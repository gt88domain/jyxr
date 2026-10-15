using System.Runtime.InteropServices.JavaScript;
using System.Text.Json;
using System.Text.Json.Nodes;
using Game.Application;
using Game.Content.Loading;
using Game.Core.Battle;
using Game.Core.Model;
using Game.Core.Model.Character;
using Game.Core.Model.Skills;
using Game.Core.Persistence;
using Game.Core.Serialization;

namespace Game.Web.Runtime;

public static partial class BrowserBridge
{
    private static readonly JsonSerializerOptions Json = new(GameJson.Default) { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
    private static InMemoryContentRepository? _content;
    private static GameSession? _session;
    private static BattleState? _battle;
    private static BattleEngine? _engine;
    private static BasicEnemyBattleAgent? _ai;
    private static OrdinaryBattleRequest? _request;
    private static readonly List<string> Logs = [];
    private static string? _error;
    private static bool _settled;
    private static BrowserStoryHost _host = new();
    private static Task? _storyTask;
    private static CancellationTokenSource _storyCancellation = new();
    private static string? _backgroundId;
    private static string? _musicId;

    [JSExport]
    public static string Initialize(string contentJson)
    {
        try
        {
            var root = JsonNode.Parse(contentJson)?.AsObject() ?? throw new InvalidOperationException("内容包为空。");
            var scripts = root["storyScripts"]?.DeepClone();
            root.Remove("storyScripts");
            var package = root.Deserialize<ContentPackage>(Json) ?? throw new InvalidOperationException("内容包无效。");
            if (scripts is JsonObject storyObjects)
                foreach (var entry in storyObjects)
                    package.StoryScripts[entry.Key] = Game.Core.Story.StoryScriptJson.Parse(entry.Value!.ToJsonString(), entry.Key);
            _content = new JsonContentLoader().LoadFromPackage(package);
            _session = null;
            _battle = null;
            Logs.Clear();
            Log($"原版内容载入：{_content.GetCharacters().Count} 名角色、{_content.GetExternalSkills().Count} 门外功、{_content.GetItems().Count} 件物品。");
            _error = null;
        }
        catch (Exception exception) { _error = exception.Message; }
        return Snapshot();
    }

    [JSExport]
    public static Task<string> Dispatch(string commandJson)
    {
        try
        {
            _error = null;
            using var command = JsonDocument.Parse(commandJson);
            var args = command.RootElement;
            var type = Read(args, "type");
            switch (type)
            {
                case "createCharacter": CreateCharacter(Read(args, "name", "小虾米"), Read(args, "difficulty", "Normal")); break;
                case "talk":
                case "interact":
                    var location = Read(args, "locationId", "武师");
                    if (location is "南贤居" or "小村")
                    {
                        RequireSession().MapService.EnterMap(location == "南贤居" ? "南贤屋内" : "小村");
                        break;
                    }
                    if (location == "南贤" && RequireSession().State.Story.IsStoryCompleted("新手村_南贤开场"))
                        throw new InvalidOperationException("开场引导已完成，可以前往小村寻找武师。");
                    var storyId = location switch { "武师" => "新手村_武师", "南贤" => "新手村_南贤开场", _ => throw new InvalidOperationException("此地点尚未迁移交互剧情。") };
                    StartStory(storyId);
                    break;
                case "next": _host.ContinueDialogue(); break;
                case "choose": _host.Choose(args.GetProperty("index").GetInt32()); break;
                case "playStory": StartStory(Read(args, "storyId")); break;
                case "startTraining":
                    if (RequireSession().State.Location.CurrentMapId != "小村") throw new InvalidOperationException("请先完成南贤引导，再前往小村武师处练习。");
                    StartStory("新手村_武师7");
                    break;
                case "move":
                    EnsurePlayerAction();
                    Check(_engine!.MoveTo(_battle!, Active!.Id, Position(args)));
                    break;
                case "attack":
                    EnsurePlayerAction();
                    var skillId = Read(args, "skillId", Skills(Active!.Character).FirstOrDefault()?.Id ?? "");
                    var skill = Skills(Active!.Character).First(s => s.Id == skillId);
                    var targetId = Read(args, "targetId");
                    var target = targetId.Length > 0 ? _battle!.GetUnit(targetId).Position : Position(args);
                    var actor = Active;
                    Check(_engine!.CastSkill(_battle!, actor!.Id, skill, target));
                    Log($"{actor.Character.Name}施展「{skill.Name}」。");
                    FinishPlayerAction(actor.Id);
                    break;
                case "rest":
                case "defend":
                    EnsurePlayerAction();
                    Log($"{Active!.Character.Name}休息调息。");
                    Check(_engine!.Rest(_battle!, Active.Id));
                    AdvanceEnemies();
                    break;
                case "autoTurn":
                case "advance":
                    EnsurePlayerAction();
                    ExecuteAiTurn(Active!.Id);
                    AdvanceEnemies();
                    break;
                case "leaveBattle":
                    if (_battle is not null && BattleOutcomeEvaluator.Evaluate(_battle).Kind == BattleOutcomeKind.Ongoing)
                        throw new InvalidOperationException("战斗尚未结束。");
                    _battle = null;
                    _host.CompleteBattle();
                    break;
                case "enterMap":
                    RequireSession().MapService.EnterMap(Read(args, "mapId"));
                    break;
                case "state": break;
                default: throw new InvalidOperationException($"未知指令：{type}");
            }
            if (_storyTask?.IsFaulted == true) throw _storyTask.Exception!.GetBaseException();
        }
        catch (Exception exception) { _error = exception.Message; }
        return Task.FromResult(Snapshot());
    }

    [JSExport]
    public static string ExportSave()
    {
        if (_battle is not null && BattleOutcomeEvaluator.Evaluate(_battle).Kind == BattleOutcomeKind.Ongoing)
            return JsonSerializer.Serialize(new { error = "请在战斗结束后存档。" }, Json);
        var session = RequireSession();
        if (_host.Dialogue is not null || _host.Choice is not null) return JsonSerializer.Serialize(new { error = "请先结束当前对话。" }, Json);
        return JsonSerializer.Serialize(new { browserSaveVersion = 1, game = session.SaveGameService.CreateSave(), profile = session.ProfileService.CreateProfileRecord() }, Json);
    }

    [JSExport]
    public static string ImportSave(string saveJson)
    {
        try
        {
            if (_content is null) throw new InvalidOperationException("请先加载内容包。");
            using var document = JsonDocument.Parse(saveJson);
            var root = document.RootElement;
            var wrapped = root.TryGetProperty("browserSaveVersion", out var browserVersion);
            if (wrapped && browserVersion.GetInt32() != 1) throw new InvalidOperationException("浏览器存档版本不匹配。");
            var save = JsonSerializer.Deserialize<SaveGame>(wrapped ? root.GetProperty("game") : root, Json) ?? throw new InvalidOperationException("存档无效。");
            if (save.Version != SaveGame.CurrentVersion) throw new InvalidOperationException("存档版本不匹配。");
            // Validate into a fresh candidate before replacing a running session.
            var candidateHost = new BrowserStoryHost();
            var candidate = new GameSession(new GameState(), _content, candidateHost, config: RuntimeConfig);
            if (wrapped)
            {
                var profile = root.GetProperty("profile").Deserialize<GameProfileRecord>(Json) ?? throw new InvalidOperationException("玩家档案无效。");
                candidate.ProfileService.LoadProfile(profile);
            }
            candidate.SaveGameService.LoadSave(save);
            ResetStory();
            _host = candidateHost;
            _session = candidate;
            _battle = null;
            _error = null;
            Log("已读取浏览器存档。");
        }
        catch (Exception exception) { _error = exception.Message; }
        return Snapshot();
    }

    private static GameConfig RuntimeConfig => new()
    {
        MaximizeNewPartyCharacterSkills = false,
        InitialStorySegmentId = "新手村_出生",
        // Legacy Item.Generate(bool): .1 => 4, otherwise .2 => 3,
        // otherwise .4 => 2, otherwise 1. These are conditional rolls.
        EquipmentRandomAffixCountWeights = [new(4, 100), new(3, 180), new(2, 288), new(1, 432)]
    };
    private static GameSession RequireSession() => _session ?? throw new InvalidOperationException("请先创建角色。");
    private static BattleUnit? Active => _battle?.CurrentAction is { } action ? _battle.TryGetUnit(action.ActingUnitId) : null;
    private static IEnumerable<SkillInstance> Skills(CharacterInstance character) =>
        character.ExternalSkills.Cast<SkillInstance>().Concat(character.GetFormSkills()).Concat(character.SpecialSkills).Where(s => s.IsActive);

    private static void CreateCharacter(string name, string difficulty)
    {
        if (_content is null) throw new InvalidOperationException("请先加载内容包。");
        name = name.Trim();
        if (name.Length is < 1 or > 12) throw new InvalidOperationException("姓名请填写 1 至 12 个字符。");
        var state = new GameState();
        if (Enum.TryParse<GameDifficulty>(difficulty, true, out var selectedDifficulty)) state.Adventure.SetDifficulty(selectedDifficulty);
        ResetStory();
        _session = new GameSession(state, _content, _host, config: RuntimeConfig);
        var hero = new InitialCharacterFactory(_content, RuntimeConfig).Create("主角", "主角", state.EquipmentInstanceFactory);
        hero.Name = name;
        state.Party.AddMember(hero);
        var map = _content.TryGetMap("小村", out var village) ? village : _content.TryGetMap("南贤屋内", out var room) ? room : null;
        if (map is not null) _session.MapService.EnterMap(map.Id);
        _battle = null;
        Logs.Clear();
        Log($"{name}初入江湖。" );
        if (_content.TryGetStorySegment("新手村_出生", out _)) StartStory("新手村_出生");
    }

    private static void StartBattle(string id)
    {
        var session = RequireSession();
        if (_battle is not null && BattleOutcomeEvaluator.Evaluate(_battle).Kind == BattleOutcomeKind.Ongoing)
            throw new InvalidOperationException("已有战斗正在进行。");
        _request = new OrdinaryBattleRequest(id, session.State.Party.Members.Select(c => c.Id).ToArray());
        _battle = session.BattleService.BuildBattleState(_request);
        _engine = new BattleEngine(
            buffResolver: _content!.GetBuff,
            legendSkillsProvider: _content!.GetLegendSkillsFor,
            skillMaxLevelResolver: session.SkillMaxLevelPolicy.GetMaxLevel,
            characterGrowTemplateResolver: c => _content!.GetGrowTemplate(c.GrowTemplateId ?? CharacterExperienceProgression.DefaultGrowTemplateId));
        _ai = new BasicEnemyBattleAgent(new BattleTurnCandidateGenerator(_engine), new BattleAiPolicyResolver(session.SkillMaxLevelPolicy.GetMaxLevel));
        _settled = false;
        Check(_engine.StartBattle(_battle));
        Log($"进入原版战斗：{_content.GetBattle(id).Name}。");
        AdvanceEnemies();
    }

    private static void EnsurePlayerAction()
    {
        if (_battle is null || _engine is null) throw new InvalidOperationException("尚未进入战斗。");
        if (BattleOutcomeEvaluator.Evaluate(_battle).Kind != BattleOutcomeKind.Ongoing) throw new InvalidOperationException("战斗已经结束。");
        if (Active?.Team != 1) throw new InvalidOperationException("当前不是我方回合。");
    }

    private static void FinishPlayerAction(string unitId)
    {
        if (_battle!.CurrentAction is not null) Check(_engine!.EndAction(_battle, unitId));
        AdvanceEnemies();
    }

    private static void ExecuteAiTurn(string unitId)
    {
        var plan = _ai!.Decide(_battle!, unitId);
        var unit = _battle!.GetUnit(unitId);
        if (plan.MoveDestination != unit.Position) Check(_engine!.MoveTo(_battle, unitId, plan.MoveDestination));
        if (plan.MainAction.Kind == BattleMainActionKind.CastSkill)
        {
            var skill = Skills(unit.Character).First(s => s.Id == plan.MainAction.SkillId);
            Check(_engine!.CastSkill(_battle, unitId, skill, plan.MainAction.TargetPosition!.Value));
            Log($"{unit.Character.Name}施展「{skill.Name}」。");
            if (_battle.CurrentAction is not null) Check(_engine.EndAction(_battle, unitId));
        }
        else { Check(_engine!.Rest(_battle, unitId)); Log($"{unit.Character.Name}休息调息。"); }
    }

    private static void AdvanceEnemies()
    {
        for (var turns = 0; turns < 100; turns++)
        {
            var outcome = BattleOutcomeEvaluator.Evaluate(_battle!);
            if (outcome.Kind != BattleOutcomeKind.Ongoing) { Settle(outcome); return; }
            if (_battle!.CurrentAction is null) Check(_engine!.AdvanceUntilNextAction(_battle));
            if (Active!.Team == 1) return;
            ExecuteAiTurn(Active.Id);
        }
        throw new InvalidOperationException("敌方连续行动过多，请检查战斗速度配置。");
    }

    private static void Settle(Game.Core.Battle.BattleOutcome outcome)
    {
        if (_settled) return;
        _settled = true;
        _lastBattleWinner = outcome.WinningTeam;
        var session = RequireSession();
        session.BattleService.ApplyPlayerBattleCarryover(_battle!);
        session.BattleService.RecordDefeatedEnemies(_battle!);
        if (outcome.WinningTeam == 1)
        {
            var settlement = session.BattleService.PreviewVictorySettlement(_battle!, _request!);
            session.BattleService.ApplyOrdinaryVictorySettlement(_battle!, settlement);
            Log("战斗胜利，已按原有规则结算经验和掉落。");
        }
        else Log("战斗结束。可返回地图重新切磋。");
    }

    private static void Check<T>(BattleCommandResult<T> result)
    {
        if (!result.Success) throw new InvalidOperationException($"操作未执行：{result.Failure?.Reason}");
    }

    private static object SkillView(SkillInstance skill, BattleUnit? unit = null)
    {
        var available = unit is not null && _battle is not null ? _engine!.EvaluateSkillAvailability(_battle, unit.Id, skill) : null;
        return new { id = skill.Id, name = skill.Name, level = skill.Level, mpCost = available?.MpCost ?? skill.MpCost, castSize = skill.CastSize, impactSize = skill.ImpactSize, available = available?.IsAvailable ?? true, reason = available?.Status.ToString() };
    }

    private static string Snapshot()
    {
        try
        {
            var hero = _session?.State.Party.Members.FirstOrDefault();
            var battleHero = _battle?.Units.FirstOrDefault(u => u.Team == 1);
            var mapId = _session?.State.Location.CurrentMapId;
            var map = mapId is not null && _content is not null && _content.TryGetMap(mapId, out var definition) ? definition : null;
            var outcome = _battle is null ? null : BattleOutcomeEvaluator.Evaluate(_battle);
            var snapshot = new
            {
                ok = _error is null, error = _error,
                state = new
                {
                    phase = _session is null ? "title" : _battle is not null ? "battle" : _host.Dialogue is not null ? "dialogue" : _host.Choice is not null ? "choice" : "world",
                    hero = hero is null ? null : new { id = hero.Id, name = hero.Name, level = hero.Level, hp = battleHero?.Hp ?? hero.CurrentHp ?? (int)hero.GetStat(StatType.MaxHp), maxHp = (int)hero.GetStat(StatType.MaxHp), mp = battleHero?.Mp ?? hero.CurrentMp ?? (int)hero.GetStat(StatType.MaxMp), maxMp = (int)hero.GetStat(StatType.MaxMp), skills = Skills(hero).Select(s => SkillView(s)).ToArray() },
                    silver = _session?.State.Currency.Silver ?? 0,
                    backgroundId = _backgroundId, musicId = _musicId,
                    inventory = _session?.State.Inventory.Entries.Select(e => new { id = e.Definition.Id, name = e.Definition.Name, count = e is StackInventoryEntry stack ? stack.Quantity : 1, quantity = e is StackInventoryEntry stack2 ? stack2.Quantity : 1, description = e.Definition.Description }).ToArray(),
                    map = map is null ? null : new { id = map.Id, name = map.Name, description = map.Description, locations = map.Locations.Select(l => new { id = l.Id, name = l.Name, description = l.Description }) },
                    battle = _battle is null ? null : new
                    {
                        name = _content!.GetBattle(_request!.BattleId).Name, width = _battle.Grid.Width, height = _battle.Grid.Height,
                        activeUnitId = Active?.Id, tick = _battle.Tick, outcome = outcome!.Kind == BattleOutcomeKind.Ongoing ? "ongoing" : outcome.WinningTeam == 1 ? "win" : "lose",
                        units = _battle.Units.Select(u => new { id = u.Id, name = u.Character.Name, team = u.Team, x = u.Position.X, y = u.Position.Y, hp = u.Hp, maxHp = u.MaxHp, mp = u.Mp, maxMp = u.MaxMp, alive = u.IsAlive }),
                        skills = Active?.Team == 1 ? Skills(Active.Character).Select(s => SkillView(s, Active)).ToArray() : [],
                        reachable = Active?.Team == 1 && outcome.Kind == BattleOutcomeKind.Ongoing ? _engine!.GetReachablePositions(_battle, Active.Id).Keys.Select(p => new { x = p.X, y = p.Y }).ToArray() : [],
                        logs = Logs.TakeLast(20).ToArray()
                    },
                    dialogue = _host.Dialogue is { } d ? new { speaker = d.Speaker == "主角" ? hero?.Name ?? d.Speaker : d.Speaker, text = d.Text } : _host.Choice is { } c ? new { speaker = c.PromptSpeaker, text = c.PromptText } : null,
                    choices = _host.Choice?.Options.Select(o => new { index = o.Index, text = o.Text }).ToArray(), logs = Logs.TakeLast(30).ToArray()
                }
            };
            return JsonSerializer.Serialize(snapshot, Json);
        }
        catch (Exception exception) { return JsonSerializer.Serialize(new { ok = false, error = exception.Message }, Json); }
    }

    private static string Read(JsonElement args, string key, string fallback = "") => args.TryGetProperty(key, out var value) ? value.GetString() ?? fallback : fallback;
    private static GridPosition Position(JsonElement args) => new(args.GetProperty("x").GetInt32(), args.GetProperty("y").GetInt32());
    private static void Log(string message) { Logs.Add(message); if (Logs.Count > 200) Logs.RemoveAt(0); }

    private static void ResetStory()
    {
        _storyCancellation.Cancel();
        _storyCancellation.Dispose();
        _storyCancellation = new CancellationTokenSource();
        _storyTask = null;
        _host = new BrowserStoryHost();
    }

    private static void StartStory(string storyId)
    {
        var session = RequireSession();
        if (_storyTask is { IsCompleted: false }) throw new InvalidOperationException("请先结束当前剧情。");
        if (_battle is not null) throw new InvalidOperationException("请先离开当前战斗。");
        if (!_content!.TryGetStorySegment(storyId, out _)) throw new InvalidOperationException("此剧情尚未完成迁移。");
        _storyTask = session.StoryService.ExecuteAsync(storyId, cancellationToken: _storyCancellation.Token);
        if (_storyTask.IsFaulted) throw _storyTask.Exception!.GetBaseException();
    }

    private sealed class BrowserStoryHost : Game.Core.Story.IRuntimeHost
    {
        [StoryCommand("map", "set_map", "tutorial")]
        public void EnterMap(string mapId) => RequireSession().MapService.EnterMap(mapId);

        [StoryCommand("background")]
        public void Background(string resourceId) => _backgroundId = resourceId;

        [StoryCommand("music")]
        public void Music(string resourceId) => _musicId = resourceId;

        [StoryCommand("suggest")]
        public ValueTask Suggest(string text, CancellationToken cancellationToken) => DialogueAsync(new Game.Core.Story.DialogueContext("提示", text), cancellationToken);

        public Game.Core.Story.DialogueContext? Dialogue { get; private set; }
        public Game.Core.Story.ChoiceContext? Choice { get; private set; }
        private TaskCompletionSource? _dialogue;
        private TaskCompletionSource<int>? _choice;
        private TaskCompletionSource<Game.Core.Story.BattleOutcome>? _battleResult;

        public ValueTask DialogueAsync(Game.Core.Story.DialogueContext dialogue, CancellationToken cancellationToken)
        {
            Dialogue = dialogue;
            _dialogue = new TaskCompletionSource();
            cancellationToken.Register(() => _dialogue?.TrySetCanceled(cancellationToken));
            return new ValueTask(_dialogue.Task);
        }

        public ValueTask<int> ChooseOptionAsync(Game.Core.Story.ChoiceContext choice, CancellationToken cancellationToken)
        {
            Choice = choice;
            _choice = new TaskCompletionSource<int>();
            cancellationToken.Register(() => _choice?.TrySetCanceled(cancellationToken));
            return new ValueTask<int>(_choice.Task);
        }

        public ValueTask<Game.Core.Story.BattleOutcome> ResolveBattleAsync(Game.Core.Story.BattleContext battle, CancellationToken cancellationToken)
        {
            StartBattle(battle.BattleId);
            _battleResult = new TaskCompletionSource<Game.Core.Story.BattleOutcome>();
            cancellationToken.Register(() => _battleResult?.TrySetCanceled(cancellationToken));
            return new ValueTask<Game.Core.Story.BattleOutcome>(_battleResult.Task);
        }

        public void ContinueDialogue()
        {
            if (Dialogue is null || _dialogue is null) throw new InvalidOperationException("当前没有待继续的对白。");
            var pending = _dialogue;
            Dialogue = null;
            _dialogue = null;
            pending.SetResult();
        }

        public void Choose(int index)
        {
            if (Choice is null || _choice is null || !Choice.Options.Any(o => o.Index == index)) throw new InvalidOperationException("选项无效。");
            var pending = _choice;
            Choice = null;
            _choice = null;
            pending.SetResult(index);
        }

        public void CompleteBattle()
        {
            var pending = _battleResult;
            _battleResult = null;
            pending?.SetResult(_lastBattleWinner == 1 ? Game.Core.Story.BattleOutcome.Win : Game.Core.Story.BattleOutcome.Lose);
        }
    }

    private static int? _lastBattleWinner;
}
