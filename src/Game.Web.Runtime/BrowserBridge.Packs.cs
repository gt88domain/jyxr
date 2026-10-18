using System.Text.Json;
using System.Text.Json.Nodes;
using Game.Content.Loading;
using Game.Core.Model;
using Game.Core.Model.Character;

namespace Game.Web.Runtime;

public static partial class BrowserBridge
{
    private static JsonObject _pack = LegacyPack();
    private static string? _shopId;
    private static bool _hasSaved;
    private static readonly HashSet<string> WonBattles = new(StringComparer.Ordinal);
    private static string PackText(string key) => _pack[key]?.GetValue<string>() ?? "";
    private static JsonObject LegacyPack() => new()
    {
        ["id"] = "jyx", ["title"] = "金庸群侠传 X", ["heroDefinitionId"] = "主角",
        ["initialMapId"] = "小村", ["initialStoryId"] = "新手村_出生",
        ["trainingMapId"] = "小村", ["trainingStoryId"] = "新手村_武师7"
    };

    private static void ValidatePack(JsonObject pack, InMemoryContentRepository content)
    {
        foreach (var key in new[] { "id", "title", "heroDefinitionId", "initialMapId" })
            if (pack[key] is not JsonValue value || !value.TryGetValue<string>(out var text) || string.IsNullOrWhiteSpace(text))
                throw new InvalidOperationException($"内容包缺少 {key}。");
        content.GetCharacter(pack["heroDefinitionId"]!.GetValue<string>());
        content.GetMap(pack["initialMapId"]!.GetValue<string>());
        if (pack["formationRules"] is { } formationNode)
        {
            var formation = formationNode.Deserialize<Game.Core.Battle.BattleFormationRules>(Json) ?? throw new InvalidOperationException("阵法规则为空。");
            formation.Validate();
            foreach (var talentId in new[] { formation.InterceptTalentId, formation.SharedDamageTalentId, formation.TransferTalentId, formation.GroupAttackTalentId })
                content.GetTalent(talentId);
        }
        foreach (var key in new[] { "initialStoryId", "trainingStoryId" })
            if (pack[key]?.GetValue<string>() is { Length: > 0 } story) content.GetStorySegment(story);
        if (pack["trainingMapId"]?.GetValue<string>() is { Length: > 0 } map) content.GetMap(map);
        if (pack["creation"]?["startingCompanionPools"] is JsonArray pools)
        {
            if (pools.Count == 0) throw new InvalidOperationException("开局伙伴池不能为空。");
            var previousRound = 0;
            foreach (var pool in pools)
            {
                var minimumRound = pool!["minimumRound"]!.GetValue<int>();
                if (minimumRound <= previousRound || previousRound == 0 && minimumRound != 1)
                    throw new InvalidOperationException("开局伙伴池必须从第一周目开始并按周目递增。");
                previousRound = minimumRound;
                var ids = pool["characterIds"]!.AsArray().Select(id => id!.GetValue<string>()).ToArray();
                if (pool["weights"] is JsonArray weights)
                {
                    if (weights.Count != ids.Length || weights.Any(weight => weight!.GetValue<int>() <= 0))
                        throw new InvalidOperationException("开局伙伴权重须与候选一一对应且为正整数。");
                    _ = weights.Aggregate(0, (total, weight) => checked(total + weight!.GetValue<int>()));
                }
                if (ids.Distinct(StringComparer.Ordinal).Count() != ids.Length)
                    throw new InvalidOperationException("开局伙伴候选不能重复。");
                foreach (var id in ids)
                {
                    if (id == Party.HeroCharacterId || id == pack["heroDefinitionId"]!.GetValue<string>())
                        throw new InvalidOperationException("主角不能作为开局伙伴重复发放。");
                    content.GetCharacter(id);
                }
            }
        }
        foreach (var milestone in (pack["milestones"]?.AsArray() ?? []).OfType<JsonObject>())
        {
            content.GetStorySegment(milestone["storyId"]!.GetValue<string>());
            if (string.IsNullOrWhiteSpace(milestone["id"]?.GetValue<string>()) || string.IsNullOrWhiteSpace(milestone["title"]?.GetValue<string>()))
                throw new InvalidOperationException("江湖消息缺少编号或标题。");
        }
        foreach (var objective in (pack["objectives"]?.AsArray() ?? []).OfType<JsonObject>())
        {
            var kind = objective["kind"]?.GetValue<string>();
            var target = objective["target"]?.GetValue<string>() ?? "";
            if (string.IsNullOrWhiteSpace(objective["id"]?.GetValue<string>()) || string.IsNullOrWhiteSpace(objective["title"]?.GetValue<string>())) throw new InvalidOperationException("任务缺少编号或标题。");
            switch (kind)
            {
                case "story": content.GetStorySegment(target); break;
                case "party": content.GetCharacter(target); break;
                case "battle": content.GetBattle(target); break;
                case "equipment": case "cultivation": case "purchase": case "save": break;
                default: throw new InvalidOperationException($"未知任务类型：{kind}。");
            }
        }
    }

    private static void Interact(string locationId)
    {
        RequireManagement();
        if (_shopId is not null || _storyTask is { IsCompleted: false }) throw new InvalidOperationException("请先结束当前交互。");
        var session = RequireSession();
        var location = CurrentMapView().Locations.FirstOrDefault(l => l.Location.Id == locationId);
        if (location.Location is null || location.Event is null) throw new InvalidOperationException("此地点当前没有可用事件。");
        var interaction = session.MapService.InteractWithLocation(location);
        _storyTask = session.MapService.ExecuteInteractionAsync(interaction, _storyCancellation.Token);
        if (_storyTask.IsFaulted) throw _storyTask.Exception!.GetBaseException();
    }

    private static void Buy(JsonElement args)
    {
        RequireShop();
        var quantity = args.TryGetProperty("quantity", out var amount) ? amount.GetInt32() : 1;
        var result = RequireSession().ShopService.Buy(_shopId!, Read(args, "productId"), quantity);
        if (!result.Success) throw new InvalidOperationException(result.Message);
        Log(result.Message);
    }

    private static void Sell(JsonElement args)
    {
        RequireShop();
        var quantity = args.TryGetProperty("quantity", out var amount) ? amount.GetInt32() : 1;
        var entry = Entry(args.GetProperty("entryNumber").GetInt64());
        if ((entry is StackInventoryEntry stackEntry ? stackEntry.Quantity : 1) - quantity < AssignedManuals(entry.Definition.Id)) throw new InvalidOperationException("秘籍正在修炼，请先暂停相应人物的修炼。");
        // ShopService validates ownership/quantity; preflight arithmetic before it
        // removes inventory so malformed huge commands cannot overflow afterward.
        var proceeds = checked(RequireSession().ShopService.GetSellPrice(entry.Definition) * quantity);
        _ = checked(RequireSession().State.Currency.Silver + proceeds);
        var result = RequireSession().ShopService.Sell(entry, quantity);
        if (!result.Success) throw new InvalidOperationException(result.Message);
        ClearUnavailableCultivations();
        Log(result.Message);
    }

    private static void RequireShop()
    {
        RequireSession();
        if (_shopId is null || _battle is not null || _host.Dialogue is not null || _host.Choice is not null) throw new InvalidOperationException("请先进入商店。");
    }

    private static void CloseShop()
    {
        RequireShop();
        var pending = _host.ShopCompletion;
        _shopId = null;
        _host.ShopCompletion = null;
        pending?.SetResult();
    }

    private static object? ShopSnapshot()
    {
        if (_session is null || _shopId is null) return null;
        var shop = _session.ShopService.Open(_shopId);
        return new
        {
            id = shop.Definition.Id, name = shop.Definition.Name,
            products = shop.Products.Select(p => new
            {
                id = p.ProductId, itemId = p.Item?.Id, name = p.DisplayName, description = p.Description, icon = p.Item is null ? null : ItemMedia(p.Item.Id),
                price = p.Price, premiumPrice = p.PremiumPrice, remaining = p.RemainingClaims, purchased = p.PurchasedQuantity,
                canBuy = p.Price is { } price && price <= _session.State.Currency.Silver && p.RemainingClaims != 0
            }).ToArray(),
            sellable = _session.State.Inventory.Entries.Where(e => _session.ShopService.CanSell(e.Definition)).Select(e => new
            {
                entryNumber = e.EntryNumber, id = e.Definition.Id, name = e.Definition.Name, icon = ItemMedia(e.Definition.Id),
                quantity = e is StackInventoryEntry stack ? stack.Quantity : 1,
                price = _session.ShopService.GetSellPrice(e.Definition)
            }).ToArray()
        };
    }

    private static object[] PartyView() => _session?.State.Party.Members.Select(c =>
    {
        var battleUnit = _battle?.Units.FirstOrDefault(u => u.Team == 1 && u.Character.Id == c.Id);
        return (object)new
        {
            id = c.Id, definitionId = c.Definition.Id, name = c.Name, level = c.Level,
            sprite = CharacterMedia(c, "characters"), portrait = CharacterMedia(c, "portraits"),
            hp = battleUnit?.Hp ?? c.CurrentHp ?? (int)c.GetStat(StatType.MaxHp), maxHp = (int)c.GetStat(StatType.MaxHp),
            mp = battleUnit?.Mp ?? c.CurrentMp ?? (int)c.GetStat(StatType.MaxMp), maxMp = (int)c.GetStat(StatType.MaxMp),
            skills = Skills(c).Select(s => SkillView(s)).ToArray(), equipment = EquipmentView(c), isHero = c.Id == Party.HeroCharacterId
        };
    }).ToArray() ?? [];

    private static object[] RosterView() => _session?.State.Party.GetAllCharacters().Select(c => (object)new
    {
        id = c.Id, definitionId = c.Definition.Id, name = c.Name, level = c.Level, portrait = CharacterMedia(c, "portraits"),
        placement = _session.State.Party.ContainsMember(c.Id) ? "member" : _session.State.Party.ContainsFollower(c.Id) ? "follower" : "reserve",
        formationStatus = _session.State.Party.ContainsMember(c.Id) ? "active" : _session.State.Party.ContainsFollower(c.Id) ? "following" : FormationReserves.Contains(c.Id) ? "reserve" : "story-away",
        cultivation = CultivationView(c),
        runningInternalName = c.InternalSkills.FirstOrDefault(s => s.Id == c.EquippedInternalSkillId)?.Name,
        isHero = c.Id == Party.HeroCharacterId, equipment = EquipmentView(c),
        sprite = CharacterMedia(c, "characters"), skills = Skills(c).Select(s => SkillView(s)).ToArray(),
        hp = c.CurrentHp ?? (int)c.GetStat(StatType.MaxHp), maxHp = (int)c.GetStat(StatType.MaxHp),
        mp = c.CurrentMp ?? (int)c.GetStat(StatType.MaxMp), maxMp = (int)c.GetStat(StatType.MaxMp),
        unspentStatPoints = c.UnspentStatPoints
        ,canBench = CanManage && c.Id != Party.HeroCharacterId && _session.State.Party.ContainsMember(c.Id), canRejoin = CanManage && FormationReserves.Contains(c.Id) && _session.State.Party.ContainsReserve(c.Id)
    }).ToArray() ?? [];

    private static object[] ObjectiveView() => (_pack["objectives"]?.AsArray() ?? []).OfType<JsonObject>().Select(o =>
    {
        var kind = o["kind"]!.GetValue<string>();
        var target = o["target"]?.GetValue<string>() ?? "";
        var completed = _session is not null && kind switch
        {
            "story" => _session.State.Story.IsStoryCompleted(target),
            "party" => _session.State.Party.ContainsMember(target),
            "equipment" => Enum.GetValues<EquipmentSlotType>().Any(s => Hero.GetEquipment(s) is { } e && (target.Length == 0 || e.Definition.Id == target)),
            "cultivation" => CultivationView(Hero) is not null && (target.Length == 0 || _cultivationItemId == target),
            "purchase" => _session.State.Shop.PurchasedQuantities.Any(p => p.Value > 0 && (target.Length == 0 || p.Key.ShopId == target)),
            "save" => _hasSaved,
            "battle" => WonBattles.Contains(target),
            _ => false
        };
        return (object)new { id = o["id"]!.GetValue<string>(), title = o["title"]!.GetValue<string>(), description = o["description"]?.GetValue<string>(), kind, target, completed };
    }).ToArray();

    private static string? CharacterMedia(string definitionId, string group, int team = 1) =>
        _pack["media"]?[group]?[definitionId]?.GetValue<string>() ??
        (group == "characters" ? _pack["media"]?[team == 1 ? "defaultFriendly" : "defaultEnemy"]?.GetValue<string>() : null);

    private static string? MapMedia(string mapId) => _pack["media"]?["maps"]?[mapId]?.GetValue<string>() ?? _pack["media"]?["worldBackground"]?.GetValue<string>();
    private static string? BattleMedia(string battleId) => _pack["media"]?["battles"]?[battleId]?.GetValue<string>() ?? _pack["media"]?["battleBackground"]?.GetValue<string>();
}
