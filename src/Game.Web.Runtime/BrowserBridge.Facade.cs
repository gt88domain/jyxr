using System.Runtime.InteropServices.JavaScript;
using System.Text.Json;

namespace Game.Web.Runtime;

/// <summary>The JavaScript boundary owns one instance; gameplay state lives in it.</summary>
public static partial class BrowserBridge
{
    private static BrowserRuntimeSession _runtime = new();

    [JSExport]
    public static string Initialize(string contentJson)
    {
        var candidate = new BrowserRuntimeSession();
        var response = candidate.Initialize(contentJson);
        using var parsed = JsonDocument.Parse(response);
        if (!parsed.RootElement.GetProperty("ok").GetBoolean())
        {
            candidate.Dispose();
            return _runtime.Reject(parsed.RootElement.GetProperty("error").GetString() ?? "内容包无效。");
        }
        var previous = _runtime;
        _runtime = candidate;
        previous.Dispose();
        return response;
    }

    [JSExport] public static Task<string> Dispatch(string commandJson) => _runtime.Dispatch(commandJson);
    [JSExport] public static string ExportSave() => _runtime.ExportSave();
    [JSExport] public static string ImportSave(string json) => _runtime.ImportSave(json);
    [JSExport] public static string ImportStoredSave(string json) => _runtime.ImportStoredSave(json);
    [JSExport] public static string ExportProfile() => _runtime.ExportProfile();
    [JSExport] public static string InitializeProfile(string json) => _runtime.InitializeProfile(json);
    [JSExport] public static string InspectCompanionConditions() => _runtime.InspectCompanionConditions();
    [JSExport] public static string InspectEquipment(string json) => _runtime.InspectEquipment(json);
    [JSExport] public static string MiniGameInput(string json) => _runtime.MiniGameInput(json);
}

internal sealed partial class BrowserRuntimeSession : IDisposable
{
    private bool _disposed;
    internal string Reject(string message)
    {
        _error = message;
        var response = Snapshot();
        _error = null;
        return response;
    }

    public void Dispose()
    {
        if(_disposed)return;
        _disposed=true;
        _activitySubscription?.Dispose(); _activitySubscription = null;
        _partySubscription?.Dispose(); _partySubscription = null;
        ResetStory(replaceHost:false);
        _storyCancellation.Dispose();
    }
}
