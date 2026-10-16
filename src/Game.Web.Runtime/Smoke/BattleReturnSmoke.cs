using System.Text.Json;
using System.Text.Json.Nodes;
using Game.Web.Runtime;

internal static class BattleReturnSmoke
{
    private static JsonNode Parse(string json)
    {
        var r=JsonNode.Parse(json)!;if(!r["ok"]!.GetValue<bool>())throw new InvalidOperationException(r["error"]!.GetValue<string>());return r["state"]!;
    }
    private static async Task<JsonNode> Cmd(object c)=>Parse(await BrowserBridge.Dispatch(JsonSerializer.Serialize(c)));
    private static void Check(bool b,string m){if(!b)throw new InvalidOperationException(m);}
    private static async Task<JsonNode> Continue()
    {
        var s=await Cmd(new{type="state"});for(var i=0;i<100&&s["phase"]!.GetValue<string>()=="dialogue";i++)s=await Cmd(new{type="next"});return s;
    }
    private static async Task<JsonNode> StartArena()
    {
        await Cmd(new{type="playStory",storyId="original_同福客栈.竞技场开始3"});var s=await Continue();
        var duel=s["choices"]!.AsArray().Single(c=>c!["text"]!.GetValue<string>()=="单挑战")!;
        await Cmd(new{type="choose",index=duel["index"]!.GetValue<int>()});
        await Cmd(new{type="choose",index=5});
        return await Cmd(new{type="selectCombatants",characterIds=new[]{"主角"}});
    }
    public static async Task Run(string content,string save,string output)
    {
        Parse(BrowserBridge.Initialize(File.ReadAllText(content)));Parse(BrowserBridge.ImportSave(File.ReadAllText(save)));
        await Cmd(new{type="enterMap",mapId="同福客栈"});File.WriteAllText(output,BrowserBridge.ExportSave());
        for(var attempt=0;attempt<2;attempt++)
        {
            var before=await Cmd(new{type="state"});var silver=before["silver"]!.GetValue<int>();
            Check(before["hero"]!["hp"]!.GetValue<int>()==before["hero"]!["maxHp"]!.GetValue<int>(),"A retry must begin alive without entering another map or reloading.");
            var s=await StartArena();
            Check(s["battle"]!["tick"]!.GetValue<int>()>0,"A retry cannot immediately end at tick zero from stale dead participants.");
            for(var i=0;i<500&&s["battle"]!["outcome"]!.GetValue<string>()=="ongoing";i++)s=await Cmd(new{type="autoTurn"});
            Check(s["battle"]!["outcome"]!.GetValue<string>()=="lose"&&s["battle"]!["units"]!.AsArray().Single(u=>u!["team"]!.GetValue<int>()==1)!["hp"]!.GetValue<int>()==0,"The low-level source duel must actually defeat the hero, not forge a loss.");
            await Cmd(new{type="leaveBattle"});var returned=await Continue();
            Check(returned["phase"]!.GetValue<string>()=="world"&&returned["map"]!["id"]!.GetValue<string>()=="同福客栈","Arena must return to the same map.");
            Check(returned["hero"]!["hp"]!.GetValue<int>()==returned["hero"]!["maxHp"]!.GetValue<int>()&&returned["hero"]!["mp"]!.GetValue<int>()==returned["hero"]!["maxMp"]!.GetValue<int>(),"Map return must perform the source ResetTeam resource recovery.");
            Check(returned["silver"]!.GetValue<int>()==silver-500,"Recovery cannot refund fees or grant a victory reward.");
        }
        Console.WriteLine("PASS two actual high-tier source duel defeats, same-map full resource recovery, live retry and exact entry fees");
    }
}
