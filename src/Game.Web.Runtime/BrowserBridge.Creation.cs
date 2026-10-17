using System.Text.Json;
using System.Text.Json.Nodes;
using Game.Application;
using Game.Core.Model;
using Game.Core.Model.Character;

namespace Game.Web.Runtime;

public static partial class BrowserBridge
{
    private sealed class CreationDraft(string name, GameDifficulty difficulty)
    {
        public string Name { get; } = name;
        public GameDifficulty Difficulty { get; } = difficulty;
        public List<int> Answers { get; } = [];
        public string Portrait { get; set; } = "头像.主角";
        public int Roll { get; set; }
        public CreationResult? Preview { get; set; }
        public int Round { get; init; } = 1;
        public int TrialCount { get; init; }
        public GameState? OriginState { get; init; }
    }

    private sealed record CreationResult(CharacterInstance Hero, int Silver, Dictionary<string, int> Items, Dictionary<string, int> RandomBonus);
    private static CreationDraft? _creation;
    private static JsonObject CreationProfile => _pack["creation"]?.AsObject() ?? throw new InvalidOperationException("此内容包没有开局问答。");
    private static JsonArray CreationQuestions => CreationProfile["questions"]!.AsArray();
    private static CreationDraft RequireCreation() => _creation ?? throw new InvalidOperationException("请先开始人物生成。");

    private static (string Id, int Weight)[] StartingCompanionPool(int round)
    {
        var pool = (CreationProfile["startingCompanionPools"]?.AsArray() ?? [])
            .LastOrDefault(p => p!["minimumRound"]!.GetValue<int>() <= round);
        if (pool is null) return [];
        return pool["characterIds"]!.AsArray().Select((id, index) =>
            (id!.GetValue<string>(), pool["weights"]?[index]?.GetValue<int>() ?? 1)).ToArray();
    }

    private static void BeginCreation(JsonElement args)
    {
        if (_content is null || _session is not null) throw new InvalidOperationException("请返回标题后创建新人物。");
        _ = CreationProfile;
        var name = Read(args, "name", "小虾米").Trim();
        if (name.Length is < 1 or > 12) throw new InvalidOperationException("姓名请填写 1 至 12 个字符。");
        if (!Enum.TryParse<GameDifficulty>(Read(args, "difficulty", "normal"), true, out var difficulty) || !Enum.IsDefined(difficulty))
            throw new InvalidOperationException("难度无效。");
        _creation = new(name, difficulty);
    }

    private static void AnswerCreation(JsonElement args)
    {
        var draft = RequireCreation();
        if (draft.Preview is not null || draft.Answers.Count >= CreationQuestions.Count || args.GetProperty("questionIndex").GetInt32() != draft.Answers.Count)
            throw new InvalidOperationException("问答步骤已变化，请按当前问题选择。");
        var index = args.GetProperty("index").GetInt32();
        if (index < 0 || index >= CreationQuestions[draft.Answers.Count]!["options"]!.AsArray().Count) throw new InvalidOperationException("选项无效。");
        draft.Answers.Add(index);
    }

    private static void SelectCreationPortrait(string id)
    {
        var draft = RequireCreation();
        if (draft.Answers.Count != CreationQuestions.Count || !CreationProfile["portraits"]!.AsArray().Any(p => p!["id"]!.GetValue<string>() == id))
            throw new InvalidOperationException("请完成问答并选择列表中的头像。");
        draft.Portrait = id;
        RollCreation();
    }

    private static void BackCreation()
    {
        var draft = RequireCreation();
        if (draft.Preview is not null) draft.Preview = null;
        else if (draft.Answers.Count > 0) draft.Answers.RemoveAt(draft.Answers.Count - 1);
    }

    private static void RollCreation()
    {
        var draft = RequireCreation();
        if (draft.Answers.Count != CreationQuestions.Count) throw new InvalidOperationException("请先完成开局问答。");
        // Rebuild from the immutable role definition every time. Neither a
        // reroll nor a backtrack can compound attributes, money or inventory.
        var policy = new SkillMaxLevelPolicy(RuntimeConfig, _session?.Profile, draft.Round);
        var ids = EquipmentInstanceFactory.Restore(draft.OriginState?.EquipmentInstanceFactory.NextNumber ?? 1);
        var hero = new InitialCharacterFactory(_content!, RuntimeConfig, policy).Create(Party.HeroCharacterId, PackText("heroDefinitionId"), ids);
        hero.Name = draft.Name;
        hero.Portrait = draft.Portrait;
        var silver = CreationProfile["baseSilver"]!.GetValue<int>();
        var items = new Dictionary<string, int>(StringComparer.Ordinal);
        void AddItems(JsonNode? node)
        {
            if (node is not JsonObject group) return;
            foreach (var (id, quantity) in group) items[id] = checked(items.GetValueOrDefault(id) + quantity!.GetValue<int>());
        }
        AddItems(CreationProfile["baseItems"]);
        for (var i = 0; i < draft.Answers.Count; i++)
        {
            var option = CreationQuestions[i]!["options"]![draft.Answers[i]]!;
            if (option["stats"] is JsonObject stats)
                foreach (var (stat, delta) in stats) hero.AddBaseStat(StatCatalog.Parse(stat), delta!.GetValue<int>());
            if (option["silverSet"] is { } set) silver = set.GetValue<int>();
            silver = checked(silver + (option["silver"]?.GetValue<int>() ?? 0));
            AddItems(option["items"]);
            if (option["model"] is { } model) hero.Model = model.GetValue<string>();
            if (option["talents"] is JsonArray talents)
                foreach (var talent in talents) hero.UnlockedTalents.Add(_content!.GetTalent(talent!.GetValue<string>()));
            if (option["internalSkill"] is { } skill)
                hero.SetInternalSkillState(_content!.GetInternalSkill(skill["id"]!.GetValue<string>()), skill["level"]!.GetValue<int>(), 0);
        }
        if (draft.Round == 1 && draft.Difficulty == GameDifficulty.Normal) AddItems(CreationProfile["normalItems"]);
        if (draft.Round > 1)
        {
            var groups = CreationProfile["roundItems"]![draft.Round <= 3 ? draft.Round.ToString() : "later"]!.AsArray();
            foreach (var group in groups)
            {
                var pool = group!.AsArray(); var id = pool[Random.Shared.Next(pool.Count)]!.GetValue<string>();
                items[id] = checked(items.GetValueOrDefault(id) + 1);
            }
        }
        var trialTier = CreationProfile["trialItems"]!.AsArray().LastOrDefault(t => draft.TrialCount >= t!["minimum"]!.GetValue<int>());
        if (trialTier is not null)
            foreach (var node in trialTier["items"]!.AsArray()) { var id = node!.GetValue<string>(); items[id] = checked(items.GetValueOrDefault(id) + 1); }
        var randomStats = CreationProfile["randomStats"]!.AsArray().Select(n => n!.GetValue<string>()).ToArray();
        var bonus = randomStats.ToDictionary(s => s, _ => 0);
        for (var i = 0; i < 13; i++)
        {
            var stat = randomStats[Random.Shared.Next(randomStats.Length)];
            var delta = i < 3 ? 10 : 1;
            hero.AddBaseStat(StatCatalog.Parse(stat), delta);
            bonus[stat] += delta;
        }
        foreach (var id in items.Keys) _content!.GetItem(id);
        hero.RebuildSnapshot();
        draft.Preview = new(hero, silver, items, bonus);
        draft.Roll++;
    }

    private static void ConfirmCreation()
    {
        var draft = RequireCreation();
        var preview = draft.Preview ?? throw new InvalidOperationException("请先选择头像并查看人物属性。");
        if (draft.OriginState is not null) ConfirmRoundCreation(draft, preview);
        else CreateCharacter(draft.Name, draft.Difficulty.ToString(), preview);
    }

    private static object? CreationSnapshot()
    {
        if (_creation is not { } draft) return null;
        var preview = draft.Preview;
        return new
        {
            name = draft.Name, difficulty = draft.Difficulty.ToString().ToLowerInvariant(), round = draft.Round,
            step = preview is not null ? "preview" : draft.Answers.Count == CreationQuestions.Count ? "portrait" : "question",
            questionIndex = draft.Answers.Count, total = CreationQuestions.Count, answers = draft.Answers.ToArray(),
            question = draft.Answers.Count < CreationQuestions.Count ? CreationQuestions[draft.Answers.Count]!.DeepClone() : null,
            portraits = CreationProfile["portraits"]!.DeepClone(), roll = draft.Roll,
            startingCompanionCandidates = StartingCompanionPool(draft.Round).Select(candidate =>
            {
                var id = candidate.Id;
                var character = _content!.GetCharacter(id);
                return new { id, name = character.Name, weight = candidate.Weight };
            }).ToArray(),
            preview = preview is null ? null : new
            {
                portrait = CharacterMedia(preview.Hero, "portraits"), sprite = CharacterMedia(preview.Hero, "characters"),
                silver = preview.Silver, randomBonus = preview.RandomBonus,
                attributes = StatCatalog.TenDimensionStats.Select(s => new { id = StatCatalog.GetCode(s), label = StatCatalog.GetDisplayNameCn(s), value = preview.Hero.GetBaseStat(s) }).ToArray(),
                talents = preview.Hero.EffectiveTalents.Select(t => new { id = t.Id, name = t.Name }).ToArray(),
                internalSkills = preview.Hero.InternalSkills.Select(s => new { id = s.Id, name = s.Name, level = s.Level }).ToArray(),
                items = preview.Items.Select(pair => new { id = pair.Key, name = _content!.GetItem(pair.Key).Name, quantity = pair.Value, icon = ItemMedia(pair.Key) }).ToArray()
            }
        };
    }
}
