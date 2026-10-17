using System.Text.Json;
using System.Text.Json.Nodes;
using Game.Core.Model;
using Game.Core.Persistence;
using Game.Core.Serialization;
using Game.Web.Runtime;

internal static class ProfileSmoke
{
    public static async Task Run(string contentPath, string savePath, string output)
    {
        var options = new JsonSerializerOptions(GameJson.Default) { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
        var content = File.ReadAllText(contentPath); var oldSave = File.ReadAllText(savePath); var checks = 0;
        void Check(bool value, string text) { if (!value) throw new InvalidOperationException("Device profile: " + text); checks++; }
        bool Ok(string response) => JsonNode.Parse(response)!["ok"]!.GetValue<bool>();
        var p = new GameProfile(); p.UnlockAchievement("全真高手"); p.AddDeaths(4); p.AddKills(23); p.AddYuanbao(17);
        p.TryAddSkillMaxLevelBonusOnce("野球拳", 2, "profile-fixture"); p.RecordCompletion(2);
        var profile = JsonSerializer.Serialize(new { schemaVersion = 1, packId = "jyx", profile = GameProfileRecord.Create(p) }, options);
        Check(Ok(BrowserBridge.Initialize(content)), "initialize actual content");
        Check(BrowserBridge.ExportProfile() == "null", "an untouched title screen has no authoritative device profile");
        Check(Ok(await BrowserBridge.Dispatch("{\"type\":\"beginCreation\",\"name\":\"档案草稿\",\"difficulty\":\"normal\"}")), "open an unconfirmed original character draft");
        Check(Ok(await BrowserBridge.Dispatch("{\"type\":\"cancelCreation\"}")), "cancel the unconfirmed character draft");
        Check(BrowserBridge.ExportProfile() == "null", "drafts do not create an empty device profile ahead of first old-save migration");
        Check(Ok(BrowserBridge.InitializeProfile(profile)), "restore validated independent profile before a journey");
        Check(BrowserBridge.ExportProfile() == profile, "all profile fields roundtrip without additive duplication");
        var wrong = JsonNode.Parse(profile)!; wrong["packId"] = "frontier";
        Check(!Ok(BrowserBridge.InitializeProfile(wrong.ToJsonString())), "wrong world rejected");
        Check(BrowserBridge.ExportProfile() == profile, "failed profile replacement leaves the active record unchanged");
        var future = JsonNode.Parse(profile)!; future["profile"]!["version"] = 999;
        Check(!Ok(BrowserBridge.InitializeProfile(future.ToJsonString())), "future profile version rejected");
        Check(BrowserBridge.ExportProfile() == profile, "unsupported profile version does not replace current progress");
        Check(Ok(await BrowserBridge.Dispatch("{\"type\":\"createCharacter\",\"name\":\"档案旅人\",\"difficulty\":\"normal\"}")), "new original character starts with the device profile");
        Check(BrowserBridge.ExportProfile() == profile, "new journey retains achievements, counters, yuanbao and once-only skill keys");
        Check(!Ok(BrowserBridge.InitializeProfile(profile)), "live session cannot be replaced through initialization");
        Check(Ok(BrowserBridge.ImportStoredSave(oldSave)), "continue older journey using the current device profile");
        Check(BrowserBridge.ExportProfile() == profile, "loading older progress does not roll back device profile");
        Check(Ok(BrowserBridge.ImportStoredSave(oldSave)), "repeat old progress load");
        Check(BrowserBridge.ExportProfile() == profile, "repeat loads neither add yuanbao nor duplicate skill bonuses");
        var before = BrowserBridge.ExportProfile();
        Check(!Ok(BrowserBridge.ImportStoredSave("{}")), "malformed old progress rejected");
        Check(BrowserBridge.ExportProfile() == before, "failed journey replacement is profile-transactional");
        var futureSave = JsonNode.Parse(oldSave)!; futureSave["profile"]!["version"] = 999;
        Check(!Ok(BrowserBridge.ImportSave(futureSave.ToJsonString())), "full backup rejects future profile versions");
        Check(BrowserBridge.ExportProfile() == before, "future backup rejection leaves current profile unchanged");
        Check(Ok(BrowserBridge.ImportSave(oldSave)), "explicit full backup import retains the existing full-restore semantics");
        var imported = JsonNode.Parse(BrowserBridge.ExportProfile())!;
        Check(imported["profile"]!.ToJsonString() == JsonNode.Parse(oldSave)!["profile"]!.ToJsonString(), "explicit backup imports that backup's profile once");
        Check(Ok(BrowserBridge.Initialize(content)), "reinitialize content for browser reload fixture");
        Check(BrowserBridge.ExportProfile() == "null", "initialization does not leak a previous world's profile");
        Check(Ok(BrowserBridge.ImportStoredSave(oldSave)), "first old journey migrates its embedded profile if no independent record exists");
        Check(JsonNode.Parse(BrowserBridge.ExportProfile())!["profile"]!.ToJsonString() == JsonNode.Parse(oldSave)!["profile"]!.ToJsonString(), "first migration retains the old journey's achievements and profile data");
        File.WriteAllText(output, profile);
        Console.WriteLine($"PASS {checks} isolated device profile checks: initialization/new character, old progress preservation, full backup import, rollback and repeat-load idempotence; no campaign.");
    }
}
