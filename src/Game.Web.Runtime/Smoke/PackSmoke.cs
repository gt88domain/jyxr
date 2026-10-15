using System.Text.Json;
using System.Text.Json.Nodes;
using Game.Web.Runtime;

internal static class PackSmoke
{
    public static async Task Run(string easternPath, string westernPath)
    {
        var eastern = File.ReadAllText(easternPath);
        var western = File.ReadAllText(westernPath);
        Ok(BrowserBridge.Initialize(eastern), "load eastern pack");
        Ok(await Command(new { type = "createCharacter", name = "隔离验收侠" }), "start eastern pack");
        var pending = State(await Command(new { type = "state" }));
        var broken = JsonNode.Parse(western)!.AsObject();
        broken["browser"]!["initialMapId"] = "missing-map";
        Fail(BrowserBridge.Initialize(broken.ToJsonString()), "reject invalid candidate pack");
        Equal(State(await Command(new { type = "state" })).GetProperty("hero").GetProperty("name").GetString(), "隔离验收侠", "failed pack preserved live hero");
        Equal(State(await Command(new { type = "state" })).GetProperty("phase").GetString(), pending.GetProperty("phase").GetString(), "failed pack preserved pending flow");
        Ok(BrowserBridge.Initialize(western), "switch cancels pending eastern story");
        Equal(State(await Command(new { type = "state" })).GetProperty("phase").GetString(), "title", "switch leaves fresh title");
        Ok(await Command(new { type = "createCharacter", name = "验收佣兵" }), "start western pack");
        await Dialogues();
        var westSave = BrowserBridge.ExportSave();
        using (var save = JsonDocument.Parse(westSave))
        {
            Equal(save.RootElement.GetProperty("browserSaveVersion").GetInt32(), 2, "save version");
            Equal(save.RootElement.GetProperty("packId").GetString(), "frontier", "western save binds pack");
        }
        var unboundV1 = JsonNode.Parse(westSave)!.AsObject();
        unboundV1["browserSaveVersion"] = 1;
        unboundV1.Remove("packId");
        Fail(BrowserBridge.ImportSave(unboundV1.ToJsonString()), "reject unbound v1 in western world");
        Equal(State(await Command(new { type = "state" })).GetProperty("hero").GetProperty("name").GetString(), "验收佣兵", "failed old save preserves western hero");
        Ok(await Command(new { type = "interact", locationId = "mara" }), "recruit via real map story");
        await Dialogues();
        Ok(await Command(new { type = "choose", index = 0 }), "invite real companion");
        await Dialogues();
        var recruited = State(await Command(new { type = "state" }));
        Equal(recruited.GetProperty("party").GetArrayLength(), 2, "PartyService joined companion");
        if (!recruited.GetProperty("party").EnumerateArray().Any(p => p.GetProperty("id").GetString() == "frontier_mara")) throw new InvalidOperationException("Companion missing from actual party.");
        Ok(await Command(new { type = "interact", locationId = "east-road" }), "generic map navigation");
        Ok(await Command(new { type = "interact", locationId = "roadblock" }), "start real western encounter");
        await Dialogues();
        var encounter = State(await Command(new { type = "state" })).GetProperty("battle");
        Equal(encounter.GetProperty("outcome").GetString(), "ongoing", "western battle is pending");
        Equal(encounter.GetProperty("units").EnumerateArray().Count(u => u.GetProperty("team").GetInt32() == 1), 2, "both real members participate in battle");
        Ok(BrowserBridge.Initialize(eastern), "switch cancels pending western battle");
        Equal(State(await Command(new { type = "state" })).GetProperty("phase").GetString(), "title", "battle switch leaves clean title");
        Ok(await Command(new { type = "createCharacter", name = "银两验收侠" }), "start eastern candidate");
        await Dialogues();
        Fail(BrowserBridge.ImportSave(westSave), "reject other pack save");
        Equal(State(await Command(new { type = "state" })).GetProperty("hero").GetProperty("name").GetString(), "银两验收侠", "cross-pack failure preserves current session");

        // Isolated fixture uses the same content definitions and ShopService;
        // no fixture rewards, silver, or maps are added to production packages.
        var fixture = JsonNode.Parse(eastern)!.AsObject();
        fixture["browser"]!["initialMapId"] = "fixture-market";
        fixture["browser"]!["initialStoryId"] = "";
        fixture["maps"]!.AsArray().Add(JsonNode.Parse("""{"id":"fixture-market","name":"隔离测试市场","locations":[{"id":"merchant","name":"商人","events":[{"id":"trade","action":"shop('fixture-shop')","repeatMode":"infinite"}]}]}""")!);
        fixture["shops"]!.AsArray().Add(JsonNode.Parse("""{"id":"fixture-shop","name":"隔离测试商店","products":[{"id":"blade","reward":{"kind":"item","itemId":"木刀","quantity":1},"price":4,"maxClaims":2}]}""")!);
        Ok(BrowserBridge.Initialize(fixture.ToJsonString()), "load isolated real shop fixture");
        Ok(await Command(new { type = "createCharacter", name = "交易验收侠" }), "create shop fixture hero");
        var initial = JsonNode.Parse(BrowserBridge.ExportSave())!.AsObject();
        initial["game"]!["currency"]!["silver"] = 20;
        Ok(BrowserBridge.ImportSave(initial.ToJsonString()), "fund isolated shop fixture");
        Ok(await Command(new { type = "interact", locationId = "merchant" }), "generic shop map action");
        var shop = State(await Command(new { type = "state" }));
        Equal(shop.GetProperty("phase").GetString(), "shop", "shop phase");
        Fail(await Command(new { type = "buy", productId = "blade", quantity = 3 }), "reject excess stock");
        Equal(State(await Command(new { type = "state" })).GetProperty("silver").GetInt32(), 20, "stock rejection preserves silver");
        Ok(await Command(new { type = "buy", productId = "blade", quantity = 2 }), "buy real items through ShopService");
        var bought = State(await Command(new { type = "state" }));
        Equal(bought.GetProperty("silver").GetInt32(), 12, "buy conserves silver");
        Equal(bought.GetProperty("shop").GetProperty("products")[0].GetProperty("remaining").GetInt32(), 0, "purchase consumes claim stock");
        var item = bought.GetProperty("shop").GetProperty("sellable").EnumerateArray().First(i => i.GetProperty("id").GetString() == "木刀");
        var sellPrice = item.GetProperty("price").GetInt32();
        Ok(await Command(new { type = "sell", entryNumber = item.GetProperty("entryNumber").GetInt64(), quantity = 1 }), "sell real inventory item");
        Equal(State(await Command(new { type = "state" })).GetProperty("silver").GetInt32(), 12 + sellPrice, "sell credits actual half-price proceeds");
        Fail(await Command(new { type = "buy", productId = "blade" }), "selling does not reset stock");
        Ok(await Command(new { type = "closeShop" }), "close shop completes map event");
        var persisted = BrowserBridge.ExportSave();
        Ok(BrowserBridge.ImportSave(persisted), "shop save roundtrip");
        Ok(await Command(new { type = "interact", locationId = "merchant" }), "reopen saved shop");
        Equal(State(await Command(new { type = "state" })).GetProperty("shop").GetProperty("products")[0].GetProperty("remaining").GetInt32(), 0, "stock persists after save");
        Console.WriteLine("PASS pack isolation, candidate replacement, real shop conservation and persistence");
    }

    private static Task<string> Command(object command) => BrowserBridge.Dispatch(JsonSerializer.Serialize(command));
    private static JsonElement State(string response) { using var doc = JsonDocument.Parse(response); return doc.RootElement.GetProperty("state").Clone(); }
    private static void Ok(string response, string label) { using var doc = JsonDocument.Parse(response); if (!doc.RootElement.GetProperty("ok").GetBoolean()) throw new InvalidOperationException($"{label}: {response}"); Console.WriteLine($"PASS {label}"); }
    private static void Fail(string response, string label) { using var doc = JsonDocument.Parse(response); if (doc.RootElement.GetProperty("ok").GetBoolean()) throw new InvalidOperationException($"Expected failure: {label}"); Console.WriteLine($"PASS {label}"); }
    private static void Equal<T>(T actual, T expected, string label) { if (!EqualityComparer<T>.Default.Equals(actual, expected)) throw new InvalidOperationException($"{label}: {actual} != {expected}"); }
    private static async Task Dialogues()
    {
        for (var i = 0; i < 100; i++)
        {
            var state = State(await Command(new { type = "state" }));
            if (state.GetProperty("phase").GetString() != "dialogue") return;
            Ok(await Command(new { type = "next" }), "continue opening");
        }
        throw new InvalidOperationException("Opening failed to complete.");
    }
}
