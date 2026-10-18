using System.Text.Json;
using System.Text.Json.Nodes;
using Game.Web.Runtime;

internal static class SessionIsolationSmoke
{
    private static JsonNode State(string response){var root=JsonNode.Parse(response)!;Check(root["ok"]!.GetValue<bool>(),root["error"]?.ToString()??"Request failed");return root["state"]!;}
    private static void Check(bool condition,string message){if(!condition)throw new InvalidOperationException(message);}
    private static Task<string> Command(BrowserRuntimeSession runtime,object command)=>runtime.Dispatch(JsonSerializer.Serialize(command));
    private static async Task<JsonNode> Current(BrowserRuntimeSession runtime)=>State(await Command(runtime,new{type="state"}));
    private static async Task<JsonNode> Continue(BrowserRuntimeSession runtime){var state=await Current(runtime);for(var i=0;i<200&&state["phase"]!.ToString()=="dialogue";i++)state=State(await Command(runtime,new{type="next"}));return state;}
    private static string Entries(JsonNode state)=>state["activity"]!.ToJsonString();

    public static async Task Run(string originalPath,string westernPath,string managementSave)
    {
        var original=File.ReadAllText(originalPath);var western=File.ReadAllText(westernPath);
        using var a=new BrowserRuntimeSession();using var b=new BrowserRuntimeSession();
        State(a.Initialize(original));State(b.Initialize(western));
        State(a.ImportSave(File.ReadAllText(managementSave)));
        State(await Command(b,new{type="createCharacter",name="独立佣兵"}));await Continue(b);
        var westBefore=(await Current(b)).ToJsonString();
        var selected=State(await Command(a,new{type="selectCharacter",characterId="钟灵"}));
        Check(selected["managedCharacter"]!["id"]!.ToString()=="钟灵","Original selected role missing");
        State(await Command(a,new{type="unequipItem",slot="Weapon"}));
        var changed=await Current(a);
        Check(changed["managedCharacter"]!["equipment"]!.AsArray().Single(e=>e!["slot"]!.ToString()=="Weapon")!["item"] is null,"Original gear operation failed");
        Check((await Current(b)).ToJsonString()==westBefore,"A changed another live session's world, party, training or history");
        Console.WriteLine("PASS two concurrent runtime instances isolate world, selected companion, equipment, cultivation and history");

        var before=changed.ToJsonString();
        foreach(var malformed in new[]{"{}","[]","{\"type\":\"unknown\"}","{\"type\":\"state\",\"x\":1}","{\"type\":\"equipItem\"}","{\"type\":\"equipItem\",\"entryNumber\":\"1\"}","{\"type\":\"state\",\"type\":\"rest\"}","{\"type\":\"attack\",\"x\":1}","{\"type\":\"move\",\"x\":2147483648,\"y\":0}"})
        {
            var rejection=JsonNode.Parse(await a.Dispatch(malformed))!;
            Check(!rejection["ok"]!.GetValue<bool>(),"Malformed command accepted: "+malformed);
            Check((await Current(a)).ToJsonString()==before,"Rejected request mutated game/history: "+malformed);
        }
        Console.WriteLine("PASS missing, unknown, duplicate, mistyped and out-of-range request fields reject before gameplay mutation");

        var save=a.ExportSave();
        Check(JsonNode.Parse(save)!["activity"] is not null,"History missing from save");
        var expected=Entries(await Current(a));var journey=(await Current(a))["journeyId"]!.ToString();
        State(a.ImportSave(save));
        var loaded=(await Current(a))["activity"]!.AsArray();
        Check(loaded.Last()!["message"]!.ToString()=="已读取浏览器存档。","Load event missing from history");
        Check(new JsonArray(loaded.SkipLast(1).Select(e=>e!.DeepClone()).ToArray()).ToJsonString()==expected&&(await Current(a))["journeyId"]!.ToString()==journey,"History or journey changed after load");
        expected=Entries(await Current(a));
        var broken=JsonNode.Parse(save)!;broken["activity"]!["nextId"]=-1;
        Check(!JsonNode.Parse(a.ImportSave(broken.ToJsonString()))!["ok"]!.GetValue<bool>(),"Malformed history accepted");
        Check(Entries(await Current(a))==expected,"Rejected history damaged live records");
        var legacy=JsonNode.Parse(save)!;legacy.AsObject().Remove("activity");State(a.ImportSave(legacy.ToJsonString()));
        Check((await Current(a))["activity"]!.AsArray().Count==1&&(await Current(a))["activity"]![0]!["message"]!.ToString()=="已读取浏览器存档。","Old saves invented historical records");
        Console.WriteLine("PASS history survives save/load, malformed history is atomic, old saves load without fabricated records");

        // New original character publishes actual inventory events, not UI guesses.
        State(a.Initialize(original));
        State(await Command(a,new{type="beginCreation",name="通知验收侠"}));
        for(var index=0;index<7;index++)State(await Command(a,new{type="answerCreation",questionIndex=index,index=0}));
        var portrait=(await Current(a))["creation"]!["portraits"]![0]!["id"]!.ToString();
        State(await Command(a,new{type="selectCreationPortrait",portraitId=portrait}));
        State(await Command(a,new{type="confirmCreation"}));await Continue(a);
        var fresh=await Current(a);Check(fresh["journeyId"]!.ToString()!=journey,"New game reused prior history identity");
        Check(fresh["activity"]!.AsArray().Any(e=>e!["kind"]!.ToString()=="item"&&e["notice"]!.GetValue<bool>()),"Actual opening item rewards were not notified");
        Check(fresh["activity"]!.AsArray().Any(e=>e!["kind"]!.ToString()=="dialogue"),"Actual dialogue not recorded");
        State(await Command(a,new{type="playStory",storyId="original_同福客栈.升级开始"}));await Continue(a);
        var grown=await Current(a);Check(grown["activity"]!.AsArray().Any(e=>e!["kind"]!.ToString()=="growth"&&e["notice"]!.GetValue<bool>()),"Actual level-up not notified");
        State(await Command(a,new{type="playStory",storyId="tlbb.dy_钟灵"}));await Continue(a);
        State(await Command(a,new{type="choose",index=0}));await Continue(a);
        Check((await Current(a))["activity"]!.AsArray().Any(e=>e!["kind"]!.ToString()=="party"&&e["message"]!.ToString().Contains("钟灵")&&e["notice"]!.GetValue<bool>()),"Actual recruitment not notified");
        State(await Command(a,new{type="setPartyPlacement",characterId="钟灵",placement="reserve"}));
        Check((await Current(a))["activity"]!.AsArray().Any(e=>e!["kind"]!.ToString()=="party"&&e["message"]!.ToString().Contains("参战 → 后备")),"Actual placement change missing");
        // Repeated accepted stateful actions exercise bounded retention; read-only
        // state inspection above must never add entries.
        for(var i=0;i<305;i++)State(await Command(a,new{type="clearCultivation"}));
        var capped=await Current(a);Check(capped["activity"]!.AsArray().Count==300,"History retention is not bounded to300");
        Check(capped["activity"]![0]!["id"]!.GetValue<long>()>1,"Retention failed to remove oldest entries");
        Console.WriteLine("PASS actual item, dialogue and level events create records; new journeys reset them and retention caps at300");

        State(await Command(a,new{type="playStory",storyId="新手村_出生"}));
        Check((await Current(a))["phase"]!.ToString()=="dialogue","Expected a real pending original dialogue before import");
        State(a.ImportSave(File.ReadAllText(managementSave)));var imported=(await Current(a)).ToJsonString();
        await Task.Yield();Check((await Current(a)).ToJsonString()==imported,"Cancelled pre-load story changed restored game");
        Console.WriteLine("PASS importing over a real pending original dialogue cancels its continuation without changing restored data");
        State(await Command(a,new{type="playStory",storyId="新手村_出生"}));
        a.Dispose();await Task.Yield();
        Check((await Current(b)).ToJsonString()==westBefore,"Cancelled original continuation changed the other live world");
        State(BrowserBridge.Initialize(western));var facadeBefore=State(await BrowserBridge.Dispatch("{\"type\":\"state\"}")).ToJsonString();
        Check(!JsonNode.Parse(BrowserBridge.Initialize("{}"))!["ok"]!.GetValue<bool>(),"Invalid candidate accepted");
        Check(State(await BrowserBridge.Dispatch("{\"type\":\"state\"}")).ToJsonString()==facadeBefore,"Invalid candidate replaced live facade state");
        Console.WriteLine("PASS pending story cancellation stays with its owner; invalid initialization preserves the active facade session");
    }
}
