using System.Text.Json;
using System.Text.Json.Nodes;
using Game.Web.Runtime;

internal static class FlowSmoke
{
    private static JsonNode Parse(string json) {var r=JsonNode.Parse(json)!;if(!r["ok"]!.GetValue<bool>())throw new InvalidOperationException(r["error"]!.GetValue<string>());return r["state"]!;}
    private static async Task<JsonNode> Cmd(object c)=>Parse(await BrowserBridge.Dispatch(JsonSerializer.Serialize(c)));
    private static void Check(bool b,string m){if(!b)throw new InvalidOperationException(m);}
    private static async Task<JsonNode> Continue()
    {
        var s=await Cmd(new{type="state"});for(var i=0;i<250&&s["phase"]!.GetValue<string>()=="dialogue";i++)s=await Cmd(new{type="next"});return s;
    }
    private static async Task<JsonNode> Create()
    {
        var s=await Cmd(new{type="beginRoundCreation"});
        for(var i=0;i<7;i++)s=await Cmd(new{type="answerCreation",questionIndex=i,index=0});
        return await Cmd(new{type="selectCreationPortrait",portraitId="头像.主角"});
    }
    private static async Task Reject(object c){var r=JsonNode.Parse(await BrowserBridge.Dispatch(JsonSerializer.Serialize(c)))!;Check(!r["ok"]!.GetValue<bool>(),"Invalid flow operation accepted.");}
    public static async Task Run(string contentPath,string savePath,string output)
    {
        var content=JsonNode.Parse(File.ReadAllText(contentPath))!;
        content["storyScripts"]!.AsObject().First().Value!["segments"]!.AsArray().Add(JsonNode.Parse("""{"name":"fixture_huashan_party","steps":[{"kind":"command","call":"join('田伯光')"},{"kind":"command","call":"join('张无忌')"}]}"""));
        var baseline=JsonNode.Parse(File.ReadAllText(savePath))!;
        baseline["profile"]!["yuanbao"]=7;
        baseline["game"]!["specialBattleState"]!["trialCompletedCharacterIds"]=new JsonArray("主角","钟灵","女主");
        void Load(){Parse(BrowserBridge.Initialize(content.ToJsonString()));Parse(BrowserBridge.ImportSave(baseline.ToJsonString()));}
        Load();
        await Cmd(new{type="playStory",storyId="original_主角之家.开场"});var tutorial=await Continue();
        Check(tutorial["phase"]!.GetValue<string>()=="choice"&&tutorial["dialogue"]!["text"]!.GetValue<string>()=="要不要做新手任务？","Original tutorial scene must continue teaching after world-map entry.");
        await Cmd(new{type="choose",index=1});var sect=await Continue();Check(sect["phase"]!.GetValue<string>()=="sect","Skipping original tutorial must still reach real sect choice.");
        Console.WriteLine("PASS original non-starter opening tutorial scene enters world and continues original teaching/sect choice");
        Load();await Reject(new{type="beginRoundCreation"});
        var before=JsonNode.Parse(BrowserBridge.ExportSave())!;
        var oldChest=before["game"]!["chest"]!.ToJsonString();
        await Cmd(new{type="playStory",storyId="original_女主.华山论剑.trueEnding1.结束"});await Continue();
        await Cmd(new{type="choose",index=0});var next=await Continue();
        Check(next["ending"]!["kind"]!.GetValue<string>()=="next"&&next["profile"]!["completionCount"]!.GetValue<int>()==1,"Actual original ending must suspend at next-round creation and record completion once.");
        var endingSave=BrowserBridge.ExportSave();
        Directory.CreateDirectory(output);File.WriteAllText(Path.Combine(output,"flow-next-save.json"),endingSave);
        var invalid=JsonNode.Parse(endingSave)!;invalid["ending"]!["targetRound"]=999;
        Check(!JsonNode.Parse(BrowserBridge.ImportSave(invalid.ToJsonString()))!["ok"]!.GetValue<bool>(),"Invalid round marker accepted.");
        Parse(BrowserBridge.ImportSave(endingSave));
        var preview=await Create();
        Check(preview["creation"]!["round"]!.GetValue<int>()==2,"Next-round creation must use actual round two.");
        var items=preview["creation"]!["preview"]!["items"]!.AsArray();
        Check(!items.Any(i=>i!["id"]!.GetValue<string>()=="新手礼包-大蟠桃"),"Round two cannot repeat round-one normal gifts.");
        Check(items.Any(i=>i!["id"]!.GetValue<string>()=="王母蟠桃")&&items.Any(i=>i!["id"]!.GetValue<string>()=="道家仙丹"),"Trial count three must grant actual original inherited rewards.");
        await Cmd(new{type="confirmCreation"});var started=await Continue();
        Check(started["adventure"]!["round"]!.GetValue<int>()==2&&started["silver"]!.GetValue<int>()==6100,"Round two must use confirmed creation money without an extra service100.");
        var roundSave=JsonNode.Parse(BrowserBridge.ExportSave())!;
        Check(roundSave["game"]!["chest"]!.ToJsonString()==oldChest&&roundSave["profile"]!["yuanbao"]!.GetValue<int>()==7,"Round transition must preserve chest and premium profile.");
        Check(started["party"]!.AsArray().Count==1&&started["hero"]!["cultivation"] is null&&started["profile"]!["completionCount"]!.GetValue<int>()==1,"Old companions/cultivation must reset without duplicate completion.");
        Check(roundSave["game"]!["equipmentInstanceFactory"]!["nextNumber"]!.GetValue<long>()>=before["game"]!["equipmentInstanceFactory"]!["nextNumber"]!.GetValue<long>(),"Round reset reused carried equipment identities.");
        Parse(BrowserBridge.ImportSave(roundSave.ToJsonString()));
        Console.WriteLine("PASS original next-round choice, saved pending ending, validated marker, round/trial rewards, chest/profile/identity carry and actual new opening");

        await Cmd(new{type="playStory",storyId="original_女主.华山论剑.trueEnding1.结束"});await Continue();await Cmd(new{type="choose",index=1});var finished=await Continue();
        Check(finished["ending"]!["kind"]!.GetValue<string>()=="complete"&&finished["profile"]!["completionCount"]!.GetValue<int>()==2,"Second-round gameFin must record one more completion.");
        var finishedSave=BrowserBridge.ExportSave();var record=JsonNode.Parse(finishedSave)!;
        Check(record["profile"]!["skillMaxLevelBonuses"]!["野球拳"]!.GetValue<int>()==2,"Original max-level reward must apply once in each round.");
        File.WriteAllText(Path.Combine(output,"flow-complete-save.json"),finishedSave);Parse(BrowserBridge.ImportSave(finishedSave));await Reject(new{type="beginRoundCreation"});
        Check((await Cmd(new{type="state"}))["profile"]!["completionCount"]!.GetValue<int>()==2,"Reloading a complete ending repeated its completion reward.");
        Console.WriteLine("PASS original gameFin, per-round skill unlock, completed-ending save/reload and no duplicate completion");

        Load();await Cmd(new{type="playStory",storyId="original_女主.华山论剑.normalEnding.结束"});await Continue();await Cmd(new{type="choose",index=0});await Continue();
        var restart=await Create();Check(restart["creation"]!["round"]!.GetValue<int>()==1,"Restart must stay in the same round.");
        await Cmd(new{type="confirmCreation"});var restarted=await Continue();Check(restarted["adventure"]!["round"]!.GetValue<int>()==1&&restarted["party"]!.AsArray().Count==1,"Restart did not rebuild the same round.");
        Console.WriteLine("PASS original normal-ending restart rebuilds the same round through full character creation");

        Load();await Cmd(new{type="playStory",storyId="华山论剑_天关"});var select=await Continue();
        Check(select["phase"]!.GetValue<string>()=="combatants","Original Huashan entry must open deployment.");
        await Cmd(new{type="selectCombatants",characterIds=new[]{"主角"}});
        var battle=await Cmd(new{type="state"});for(var i=0;i<1200&&battle["battle"]!["outcome"]!.GetValue<string>()=="ongoing";i++)battle=await Cmd(new{type="autoTurn"});
        Check(battle["battle"]!["outcome"]!.GetValue<string>()=="lose","Low-level Huashan fixture must exercise a real defeat.");
        await Cmd(new{type="leaveBattle"});var lost=await Continue();
        Check(lost["phase"]!.GetValue<string>()=="gameover"&&lost["profile"]!["deathCount"]!.GetValue<int>()==1&&lost["profile"]!["completionCount"]!.GetValue<int>()==0,"Huashan defeat must end the game and record death, not completion.");
        Console.WriteLine("PASS original Huashan actual defeat enters game-over without inventing victory/completion");

        // Isolated high-stat roster and ending prerequisites verify all four
        // original encounters and routing, not a balanced mainline playthrough.
        Load();await Cmd(new{type="playStory",storyId="fixture_huashan_party"});await Continue();
        var strong=JsonNode.Parse(BrowserBridge.ExportSave())!;
        strong["game"]!["adventure"]!["difficulty"]="hard";
        foreach(var character in strong["game"]!["characters"]!.AsArray())
        {
            foreach(var key in new[]{"bili","gengu","shenfa","dingli","quanzhang","jianfa","daofa","qimen"})character!["baseStats"]![key]=10000;
            character!["baseStats"]!["max_hp"]=500000;character["baseStats"]!["max_mp"]=500000;
        }
        foreach(var id in new[]{"mainStory_最终决战3","original_女主.重伤.trueEnding.结束","original_女主.重伤.表白","original_女主.襄阳大战后","original_女主.神雕侠侣.绝情谷小龙女"})
            strong["game"]!["storyState"]!["completedStoryIds"]!.AsArray().Add(id);
        File.WriteAllText(Path.Combine(output,"flow-huashan-ready-save.json"),strong.ToJsonString());
        Parse(BrowserBridge.ImportSave(strong.ToJsonString()));await Cmd(new{type="playStory",storyId="华山论剑_天关"});await Continue();
        var used=new HashSet<string>();
        for(var stage=0;stage<4;stage++)
        {
            var s=await Cmd(new{type="state"});Check(s["phase"]!.GetValue<string>()=="combatants","Huashan must select each stage separately.");
            var candidates=s["combatantSelection"]!["candidates"]!.AsArray();
            Check(candidates.Where(c=>used.Contains(c!["id"]!.GetValue<string>())).All(c=>c!["forbidden"]!.GetValue<bool>()),"Used Huashan companions must remain forbidden.");
            var id=candidates.First(c=>!c!["forbidden"]!.GetValue<bool>())!["id"]!.GetValue<string>();used.Add(id);
            await Cmd(new{type="selectCombatants",characterIds=new[]{id}});
            s=await Cmd(new{type="state"});for(var turn=0;turn<1200&&s["battle"]!["outcome"]!.GetValue<string>()=="ongoing";turn++)s=await Cmd(new{type="autoTurn"});
            Check(s["battle"]!["outcome"]!.GetValue<string>()=="win",$"Huashan high-stat routing fixture lost stage {stage+1}.");
            await Cmd(new{type="leaveBattle"});await Continue();
        }
        var epilogue=await Cmd(new{type="state"});
        for(var i=0;i<20&&epilogue["phase"]!.GetValue<string>()=="choice";i++){await Cmd(new{type="choose",index=1});epilogue=await Continue();}
        Check(epilogue["ending"]?["kind"]?.GetValue<string>()=="complete"&&used.Count==4,"All four Huashan wins must reach the real configured epilogue.");
        Console.WriteLine("PASS four original Huashan encounters, distinct deployment bans and True Ending routing with isolated high-stat/prerequisite fixture; not a balance or continuous-mainline claim");
    }
}
