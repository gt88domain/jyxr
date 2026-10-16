using System.Text.Json;
using System.Text.Json.Nodes;
using Game.Web.Runtime;

internal static class MiniGameSmoke
{
    private static JsonNode Parse(string json)
    {
        var r=JsonNode.Parse(json)!;
        if(!r["ok"]!.GetValue<bool>()) throw new InvalidOperationException(r["error"]!.GetValue<string>());
        return r;
    }
    private static async Task<JsonNode> Cmd(object value)=>Parse(await BrowserBridge.Dispatch(JsonSerializer.Serialize(value)))["state"]!;
    private static JsonNode Input(object value)=>Parse(BrowserBridge.MiniGameInput(JsonSerializer.Serialize(value)))["frame"]!;
    private static void Check(bool value,string message){if(!value)throw new InvalidOperationException(message);}
    private static async Task<JsonNode> Continue()
    {
        var s=await Cmd(new{type="state"});
        for(var i=0;i<100&&s["phase"]!.GetValue<string>()=="dialogue";i++)s=await Cmd(new{type="next"});
        return s;
    }
    public static async Task Run(string contentPath,string savePath)
    {
        Parse(BrowserBridge.Initialize(File.ReadAllText(contentPath)));
        Parse(BrowserBridge.ImportSave(File.ReadAllText(savePath)));
        foreach(var (story,id) in new[]{("original_同福客栈.轻功","qinggong"),("original_同福客栈.葵花点穴手","dianxue")})
        {
            var before=await Cmd(new{type="state"});
            await Cmd(new{type="playStory",storyId=story}); await Continue();
            await Cmd(new{type="choose",index=0}); var ready=await Continue();
            Check(ready["phase"]!.GetValue<string>()=="minigame"&&ready["miniGame"]!["id"]!.GetValue<string>()==id,"Original game result must open real training.");
            Check(ready["silver"]!.GetValue<int>()==before["silver"]!.GetValue<int>()-10,"Original training must debit ten silver exactly once.");
            Check(JsonNode.Parse(BrowserBridge.ExportSave())!["error"] is not null,"Unfinished training cannot be saved as completed.");
            var rejected=JsonNode.Parse(await BrowserBridge.Dispatch("{\"type\":\"finishMiniGame\"}"))!;
            Check(!rejected["ok"]!.GetValue<bool>(),"Unfinished training was accepted.");
            Input(new{action="start",elapsed=99999,score=99999,itemCounts=new{大还丹=999}});
            var frame=Input(new{action="pause"});
            Check(frame["elapsed"]!.GetValue<double>()<3&&frame["score"]!.GetValue<int>()==0,"Client-supplied time/score must not affect actual results.");
            var elapsed=frame["elapsed"]!.GetValue<double>(); await Task.Delay(40);
            Check(Input(new{action="frame"})["elapsed"]!.GetValue<double>()==elapsed,"Pause must stop training time.");
            Input(new{action="quit"}); await Cmd(new{type="finishMiniGame"}); var done=await Continue();
            Check(done["phase"]!.GetValue<string>()=="world","Application must finish actual reward/growth dialogue and return to world.");
            var saved=BrowserBridge.ExportSave(); Parse(BrowserBridge.ImportSave(saved));
            await Cmd(new{type="playStory",storyId=story}); await Continue(); await Cmd(new{type="choose",index=0}); var repeated=await Continue();
            Check(repeated["phase"]!.GetValue<string>()=="world"&&repeated["silver"]!.GetValue<int>()==done["silver"]!.GetValue<int>(),"Monthly cooldown must persist through save/import and avoid duplicate cost.");
            Console.WriteLine($"PASS original {id}: fee, real host time, pause, rejected score injection, completion and saved monthly cooldown");
        }
    }
}
