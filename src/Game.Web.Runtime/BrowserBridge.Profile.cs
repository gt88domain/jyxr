using System.Runtime.InteropServices.JavaScript;
using System.Text.Json;
using Game.Core.Model;
using Game.Core.Persistence;

namespace Game.Web.Runtime;

public static partial class BrowserBridge
{
    private static GameProfile _deviceProfile = new();
    private static bool _deviceProfileInitialized;

    [JSExport]
    public static string ExportProfile() => _session is null && !_deviceProfileInitialized ? "null" : JsonSerializer.Serialize(new {
        schemaVersion = 1, packId = PackText("id"),
        profile = GameProfileRecord.Create(_session?.Profile ?? _deviceProfile)
    }, Json);

    [JSExport]
    public static string InitializeProfile(string json)
    {
        try
        {
            if (_session is not null) throw new InvalidOperationException("请在开始旅程前加载设备档案。");
            using var document = JsonDocument.Parse(json);
            var root = document.RootElement;
            if (root.GetProperty("schemaVersion").GetInt32() != 1 || root.GetProperty("packId").GetString() != PackText("id"))
                throw new InvalidOperationException("设备档案版本或所属世界不匹配。");
            var record = root.GetProperty("profile").Deserialize<GameProfileRecord>(Json) ?? throw new InvalidOperationException("设备档案为空。");
            if (record.Version < 1 || record.Version > GameProfileRecord.CurrentVersion) throw new InvalidOperationException("玩家档案版本不受支持。");
            var candidate = record.Restore();
            _deviceProfile = candidate; _deviceProfileInitialized = true; _error = null;
        }
        catch (Exception exception) { _error = exception.Message; }
        return Snapshot();
    }

    [JSExport]
    public static string ImportStoredSave(string saveJson) => ImportSaveCore(saveJson, preserveDeviceProfile: true);
}
