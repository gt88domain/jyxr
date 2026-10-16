using System.Text.Json;
using System.Text.Json.Nodes;
using Game.Web.Runtime;

internal static class SourceFixSmoke
{
    private static JsonNode Parse(string json)
    {
        var r=JsonNode.Parse(json)!;if(!r["ok"]!.GetValue<bool>())throw new InvalidOperationException(r["error"]!.GetValue<string>());return r["state"]!;
    }
    private static async Task<JsonNode> Cmd(object c)=>Parse(await BrowserBridge.Dispatch(JsonSerializer.Serialize(c)));
    private static void Check(bool b,string m){if(!b)throw new InvalidOperationException(m);}
    private static async Task<JsonNode> Continue()
    {
        var s=await Cmd(new{type="state"});for(var i=0;i<200&&s["phase"]!.GetValue<string>()=="dialogue";i++)s=await Cmd(new{type="next"});return s;
    }
    private static int SkillLevel(JsonNode s,string id)=>s["managedCharacter"]!["externalSkills"]!.AsArray().FirstOrDefault(x=>x!["id"]!.GetValue<string>()==id)?["level"]?.GetValue<int>()??0;
    public static async Task Run(string path,string save)
    {
        var content=JsonNode.Parse(File.ReadAllText(path))!;
        // Isolate the recipients only; execute the corrected original rewards.
        content["storyScripts"]!.AsObject().First().Value!["segments"]!.AsArray().Add(JsonNode.Parse("""{"name":"fixture_reward_subjects","steps":[{"kind":"command","call":"join('小龙女')"},{"kind":"command","call":"join('达尔巴')"}]}"""));
        Parse(BrowserBridge.Initialize(content.ToJsonString()));Parse(BrowserBridge.ImportSave(File.ReadAllText(save)));
        await Cmd(new{type="playStory",storyId="fixture_reward_subjects"});
        foreach(var (character,skill) in new[]{("小龙女","玉女素心剑"),("达尔巴","火焰刀法")})
        {
            var before=await Cmd(new{type="selectCharacter",characterId=character});var level=SkillLevel(before,skill);
            await Cmd(new{type="playStory",storyId="霹雳堂_"+character});var after=await Continue();
            Check(SkillLevel(after,skill)==level+5,"Corrected source instruction must actually add five skill levels.");
            if(character=="小龙女")Check(after["managedCharacter"]!["talents"]!.AsArray().Any(t=>t!["id"]!.GetValue<string>()=="左右互搏"),"Original Xiaolongnü reward must grant her source talent.");
            else Check(after["inventory"]!.AsArray().Any(i=>i!["id"]!.GetValue<string>()=="金钟罩心法"),"Original Dalba reward must grant his source book.");
        }
        await Cmd(new{type="playStory",storyId="original_山庄风云.贾飞女主2"});var result=await Continue();
        Check(result["inventory"]!.AsArray().Any(i=>i!["id"]!.GetValue<string>()=="鸣凤剑"),"Corrected source dialogue must continue to the actual original item reward.");
        Parse(BrowserBridge.ImportSave(BrowserBridge.ExportSave()));
        Console.WriteLine("PASS three exact source spelling corrections execute original skill/talent/book/sword rewards and remain saveable");

        Parse(BrowserBridge.ImportSave(File.ReadAllText(save)));
        await Cmd(new{type="playStory",storyId="mainStory_黑衣教入教"});var black=await Continue();
        Check(black["adventure"]!["sect"]!.GetValue<string>()=="黑衣"&&black["hero"]!["talents"]!.AsArray().Any(t=>t!["id"]!.GetValue<string>()=="黑衣"&&t["description"]!.GetValue<string>()==""),"Original initiation must retain its source-declared identity and sect without inventing a description.");
        Parse(BrowserBridge.ImportSave(File.ReadAllText(save)));
        var baseline=JsonNode.Parse(BrowserBridge.ExportSave())!["game"]!["characters"]!.AsArray().Single(c=>c!["id"]!.GetValue<string>()=="主角")!.DeepClone();
        await Cmd(new{type="playStory",storyId="黑衣_对战魔君失败"});await Continue();
        var lost=JsonNode.Parse(BrowserBridge.ExportSave())!["game"]!["characters"]!.AsArray().Single(c=>c!["id"]!.GetValue<string>()=="主角")!;
        foreach(var stat in baseline["baseStats"]!.AsObject().Where(p=>p.Key!="wuxue"))
            Check(lost["baseStats"]![stat.Key]!.GetValue<double>()==(int)(stat.Value!.GetValue<double>()*.5),"Original five-tenths loss must halve each base stat with integer truncation: "+stat.Key);
        Check(lost["unspentStatPoints"]!.GetValue<int>()==baseline["unspentStatPoints"]!.GetValue<int>()/2,"Original five-tenths loss must also halve unspent points.");
        Console.WriteLine("PASS source-declared Black Sect identity and binary-verified five-tenths loss, actual continuation and save");
    }
}
