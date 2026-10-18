using System.Text.Json;

namespace Game.Web.Runtime;

/// <summary>One source of request shapes, shared with the generated TS client.</summary>
internal static class BrowserCommandContract
{
    private static readonly JsonDocument Contract=JsonDocument.Parse(typeof(BrowserCommandContract).Assembly.GetManifestResourceStream("Jyxr.CommandContract")!);
    internal static string Validate(JsonElement args)
    {
        if(args.ValueKind!=JsonValueKind.Object||!args.TryGetProperty("type",out var typeNode)||typeNode.ValueKind!=JsonValueKind.String)
            throw new InvalidOperationException("请求缺少指令类型。");
        var type=typeNode.GetString()!;
        if(!Contract.RootElement.GetProperty("commands").TryGetProperty(type,out var command))throw new InvalidOperationException($"未知指令：{type}");
        var fields=command.GetProperty("fields");var seen=new HashSet<string>(StringComparer.Ordinal);
        foreach(var value in args.EnumerateObject())
        {
            if(!seen.Add(value.Name))throw new InvalidOperationException($"请求字段重复：{value.Name}");
            if(value.Name=="type")continue;
            if(!fields.TryGetProperty(value.Name,out var definition)&&!fields.TryGetProperty(value.Name+"?",out definition))
                throw new InvalidOperationException($"{type}不接受字段：{value.Name}");
            var valid=definition.GetString() switch {
                "string"=>value.Value.ValueKind==JsonValueKind.String,
                "boolean"=>value.Value.ValueKind is JsonValueKind.True or JsonValueKind.False,
                "integer"=>value.Value.ValueKind==JsonValueKind.Number&&value.Value.TryGetInt32(out _),
                "id"=>value.Value.ValueKind==JsonValueKind.Number&&value.Value.TryGetInt64(out var id)&&id>0,
                "strings"=>value.Value.ValueKind==JsonValueKind.Array&&value.Value.EnumerateArray().All(v=>v.ValueKind==JsonValueKind.String),
                _=>false,
            };
            if(!valid)throw new InvalidOperationException($"请求字段类型无效：{value.Name}");
        }
        foreach(var field in fields.EnumerateObject())if(!field.Name.EndsWith('?')&&!seen.Contains(field.Name))throw new InvalidOperationException($"请求缺少字段：{field.Name}");
        if(type=="attack"&&(!args.TryGetProperty("targetId",out var target)||string.IsNullOrEmpty(target.GetString()))&&(!seen.Contains("x")||!seen.Contains("y")))
            throw new InvalidOperationException("出招必须提供目标或完整目标格。");
        return type;
    }
    internal static string Label(string type)=>Contract.RootElement.GetProperty("commands").GetProperty(type).GetProperty("label").GetString()!;
}
