using System.Text.Json;
using System.Text.Json.Nodes;
using Game.Web.Runtime;

internal static class ManagementSmoke
{
    private static JsonNode State(string json)
    {
        var result=JsonNode.Parse(json)!;
        if(!result["ok"]!.GetValue<bool>()) throw new InvalidOperationException(result["error"]!.GetValue<string>());
        return result["state"]!;
    }
    private static Task<JsonNode> Cmd(object value)=>Run(JsonSerializer.Serialize(value));
    private static async Task<JsonNode> Run(string json)=>State(await BrowserBridge.Dispatch(json));
    private static void Check(bool value,string message){if(!value)throw new InvalidOperationException(message);}
    private static async Task Reject(object value)
    {
        var result=JsonNode.Parse(await BrowserBridge.Dispatch(JsonSerializer.Serialize(value)))!;
        Check(!result["ok"]!.GetValue<bool>(),"Invalid management operation accepted.");
    }
    private static async Task<JsonNode> Continue()
    {
        var s=await Cmd(new{type="state"});
        for(var i=0;i<200&&s["phase"]!.GetValue<string>()=="dialogue";i++)s=await Cmd(new{type="next"});
        return s;
    }
    private static JsonNode Item(JsonNode s,string id)=>s["inventory"]!.AsArray().Single(i=>i!["id"]!.GetValue<string>()==id)!;
    private static int Stat(JsonNode s,string id)=>s["managedCharacter"]!["attributes"]!.AsArray().Single(a=>a!["id"]!.GetValue<string>()==id)!["baseValue"]!.GetValue<int>();
    private static async Task<JsonNode> Fight()
    {
        var s=await Cmd(new{type="state"});
        for(var i=0;i<800&&s["battle"]!["outcome"]!.GetValue<string>()=="ongoing";i++)s=await Cmd(new{type="autoTurn"});
        Check(s["battle"]!["outcome"]!.GetValue<string>()!="ongoing","Battle did not settle.");
        return s;
    }

    public static async Task Run(string path,string output)
    {
        var testContent=JsonNode.Parse(File.ReadAllText(path))!;
        testContent["storyScripts"]!.AsObject().First().Value!["segments"]!.AsArray().Add(JsonNode.Parse("""{"name":"fixture_release_companion","steps":[{"kind":"command","call":"leave('钟灵')"}]}"""));
        State(BrowserBridge.Initialize(testContent.ToJsonString()));
        await Cmd(new{type="createCharacter",name="管理验收侠"});await Continue();
        // Isolated money/items fixture; actual training, recruitment, allocation,
        // equipment, chest, combat and saves still use production services.
        var fixture=JsonNode.Parse(BrowserBridge.ExportSave())!;
        fixture["game"]!["currency"]!["silver"]=20000;
        var inventory=fixture["game"]!["inventory"]!;
        var next=inventory["nextEntryNumber"]!.GetValue<long>();
        foreach(var (id,qty) in new[]{("木刀",1),("内功入门",2),("小还丹",4)}) inventory["entries"]!.AsArray().Add(new JsonObject{["kind"]="stack",["entryNumber"]=next++,["itemDefinitionId"]=id,["quantity"]=qty});
        inventory["nextEntryNumber"]=next;
        State(BrowserBridge.ImportSave(fixture.ToJsonString()));
        var initial=await Cmd(new{type="state"});
        await Cmd(new{type="playStory",storyId="original_同福客栈.升级开始"});var leveled=await Continue();
        Check(leveled["hero"]!["level"]!.GetValue<int>()==2&&leveled["silver"]!.GetValue<int>()==19900,"Original paid training must debit100 and actually level up.");
        var points=leveled["managedCharacter"]!["unspentStatPoints"]!.GetValue<int>();
        Check(points>0,"Level growth must grant real free stat points.");
        var before=Stat(leveled,"bili");
        var allocated=await Cmd(new{type="allocateStat",stat="bili"});
        Check(Stat(allocated,"bili")==before+1&&allocated["managedCharacter"]!["unspentStatPoints"]!.GetValue<int>()==points-1,"Allocation must consume exactly one point.");
        await Reject(new{type="allocateStat",stat="max_hp"});await Reject(new{type="allocateStat",stat="bili",points=points+100});
        Check(Stat(await Cmd(new{type="state"}),"bili")==before+1,"Rejected allocation mutated base stats.");
        Console.WriteLine("PASS original paid leveling, exact stat-point consumption and invalid-allocation safety");

        await Cmd(new{type="playStory",storyId="original_女主出场.结束"});
        Check((await Cmd(new{type="state"}))["phase"]!.GetValue<string>()=="rename","Original heroine story must request a real name.");
        await Reject(new{type="renameHeroine",name=""});
        await Cmd(new{type="renameHeroine",name="同路人"});await Continue();
        var followed=await Cmd(new{type="state"});
        Check(followed["roster"]!.AsArray().Single(c=>c!["id"]!.GetValue<string>()=="女主")!["placement"]!.GetValue<string>()=="follower","Story follow must add original heroine as follower.");
        await Reject(new{type="setPartyPlacement",characterId="女主",placement="member"});
        await Cmd(new{type="playStory",storyId="tlbb.dy_钟灵"});await Continue();await Cmd(new{type="choose",index=0});await Continue();
        await Cmd(new{type="selectCharacter",characterId="钟灵"});
        var withGirl=await Cmd(new{type="state"});
        await Cmd(new{type="equipItem",entryNumber=Item(withGirl,"木刀")["entryNumber"]!.GetValue<long>()});
        await Cmd(new{type="setCultivation",entryNumber=Item(withGirl,"内功入门")["entryNumber"]!.GetValue<long>()});
        var girlSheet=(await Cmd(new{type="state"}))["managedCharacter"]!;
        var bladeId=girlSheet["equipment"]!.AsArray().Single(e=>e!["slot"]!.GetValue<string>()=="Weapon")!["item"]!["instanceId"]!.GetValue<string>();
        await Cmd(new{type="selectCharacter",characterId="主角"});
        await Cmd(new{type="setCultivation",entryNumber=Item(withGirl,"内功入门")["entryNumber"]!.GetValue<long>()});
        await Reject(new{type="setPartyPlacement",characterId="主角",placement="reserve"});
        await Reject(new{type="setPartyPlacement",characterId="不存在的人",placement="member"});
        await Reject(new{type="chestDeposit",entryNumber=Item(withGirl,"内功入门")["entryNumber"]!.GetValue<long>()});
        await Cmd(new{type="setPartyPlacement",characterId="钟灵",placement="reserve"});
        var reserved=await Cmd(new{type="state"});
        Check(reserved["party"]!.AsArray().Count==1,"Reserve must leave the active battle roster.");
        var benchSave=BrowserBridge.ExportSave();State(BrowserBridge.ImportSave(benchSave));
        Check((await Cmd(new{type="state"}))["roster"]!.AsArray().Single(c=>c!["id"]!.GetValue<string>()=="钟灵")!["canRejoin"]!.GetValue<bool>(),"Player bench eligibility must survive save import.");
        await Cmd(new{type="selectCharacter",characterId="钟灵"});
        await Reject(new{type="clearInternalSkill"});
        Check((await Cmd(new{type="state"}))["managedCharacter"]!["equipment"]!.AsArray().Single(e=>e!["slot"]!.GetValue<string>()=="Weapon")!["item"]!["instanceId"]!.GetValue<string>()==bladeId,"Formation reserve must preserve the real equipment instance.");
        await Cmd(new{type="setPartyPlacement",characterId="钟灵",placement="member"});
        await Cmd(new{type="selectCharacter",characterId="主角"});
        await Cmd(new{type="enterMap",mapId="松鼠旅馆"});
        await Cmd(new{type="interact",locationId="箱子"});
        await Continue();
        if((await Cmd(new{type="state"}))["phase"]!.GetValue<string>()!="chest") await Cmd(new{type="interact",locationId="箱子"});
        Check((await Cmd(new{type="state"}))["phase"]!.GetValue<string>()=="chest","Original first-use chest introduction must finish before the storage window opens.");
        await Reject(new{type="chestDeposit",entryNumber=Item(withGirl,"内功入门")["entryNumber"]!.GetValue<long>()});
        var pills=Item(await Cmd(new{type="state"}),"小还丹")["entryNumber"]!.GetValue<long>();
        await Cmd(new{type="chestDeposit",entryNumber=pills,quantity=2});
        var stored=await Cmd(new{type="state"});
        Check(Item(stored,"小还丹")["count"]!.GetValue<int>()==2&&stored["chest"]!["stored"]!.GetValue<int>()==2,"Chest deposit must conserve quantity.");
        var chestEntry=stored["chest"]!["entries"]!.AsArray().Single(i=>i!["id"]!.GetValue<string>()=="小还丹")!["entryNumber"]!.GetValue<long>();
        await Reject(new{type="chestWithdraw",entryNumber=chestEntry,quantity=3});
        await Cmd(new{type="chestWithdraw",entryNumber=chestEntry,quantity=1});
        await Cmd(new{type="closeChest"});
        var saved=BrowserBridge.ExportSave();
        var loaded=State(BrowserBridge.ImportSave(saved));
        Check(loaded["party"]!.AsArray().Count==2&&loaded["chest"]!["stored"]!.GetValue<int>()==1,"Roster and chest must survive save import.");
        await Cmd(new{type="selectCharacter",characterId="钟灵"});
        Check((await Cmd(new{type="state"}))["managedCharacter"]!["cultivation"]!["itemId"]!.GetValue<string>()=="内功入门","Companion cultivation must survive import.");
        Directory.CreateDirectory(Path.GetDirectoryName(output)!);File.WriteAllText(output,saved);
        await Cmd(new{type="playStory",storyId="browser_结伴练习"});await Continue();
        await Reject(new{type="allocateStat",stat="bili"});
        var result=await Fight();
        Check(result["battle"]!["outcome"]!.GetValue<string>()=="win","Real trained duo should win wooden-dummy practice.");
        await Cmd(new{type="leaveBattle"});await Continue();
        Check((await Cmd(new{type="state"}))["managedCharacter"]!["cultivation"]!["exp"]!.GetValue<int>()>0,"Participating companion must actually train her selected book.");
        await Cmd(new{type="setPartyPlacement",characterId="钟灵",placement="reserve"});
        await Cmd(new{type="playStory",storyId="fixture_release_companion"});await Continue();
        await Reject(new{type="setPartyPlacement",characterId="钟灵",placement="member"});
        Check((await Cmd(new{type="state"}))["inventory"]!.AsArray().Any(i=>i!["id"]!.GetValue<string>()=="木刀"),"Story release of a benched role must return equipment and revoke player recall.");
        Console.WriteLine("PASS original heroine naming/follow, companion equipment/manuals, roster reserves, chest conservation, save import and real team training");
    }
}
