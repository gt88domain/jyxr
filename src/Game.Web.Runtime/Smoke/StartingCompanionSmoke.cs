using System.Text.Json;
using System.Text.Json.Nodes;
using Game.Web.Runtime;

internal static class StartingCompanionSmoke
{
    private static void Check(bool condition, string message)
    {
        if (!condition) throw new InvalidOperationException(message);
    }

    private static JsonNode Parse(string json)
    {
        var result = JsonNode.Parse(json)!;
        Check(result["ok"]!.GetValue<bool>(), result["error"]?.GetValue<string>() ?? "Command rejected.");
        return result["state"]!;
    }

    private static async Task<JsonNode> Command(object value) => Parse(await BrowserBridge.Dispatch(JsonSerializer.Serialize(value)));
    private static async Task<JsonNode> Continue()
    {
        var state = await Command(new { type = "state" });
        for (var i = 0; i < 80 && state["phase"]!.GetValue<string>() == "dialogue"; i++) state = await Command(new { type = "next" });
        Check(state["phase"]!.GetValue<string>() != "dialogue", "Opening did not complete.");
        return state;
    }

    private static async Task<JsonNode> Prepare(string command)
    {
        await Command(new { type = command, name = "周目奖励检查", difficulty = "normal" });
        for (var i = 0; i < 7; i++) await Command(new { type = "answerCreation", questionIndex = i, index = 0 });
        return await Command(new { type = "selectCreationPortrait", portraitId = "头像.主角" });
    }

    private static JsonNode TransitionFixture(string baseline, int round, string kind = "next")
    {
        // Isolated pending-transition fixture. It does not claim a playthrough.
        var saved = JsonNode.Parse(baseline)!;
        var priorRound = kind == "next" ? round - 1 : round;
        saved["game"]!["adventure"]!["round"] = priorRound;
        saved["profile"]!["highestRound"] = priorRound;
        saved["profile"]!["yuanbao"] = 13;
        saved["ending"] = new JsonObject { ["kind"] = kind, ["completedRound"] = priorRound, ["targetRound"] = round };
        return saved;
    }

    private static string[] Pool(JsonNode content, int round) => content["browser"]!["creation"]!["startingCompanionPools"]!.AsArray()
        .Last(p => p!["minimumRound"]!.GetValue<int>() <= round)!["characterIds"]!.AsArray().Select(c => c!.GetValue<string>()).ToArray();

    private static void VerifyAlly(JsonNode state, JsonNode content, string[] candidates)
    {
        var party = state["party"]!.AsArray();
        Check(party.Count == (candidates.Length == 0 ? 1 : 2), "Opening must contain exactly the hero and at most one awarded companion.");
        if (candidates.Length == 0) return;
        var ally = party.Single(c => !c!["isHero"]!.GetValue<bool>())!;
        var id = ally["definitionId"]!.GetValue<string>();
        Check(candidates.Contains(id), "Awarded role is outside the actual round pool.");
        var definition = content["characters"]!.AsArray().Single(c => c!["id"]!.GetValue<string>() == id)!;
        Check(ally["id"]!.GetValue<string>() == id && ally["level"]!.GetValue<int>() == definition["level"]!.GetValue<int>(), "Role identity or original starting level changed.");
        var saved = JsonNode.Parse(BrowserBridge.ExportSave())!;
        var record = saved["game"]!["characters"]!.AsArray().Single(c => c!["id"]!.GetValue<string>() == id)!;
        foreach (var (stat, value) in definition["stats"]!.AsObject())
        {
            if (stat == "wuxue") continue; // modern domain derives martial knowledge
            Check((record["baseStats"]![stat]?.GetValue<double>() ?? 0) == value!.GetValue<double>(), $"Award changed original base stat {id}/{stat}.");
        }
    }

    public static async Task Run(string contentPath, string output)
    {
        Directory.CreateDirectory(output);
        var content = JsonNode.Parse(File.ReadAllText(contentPath))!;
        Parse(BrowserBridge.Initialize(content.ToJsonString()));
        var first = await Prepare("beginCreation");
        Check(first["creation"]!["startingCompanionCandidates"]!.AsArray().Count == 0, "Round one must not promise a free companion.");
        await Command(new { type = "confirmCreation" });
        var firstStarted = await Continue(); VerifyAlly(firstStarted, content, []);
        var baseline = BrowserBridge.ExportSave();
        Console.WriteLine("PASS normal first-round opening remains hero-only");

        foreach (var round in new[] { 2, 3, 4, 5, 6, 99 })
        {
            Parse(BrowserBridge.Initialize(content.ToJsonString()));
            var pending = TransitionFixture(baseline, round);
            Parse(BrowserBridge.ImportSave(pending.ToJsonString()));
            if (round is 2 or 3) File.WriteAllText(Path.Combine(output, $"starting-companion-round{round}-ready.json"), pending.ToJsonString());
            var originalGame = JsonNode.Parse(BrowserBridge.ExportSave())!["game"]!.ToJsonString();
            var preview = await Prepare("beginRoundCreation");
            var candidates = Pool(content, round);
            Check(preview["creation"]!["startingCompanionCandidates"]!.AsArray().Select(c => c!["id"]!.GetValue<string>()).SequenceEqual(candidates), "Preview must show the real ordered round pool.");
            Check(preview["creation"]!["startingCompanionCandidates"]!.AsArray().Select(c => c!["weight"]!.GetValue<int>()).SequenceEqual(new[] { 2 }.Concat(Enumerable.Repeat(1, candidates.Length - 1))), "Original inclusive-count/modulo weights changed.");
            for (var roll = 0; roll < 3; roll++)
            {
                preview = await Command(new { type = "rollCreation" });
                Check(JsonNode.Parse(BrowserBridge.ExportSave())!["game"]!.ToJsonString() == originalGame, "Reroll awarded a companion or changed the old journey.");
            }
            await Command(new { type = "cancelCreation" });
            Check(JsonNode.Parse(BrowserBridge.ExportSave())!["game"]!.ToJsonString() == originalGame, "Cancellation changed the old journey.");
            await Prepare("beginRoundCreation");
            await Command(new { type = "confirmCreation" });
            var started = await Continue();
            VerifyAlly(started, content, candidates);
            Check(started["adventure"]!["round"]!.GetValue<int>() == round && started["yuanbao"]!.GetValue<int>() == 13, "Round/profile was not preserved.");
            var saved = BrowserBridge.ExportSave();
            var rejected = JsonNode.Parse(await BrowserBridge.Dispatch("{\"type\":\"confirmCreation\"}"))!;
            Check(!rejected["ok"]!.GetValue<bool>() && BrowserBridge.ExportSave() == saved, "Duplicate confirmation granted another reward.");
            var restored = Parse(BrowserBridge.ImportSave(saved));
            Check(restored["party"]!.ToJsonString() == started["party"]!.ToJsonString(), "Reload changed the rewarded character or equipment.");
            Check(restored["profile"]!.ToJsonString() == started["profile"]!.ToJsonString(), "Reload changed completion/profile counters.");
        }
        Console.WriteLine("PASS round 2/3/4/5/6/99 pools, preview/reroll/cancel isolation, one grant, exact original stats and save roundtrip");

        var tested = 0;
        foreach (var pool in content["browser"]!["creation"]!["startingCompanionPools"]!.AsArray().Skip(1))
        {
            var round = pool!["minimumRound"]!.GetValue<int>();
            foreach (var candidate in pool["characterIds"]!.AsArray())
            {
                // Singleton candidate fixture makes every original role pass
                // through the same real confirmation, party and save services.
                var id = candidate!.GetValue<string>();
                var fixture = content.DeepClone();
                fixture["browser"]!["creation"]!["startingCompanionPools"]!.AsArray().Single(p => p!["minimumRound"]!.GetValue<int>() == round)!["characterIds"] = new JsonArray(id);
                fixture["browser"]!["creation"]!["startingCompanionPools"]!.AsArray().Single(p => p!["minimumRound"]!.GetValue<int>() == round)!["weights"] = new JsonArray(2);
                Parse(BrowserBridge.Initialize(fixture.ToJsonString()));
                Parse(BrowserBridge.ImportSave(TransitionFixture(baseline, round).ToJsonString()));
                await Prepare("beginRoundCreation"); await Command(new { type = "confirmCreation" });
                var started = await Continue(); VerifyAlly(started, content, [id]);
                if (id == "殷天正") File.WriteAllText(Path.Combine(output, "starting-companion-yin-save.json"), BrowserBridge.ExportSave());
                tested++;
            }
        }
        Check(tested == 43, "Not all original candidate definitions were exercised.");
        Console.WriteLine("PASS all 43 real candidate definitions join at original levels/stats, including the source-backed Yin Tianzheng alias; isolated candidate fixtures");

        Parse(BrowserBridge.Initialize(content.ToJsonString()));
        Parse(BrowserBridge.ImportSave(TransitionFixture(baseline, 3, "restart").ToJsonString()));
        await Prepare("beginRoundCreation"); await Command(new { type = "confirmCreation" });
        VerifyAlly(await Continue(), content, Pool(content, 3));
        Console.WriteLine("PASS same-round restart replaces the roster and awards one companion from that same round pool");

        var beforeInvalid = BrowserBridge.ExportSave();
        foreach (var invalid in new[] { "unknown", "duplicate", "hero", "order", "weight-count", "weight-zero" })
        {
            var bad = content.DeepClone(); var pool = bad["browser"]!["creation"]!["startingCompanionPools"]![1]!;
            if (invalid == "unknown") { pool["characterIds"] = new JsonArray("不存在的角色"); pool["weights"] = new JsonArray(2); }
            if (invalid == "duplicate") { pool["characterIds"] = new JsonArray("阿九", "阿九"); pool["weights"] = new JsonArray(2, 1); }
            if (invalid == "hero") { pool["characterIds"] = new JsonArray("主角"); pool["weights"] = new JsonArray(2); }
            if (invalid == "order") pool["minimumRound"] = 1;
            if (invalid == "weight-count") pool["weights"] = new JsonArray(2);
            if (invalid == "weight-zero") pool["weights"]![0] = 0;
            var result = JsonNode.Parse(BrowserBridge.Initialize(bad.ToJsonString()))!;
            Check(!result["ok"]!.GetValue<bool>() && BrowserBridge.ExportSave() == beforeInvalid, "Invalid content replaced the active journey.");
        }
        Console.WriteLine("PASS unknown roles, duplicated candidates, hero rewards and unordered pools reject before replacing the current journey");
    }
}
