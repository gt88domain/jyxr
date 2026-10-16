using System.Text.Json;
using System.Text.Json.Nodes;
using Game.Web.Runtime;

internal static class TimeoutSmoke
{
    private static JsonNode Parse(string json)
    {
        var r=JsonNode.Parse(json)!;
        if(!r["ok"]!.GetValue<bool>())throw new InvalidOperationException(r["error"]!.GetValue<string>());
        return r["state"]!;
    }
    private static async Task<JsonNode> Cmd(object c)=>Parse(await BrowserBridge.Dispatch(JsonSerializer.Serialize(c)));
    private static void Check(bool b,string m){if(!b)throw new InvalidOperationException(m);}
    public static async Task Run(string path,string savePath,string? output)
    {
        Parse(BrowserBridge.Initialize(File.ReadAllText(path)));
        Parse(BrowserBridge.ImportSave(File.ReadAllText(savePath)));
        await Cmd(new{type="enterMap",mapId="南贤居"});
        if(output is not null)File.WriteAllText(output,BrowserBridge.ExportSave());
        var s=await Cmd(new{type="interact",locationId="结伴练习"});
        for(var i=0;i<100&&s["phase"]!.GetValue<string>()=="dialogue";i++)s=await Cmd(new{type="next"});
        Check(s["phase"]!.GetValue<string>()=="battle","Practice must open a real battle.");
        var beforeSilver=s["silver"]!.GetValue<int>();var beforeExp=s["hero"]!["experience"]!.GetValue<int>();
        var sawBoundary=false;
        for(var i=0;i<200&&s["battle"]!["outcome"]!.GetValue<string>()=="ongoing";i++)
        {
            var tick=s["battle"]!["tick"]!.GetValue<int>();
            Check(tick<=3000&&!s["battle"]!["timedOut"]!.GetValue<bool>(),"A player action cannot occur past the source limit.");
            if(tick==3000)sawBoundary=true;
            s=await Cmd(new{type="rest"});
        }
        Check(sawBoundary,"The original strict greater boundary must allow tick 3000.");
        Check(s["battle"]!["tick"]!.GetValue<int>()==3001&&s["battle"]!["timedOut"]!.GetValue<bool>()&&s["battle"]!["outcome"]!.GetValue<string>()=="lose","Stalemate must lose exactly at tick 3001.");
        Check(s["battle"]!["units"]!.AsArray().All(u=>u!["alive"]!.GetValue<bool>()),"Timeout must not fake unit deaths.");
        Check(s["silver"]!.GetValue<int>()==beforeSilver&&s["hero"]!["experience"]!.GetValue<int>()==beforeExp,"A timeout cannot award victory silver or experience.");
        var rejected=JsonNode.Parse(await BrowserBridge.Dispatch("{\"type\":\"autoTurn\"}"))!;
        Check(!rejected["ok"]!.GetValue<bool>(),"Ended timeout must reject further action.");
        s=await Cmd(new{type="leaveBattle"});
        for(var i=0;i<100&&s["phase"]!.GetValue<string>()=="dialogue";i++)s=await Cmd(new{type="next"});
        Check(s["phase"]!.GetValue<string>()=="world"&&!s["objectives"]!.AsArray().Single(o=>o!["id"]!.GetValue<string>()=="team")!["completed"]!.GetValue<bool>(),"Timeout must follow the defeat branch and never complete a win objective.");
        var restored=Parse(BrowserBridge.ImportSave(BrowserBridge.ExportSave()));
        Check(restored["silver"]!.GetValue<int>()==beforeSilver,"Returning from timeout must remain saveable without rewards.");
        Console.WriteLine("PASS original 3000/3001 strict timeout, living-unit defeat, no victory reward, action guard, lose continuation and save/load");
    }
}
