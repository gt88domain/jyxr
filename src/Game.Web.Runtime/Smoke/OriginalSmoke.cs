using System.Text.Json;
using System.Text.Json.Nodes;
using Game.Web.Runtime;

internal static class OriginalSmoke
{
    private static JsonElement State(string response)
    {
        using var document = JsonDocument.Parse(response);
        if (!document.RootElement.GetProperty("ok").GetBoolean()) throw new InvalidOperationException(response);
        return document.RootElement.GetProperty("state").Clone();
    }
    private static async Task<JsonElement> Command(object command) => State(await BrowserBridge.Dispatch(JsonSerializer.Serialize(command)));
    private static async Task<JsonElement> Continue()
    {
        var state = await Command(new { type = "state" });
        for (var i = 0; i < 300; i++)
        {
            var phase = state.GetProperty("phase").GetString();
            if (phase != "dialogue") return state;
            state = await Command(new { type = "next" });
        }
        throw new InvalidOperationException("Dialogue loop did not finish.");
    }
    private static void Assert(bool condition, string message)
    {
        if (!condition) throw new InvalidOperationException(message);
    }

    public static async Task Run(string path)
    {
        var content = File.ReadAllText(path);
        var names = new[] { "古墓派", "大轮寺", "血刀门", "全真教", "灵鹫宫", "少林派", "武当派", "星宿派", "无门派" };
        var expected = new[] { "古墓", "大轮寺", "血刀门", "全真教", "灵鹫宫", "少林寺", "武当派", "星宿派", "" };
        for (var index = 0; index < names.Length; index++)
        {
            State(BrowserBridge.Initialize(content));
            await Command(new { type = "createCharacter", name = "原版校验侠" });
            await Continue();
            await Command(new { type = "playStory", storyId = "original_门派选择" });
            var menu = await Continue();
            Assert(menu.GetProperty("phase").GetString() == "sect", "Sect UI must await a real player choice.");
            Assert(menu.GetProperty("sects").GetArrayLength() == 9 && menu.GetProperty("sects").EnumerateArray().All(s => s.GetProperty("available").GetBoolean()), "Every original sect entry must be available.");
            Assert(JsonNode.Parse(BrowserBridge.ExportSave())!["error"] is not null, "Pending sect choice must not be saved as finished.");
            var state = await Command(new { type = "selectSect", sectId = names[index] });
            state = await Continue();
            if (names[index] == "少林派")
            {
                Assert(state.GetProperty("phase").GetString() == "choice", "Preserve original shaving choice.");
                await Command(new { type = "choose", index = 0 });
                state = await Continue();
                Assert(state.GetProperty("hero").GetProperty("talents").EnumerateArray().Any(t => t.GetProperty("id").GetString() == "无相"), "Shaolin talent must be granted.");
            }
            if (names[index] == "星宿派")
            {
                Assert(state.GetProperty("phase").GetString() == "choice", "Preserve original 星宿口号 choice.");
                await Command(new { type = "choose", index = 1 });
                state = await Continue();
            }
            Assert(state.GetProperty("phase").GetString() == "world", names[index] + " entry must return to its actual map.");
            var sect = state.GetProperty("adventure").GetProperty("sect");
            Assert((sect.ValueKind == JsonValueKind.Null ? "" : sect.GetString()) == expected[index], "Original runtime sect ID must be preserved: " + names[index]);
            var save = BrowserBridge.ExportSave();
            var restored = State(BrowserBridge.ImportSave(save));
            Assert(restored.GetProperty("adventure").GetProperty("sect").GetRawText() == sect.GetRawText(), "Sect must persist.");
            Console.WriteLine("PASS original sect entry/rewards/map/save: " + names[index]);
        }

        // The full original newbie state machine, using original story rewards
        // and actual battle execution. No forged completion flags or items.
        State(BrowserBridge.Initialize(content));
        await Command(new { type = "createCharacter", name = "教学校验侠" });
        await Continue();
        await Command(new { type = "playStory", storyId = "original_新手引导.任务买药" });
        var tutorial = await Continue();
        Assert(tutorial.GetProperty("tutorial").GetProperty("id").GetString() == "购买物品", "Original task must start.");
        await Command(new { type = "enterMap", mapId = "洛阳" });
        await Command(new { type = "interact", locationId = "商店" });
        await Continue();
        await Command(new { type = "choose", index = 0 });
        var medicine = await Continue();
        Assert(medicine.GetProperty("tutorial").GetProperty("id").GetString() == "购买药品完成", "Original newbie.xml finish should advance after gifts.");
        await Command(new { type = "enterMap", mapId = "南贤居" });
        await Command(new { type = "interact", locationId = "南贤" });
        var repayment = await Continue();
        Assert(repayment.GetProperty("hero").GetProperty("maxHp").GetInt32() == 300, "Original completion must grant +100 HP.");
        Assert(repayment.GetProperty("phase").GetString() == "choice", "Original follow-up choice should appear automatically.");
        await Command(new { type = "choose", index = 0 });
        await Continue();
        await Command(new { type = "enterMap", mapId = "洛阳" });
        await Command(new { type = "interact", locationId = "小孩" });
        var battle = await Continue();
        Assert(battle.GetProperty("phase").GetString() == "battle", "Original child battle must actually start.");
        for (var i = 0; i < 500 && battle.GetProperty("battle").GetProperty("outcome").GetString() == "ongoing"; i++)
            battle = await Command(new { type = "autoTurn" });
        Assert(battle.GetProperty("battle").GetProperty("outcome").GetString() != "ongoing", "Original battle must settle.");
        await Command(new { type = "leaveBattle" });
        var completeChild = await Continue();
        Assert(completeChild.GetProperty("tutorial").GetProperty("id").GetString() == "教训小孩完成", "Both original win/loss routes should progress the correct task.");
        await Command(new { type = "enterMap", mapId = "南贤居" });
        await Command(new { type = "interact", locationId = "南贤" });
        var end = await Continue();
        Assert(end.GetProperty("phase").GetString() == "sect", "Full original tutorial must reach sect selection.");
        Console.WriteLine("PASS full original newbie task completion, real battle and original reward progression");

        await Command(new { type = "selectSect", sectId = "无门派" });
        var world = await Continue();
        Assert(world.GetProperty("map").GetProperty("kind").GetString() == "large", "World must use real large-map travel.");
        var days = world.GetProperty("adventure").GetProperty("days").GetInt32();
        var oldWorld = JsonNode.Parse(BrowserBridge.ExportSave())!.AsObject();
        oldWorld["game"]!["location"]!["largeMapPositions"] = new JsonObject();
        var restoredWorld = State(BrowserBridge.ImportSave(oldWorld.ToJsonString()));
        Assert(restoredWorld.GetProperty("map").GetProperty("kind").GetString() == "large", "Old card-world saves must acquire a position.");
        Assert(restoredWorld.GetProperty("hero").GetRawText() == world.GetProperty("hero").GetRawText(), "World-position migration must not heal or alter the hero.");
        var destination = world.GetProperty("map").GetProperty("locations").EnumerateArray().First(l => l.GetProperty("id").GetString() == "洛阳");
        Assert(destination.GetProperty("timeSlots").GetInt32() > 1, "Distance must contribute to travel duration.");
        await Command(new { type = "interact", locationId = "洛阳" });
        var arrived = await Continue();
        Assert(arrived.GetProperty("adventure").GetProperty("days").GetInt32() > days, "World travel must advance time.");
        Console.WriteLine("PASS world map distance/time and full tutorial continuation");
        await BlackTutorial(content);
    }

    private static async Task BlackTutorial(string content)
    {
        State(BrowserBridge.Initialize(content));
        await Command(new { type = "createCharacter", name = "黑帮路线侠" });
        await Continue();
        await Command(new { type = "playStory", storyId = "original_新手引导.任务买药" });
        await Continue();
        await Command(new { type = "enterMap", mapId = "洛阳" });
        await Command(new { type = "interact", locationId = "商店" });
        await Continue();
        await Command(new { type = "choose", index = 0 });
        await Continue();
        await Command(new { type = "enterMap", mapId = "南贤居" });
        await Command(new { type = "interact", locationId = "南贤" });
        await Continue();
        await Command(new { type = "choose", index = 1 });
        var started = await Continue();
        Assert(started.GetProperty("tutorial").GetProperty("id").GetString() == "教训黑老大", "Preserve the alternative tutorial branch.");
        await Command(new { type = "enterMap", mapId = "衡阳" });
        await Command(new { type = "interact", locationId = "黑老大" });
        var battle = await Continue();
        Assert(battle.GetProperty("phase").GetString() == "battle", "Black-boss branch must run its original battle.");
        for (var i = 0; i < 500 && battle.GetProperty("battle").GetProperty("outcome").GetString() == "ongoing"; i++)
            battle = await Command(new { type = "autoTurn" });
        Assert(battle.GetProperty("battle").GetProperty("outcome").GetString() != "ongoing", "Black-boss battle must settle.");
        await Command(new { type = "leaveBattle" });
        var returned = await Continue();
        Assert(returned.GetProperty("tutorial").GetProperty("id").GetString() == "教训黑老大完成", "Original scripted humiliation must complete the correct branch.");
        await Command(new { type = "enterMap", mapId = "南贤居" });
        await Command(new { type = "interact", locationId = "南贤" });
        var ending = await Continue();
        Assert(ending.GetProperty("phase").GetString() == "sect", "Alternative tutorial must reach original sect UI.");
        var displayed = ending.GetProperty("map").GetRawText();
        for (var i = 0; i < 40; i++)
            Assert((await Command(new { type = "state" })).GetProperty("map").GetRawText() == displayed, "Read-only snapshots must not reroll original chance events.");
        Console.WriteLine("PASS original alternative 黑老大 tutorial and stable displayed random events");
    }
}
