using System.Text.Json;
using System.Text.Json.Nodes;
using Game.Web.Runtime;

// Isolated condition-boundary checks. The moral fixture uses the real story
// service, not an edited character or a fabricated recruitment result.
internal static class CompanionSmoke
{
    private static JsonNode Parse(string text)
    {
        var r=JsonNode.Parse(text)!;
        if(!r["ok"]!.GetValue<bool>())throw new InvalidOperationException(r["error"]!.ToString());return r["state"]!;
    }
    private static async Task<JsonNode> Cmd(object value)=>Parse(await BrowserBridge.Dispatch(JsonSerializer.Serialize(value)));
    private static void Check(bool valid,string label){if(!valid)throw new InvalidOperationException(label);Console.WriteLine("PASS "+label);}
    private static async Task<JsonNode> Continue()
    {
        var s=await Cmd(new{type="state"});
        for(var i=0;i<150&&s["phase"]!.GetValue<string>()=="dialogue";i++)s=await Cmd(new{type="next"});return s;
    }
    public static async Task Run(string contentPath,string savePath,string outputPath)
    {
        var original=JsonNode.Parse(File.ReadAllText(contentPath))!;
        var saved=File.ReadAllText(savePath);
        var initial=JsonNode.Parse(saved)!["game"]!["adventure"]!["morality"]!.GetValue<int>();
        foreach(var morality in new[]{34,35,64,65})
        {
            var content=original.DeepClone();
            content["storyScripts"]!.AsObject()["fixture_morality"]=JsonNode.Parse(JsonSerializer.Serialize(new
            {
                version=3,segments=new[]{new{name="fixture_morality",steps=new[]{new{kind="command",call=$"change_morality({morality-initial})"}}}}
            }));
            Parse(BrowserBridge.Initialize(content.ToJsonString()));Parse(BrowserBridge.ImportSave(saved));
            await Cmd(new{type="playStory",storyId="fixture_morality"});await Continue();
            await Cmd(new{type="enterMap",mapId="华山后山"});
            await Cmd(new{type="interact",locationId="令狐冲"});var s=await Continue();
            var joined=s["roster"]!.AsArray().Any(c=>c!["definitionId"]!.GetValue<string>()=="令狐冲");
            Check(joined==(morality>=35&&morality<65),$"real Linghu map entry at morality {morality}: joined={joined}");
            var recorded=s["companionJournal"]!["completedRecruitmentStories"]!.AsArray().Any(n=>n!.GetValue<string>()=="笑傲江湖_令狐冲加入");
            Check(recorded==joined,"companion journal derives from actual executed recruitment, including rejection boundaries");
        }
        Parse(BrowserBridge.Initialize(original.ToJsonString()));var normal=Parse(BrowserBridge.ImportSave(saved));
        var before=normal.ToJsonString();
        for(var n=0;n<5;n++)Check((await Cmd(new{type="state"})).ToJsonString()==before,"read-only companion facts do not reroll maps or change game state");
        // The existing management fixture has a genuinely followed heroine.
        var heroine=normal["roster"]!.AsArray().Single(c=>c!["definitionId"]!.GetValue<string>()=="女主")!;
        Check(heroine["placement"]!.GetValue<string>()=="follower","source follower is represented separately from battle members");
        await Cmd(new{type="playStory",storyId="original_女主长安加入队伍"});var member=await Continue();
        Check(member["roster"]!.AsArray().Single(c=>c!["definitionId"]!.GetValue<string>()=="女主")!["placement"]!.GetValue<string>()=="member","actual source JOIN converts the same follower into a battle member");
        var export=BrowserBridge.ExportSave();var restored=Parse(BrowserBridge.ImportSave(export));
        Check(JsonNode.DeepEquals(member["companionJournal"],restored["companionJournal"]),"companion evidence survives export/import without a separate collection save");
        File.WriteAllText(outputPath,export);
    }
}
