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
        foreach (var key in new[] { "initialStoryId", "trainingStoryId" })
            if (pack[key]?.GetValue<string>() is { Length: > 0 } story) content.GetStorySegment(story);
        if (pack["trainingMapId"]?.GetValue<string>() is { Length: > 0 } map) content.GetMap(map);
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
        var location = session.MapService.GetCurrentMap().Locations.FirstOrDefault(l => l.Location.Id == locationId);
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
        // ShopService validates ownership/quantity; preflight arithmetic before it
        // removes inventory so malformed huge commands cannot overflow afterward.
        var proceeds = checked(RequireSession().ShopService.GetSellPrice(entry.Definition) * quantity);
        _ = checked(RequireSession().State.Currency.Silver + proceeds);
        var result = RequireSession().ShopService.Sell(entry, quantity);
        if (!result.Success) throw new InvalidOperationException(result.Message);
        if (_cultivationItemId == entry.Definition.Id && !RequireSession().State.Inventory.Entries.Any(e => e.Definition.Id == _cultivationItemId)) _cultivationItemId = null;
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
                id = p.ProductId, itemId = p.Item?.Id, name = p.DisplayName, description = p.Description,
                price = p.Price, premiumPrice = p.PremiumPrice, remaining = p.RemainingClaims, purchased = p.PurchasedQuantity,
                canBuy = p.Price is { } price && price <= _session.State.Currency.Silver && p.RemainingClaims != 0
            }).ToArray(),
            sellable = _session.State.Inventory.Entries.Where(e => _session.ShopService.CanSell(e.Definition)).Select(e => new
            {
                entryNumber = e.EntryNumber, id = e.Definition.Id, name = e.Definition.Name,
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
            sprite = CharacterMedia(c.Definition.Id, "characters"), portrait = CharacterMedia(c.Definition.Id, "portraits"),
            hp = battleUnit?.Hp ?? c.CurrentHp ?? (int)c.GetStat(StatType.MaxHp), maxHp = (int)c.GetStat(StatType.MaxHp),
            mp = battleUnit?.Mp ?? c.CurrentMp ?? (int)c.GetStat(StatType.MaxMp), maxMp = (int)c.GetStat(StatType.MaxMp),
            skills = Skills(c).Select(s => SkillView(s)).ToArray(), equipment = EquipmentView(c), isHero = c.Id == Party.HeroCharacterId
        };
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
