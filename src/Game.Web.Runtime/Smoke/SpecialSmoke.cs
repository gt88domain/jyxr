using System.Text.Json;
using System.Text.Json.Nodes;
using Game.Web.Runtime;

internal static class SpecialSmoke
{
    private static JsonNode State(string json){var n=JsonNode.Parse(json)!;if(!n["ok"]!.GetValue<bool>())throw new InvalidOperationException(n["error"]!.GetValue<string>());return n["state"]!;}
    private static async Task<JsonNode> Cmd(object c)=>State(await BrowserBridge.Dispatch(JsonSerializer.Serialize(c)));
    private static void Check(bool b,string m){if(!b)throw new InvalidOperationException(m);}
    private static async Task<JsonNode> Continue()
    {
        var s=await Cmd(new{type="state"});
        for(var i=0;i<200&&s["phase"]!.GetValue<string>()=="dialogue";i++)s=await Cmd(new{type="next"});
        return s;
    }
    private static async Task<JsonNode> Fight()
    {
        var s=await Cmd(new{type="state"});
        for(var i=0;i<800&&s["battle"]!["outcome"]!.GetValue<string>()=="ongoing";i++)s=await Cmd(new{type="autoTurn"});
        Check(s["battle"]!["outcome"]!.GetValue<string>()!="ongoing","Special battle must settle through the actual engine.");
        return s;
    }
    private static async Task Deploy(int count=1)
    {
        var s=await Cmd(new{type="state"});
        Check(s["phase"]!.GetValue<string>()=="combatants","Special battle must await combatant selection.");
        var menu=s["combatantSelection"]!;
        var required=menu["candidates"]!.AsArray().Where(c=>c!["required"]!.GetValue<bool>()).Select(c=>c!["id"]!.GetValue<string>());
        var ids=required.Concat(menu["candidates"]!.AsArray().Where(c=>!c!["forbidden"]!.GetValue<bool>()).Select(c=>c!["id"]!.GetValue<string>())).Distinct().Take(Math.Min(count,menu["capacity"]!.GetValue<int>())).ToArray();
        var invalid=JsonNode.Parse(await BrowserBridge.Dispatch("{\"type\":\"selectCombatants\",\"characterIds\":[]}"))!;
        Check(!invalid["ok"]!.GetValue<bool>(),"Empty deployment must be rejected.");
        Check(JsonNode.Parse(BrowserBridge.ExportSave())!["error"] is not null,"Pending selection cannot be saved as completed.");
        await Cmd(new{type="selectCombatants",characterIds=ids});
    }

    public static async Task Run(string contentPath,string savePath)
    {
        var content=File.ReadAllText(contentPath);
        var baseSave=JsonNode.Parse(File.ReadAllText(savePath))!;
        baseSave["profile"]!["yuanbao"]=3;
        // High-stat fixture isolates service/flow behavior; it is not a claim
        // about original encounter difficulty or a forged winning outcome.
        foreach(var c in baseSave["game"]!["characters"]!.AsArray())
        {
            foreach(var key in new[]{"bili","gengu","shenfa","dingli","quanzhang","jianfa","daofa","qimen"})c!["baseStats"]![key]=1000;
            c!["baseStats"]!["max_hp"]=50000;c["baseStats"]!["max_mp"]=50000;
            c["currentHp"]=50000;c["currentMp"]=50000;
        }
        void Load(){State(BrowserBridge.Initialize(content));State(BrowserBridge.ImportSave(baseSave.ToJsonString()));}
        Load();
        await Cmd(new{type="playStory",storyId="original_同福客栈.竞技场开始"});var arena=await Continue();
        Check(arena["phase"]!.GetValue<string>()=="choice","Arena scene choice must appear.");
        await Cmd(new{type="choose",index=0});await Cmd(new{type="choose",index=0});
        await Deploy(2);
        var fight=await Fight();Check(fight["battle"]!["outcome"]!.GetValue<string>()=="win","Arena fixture must win actual combat.");
        await Cmd(new{type="leaveBattle"});var returned=await Continue();Check(returned["phase"]!.GetValue<string>()=="world","Arena must return to map.");
        Console.WriteLine("PASS original arena choices, legal deployment, procedural opponents, actual combat and map return");

        Load();
        await Cmd(new{type="playStory",storyId="original_天关.开始前"});var towers=await Continue();
        var option=towers["choices"]!.AsArray().First(c=>c!["text"]!.GetValue<string>()=="江湖异人")!["index"]!.GetValue<int>();
        await Cmd(new{type="choose",index=option});await Deploy();
        var towerWin=await Fight();Check(towerWin["battle"]!["outcome"]!.GetValue<string>()=="win","Tower fixture must win actual stage.");
        await Cmd(new{type="leaveBattle"});var next=await Continue();
        if(next["phase"]!.GetValue<string>()=="choice") {await Cmd(new{type="choose",index=1});next=await Continue();}
        Check(next["phase"]!.GetValue<string>()=="world","Withdrawing after a successful tower stage must settle pending rewards.");
        var towerSave=BrowserBridge.ExportSave();State(BrowserBridge.ImportSave(towerSave));
        Console.WriteLine("PASS original tower selection, stage battle, withdraw/reward settlement and persisted progress");

        Load();
        await Cmd(new{type="playStory",storyId="original_孔八拉_挑战_有钱"});await Continue();await Deploy();
        var trialOutcome=(await Fight())["battle"]!["outcome"]!.GetValue<string>();
        await Cmd(new{type="leaveBattle"});await Continue();
        var trialSave=JsonNode.Parse(BrowserBridge.ExportSave())!;
        Check(trialSave["game"]!["specialBattleState"]!["trialCompletedCharacterIds"]!.AsArray().Count==(trialOutcome=="win"?1:0),"Trial completion must follow the actual outcome.");
        Console.WriteLine("PASS original paid trial, actual "+trialOutcome+" branch and completion-state conservation");

        // Guarantee the adapter's victory branch independently of boss balance.
        // Only this isolated test package substitutes a wooden-dummy opponent.
        var trialFixture=JsonNode.Parse(content)!;
        var trialBattle=trialFixture["battles"]!.AsArray().Single(b=>b!["id"]!.GetValue<string>()=="试炼之地_战斗")!;
        trialBattle["randomParticipants"]=new JsonArray();
        trialBattle["participants"]!.AsArray().Add(JsonNode.Parse("""{"position":{"x":8,"y":2},"team":2,"facing":0,"characterId":"木头人"}"""));
        State(BrowserBridge.Initialize(trialFixture.ToJsonString()));State(BrowserBridge.ImportSave(baseSave.ToJsonString()));
        await Cmd(new{type="playStory",storyId="original_孔八拉_挑战_有钱"});await Continue();await Deploy();
        Check((await Fight())["battle"]!["outcome"]!.GetValue<string>()=="win","Controlled trial adapter must execute a real win.");
        await Cmd(new{type="leaveBattle"});await Continue();
        Check(JsonNode.Parse(BrowserBridge.ExportSave())!["game"]!["specialBattleState"]!["trialCompletedCharacterIds"]!.AsArray().Count==1,"Controlled trial win must record the selected character once.");
        Console.WriteLine("PASS controlled trial victory adapter and character reward persistence; not an original boss-clear claim");

        Load();
        await Cmd(new{type="playStory",storyId="珍珑棋局_judge"});await Continue();await Deploy(2);
        var zhenlongOutcome=(await Fight())["battle"]!["outcome"]!.GetValue<string>();
        await Cmd(new{type="leaveBattle"});await Continue();
        var zhenlong=JsonNode.Parse(BrowserBridge.ExportSave())!;
        Check(zhenlong["profile"]!["zhenlongqijuLevel"]!.GetValue<int>()==baseSave["profile"]!["zhenlongqijuLevel"]!.GetValue<int>()+(zhenlongOutcome=="win"?1:0),"Zhenlong level must follow the actual outcome.");
        State(BrowserBridge.ImportSave(zhenlong.ToJsonString()));
        Console.WriteLine("PASS original Zhenlong actual "+zhenlongOutcome+" branch and account-level conservation");

        var zhenlongFixture=JsonNode.Parse(content)!;
        var zhenlongBattle=zhenlongFixture["battles"]!.AsArray().Single(b=>b!["id"]!.GetValue<string>()=="珍珑棋局_战斗")!;
        zhenlongBattle["randomParticipants"]=new JsonArray();
        var players=zhenlongBattle["participants"]!.AsArray().Where(p=>p!["team"]!.GetValue<int>()==1).Select(p=>p!.DeepClone()).ToArray();
        zhenlongBattle["participants"]=new JsonArray(players);
        zhenlongBattle["participants"]!.AsArray().Add(JsonNode.Parse("""{"position":{"x":8,"y":2},"team":2,"facing":0,"characterId":"木头人"}"""));
        State(BrowserBridge.Initialize(zhenlongFixture.ToJsonString()));State(BrowserBridge.ImportSave(baseSave.ToJsonString()));
        await Cmd(new{type="playStory",storyId="珍珑棋局_judge"});await Continue();await Deploy(2);
        Check((await Fight())["battle"]!["outcome"]!.GetValue<string>()=="win","Controlled Zhenlong adapter must execute a real win.");
        await Cmd(new{type="leaveBattle"});await Continue();
        var controlled=JsonNode.Parse(BrowserBridge.ExportSave())!;
        Check(controlled["profile"]!["zhenlongqijuLevel"]!.GetValue<int>()==1&&controlled["profile"]!["yuanbao"]!.GetValue<int>()==4,"Controlled Zhenlong win must grant one level and one yuanbao exactly once.");
        Console.WriteLine("PASS controlled Zhenlong victory/profile/reward adapter; not an original encounter-clear claim");

        Load();
        await Cmd(new{type="selectCharacter",characterId="钟灵"});await Cmd(new{type="unequipItem",slot="Weapon"});
        await Cmd(new{type="playStory",storyId="洗练选择"});var refine=await Continue();
        Check(refine["phase"]!.GetValue<string>()=="choice","Original refinement confirmation must appear.");
        await Cmd(new{type="choose",index=0});refine=await Continue();
        Check(refine["phase"]!.GetValue<string>()=="choice"&&refine["choices"]!.AsArray().Last()!["text"]!.GetValue<string>()=="取消洗练","Refinement must show a real equipment choice.");
        await Cmd(new{type="choose",index=0});
        var operation=await Cmd(new{type="state"});
        var add=operation["choices"]!.AsArray().Single(c=>c!["text"]!.GetValue<string>()=="增加词条")!["index"]!.GetValue<int>();
        await Cmd(new{type="choose",index=add});
        var candidates=await Cmd(new{type="state"});
        Check(candidates["choices"]!.AsArray().Count>1,"Refinement must create real affix candidates.");
        await Cmd(new{type="choose",index=0});
        var afterRefine=await Cmd(new{type="state"});
        await Cmd(new{type="choose",index=afterRefine["choices"]!.AsArray().Last()!["index"]!.GetValue<int>()});await Continue();
        Check((await Cmd(new{type="state"}))["phase"]!.GetValue<string>()=="world","Refinement exit must return without a hanging story.");
        var refinedSave=JsonNode.Parse(BrowserBridge.ExportSave())!;
        Check(refinedSave["profile"]!["yuanbao"]!.GetValue<int>()==2,"Applying one refinement must consume exactly one yuanbao.");
        Check(refinedSave["game"]!["inventory"]!["entries"]!.AsArray().Any(e=>e!["kind"]!.GetValue<string>()=="equipment_instance"),"Refinement must preserve a real equipment instance.");
        Check(refinedSave["game"]!["inventory"]!["entries"]!.AsArray().Any(e=>e!["kind"]!.GetValue<string>()=="equipment_instance"&&e["equipment"]!["extraAffixes"]!.AsArray().Count>0),"Refinement must store actual generated affixes.");
        State(BrowserBridge.ImportSave(refinedSave.ToJsonString()));
        Console.WriteLine("PASS original refinement equipment selection, actual affix candidates, one-yuanbao debit, applied gear and saved result");
    }
}
