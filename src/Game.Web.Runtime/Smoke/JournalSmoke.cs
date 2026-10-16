using System.Text.Json;
using System.Text.Json.Nodes;
using Game.Web.Runtime;

internal static class JournalSmoke
{
    private static JsonNode Parse(string json)
    {
        var r=JsonNode.Parse(json)!;if(!r["ok"]!.GetValue<bool>())throw new InvalidOperationException(r["error"]!.GetValue<string>());return r["state"]!;
    }
    public static void Run(string content,string save)
    {
        Parse(BrowserBridge.Initialize(File.ReadAllText(content)));
        var state=Parse(BrowserBridge.ImportSave(File.ReadAllText(save)));
        var milestones=state["milestones"]!.AsArray();
        if(milestones.Count!=4||milestones.Count(m=>m!["completed"]!.GetValue<bool>())!=3||milestones.Single(m=>m!["title"]!.GetValue<string>()=="紧急")!["completed"]!.GetValue<bool>())throw new InvalidOperationException("Actual normal campaign must display exactly its three occurred mainline messages and one pending message.");
        var journal=state["journal"]!.AsArray();
        if(!journal.Any(e=>e!["text"]!.GetValue<string>().Contains("两页胡家刀法"))||!journal.Any(e=>e!["text"]!.GetValue<string>().Contains("程灵素")))throw new InvalidOperationException("Persisted source journals must contain the real medicine quest history.");
        var restored=Parse(BrowserBridge.ImportSave(BrowserBridge.ExportSave()));
        if(!JsonNode.DeepEquals(state["milestones"],restored["milestones"])||!JsonNode.DeepEquals(state["journal"],restored["journal"]))throw new InvalidOperationException("Journal and milestone display must survive save/load without advancing source state.");
        Console.WriteLine("PASS actual level-22/eight-member campaign displays three source mainline messages, real medicine quest journals and identical save/load state");
    }
}
