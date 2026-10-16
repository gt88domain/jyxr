using System.Text.Json;
using System.Text.Json.Nodes;
using Game.Web.Runtime;

internal static class AchievementSmoke
{
    private static JsonNode Parse(string json){var r=JsonNode.Parse(json)!;if(!r["ok"]!.GetValue<bool>())throw new InvalidOperationException(r["error"]!.GetValue<string>());return r["state"]!;}
    private static async Task<JsonNode> Cmd(object c)=>Parse(await BrowserBridge.Dispatch(JsonSerializer.Serialize(c)));
    private static void Check(bool b,string m){if(!b)throw new InvalidOperationException(m);}
    private static async Task<JsonNode> Continue()
    {
        var s=await Cmd(new{type="state"});for(var i=0;i<250&&s["phase"]!.GetValue<string>()=="dialogue";i++)s=await Cmd(new{type="next"});return s;
    }
    public static async Task Run(string contentPath,string savePath,string output)
    {
        var content=JsonNode.Parse(File.ReadAllText(contentPath))!;
        content["storyScripts"]!.AsObject().First().Value!["segments"]!.AsArray().Add(JsonNode.Parse("""{"name":"fixture_invalid_nick","steps":[{"kind":"command","call":"legacy_nick('not-an-original-title')"}]}"""));
        Parse(BrowserBridge.Initialize(content.ToJsonString()));Parse(BrowserBridge.ImportSave(File.ReadAllText(savePath)));
        foreach(var (story,title) in new[]{("全真教_大校胜","全真高手"),("血刀门_门内比武胜","血刀高手"),("侠客行_主太玄神功","侠客行")})
        {
            await Cmd(new{type="playStory",storyId=story});var state=await Continue();
            Check(state["achievements"]!.AsArray().Any(a=>a!["id"]!.GetValue<string>()==title),"Original achievement instruction did not record its real title.");
            Check(state["achievements"]!.AsArray().Single(a=>a!["id"]!.GetValue<string>()==title)!["description"]!.GetValue<string>()=="","Missing source descriptions must remain empty, not invented.");
        }
        var saved=BrowserBridge.ExportSave();File.WriteAllText(output,saved);var restored=Parse(BrowserBridge.ImportSave(saved));
        Check(restored["achievements"]!.AsArray().Count==3,"Original titles must survive import without duplication.");
        Check(restored["hero"]!["internalSkills"]!.AsArray().Any(s=>s!["id"]!.GetValue<string>()=="太玄神功"&&s["level"]!.GetValue<int>()==10),"Recovered 太玄 route must grant the actual internal skill, not just its title.");
        Check(restored["inventory"]!.AsArray().Any(i=>i!["id"]!.GetValue<string>()=="七星七绝剑剑谱"),"Recovered Quanzhen route must grant the actual original reward.");
        Console.WriteLine("PASS original Quanzhen/Blood Blade/太玄 reward segments execute real rewards, source-declared titles and persisted empty-description fallbacks");
        var invalid=JsonNode.Parse(await BrowserBridge.Dispatch("{\"type\":\"playStory\",\"storyId\":\"fixture_invalid_nick\"}"))!;
        Check(!invalid["ok"]!.GetValue<bool>(),"Arbitrary achievement IDs must be rejected.");
        Parse(BrowserBridge.ImportSave(saved));
        await Cmd(new{type="playStory",storyId="original_女主.华山论剑.trueEnding1"});
        var seenName=false;var state2=await Cmd(new{type="state"});
        for(var i=0;i<250&&state2["phase"]!.GetValue<string>()=="dialogue";i++)
        {
            var speaker=state2["dialogue"]!["speaker"]!.GetValue<string>();
            Check(speaker!="女主","Renamed heroine speaker must use her actual roster name.");
            if(speaker=="同路人")seenName=true;
            state2=await Cmd(new{type="next"});
        }
        Check(seenName,"Original epilogue did not display the actual named heroine.");
        Console.WriteLine("PASS unknown achievement guard and original heroine dialogue uses the live character name/portrait lookup");
    }
}
