using System.Text.Json;
using System.Text.Json.Nodes;
using Game.Web.Runtime;

// Isolated UI integration setup. It teaches two real skills through the story
// service but never edits attributes, resources, rewards or battle outcomes.
// This is not evidence that those skills were acquired on a normal quest.
internal static class AdvancedUiFixture
{
    public static async Task Create(string contentPath, string normalSavePath, string outputPath)
    {
        JsonNode Parse(string text)
        {
            var r=JsonNode.Parse(text)!;
            if(!r["ok"]!.GetValue<bool>())throw new InvalidOperationException(r["error"]!.ToString());return r["state"]!;
        }
        var content=JsonNode.Parse(File.ReadAllText(contentPath))!;
        content["storyScripts"]!.AsObject()["fixture_advanced_ui"]=JsonNode.Parse("""
            {"version":3,"segments":[{"name":"fixture_advanced_ui","steps":[
              {"kind":"command","call":"learn_special('主角', '华佗再世')"},
              {"kind":"command","call":"learn_special('主角', '武穆兵法')"}
            ]}]}
            """);
        Parse(BrowserBridge.Initialize(content.ToJsonString()));Parse(BrowserBridge.ImportSave(File.ReadAllText(normalSavePath)));
        Parse(await BrowserBridge.Dispatch(JsonSerializer.Serialize(new{type="playStory",storyId="fixture_advanced_ui"})));
        Parse(await BrowserBridge.Dispatch(JsonSerializer.Serialize(new{type="enterMap",mapId="同福客栈"})));
        var save=BrowserBridge.ExportSave();if(JsonNode.Parse(save)!["error"] is not null)throw new InvalidOperationException(save);
        File.WriteAllText(outputPath,save);Console.WriteLine("PASS isolated UI fixture teaches actual 华佗/武穆 through CharacterService with normal attributes and original IDs");
    }
}
