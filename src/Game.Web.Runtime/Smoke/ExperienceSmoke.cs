using System.Text.Json;
using System.Text.Json.Nodes;
using Game.Web.Runtime;

internal static class ExperienceSmoke
{
    public static async Task Run(string contentPath, string oldSavePath)
    {
        JsonNode State(string result)
        {
            var r = JsonNode.Parse(result)!;
            if (!r["ok"]!.GetValue<bool>()) throw new InvalidOperationException(r["error"]!.ToString());
            return r["state"]!;
        }
        void Check(bool value, string message) { if (!value) throw new InvalidOperationException(message); }
        State(BrowserBridge.Initialize(File.ReadAllText(contentPath)));
        var old = JsonNode.Parse(File.ReadAllText(oldSavePath))!;
        Check(old["characterExperienceCurve"] is null, "Fixture must be a real pre-fix browser save.");
        State(BrowserBridge.ImportSave(old.ToJsonString()));
        var migrated = JsonNode.Parse(BrowserBridge.ExportSave())!;
        var heroes = migrated["game"]!["characters"]!.AsArray();
        var hero = heroes.Single(c => c!["id"]!.GetValue<string>() == "主角")!;
        Check(hero["level"]!.GetValue<int>() == 22 && hero["experience"]!.GetValue<int>() == 10253,
            "Actual Lv22/65463 fixture must migrate to Lv22/10253 without free levels.");
        foreach (var original in old["game"]!["characters"]!.AsArray())
        {
            var expected = original!.DeepClone(); var actual = heroes.Single(c => c!["id"]!.ToString() == expected["id"]!.ToString())!;
            expected["experience"] = actual["experience"]!.DeepClone();
            Check(JsonNode.DeepEquals(expected, actual), "Migration must preserve every non-EXP character field, including reserve members.");
        }
        Check(migrated["characterExperienceCurve"]!.GetValue<string>() == "LegacyCumulative", "New exports must identify their curve.");
        State(BrowserBridge.ImportSave(migrated.ToJsonString()));
        var again = JsonNode.Parse(BrowserBridge.ExportSave())!;
        Check(JsonNode.DeepEquals(migrated["game"]!["characters"], again["game"]!["characters"]), "New-format saves must never migrate twice.");
        Console.WriteLine("PASS real old eight-member save: exact Lv22 progress migration, all non-EXP fields preserved, idempotent reload");

        var invalid = again.DeepClone(); invalid["characterExperienceCurve"] = "unknown";
        var rejected = JsonNode.Parse(BrowserBridge.ImportSave(invalid.ToJsonString()))!;
        Check(!rejected["ok"]!.GetValue<bool>(), "Unknown curves must be rejected.");
        State(await BrowserBridge.Dispatch(JsonSerializer.Serialize(new { type = "state" })));
        Check(JsonNode.DeepEquals(again["game"]!["characters"], JsonNode.Parse(BrowserBridge.ExportSave())!["game"]!["characters"]),
            "Rejected imports must preserve the running party.");
        var raw = old["game"]!.DeepClone();
        State(BrowserBridge.ImportSave(raw.ToJsonString()));
        var v1 = JsonNode.Parse(BrowserBridge.ExportSave())!["game"]!["characters"]!.AsArray().Single(c => c!["id"]!.ToString() == "主角")!;
        Check(v1["experience"]!.GetValue<int>() == 10253 && v1["level"]!.GetValue<int>() == 22, "Unwrapped v1 saves must migrate too.");
        Console.WriteLine("PASS v1 import and invalid-curve atomic rejection");
    }
}
