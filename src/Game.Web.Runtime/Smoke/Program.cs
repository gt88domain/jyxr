using System.Text.Json;
using Game.Web.Runtime;

var path = args.FirstOrDefault() ?? "src/Game.Web/public/data/content-package.json";
Check(BrowserBridge.Initialize(File.ReadAllText(path)), "initialize");
Check(await BrowserBridge.Dispatch("{\"type\":\"createCharacter\",\"name\":\"测试侠客\"}"), "create");
await ContinueDialogue();
Check(await BrowserBridge.Dispatch("{\"type\":\"talk\",\"locationId\":\"南贤\"}"), "opening");
await ContinueDialogue();
Check(await BrowserBridge.Dispatch("{\"type\":\"talk\",\"locationId\":\"武师\"}"), "trainer");
await ContinueDialogue();
Check(await BrowserBridge.Dispatch("{\"type\":\"choose\",\"index\":0}"), "choose training");
await ContinueDialogue();
var turns = 0;
while (turns++ < 200)
{
    var response = await BrowserBridge.Dispatch("{\"type\":\"autoTurn\"}");
    Check(response, $"turn {turns}", false);
    using var doc = JsonDocument.Parse(response);
    if (doc.RootElement.GetProperty("state").GetProperty("battle").GetProperty("outcome").GetString() != "ongoing") break;
}
if (turns > 200) throw new InvalidOperationException("Battle failed to end within 200 actions.");
Console.WriteLine($"Battle finished after {turns} player actions.");
var save = BrowserBridge.ExportSave();
Check(await BrowserBridge.Dispatch("{\"type\":\"leaveBattle\"}"), "battle return");
Check(await BrowserBridge.Dispatch("{\"type\":\"choose\",\"index\":1}"), "leave trainer");
save = BrowserBridge.ExportSave();
Check(BrowserBridge.ImportSave(save), "save/load");

static async Task ContinueDialogue()
{
    for (var i = 0; i < 100; i++)
    {
        var state = await BrowserBridge.Dispatch("{\"type\":\"state\"}");
        Check(state, "dialogue state", false);
        using var doc = JsonDocument.Parse(state);
        if (doc.RootElement.GetProperty("state").GetProperty("phase").GetString() != "dialogue") return;
        Check(await BrowserBridge.Dispatch("{\"type\":\"next\"}"), "dialogue next", false);
    }
    throw new InvalidOperationException("Too many dialogues.");
}

static void Check(string response, string label, bool verbose = true)
{
    using var json = JsonDocument.Parse(response);
    if (!json.RootElement.GetProperty("ok").GetBoolean()) throw new InvalidOperationException($"{label}: {response}");
    if (verbose) Console.WriteLine($"PASS {label}");
}
