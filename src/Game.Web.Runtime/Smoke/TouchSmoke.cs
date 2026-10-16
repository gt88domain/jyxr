using System.Text.Json;
using System.Text.Json.Nodes;
using Game.Web.Runtime;

internal static class TouchSmoke
{
    private static JsonNode Parse(string json)
    {
        var r=JsonNode.Parse(json)!;if(!r["ok"]!.GetValue<bool>())throw new InvalidOperationException(r["error"]!.GetValue<string>());return r["state"]!;
    }
    private static async Task<JsonNode> Cmd(object c)=>Parse(await BrowserBridge.Dispatch(JsonSerializer.Serialize(c)));
    private static void Check(bool b,string m){if(!b)throw new InvalidOperationException(m);}
    private static JsonNode Input(object c)
    {
        var r=JsonNode.Parse(BrowserBridge.MiniGameInput(JsonSerializer.Serialize(c)))!;
        Check(r["ok"]!.GetValue<bool>(),r["error"]?.ToString()??"Touch input failed.");return r["frame"]!;
    }
    private static async Task<JsonNode> Continue()
    {
        var s=await Cmd(new{type="state"});for(var i=0;i<250&&s["phase"]!.GetValue<string>()=="dialogue";i++)s=await Cmd(new{type="next"});return s;
    }
    private static async Task<JsonNode> WinTouch(string name)
    {
        var state=await Cmd(new{type="state"});Check(state["phase"]!.GetValue<string>()=="minigame"&&state["miniGame"]!["title"]!.GetValue<string>().Contains(name),"Expected the actual source subject: "+name);
        Check(state["miniGame"]!["background"] is not null,"Original touch art must resolve from existing media.");
        var rejected=JsonNode.Parse(await BrowserBridge.Dispatch("{\"type\":\"finishMiniGame\"}"))!;
        Check(!rejected["ok"]!.GetValue<bool>(),"Unfinished timing game cannot be submitted.");
        var frame=Input(new{action="start"});
        for(var i=0;i<6000&&!frame["finished"]!.GetValue<bool>();i++)
        {
            foreach(var target in frame["targets"]!.AsArray().Where(t=>t!["rating"] is null&&t["age"]!.GetValue<double>()>=1.35&&t["age"]!.GetValue<double>()<1.65).ToArray())
                Input(new{action="hit",id=target!["id"]!.GetValue<string>(),generation=target["generation"]!.GetValue<int>()});
            await Task.Delay(15);frame=Input(new{action="frame"});
        }
        Check(frame["finished"]!.GetValue<bool>()&&frame["score"]!.GetValue<int>()>=100,"Real host timing inputs failed to complete five rounds above the original threshold.");
        Console.WriteLine($"PASS {name}: five actual timed rounds, score {frame["score"]}/120; no submitted clock, score or outcome");
        await Cmd(new{type="finishMiniGame"});return await Continue();
    }
    public static async Task Run(string content,string save,string normalSave,string output)
    {
        Parse(BrowserBridge.Initialize(File.ReadAllText(content)));var baseline=File.ReadAllText(save);Parse(BrowserBridge.ImportSave(baseline));
        await Cmd(new{type="playStory",storyId="破庙_田青文_调戏胜利"});await Continue();
        var success=await WinTouch("田青文");
        Check(success["party"]!.AsArray().Any(c=>c!["id"]!.GetValue<string>()=="田青文"),"Original successful treatment must actually recruit Tian Qingwen.");
        var restored=Parse(BrowserBridge.ImportSave(BrowserBridge.ExportSave()));
        Check(restored["party"]!.AsArray().Any(c=>c!["id"]!.GetValue<string>()=="田青文"),"Actual recruitment must survive a save.");
        Parse(BrowserBridge.ImportSave(baseline));
        await Cmd(new{type="playStory",storyId="破庙_田青文_调戏胜利"});await Continue();
        Input(new{action="quit"});await Cmd(new{type="finishMiniGame"});var failed=await Continue();
        Check(!failed["party"]!.AsArray().Any(c=>c!["id"]!.GetValue<string>()=="田青文"),"Abandoning treatment must follow the original failure branch without recruitment.");
        Parse(BrowserBridge.ImportSave(baseline));
        await Cmd(new{type="playStory",storyId="tlbb.dy_木婉清.touch.前奏"});await Continue();
        Input(new{action="quit"});await Cmd(new{type="finishMiniGame"});var attacked=await Continue();
        Check(attacked["battle"]?["id"]?.GetValue<string>()=="touch木婉清失败_战斗","Original failed Muwanqing treatment must enter its real consequence battle.");
        Parse(BrowserBridge.ImportSave(baseline));
        await Cmd(new{type="playStory",storyId="tlbb.dy_阿碧线王语嫣touch3"});await Continue();
        await WinTouch("王语嫣");var final=await WinTouch("李青萝");
        Check(final["party"]!.AsArray().Any(c=>c!["id"]!.GetValue<string>()=="王语嫣")&&final["hero"]!["talents"]!.AsArray().Any(t=>t!["id"]!.GetValue<string>()=="夫妻同心"),"Both original treatments must continue to actual recruitment and original talent grants.");
        Parse(BrowserBridge.ImportSave(BrowserBridge.ExportSave()));
        Console.WriteLine("PASS original treatment success/abandonment branches, real consequence battle, two-subject continuation and persisted recruitment/rewards");
        // Browser fixture changes location only; preserves the unedited normal
        // campaign's actual stats, party, inventory and completed stories.
        Parse(BrowserBridge.ImportSave(File.ReadAllText(normalSave)));
        await Cmd(new{type="enterMap",mapId="破庙"});File.WriteAllText(output,BrowserBridge.ExportSave());
    }
}
