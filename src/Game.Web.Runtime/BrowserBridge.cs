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
using Game.Core.Definitions;
using Game.Presentation.Battle;

namespace Game.Web.Runtime;

public static partial class BrowserBridge
{
    private static readonly JsonSerializerOptions Json = new(GameJson.Default) { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
    private static InMemoryContentRepository? _content;
    private static GameSession? _session;
    private static BattleState? _battle;
    private static BattleEngine? _engine;
    private static BasicEnemyBattleAgent? _ai;
    private static SpecialBattleRequest? _request;
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
            var metadata = root["browser"]?.DeepClone()?.AsObject() ?? LegacyPack();
            root.Remove("browser");
            var scripts = root["storyScripts"]?.DeepClone();
            root.Remove("storyScripts");
            var package = root.Deserialize<ContentPackage>(Json) ?? throw new InvalidOperationException("内容包无效。");
            if (scripts is JsonObject storyObjects)
                foreach (var entry in storyObjects)
                    package.StoryScripts[entry.Key] = Game.Core.Story.StoryScriptJson.Parse(entry.Value!.ToJsonString(), entry.Key);
            var candidate = new JsonContentLoader().LoadFromPackage(package);
            ValidatePack(metadata, candidate);
            // Cancel the old flow only after the complete replacement is valid.
            ResetStory();
            _content = candidate;
            _pack = metadata;
            _session = null;
            _partySubscription?.Dispose(); _partySubscription = null; FormationReserves.Clear();
            _creation = null;
            _battle = null;
            _shopId = null;
            _hasSaved = false;
            WonBattles.Clear();
            _backgroundId = null;
            _musicId = null;
            _cultivationItemId = null;
            CompanionCultivations.Clear();
            _managedCharacterId = Party.HeroCharacterId;
            BattleEvents.Clear();
            Logs.Clear();
            Log($"{PackText("title")}内容载入：{_content.GetCharacters().Count} 名角色、{_content.GetExternalSkills().Count} 门外功、{_content.GetItems().Count} 件物品。");
            _error = null;
        }
        catch (Exception exception) { _error = exception.Message; }
        return Snapshot();
    }

    [JSExport]
    public static async Task<string> Dispatch(string commandJson)
    {
        var readOnly = false;
        try
        {
            _error = null;
            using var command = JsonDocument.Parse(commandJson);
            var args = command.RootElement;
            var type = Read(args, "type");
            readOnly = type is "state" or "selectCharacter";
            switch (type)
            {
                case "createCharacter": CreateCharacter(Read(args, "name", "小虾米"), Read(args, "difficulty", "Normal")); break;
                case "beginCreation": BeginCreation(args); break;
                case "answerCreation": AnswerCreation(args); break;
                case "selectCreationPortrait": SelectCreationPortrait(Read(args, "portraitId")); break;
                case "backCreation": BackCreation(); break;
                case "rollCreation": RollCreation(); break;
                case "confirmCreation": ConfirmCreation(); break;
                case "cancelCreation": _creation = null; break;
                case "selectCharacter": SelectManagedCharacter(Read(args, "characterId")); break;
                case "allocateStat": AllocateCharacterStat(args); break;
                case "setPartyPlacement": MovePartyCharacter(args); break;
                case "reorderParty": RequireManagement(); RequireSession().PartyService.MoveMember(Read(args, "characterId"), args.GetProperty("index").GetInt32()); break;
                case "chestDeposit": MoveChestItem(args, true); break;
                case "chestWithdraw": MoveChestItem(args, false); break;
                case "selectCombatants": _host.SelectCombatants(args); break;
                case "renameHeroine": _host.CompleteRename(Read(args, "name")); break;
                case "closeChest": _host.CloseChest(); break;
                case "equipItem":
                    RequireCharacterManagement();
                    var equipmentEntry = Entry(args.GetProperty("entryNumber").GetInt64());
                    if (equipmentEntry.Definition is not EquipmentDefinition) throw new InvalidOperationException("请选择武器、防具或饰品。");
                    var equipResult = await RequireSession().ItemUseService.UseAsync(equipmentEntry, Managed.Id);
                    if (!equipResult.Success) throw new InvalidOperationException(equipResult.Message);
                    Log(equipResult.Message);
                    break;
                case "unequipItem":
                    RequireCharacterManagement();
                    if (!Enum.TryParse<EquipmentSlotType>(Read(args, "slot"), true, out var slot) || !Enum.IsDefined(slot)) throw new InvalidOperationException("装备槽无效。");
                    var removed = RequireSession().InventoryService.UnequipToInventory(Managed, slot);
                    Log($"已卸下「{removed.Definition.Name}」。");
                    break;
                case "setCultivation": SetCultivation(args.GetProperty("entryNumber").GetInt64()); break;
                case "clearCultivation": RequireCharacterManagement(); SetCultivationId(Managed, null); Log("已停止秘籍修炼；已学武功保留。"); break;
                case "equipInternalSkill":
                    RequireCharacterManagement();
                    RequireSession().CharacterService.EquipInternalSkill(Managed.Id, Read(args, "skillId"));
                    Log("已切换当前运行内功。");
                    break;
                case "clearInternalSkill":
                    RequireCharacterManagement(); Managed.EquipInternalSkill(null); RequireSession().Events.Publish(new CharacterChangedEvent(Managed.Id)); break;
                case "setExternalSkillActive":
                    RequireCharacterManagement(); RequireSession().CharacterService.SetExternalSkillActive(Managed.Id, Read(args, "skillId"), args.GetProperty("active").GetBoolean()); break;
                case "useItem":
                    var useEntry = Entry(args.GetProperty("entryNumber").GetInt64());
                    if (_battle is not null)
                    {
                        EnsurePlayerAction();
                        if (useEntry.Definition.Type != ItemType.Consumable) throw new InvalidOperationException("战斗中只可使用战斗消耗品。");
                        var actingId = Active!.Id;
                        var itemTargetId = Read(args, "targetId", actingId);
                        if (itemTargetId == actingId && BattleSelfItemUnavailableReason(useEntry.Definition) is { } itemReason) throw new InvalidOperationException(itemReason);
                        Check(_engine!.UseItem(_battle, actingId, useEntry.Definition, itemTargetId));
                        RequireSession().ItemUseService.CommitSuccessfulUse(useEntry);
                        FinishPlayerAction(actingId);
                    }
                    else
                    {
                        RequireCharacterManagement();
                        if (BookSkill(useEntry.Definition) is not null) throw new InvalidOperationException("武学秘籍请通过修炼栏选择，逐步积累经验。");
                        if (useEntry.Definition.UseEffects.Any(e => e is RunStoryItemUseEffectDefinition)) throw new InvalidOperationException("此物品的剧情使用流程尚未迁移。");
                        var useResult = await RequireSession().ItemUseService.UseAsync(useEntry, Managed.Id);
                        if (!useResult.Success) throw new InvalidOperationException(useResult.Message);
                        Log(useResult.Message);
                    }
                    break;
                case "talk":
                case "interact":
                    Interact(Read(args, "locationId"));
                    break;
                case "buy": Buy(args); break;
                case "sell": Sell(args); break;
                case "closeShop": CloseShop(); break;
                case "selectSect": _host.ChooseSect(Read(args, "sectId")); break;
                case "next": _host.ContinueDialogue(); break;
                case "choose": _host.Choose(args.GetProperty("index").GetInt32()); break;
                case "playStory": StartStory(Read(args, "storyId")); break;
                case "startTraining":
                    if (PackText("trainingMapId") is not { Length: > 0 } trainingMap || RequireSession().State.Location.CurrentMapId != trainingMap) throw new InvalidOperationException("请前往本章的训练地点。");
                    StartStory(PackText("trainingStoryId"));
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
                    RequireManagement();
                    RequireSession().MapService.EnterMap(Read(args, "mapId"));
                    break;
                case "state": break;
                default: throw new InvalidOperationException($"未知指令：{type}");
            }
            if (_storyTask?.IsFaulted == true) throw _storyTask.Exception!.GetBaseException();
            if (!readOnly) PumpLegacyWorld();
            if (!readOnly && _session is not null) ClearUnavailableCultivations();
            if (_storyTask?.IsFaulted == true) throw _storyTask.Exception!.GetBaseException();
        }
        catch (Exception exception) { _error = exception.Message; }
        if (!readOnly) _mapView = null;
        return Snapshot();
    }

    [JSExport]
    public static string ExportSave()
    {
        if (_battle is not null && BattleOutcomeEvaluator.Evaluate(_battle).Kind == BattleOutcomeKind.Ongoing)
            return JsonSerializer.Serialize(new { error = "请在战斗结束后存档。" }, Json);
        var session = RequireSession();
        if (_host.Dialogue is not null || _host.Choice is not null) return JsonSerializer.Serialize(new { error = "请先结束当前对话。" }, Json);
        if (_shopId is not null || _storyTask is { IsCompleted: false }) return JsonSerializer.Serialize(new { error = "请先结束当前交互。" }, Json);
        _hasSaved = true;
        return JsonSerializer.Serialize(new { browserSaveVersion = 2, packId = PackText("id"), game = session.SaveGameService.CreateSave(), profile = session.ProfileService.CreateProfileRecord(), cultivationItemId = _cultivationItemId, companionCultivations = CompanionCultivations, formationReserveIds = FormationReserves.ToArray(), hasSaved = true, wonBattles = WonBattles.ToArray() }, Json);
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
            var version = wrapped ? browserVersion.GetInt32() : 1;
            if (version is not (1 or 2)) throw new InvalidOperationException("浏览器存档版本不匹配。");
            var savedPack = version == 2 ? root.GetProperty("packId").GetString() : "jyx";
            if (savedPack != PackText("id")) throw new InvalidOperationException("存档属于另一套内容，请先切换对应世界。");
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
            if (!candidate.State.Party.ContainsMember(Party.HeroCharacterId)) throw new InvalidOperationException("存档缺少主角。");
            if (!_content.TryGetMap(candidate.State.Location.CurrentMapId, out _)) throw new InvalidOperationException("存档地图不属于当前内容包。");
            var savedMap = _content.GetMap(candidate.State.Location.CurrentMapId);
            if (savedMap.Kind == MapKind.Large && !candidate.State.Location.TryGetLargeMapPosition(savedMap.Id, out _))
            {
                // Earlier browser slices exposed the world as a small card map.
                // Seed its new position without healing or replacing the state.
                var origin = savedMap.Locations.Single(l => l.Id == savedMap.DefaultLocation).Position
                    ?? throw new InvalidOperationException("大地图缺少初始坐标。");
                candidate.State.Location.SetLargeMapPosition(savedMap.Id, origin);
            }
            var victories = version == 2 && root.TryGetProperty("wonBattles", out var wins) ? wins.Deserialize<string[]>(Json) ?? [] : [];
            foreach (var victory in victories) if (!_content.TryGetBattle(victory, out _)) throw new InvalidOperationException("存档战斗记录不属于当前内容包。");
            var cultivation = wrapped && root.TryGetProperty("cultivationItemId", out var selectedBook) && selectedBook.ValueKind == JsonValueKind.String ? selectedBook.GetString() : null;
            if (cultivation is not null)
            {
                if (!_content.TryGetItem(cultivation, out var bookItem) || BookSkill(bookItem) is not { } selected || !candidate.State.Inventory.Entries.Any(e => e.Definition.Id == cultivation)) throw new InvalidOperationException("存档中的修炼秘籍无效。");
                var candidateHero = candidate.State.Party.Members.FirstOrDefault();
                var hasSkill = candidateHero is not null && (selected.Internal ? candidateHero.InternalSkills.Any(s => s.Id == selected.SkillId) : candidateHero.ExternalSkills.Any(s => s.Id == selected.SkillId));
                if (!hasSkill) throw new InvalidOperationException("存档中的修炼武功尚未学会，无法恢复修炼设置。");
            }
            var companionBooks = wrapped && root.TryGetProperty("companionCultivations", out var books) ? books.Deserialize<Dictionary<string, string>>(Json) ?? [] : [];
            foreach (var (id, itemId) in companionBooks)
            {
                if (id == Party.HeroCharacterId || !candidate.State.Party.TryGetCharacter(id, out var c) || !_content.TryGetItem(itemId, out var item) || BookSkill(item) is not { } book || !candidate.State.Inventory.Entries.Any(e => e.Definition.Id == itemId) || !(book.Internal ? c.InternalSkills.Any(s => s.Id == book.SkillId) : c.ExternalSkills.Any(s => s.Id == book.SkillId)))
                    throw new InvalidOperationException("存档中的队友修炼配置无效。");
            }
            if (!candidate.State.Party.ContainsMember(Party.HeroCharacterId) || candidate.State.Party.Members.First().Id != Party.HeroCharacterId) throw new InvalidOperationException("存档中的主角队伍位置无效。");
            foreach (var group in companionBooks.Values.Concat(cultivation is null ? [] : new[] { cultivation }).GroupBy(id => id))
            {
                var copies = candidate.State.Inventory.Entries.Where(e => e.Definition.Id == group.Key).Sum(e => e is StackInventoryEntry stack ? stack.Quantity : 1);
                if (group.Count() > copies) throw new InvalidOperationException("存档中的修炼人数超过秘籍数量。");
            }
            var formation = wrapped && root.TryGetProperty("formationReserveIds", out var formationNode) ? formationNode.Deserialize<string[]>(Json) ?? [] : [];
            if (formation.Distinct(StringComparer.Ordinal).Count() != formation.Length || formation.Any(id => id == Party.HeroCharacterId || !candidate.State.Party.ContainsReserve(id))) throw new InvalidOperationException("存档中的编队后备配置无效。");
            ResetStory();
            FormationReserves.Clear(); FormationReserves.UnionWith(formation);
            CompanionCultivations.Clear();
            foreach (var (id, itemId) in companionBooks) CompanionCultivations[id] = itemId;
            _managedCharacterId = Party.HeroCharacterId;
            _host = candidateHost;
            _session = candidate;
            _creation = null;
            _battle = null;
            _shopId = null;
            _hasSaved = true;
            WonBattles.Clear();
            WonBattles.UnionWith(victories);
            _cultivationItemId = cultivation;
            BindPartyEvents();
            BattleEvents.Clear();
            _error = null;
            Log("已读取浏览器存档。");
        }
        catch (Exception exception) { _error = exception.Message; }
        return Snapshot();
    }

    private static GameConfig RuntimeConfig => new()
    {
        MaximizeNewPartyCharacterSkills = false,
        InitialStorySegmentId = PackText("initialStoryId"),
        // Legacy Item.Generate(bool): .1 => 4, otherwise .2 => 3,
        // otherwise .4 => 2, otherwise 1. These are conditional rolls.
        EquipmentRandomAffixCountWeights = [new(4, 100), new(3, 180), new(2, 288), new(1, 432)]
    };
    private static GameSession RequireSession() => _session ?? throw new InvalidOperationException("请先创建角色。");
    private static BattleUnit? Active => _battle?.CurrentAction is { } action ? _battle.TryGetUnit(action.ActingUnitId) : null;
    private static IEnumerable<SkillInstance> Skills(CharacterInstance character) =>
        character.ExternalSkills.Cast<SkillInstance>().Concat(character.GetFormSkills()).Concat(character.SpecialSkills).Where(s => s.IsActive);

    private static void CreateCharacter(string name, string difficulty, CreationResult? prepared = null)
    {
        if (_content is null) throw new InvalidOperationException("请先加载内容包。");
        name = name.Trim();
        if (name.Length is < 1 or > 12) throw new InvalidOperationException("姓名请填写 1 至 12 个字符。");
        var state = new GameState();
        if (Enum.TryParse<GameDifficulty>(difficulty, true, out var selectedDifficulty)) state.Adventure.SetDifficulty(selectedDifficulty);
        ResetStory();
        _session = new GameSession(state, _content, _host, config: RuntimeConfig);
        var hero = prepared?.Hero ?? new InitialCharacterFactory(_content, RuntimeConfig).Create(Party.HeroCharacterId, PackText("heroDefinitionId"), state.EquipmentInstanceFactory);
        hero.Name = name;
        state.Party.AddMember(hero);
        if (prepared is not null)
        {
            state.Currency.AddSilver(prepared.Silver);
            foreach (var (id, quantity) in prepared.Items) _session.InventoryService.AddItem(id, quantity);
        }
        _creation = null;
        _session.MapService.EnterMap(PackText("initialMapId"));
        _battle = null;
        _cultivationItemId = null;
        CompanionCultivations.Clear();
        _managedCharacterId = Party.HeroCharacterId;
        _shopId = null;
        _hasSaved = false;
        WonBattles.Clear();
        Logs.Clear();
        Log($"{name}开始冒险。" );
        FormationReserves.Clear();
        BindPartyEvents();
        if (PackText("initialStoryId").Length > 0) StartStory(PackText("initialStoryId"));
    }

    private static void StartBattle(string id)
        => StartBattle(new OrdinaryBattleRequest(id, RequireSession().State.Party.Members.Select(c => c.Id).ToArray()));

    private static void StartBattle(SpecialBattleRequest request)
    {
        var session = RequireSession();
        if (_battle is not null && BattleOutcomeEvaluator.Evaluate(_battle).Kind == BattleOutcomeKind.Ongoing)
            throw new InvalidOperationException("已有战斗正在进行。");
        _request = request;
        _battle = session.BattleService.BuildBattleState(_request);
        _engine = new BattleEngine(
            buffResolver: _content!.GetBuff,
            legendSkillsProvider: _content!.GetLegendSkillsFor,
            skillMaxLevelResolver: session.SkillMaxLevelPolicy.GetMaxLevel,
            characterGrowTemplateResolver: c => _content!.GetGrowTemplate(c.GrowTemplateId ?? CharacterExperienceProgression.DefaultGrowTemplateId),
            skillUseExperienceResolver: PackText("id") == "jyx" ? BrowserLegacyRules.ResolveSkillUseExperience : null);
        _ai = new BasicEnemyBattleAgent(new BattleTurnCandidateGenerator(_engine), new BattleAiPolicyResolver(session.SkillMaxLevelPolicy.GetMaxLevel));
        _settled = false;
        BattleEvents.Clear();
        Check(_engine.StartBattle(_battle));
        Log($"进入战斗：{_content.GetBattle(request.BattleId).Name}。");
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
            ApplyCultivationExperience(settlement.ExperiencePerMember);
            WonBattles.Add(_request!.BattleId);
            Log("战斗胜利，已按原有规则结算经验和掉落。");
        }
        else Log("战斗结束。可返回地图重新切磋。");
    }

    private static void Check<T>(BattleCommandResult<T> result)
    {
        if (!result.Success) throw new InvalidOperationException(result.Failure is { } failure ? BattleCommandFailurePresenter.Format(failure) : "此操作暂时无法执行。");
        CollectMessages(result.Messages);
    }

    private static object SkillView(SkillInstance skill, BattleUnit? unit = null)
    {
        var available = unit is not null && _battle is not null ? _engine!.EvaluateSkillAvailability(_battle, unit.Id, skill) : null;
        return new { id = skill.Id, name = skill.Name, description = skill.Description, level = skill.Level, mpCost = available?.MpCost ?? skill.MpCost, castSize = unit is null ? skill.CastSize : BattleSkillTargeting.ResolveEffectiveCastSize(unit, skill), impactSize = unit is null ? skill.ImpactSize : BattleSkillTargeting.ResolveEffectiveImpactSize(unit, skill), available = available?.IsAvailable ?? true, reason = SkillUnavailableReason(available) };
    }

    private static string Snapshot()
    {
        try
        {
            var hero = _session?.State.Party.Members.FirstOrDefault(c => c.Id == Party.HeroCharacterId);
            var battleHero = _battle?.Units.FirstOrDefault(u => u.Character.Id == Party.HeroCharacterId && u.Team == 1);
            var mapId = _session?.State.Location.CurrentMapId;
            var map = mapId is not null && _content is not null && _content.TryGetMap(mapId, out var definition) ? definition : null;
            var outcome = _battle is null ? null : BattleOutcomeEvaluator.Evaluate(_battle);
            var snapshot = new
            {
                ok = _error is null, error = _error,
                state = new
                {
                    phase = _session is null ? "title" : _battle is not null ? "battle" : _host.Dialogue is not null ? "dialogue" : _host.Choice is not null ? "choice" : _shopId is not null ? "shop" : _host.SelectingSect ? "sect" : _host.Selection is not null ? "combatants" : _host.RenameDefault is not null ? "rename" : _host.GameOver ? "gameover" : _host.ChestOpen ? "chest" : "world",
                    pack = _pack,
                    creation = CreationSnapshot(),
                    combatantSelection = CombatantsSnapshot(), rename = _host.RenameDefault is { } defaultName ? new { defaultName } : null, gameOver = _host.GameOver,
                    managedCharacter = _session is null ? null : CharacterSheet(Managed), chest = ChestSnapshot(),
                    roster = RosterView(),
                    sects = SectView(), tutorial = TutorialView(),
                    adventure = _session is null ? null : new { sect = _session.State.Adventure.SectId, morality = _session.State.Adventure.Morality, days = _session.State.Clock.TotalDays, timeSlot = _session.State.Clock.TimeSlot.ToChineseBranch() },
                    party = PartyView(), objectives = ObjectiveView(), shop = ShopSnapshot(),
                    hero = hero is null ? null : new
                    {
                        id = hero.Id, name = hero.Name, level = hero.Level,
                        definitionId = hero.Definition.Id, sprite = CharacterMedia(hero, "characters"), portrait = CharacterMedia(hero, "portraits"),
                        hp = battleHero?.Hp ?? hero.CurrentHp ?? (int)hero.GetStat(StatType.MaxHp), maxHp = (int)hero.GetStat(StatType.MaxHp),
                        mp = battleHero?.Mp ?? hero.CurrentMp ?? (int)hero.GetStat(StatType.MaxMp), maxMp = (int)hero.GetStat(StatType.MaxMp),
                        skills = Skills(hero).Select(s => SkillView(s)).ToArray(),
                        experience = hero.Experience, nextLevelExperience = CharacterLevelProgression.GetTotalExperienceRequiredForLevel(hero.Level + 1),
                        attributes = Enum.GetValues<StatType>().Select(stat => new { id = StatCatalog.GetCode(stat), label = StatCatalog.GetDisplayNameCn(stat), value = hero.GetStat(stat), baseValue = hero.GetBaseStat(stat) }).ToArray(),
                        talents = hero.EffectiveTalents.Select(t => new { id = t.Id, name = t.Name, description = t.Description }).ToArray(),
                        externalSkills = hero.ExternalSkills.Select(LearnedSkillView).ToArray(), internalSkills = hero.InternalSkills.Select(LearnedSkillView).ToArray(),
                        equipment = EquipmentView(hero), cultivation = CultivationView(hero), equippedInternalSkillId = hero.EquippedInternalSkillId, canManage = CanManage
                    },
                    silver = _session?.State.Currency.Silver ?? 0,
                    yuanbao = _session?.Profile.Yuanbao ?? 0,
                    backgroundId = _backgroundId, musicId = _musicId, sceneBackground = _host.Dialogue is not null || _host.Choice is not null ? ResourceMedia(_backgroundId) : null,
                    inventory = _session?.State.Inventory.Entries.Select(InventoryView).ToArray(),
                    map = map is null ? null : new { id = map.Id, name = map.Name, description = map.Description, background = MapMedia(map.Id), kind = map.Kind.ToString().ToLowerInvariant(), locations = CurrentMapView().Locations.Select(l => new { id = l.Location.Id, name = l.Location.Name, description = l.Event?.Description ?? l.Location.Description, action = l.Event?.Action.Root.Name, image = ResourceMedia(l.Event?.Image) ?? ResourceMedia(l.Location.Picture), timeSlots = RequireSession().MapService.PreviewInteractionConsumedTimeSlots(l) }) },
                    battle = _battle is null ? null : new
                    {
                        name = _content!.GetBattle(_request!.BattleId).Name, width = _battle.Grid.Width, height = _battle.Grid.Height,
                        id = _request.BattleId, background = BattleMedia(_request.BattleId),
                        activeUnitId = Active?.Id, tick = _battle.Tick, outcome = outcome!.Kind == BattleOutcomeKind.Ongoing ? "ongoing" : outcome.WinningTeam == 1 ? "win" : "lose",
                        units = _battle.Units.Select(u => new { id = u.Id, definitionId = u.Character.Definition.Id, sprite = CharacterMedia(u.Character, "characters", u.Team), portrait = CharacterMedia(u.Character, "portraits", u.Team), name = u.Character.Name, animation = CharacterAnimation(u.Character), facing = u.Facing.ToString().ToLowerInvariant(), team = u.Team, x = u.Position.X, y = u.Position.Y, hp = u.Hp, maxHp = u.MaxHp, mp = u.Mp, maxMp = u.MaxMp, alive = u.IsAlive }),
                        skills = Active?.Team == 1 ? Skills(Active.Character).Select(s => SkillView(s, Active)).ToArray() : [],
                        reachable = Active?.Team == 1 && outcome.Kind == BattleOutcomeKind.Ongoing ? _engine!.GetReachablePositions(_battle, Active.Id).Keys.Select(p => new { x = p.X, y = p.Y }).ToArray() : [],
                        targets = TargetView(), events = BattleEvents.ToArray(), playerCanAct = Active?.Team == 1 && outcome.Kind == BattleOutcomeKind.Ongoing,
                        action = Active is { } acting && _battle.CurrentAction is { } current ? new { unitId = acting.Id, team = acting.Team, mainActionCommitted = current.HasCommittedMainAction, canMove = acting.Team == 1 && !current.HasCommittedMainAction, canRest = acting.Team == 1 && !current.HasCommittedMainAction, canAttack = acting.Team == 1 && !current.HasCommittedMainAction } : null,
                        logs = Logs.TakeLast(20).ToArray()
                    },
                    dialogue = _host.Dialogue is { } d ? new { speaker = d.Speaker == "主角" ? hero?.Name ?? d.Speaker : d.Speaker, text = d.Text, portrait = SpeakerPortrait(d.Speaker) } : _host.Choice is { } c ? new { speaker = c.PromptSpeaker, text = c.PromptText, portrait = SpeakerPortrait(c.PromptSpeaker) } : null,
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
        ExpiredStories.Clear();
        _mapView = null;
        _mapViewState = null;
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
        if (_shopId is not null) throw new InvalidOperationException("请先离开商店。");
        if (!_content!.TryGetStorySegment(storyId, out _)) throw new InvalidOperationException("此剧情尚未完成迁移。");
        _storyTask = session.StoryService.ExecuteAsync(storyId, cancellationToken: _storyCancellation.Token);
        if (_storyTask.IsFaulted) throw _storyTask.Exception!.GetBaseException();
    }

    private sealed partial class BrowserStoryHost : Game.Core.Story.IRuntimeHost
    {
        [StoryCommand("story")]
        public ValueTask ExecuteStory(string storyId, CancellationToken cancellationToken) => new(RequireSession().StoryService.ExecuteAsync(storyId, cancellationToken: cancellationToken));

        [StoryCommand("shop")]
        public ValueTask OpenShop(string shopId, CancellationToken cancellationToken)
        {
            RequireSession().ShopService.Open(shopId);
            _shopId = shopId;
            var pending = new TaskCompletionSource();
            ShopCompletion = pending;
            cancellationToken.Register(() => pending.TrySetCanceled(cancellationToken));
            return new ValueTask(pending.Task);
        }
        public TaskCompletionSource? ShopCompletion { get; set; }

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
            if (CompleteSpecialBattle()) return;
            var pending = _battleResult;
            _battleResult = null;
            pending?.SetResult(_lastBattleWinner == 1 ? Game.Core.Story.BattleOutcome.Win : Game.Core.Story.BattleOutcome.Lose);
        }
    }

    private static int? _lastBattleWinner;
}
