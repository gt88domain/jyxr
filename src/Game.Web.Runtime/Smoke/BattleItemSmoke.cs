using System.Text.Json;
using System.Text.Json.Nodes;
using Game.Web.Runtime;

internal static class BattleItemSmoke
{
    private static JsonNode Parse(string json)
    {
        var r=JsonNode.Parse(json)!;
        if(!r["ok"]!.GetValue<bool>())throw new InvalidOperationException(r["error"]!.GetValue<string>());
        return r["state"]!;
    }
    private static async Task<JsonNode> Cmd(object c)=>Parse(await BrowserBridge.Dispatch(JsonSerializer.Serialize(c)));
    private static void Check(bool b,string m){if(!b)throw new InvalidOperationException(m);}
    private static JsonNode Medicine(JsonNode s)=>s["inventory"]!.AsArray().Single(i=>i!["id"]!.GetValue<string>()=="小还丹")!;
    private static async Task<JsonNode> Start()
    {
        var s=await Cmd(new{type="interact",locationId="阎基居"});
        for(var i=0;i<80&&s["phase"]!.GetValue<string>()=="dialogue";i++)s=await Cmd(new{type="next"});
        Check(s["phase"]!.GetValue<string>()=="battle","Actual original 阎基 encounter must open battle.");
        return s;
    }
    public static async Task Run(string content,string save,string output)
    {
        Parse(BrowserBridge.Initialize(File.ReadAllText(content)));
        Parse(BrowserBridge.ImportSave(File.ReadAllText(save)));
        await Cmd(new{type="playStory",storyId="雪山飞狐_胡斐居.胜利"});
        for(var i=0;i<80&&(await Cmd(new{type="state"}))["phase"]!.GetValue<string>()=="dialogue";i++)await Cmd(new{type="next"});
        await Cmd(new{type="enterMap",mapId="大地图"});
        var original=BrowserBridge.ExportSave();
        var s=await Start();
        var medicine=Medicine(s);var actor=s["battle"]!["activeUnitId"]!.GetValue<string>();
        var ally=medicine["battleTargets"]!.AsArray().First(t=>t!["id"]!.GetValue<string>()!=actor)!;
        Check(!ally["canUse"]!.GetValue<bool>()&&ally["reason"]!.GetValue<string>().Contains("隔空取物"),"Ally selector must explain the actual missing trait.");
        var count=medicine["count"]!.GetValue<int>();
        var rejected=JsonNode.Parse(await BrowserBridge.Dispatch(JsonSerializer.Serialize(new{type="useItem",entryNumber=medicine["entryNumber"]!.GetValue<long>(),targetId=ally["id"]!.GetValue<string>()})))!;
        Check(!rejected["ok"]!.GetValue<bool>()&&Medicine(await Cmd(new{type="state"}))["count"]!.GetValue<int>()==count,"Rejected ally use must preserve inventory.");
        Console.WriteLine("PASS battle ally preview and engine reject missing 隔空取物 without consuming medicine");

        // Isolated inventory fixture: grant two real talent books, then learn
        // them through the ordinary ItemUseService. Combat and healing are real.
        var fixture=JsonNode.Parse(original)!;var inventory=fixture["game"]!["inventory"]!;
        var next=inventory["nextEntryNumber"]!.GetValue<long>();
        inventory["entries"]!.AsArray().Add(new JsonObject{["kind"]="stack",["entryNumber"]=next,["itemDefinitionId"]="隔空取物",["quantity"]=2});
        inventory["nextEntryNumber"]=next+1;
        Parse(BrowserBridge.ImportSave(fixture.ToJsonString()));
        foreach(var id in new[]{"主角","钟灵"})
        {
            await Cmd(new{type="selectCharacter",characterId=id});await Cmd(new{type="useItem",entryNumber=next});
        }
        await Cmd(new{type="selectCharacter",characterId="主角"});
        File.WriteAllText(output,BrowserBridge.ExportSave());
        s=await Start();JsonNode? wounded=null;
        for(var turn=0;turn<100;turn++)
        {
            medicine=Medicine(s);actor=s["battle"]!["activeUnitId"]!.GetValue<string>();
            wounded=medicine["battleTargets"]!.AsArray().FirstOrDefault(t=>t!["canUse"]!.GetValue<bool>()&&t["id"]!.GetValue<string>()!=actor&&t["hp"]!.GetValue<int>()<t["maxHp"]!.GetValue<int>());
            if(wounded is not null)break;
            s=await Cmd(new{type="rest"});
            Check(s["battle"]!["outcome"]!.GetValue<string>()=="ongoing","Practice unexpectedly ended while waiting for an actual wound.");
        }
        Check(wounded is not null,"Real enemy failed to wound a reachable ally.");
        var target=wounded!["id"]!.GetValue<string>();count=medicine["count"]!.GetValue<int>();
        var sequence=s["battle"]!["events"]!.AsArray().Select(e=>e!["sequence"]!.GetValue<int>()).DefaultIfEmpty(0).Max();
        s=await Cmd(new{type="useItem",entryNumber=medicine["entryNumber"]!.GetValue<long>(),targetId=target});
        Check(Medicine(s)["count"]!.GetValue<int>()==count-1,"Successful ally healing must consume exactly one medicine.");
        Check(s["battle"]!["events"]!.AsArray().Any(e=>e!["sequence"]!.GetValue<int>()>sequence&&e["kind"]!.GetValue<string>()=="Healed"&&e["unitId"]!.GetValue<string>()==target&&e["amount"]!.GetValue<int>()>0),"Real ally medicine did not emit a positive healing fact for the selected target.");
        Console.WriteLine("PASS actual enemy wounds, learnt source trait, selected ally healing and exact medicine consumption");
    }
}
