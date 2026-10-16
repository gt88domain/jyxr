using System.Text.Json;
using System.Text.Json.Nodes;
using Game.Web.Runtime;

internal static class StoryDefeatSmoke
{
    public static async Task Run(string contentPath, string normalSavePath, string outputPath)
    {
        JsonNode Parse(string text)
        {
            var r = JsonNode.Parse(text)!;
            if (!r["ok"]!.GetValue<bool>()) throw new InvalidOperationException(r["error"]!.ToString());
            return r["state"]!;
        }
        async Task<JsonNode> Cmd(object command) => Parse(await BrowserBridge.Dispatch(JsonSerializer.Serialize(command)));
        void Check(bool value, string message) { if (!value) throw new InvalidOperationException(message); }
        Parse(BrowserBridge.Initialize(File.ReadAllText(contentPath)));
        Parse(BrowserBridge.ImportSave(File.ReadAllText(normalSavePath)));
        var s = await Cmd(new { type = "interact", locationId = "襄阳" });
        for (var i = 0; i < 100 && s["phase"]!.ToString() == "dialogue"; i++) s = await Cmd(new { type = "next" });
        Check(s["battle"]?["id"]?.ToString() == "最终战场_战斗", "Real completed relief route must open the original final battlefield.");
        var silver = s["silver"]!.GetValue<int>(); var exp = s["hero"]!["experience"]!.GetValue<int>();
        // Real legal rest actions deliberately exercise defeat, not a balanced
        // attempt at winning. No outcome, level, equipment or save edits.
        for (var i = 0; i < 1500 && s["battle"]!["outcome"]!.ToString() == "ongoing"; i++) s = await Cmd(new { type = "rest" });
        Check(s["battle"]!["outcome"]!.ToString() == "lose", "Rest-only policy must reach a real defeat.");
        s = await Cmd(new { type = "leaveBattle" });
        Check(s["phase"]!.ToString() == "gameover" && s["ending"]!["kind"]!.ToString() == "gameover", "Missing source lose result must end the game.");
        Check(s["silver"]!.GetValue<int>() == silver && s["hero"]!["experience"]!.GetValue<int>() == exp, "Defeat must not grant victory rewards.");
        var deaths = s["profile"]!["deathCount"]!.GetValue<int>();
        Check(deaths == 1 && s["profile"]!["completionCount"]!.GetValue<int>() == 0, "Record one death, without a completion.");
        var saved = BrowserBridge.ExportSave();File.WriteAllText(outputPath, saved);
        s = Parse(BrowserBridge.ImportSave(saved));
        Check(s["phase"]!.ToString() == "gameover" && s["profile"]!["deathCount"]!.GetValue<int>() == deaths, "Game-over save/reload must not repeat death accounting.");
        Console.WriteLine("PASS real final-battle defeat: implicit original game-over, no rewards/completion, persistent ending and one death");
    }
}
