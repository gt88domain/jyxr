using System.Text.Json;
using System.Text.Json.Nodes;

internal static class CreationSmoke
{
    private static JsonNode State(string json)
    {
        var result = JsonNode.Parse(json)!;
        if (!result["ok"]!.GetValue<bool>()) throw new InvalidOperationException(result["error"]!.GetValue<string>());
        return result["state"]!;
    }
    private static async Task<JsonNode> Command(object value) => State(await Game.Web.Runtime.BrowserBridge.Dispatch(JsonSerializer.Serialize(value)));
    private static void Check(bool condition, string message) { if (!condition) throw new InvalidOperationException(message); }
    private static async Task<JsonNode> Prepare(int[] answers, string difficulty = "normal", string portrait = "头像.独孤求败")
    {
        await Command(new { type = "beginCreation", name = "原版开局验收", difficulty });
        for (var i = 0; i < answers.Length; i++) await Command(new { type = "answerCreation", questionIndex = i, index = answers[i] });
        return (await Command(new { type = "selectCreationPortrait", portraitId = portrait }))["creation"]!["preview"]!;
    }
    private static int Quantity(JsonNode preview, string id) => preview["items"]!.AsArray().FirstOrDefault(i => i!["id"]!.GetValue<string>() == id)?["quantity"]?.GetValue<int>() ?? 0;
    private static int Base(JsonNode preview, string id) => preview["attributes"]!.AsArray().Single(s => s!["id"]!.GetValue<string>() == id)!["value"]!.GetValue<int>() - preview["randomBonus"]![id]!.GetValue<int>();
    private static void RandomTotal(JsonNode preview) => Check(preview["randomBonus"]!.AsObject().Sum(s => s.Value!.GetValue<int>()) == 40, "13 random draws must grant exactly 3×10 + 10×1 points.");

    public static async Task Run(string path)
    {
        var content = File.ReadAllText(path);
        State(Game.Web.Runtime.BrowserBridge.Initialize(content));
        var originSilver = new[] { 6100, 1100, 1200, 1000, 1100, 1100 };
        var originBili = new[] { 35, 40, 37, 52, 40, 41 }; // template30 + origin delta + Q7乔峰10
        for (var origin = 0; origin < 6; origin++)
        {
            var preview = await Prepare([origin, 0, 0, 0, 0, 0, 0]);
            Check(preview["silver"]!.GetValue<int>() == originSilver[origin], "Origin silver mismatch.");
            Check(Base(preview, "bili") == originBili[origin], "Origin attributes mismatch.");
            Check(Quantity(preview, "小还丹") == 3 && Quantity(preview, "新手礼包-大蟠桃") == 5, "First-round normal gifts mismatch.");
            RandomTotal(preview);
            var items = preview["items"]!.ToJsonString();
            for (var reroll = 0; reroll < 5; reroll++)
            {
                preview = (await Command(new { type = "rollCreation" }))["creation"]!["preview"]!;
                Check(Base(preview, "bili") == originBili[origin] && preview["items"]!.ToJsonString() == items, "Reroll compounded permanent attributes/rewards.");
                RandomTotal(preview);
            }
        }
        Console.WriteLine("PASS six original origins, source silver/stat deltas, 40 random points and 30 independent rerolls");
        var hunter = await Prepare([1, 4, 4, 2, 2, 1, 5], "hard");
        Check(new[] { "异世人", "猎人", "自我主义", "好色" }.All(id => hunter["talents"]!.AsArray().Any(t => t!["id"]!.GetValue<string>() == id)), "Answer talents not granted.");
        Check(Quantity(hunter, "天王保命丹") == 6 && Quantity(hunter, "新手礼包-大蟠桃") == 0, "Hard mode gifts mismatch.");
        var special = await Prepare([0, 0, 0, 1, 0, 0, 4]);
        Check(special["internalSkills"]!.AsArray().Single(s => s!["id"]!.GetValue<string>() == "基本内功")!["level"]!.GetValue<int>() == 20 && Quantity(special, "松果") == 3, "Squirrel answer must grant level20 internal skill and three pinecones.");
        var before = (await Command(new { type = "state" }))["creation"]!.ToJsonString();
        var rejected = JsonNode.Parse(await Game.Web.Runtime.BrowserBridge.Dispatch("{\"type\":\"answerCreation\",\"questionIndex\":0,\"index\":999}"))!;
        Check(!rejected["ok"]!.GetValue<bool>(), "Invalid/stale answer accepted.");
        Check((await Command(new { type = "state" }))["creation"]!.ToJsonString() == before, "Rejected command mutated preview.");
        await Command(new { type = "backCreation" });
        await Command(new { type = "backCreation" });
        Check((await Command(new { type = "state" }))["creation"]!["questionIndex"]!.GetValue<int>() == 6, "Backtracking must return to last answer.");
        await Command(new { type = "answerCreation", questionIndex = 6, index = 4 });
        var restoredPreview = (await Command(new { type = "selectCreationPortrait", portraitId = "头像.独孤求败" }))["creation"]!["preview"]!;
        await Command(new { type = "confirmCreation" });
        var state = await Command(new { type = "state" });
        while (state["phase"]!.GetValue<string>() == "dialogue") state = await Command(new { type = "next" });
        Check(state["silver"]!.GetValue<int>() == 6100, "Confirmed money differs from preview.");
        Check(state["hero"]!["portrait"]!.GetValue<string>() == restoredPreview["portrait"]!.GetValue<string>(), "Confirmed portrait differs from preview.");
        foreach (var stat in restoredPreview["attributes"]!.AsArray())
            Check(state["hero"]!["attributes"]!.AsArray().Single(s => s!["id"]!.GetValue<string>() == stat!["id"]!.GetValue<string>())!["baseValue"]!.GetValue<int>() == stat!["value"]!.GetValue<int>(), "Confirmed attributes differ from preview.");
        var saved = Game.Web.Runtime.BrowserBridge.ExportSave();
        var loaded = State(Game.Web.Runtime.BrowserBridge.ImportSave(saved));
        Check(loaded["hero"]!.ToJsonString() == state["hero"]!.ToJsonString() && loaded["inventory"]!.ToJsonString() == state["inventory"]!.ToJsonString(), "Creation results must survive actual save import including level20 internal skill.");
        rejected = JsonNode.Parse(await Game.Web.Runtime.BrowserBridge.Dispatch("{\"type\":\"confirmCreation\"}"))!;
        Check(!rejected["ok"]!.GetValue<bool>() && rejected["state"]!["silver"]!.GetValue<int>() == 6100, "Double confirmation must not duplicate rewards.");
        State(Game.Web.Runtime.BrowserBridge.Initialize(content));
        await Command(new { type = "beginCreation", name = "取消测试" });
        Check((await Command(new { type = "cancelCreation" }))["creation"] is null, "Cancel must discard the draft.");
        Console.WriteLine("PASS original talent/item/special-skill answers, hard mode, backtracking, invalid commands, exact confirmation, save roundtrip and cancellation");
    }
}
