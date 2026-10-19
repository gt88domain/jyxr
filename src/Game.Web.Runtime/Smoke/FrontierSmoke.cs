using System.Text.Json;
using System.Text.Json.Nodes;
using Game.Web.Runtime;

internal static class FrontierSmoke
{
    public static async Task Run(string path)
    {
        var content=File.ReadAllText(path);
        Ok(BrowserBridge.Initialize(content));
        var title=await State();Check(title.GetProperty("pack").GetProperty("id").GetString()=="frontier","standalone content loads with full cross-reference validation");
        Ok(await Command(new {type="createCharacter",name="独立佣兵"}));await Dialogues();
        var start=await State();Check(start.GetProperty("silver").GetInt32()==80,"original prototype opening grants exactly80 silver");
        Ok(await Command(new {type="interact",locationId="mara"}));await Dialogues();
        Ok(await Command(new {type="choose",index=1}));await Dialogues();
        Check((await State()).GetProperty("party").GetArrayLength()==1,"declining does not recruit a companion");
        var declined=BrowserBridge.ExportSave();Ok(BrowserBridge.ImportSave(declined));
        Ok(await Command(new {type="interact",locationId="mara"}));await Dialogues();
        Check((await State()).GetProperty("phase").GetString()=="choice","declined recruitment remains available after save/load");
        Ok(await Command(new {type="choose",index=0}));await Dialogues();
        Check((await State()).GetProperty("party").GetArrayLength()==2,"reconsidering recruits the real companion");
        Ok(await Command(new {type="interact",locationId="mara"}));await Dialogues();
        Check((await State()).GetProperty("party").GetArrayLength()==2,"revisiting never duplicates a companion");
        var before=await State();
        var invalid=JsonNode.Parse(content)!.AsObject();invalid["browser"]!["initialMapId"]="missing-map";
        Reject(BrowserBridge.Initialize(invalid.ToJsonString()));
        Check((await State()).GetRawText()==before.GetRawText(),"invalid content leaves the live session intact");
        var originalSave="""{"browserSaveVersion":1,"packId":"jyx"}""";
        Reject(BrowserBridge.ImportSave(originalSave));
        Check((await State()).GetRawText()==before.GetRawText(),"an original-game save cannot replace a western session");
        var save=BrowserBridge.ExportSave();Ok(BrowserBridge.ImportSave(save));
        Check((await State()).GetProperty("hero").GetProperty("name").GetString()=="独立佣兵","western journey survives normal save/load");
    }
    private static Task<string> Command(object value)=>BrowserBridge.Dispatch(JsonSerializer.Serialize(value));
    private static async Task<JsonElement> State(){using var doc=JsonDocument.Parse(await Command(new {type="state"}));if(!doc.RootElement.GetProperty("ok").GetBoolean())throw new Exception(doc.RootElement.ToString());return doc.RootElement.GetProperty("state").Clone();}
    private static void Ok(string value){using var doc=JsonDocument.Parse(value);if(!doc.RootElement.GetProperty("ok").GetBoolean())throw new Exception(value);}
    private static void Reject(string value){using var doc=JsonDocument.Parse(value);if(doc.RootElement.GetProperty("ok").GetBoolean())throw new Exception("Expected rejection");}
    private static void Check(bool result,string message){if(!result)throw new Exception(message);Console.WriteLine("PASS "+message);}
    private static async Task Dialogues(){for(var i=0;i<100;i++){if((await State()).GetProperty("phase").GetString()!="dialogue")return;Ok(await Command(new {type="next"}));}throw new Exception("Dialogue did not finish");}
}
