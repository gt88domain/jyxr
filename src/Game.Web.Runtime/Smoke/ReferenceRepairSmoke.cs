using System.Text.Json;
using System.Text.Json.Nodes;
using Game.Web.Runtime;

internal static class ReferenceRepairSmoke
{
    public static async Task Run(string contentPath, string normalSavePath)
    {
        JsonNode Parse(string text)
        {
            var r=JsonNode.Parse(text)!;
            if(!r["ok"]!.GetValue<bool>())throw new InvalidOperationException(r["error"]!.ToString());
            return r["state"]!;
        }
        async Task<JsonNode> Cmd(object command)=>Parse(await BrowserBridge.Dispatch(JsonSerializer.Serialize(command)));
        void Check(bool value,string message){if(!value)throw new InvalidOperationException(message);}
        Parse(BrowserBridge.Initialize(File.ReadAllText(contentPath)));
        var baseline=File.ReadAllText(normalSavePath);
        Parse(BrowserBridge.ImportSave(baseline));
        var s=await Cmd(new{type="playStory",storyId="碧血剑_五毒教圣地2"});var lines=0;
        while(s["phase"]!.ToString()=="dialogue"&&lines<10){lines++;s=await Cmd(new{type="next"});}
        Check(lines==4&&s["map"]!["id"]!.ToString()=="五毒教森林1","Four original lines must lead to the uploaded source's actual forest map.");
        Parse(BrowserBridge.ImportSave(BrowserBridge.ExportSave()));
        Console.WriteLine("PASS exact five-poisons source repair: four original lines, real forest entry and save/reload");
        foreach(var (story,text,battle) in new[]{
            ("武当派_卓一航1","师伯，我来祝你们一臂之力！","武当派_玉罗刹之战"),
            ("武当派_卓一航2","唉，一航师兄，我来祝你一臂之力！","武当派_玉罗刹之战2")})
        {
            Parse(BrowserBridge.ImportSave(baseline));
            s=await Cmd(new{type="playStory",storyId=story});
            Check(s["dialogue"]!["text"]!.ToString()==text&&s["dialogue"]!["speaker"]!.ToString()==""&&s["dialogue"]!["portrait"] is null,
                "Unattributed original text must await Next with no fabricated actor or portrait.");
            s=await Cmd(new{type="next"});
            Check(s["phase"]!.ToString()=="battle"&&s["battle"]!["id"]!.ToString()==battle,"Preserved source narration must continue to its actual battle.");
            Console.WriteLine("PASS unaltered anonymous original dialogue and real Wudang battle: "+story);
        }
    }
}
