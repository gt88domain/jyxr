using System.Text.Json;
using Game.Web.Runtime;

if (args.FirstOrDefault() == "--white-horse")
{
    await WhiteHorseSmoke.Run(args[1], args[2]);
    return;
}

if(args.FirstOrDefault()=="--frontier")
{
    await FrontierSmoke.Run(args[1]);
    return;
}

if(args.FirstOrDefault()=="--session-isolation")
{
    await SessionIsolationSmoke.Run(args[1],args[2],args[3]);
    return;
}

if (args.FirstOrDefault() == "--device-profile")
{
    await ProfileSmoke.Run(args[1], args[2], args[3]);
    return;
}

if (args.FirstOrDefault() == "--starting-companions")
{
    await StartingCompanionSmoke.Run(args[1], args[2]);
    return;
}

if (args.FirstOrDefault() == "--companions")
{
    await CompanionSmoke.Run(args[1],args[2],args[3]);
    return;
}

if (args.FirstOrDefault() == "--advanced-ui")
{
    await AdvancedUiFixture.Create(args[1], args[2], args[3]);
    return;
}

if (args.FirstOrDefault() == "--reference-repairs")
{
    await ReferenceRepairSmoke.Run(args[1], args[2]);
    return;
}

if (args.FirstOrDefault() == "--story-defeat")
{
    await StoryDefeatSmoke.Run(args[1], args[2], args[3]);
    return;
}

if (args.FirstOrDefault() == "--experience")
{
    await ExperienceSmoke.Run(args[1], args[2]);
    return;
}

if (args.FirstOrDefault() == "--battle-return")
{
    await BattleReturnSmoke.Run(args[1],args[2],args[3]);
    return;
}

if (args.FirstOrDefault() == "--touch")
{
    await TouchSmoke.Run(args[1],args[2],args[3],args[4]);
    return;
}

if (args.FirstOrDefault() == "--journal")
{
    JournalSmoke.Run(args[1],args[2]);
    return;
}

if (args.FirstOrDefault() == "--source-fixes")
{
    await SourceFixSmoke.Run(args[1],args[2]);
    return;
}

if (args.FirstOrDefault() == "--timeout")
{
    await TimeoutSmoke.Run(args[1],args[2],args.ElementAtOrDefault(3));
    return;
}

if (args.FirstOrDefault() == "--campaign")
{
    await CampaignSmoke.Run(args[1],args[2],args.ElementAtOrDefault(3)??"new");
    return;
}

if (args.FirstOrDefault() == "--battle-items")
{
    await BattleItemSmoke.Run(args[1],args[2],args[3]);
    return;
}

if (args.FirstOrDefault() == "--achievements")
{
    await AchievementSmoke.Run(args[1],args[2],args[3]);
    return;
}

if (args.FirstOrDefault() == "--flow")
{
    await FlowSmoke.Run(args[1],args[2],args[3]);
    return;
}

if (args.FirstOrDefault() == "--minigame")
{
    await MiniGameSmoke.Run(args[1],args[2]);
    return;
}

if (args.FirstOrDefault() == "--special")
{
    await SpecialSmoke.Run(args[1],args[2]);
    return;
}

if (args.FirstOrDefault() == "--management")
{
    await ManagementSmoke.Run(args[1],args[2]);
    return;
}

if (args.FirstOrDefault() == "--creation")
{
    await CreationSmoke.Run(args[1]);
    return;
}

if (args.FirstOrDefault() == "--original")
{
    await OriginalSmoke.Run(args[1]);
    return;
}

if (args.FirstOrDefault() == "--packs")
{
    await PackSmoke.Run(args[1], args[2]);
    return;
}

var path = args.FirstOrDefault() ?? "src/Game.Web/public/data/content-package.json";
Check(BrowserBridge.Initialize(File.ReadAllText(path)), "initialize");
Check(await BrowserBridge.Dispatch("{\"type\":\"createCharacter\",\"name\":\"测试侠客\"}"), "create");
await ContinueDialogue();
Check(await BrowserBridge.Dispatch("{\"type\":\"talk\",\"locationId\":\"南贤\"}"), "opening");
await ContinueDialogue();
var beforeTraining = State(await BrowserBridge.Dispatch("{\"type\":\"state\"}"));
var book = beforeTraining.GetProperty("inventory").EnumerateArray().Single(i => i.GetProperty("id").GetString() == "内功入门");
var entryNumber = book.GetProperty("entryNumber").GetInt64();
if (book.GetProperty("count").GetInt32() != 1 || beforeTraining.GetProperty("hero").GetProperty("equipment").EnumerateArray().Any(s => s.GetProperty("item").ValueKind != JsonValueKind.Null)) throw new InvalidOperationException("Opening rewards or empty equipment slots changed.");
var cultivated = State(await Command(new { type = "setCultivation", entryNumber }));
var cultivation = cultivated.GetProperty("hero").GetProperty("cultivation");
if (cultivation.GetProperty("level").GetInt32() != 1 || cultivated.GetProperty("hero").GetProperty("equippedInternalSkillId").GetRawText() != beforeTraining.GetProperty("hero").GetProperty("equippedInternalSkillId").GetRawText()) throw new InvalidOperationException("Cultivation changed the source level or running internal skill.");
Check(await Command(new { type = "clearInternalSkill" }), "clear running internal skill independently");
if (State(await Command(new { type = "state" })).GetProperty("hero").GetProperty("cultivation").GetProperty("itemId").GetString() != "内功入门") throw new InvalidOperationException("Clearing internal skill changed cultivation.");
Check(await Command(new { type = "equipInternalSkill", skillId = "基本内功" }), "run learned internal skill");
Check(await Command(new { type = "clearCultivation" }), "clear cultivation without forgetting");
if (State(await Command(new { type = "state" })).GetProperty("hero").GetProperty("internalSkills").GetArrayLength() != 1) throw new InvalidOperationException("Clearing cultivation forgot a learned skill.");
Check(await Command(new { type = "setCultivation", entryNumber }), "select cultivation again");
var preBattleSave = BrowserBridge.ExportSave();
Check(BrowserBridge.ImportSave(preBattleSave), "prebattle cultivation save/load");
if (State(await Command(new { type = "state" })).GetProperty("hero").GetProperty("cultivation").GetProperty("itemId").GetString() != "内功入门") throw new InvalidOperationException("Cultivation selection was lost.");
Check(await BrowserBridge.Dispatch("{\"type\":\"talk\",\"locationId\":\"武师\"}"), "trainer");
await ContinueDialogue();
Check(await BrowserBridge.Dispatch("{\"type\":\"choose\",\"index\":0}"), "choose training");
await ContinueDialogue();
var forbidden = State(await Command(new { type = "state" })).GetProperty("hero").GetProperty("cultivation").GetRawText();
var battleSkills = State(await Command(new { type = "state" })).GetProperty("battle").GetProperty("skills");
if (battleSkills.EnumerateArray().Any(s => s.GetProperty("available").GetBoolean() && s.GetProperty("reason").ValueKind != JsonValueKind.Null)) throw new InvalidOperationException("Available skills displayed a failure reason.");
var rejected = await Command(new { type = "clearCultivation" });
using (var rejectDoc = JsonDocument.Parse(rejected)) if (rejectDoc.RootElement.GetProperty("ok").GetBoolean()) throw new InvalidOperationException("Battle permitted cultivation changes.");
if (State(await Command(new { type = "state" })).GetProperty("hero").GetProperty("cultivation").GetRawText() != forbidden) throw new InvalidOperationException("Rejected command mutated cultivation.");
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
var restored = State(await Command(new { type = "state" }));
var restoredCultivation = restored.GetProperty("hero").GetProperty("cultivation");
if (restoredCultivation.GetProperty("level").GetInt32() <= 1 && restoredCultivation.GetProperty("exp").GetInt32() <= 0) throw new InvalidOperationException("Cultivation did not grow through battle.");
if (restored.GetProperty("hero").GetProperty("equippedInternalSkillId").GetString() != "基本内功") throw new InvalidOperationException("Running internal skill was lost.");
if (restored.GetProperty("inventory").EnumerateArray().Single(i => i.GetProperty("id").GetString() == "内功入门").GetProperty("count").GetInt32() != 1) throw new InvalidOperationException("Cultivation consumed its book.");
var legacy = System.Text.Json.Nodes.JsonNode.Parse(save)!.AsObject();
legacy.Remove("cultivationItemId");
legacy["browserSaveVersion"] = 1;
legacy.Remove("packId");
legacy.Remove("wonBattles");
Check(BrowserBridge.ImportSave(legacy.ToJsonString()), "older v1 save without cultivation metadata");
Check(BrowserBridge.ImportSave(save), "restore current save");
var invalidCultivationSave = System.Text.Json.Nodes.JsonNode.Parse(save)!.AsObject();
invalidCultivationSave["game"]!["characters"]![0]!["internalSkills"] = new System.Text.Json.Nodes.JsonArray();
var oldHeroState = State(await Command(new { type = "state" })).GetProperty("hero").GetRawText();
var failedImport = BrowserBridge.ImportSave(invalidCultivationSave.ToJsonString());
using (var failedDocument = JsonDocument.Parse(failedImport)) if (failedDocument.RootElement.GetProperty("ok").GetBoolean()) throw new InvalidOperationException("Unlearned cultivation skill was accepted from a malformed save.");
if (State(await Command(new { type = "state" })).GetProperty("hero").GetRawText() != oldHeroState) throw new InvalidOperationException("Rejected save changed the existing session.");
Console.WriteLine("PASS reject invalid cultivation save without modifying active session");
Console.WriteLine("PASS real book training growth, independent internal skill, battle lock and save persistence");
// Isolated save fixture exercises a real existing equipment definition. It does
// not change production opening rewards, content, or the initial character.
var equipmentFixture = System.Text.Json.Nodes.JsonNode.Parse(save)!.AsObject();
var fixtureInventory = equipmentFixture["game"]!["inventory"]!;
var equipmentEntryNumber = fixtureInventory["nextEntryNumber"]!.GetValue<long>();
fixtureInventory["entries"]!.AsArray().Add(new System.Text.Json.Nodes.JsonObject { ["kind"] = "stack", ["entryNumber"] = equipmentEntryNumber, ["itemDefinitionId"] = "木刀", ["quantity"] = 1 });
fixtureInventory["nextEntryNumber"] = equipmentEntryNumber + 1;
Check(BrowserBridge.ImportSave(equipmentFixture.ToJsonString()), "isolated real-equipment save fixture");
Check(await Command(new { type = "equipItem", entryNumber = equipmentEntryNumber }), "equip real wooden blade");
var equippedState = State(await Command(new { type = "state" }));
var equippedSlot = equippedState.GetProperty("hero").GetProperty("equipment").EnumerateArray().Single(e => e.GetProperty("slot").GetString() == "Weapon");
if (equippedSlot.GetProperty("item").GetProperty("id").GetString() != "木刀") throw new InvalidOperationException("Real equipment was not applied.");
var equippedId = equippedSlot.GetProperty("item").GetProperty("instanceId").GetString();
Check(BrowserBridge.ImportSave(BrowserBridge.ExportSave()), "equipment save/load");
var persistedSlot = State(await Command(new { type = "state" })).GetProperty("hero").GetProperty("equipment").EnumerateArray().Single(e => e.GetProperty("slot").GetString() == "Weapon");
if (persistedSlot.GetProperty("item").GetProperty("instanceId").GetString() != equippedId) throw new InvalidOperationException("Equipment instance changed after save/load.");
Check(await Command(new { type = "unequipItem", slot = "Weapon" }), "unequip returns actual inventory item");
if (!State(await Command(new { type = "state" })).GetProperty("inventory").EnumerateArray().Any(i => i.GetProperty("id").GetString() == "木刀")) throw new InvalidOperationException("Unequipped item was lost.");
Check(BrowserBridge.ImportSave(save), "discard isolated equipment fixture");
var originalV1Path = "src/Game.Web/tests/fixtures/legacy-v1-save.json";
if (File.Exists(originalV1Path))
{
    Check(BrowserBridge.ImportSave(File.ReadAllText(originalV1Path)), "frozen original-browser v1 save");
    var oldSaveHero = State(await Command(new { type = "state" })).GetProperty("hero");
    if (oldSaveHero.GetProperty("name").GetString() != "云游测试侠") throw new InvalidOperationException("Original browser save lost its hero.");
    Check(BrowserBridge.ImportSave(save), "restore current version after legacy fixture");
}

static Task<string> Command(object command) => BrowserBridge.Dispatch(JsonSerializer.Serialize(command));
static JsonElement State(string response) { using var doc = JsonDocument.Parse(response); return doc.RootElement.GetProperty("state").Clone(); }

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
