using System.Runtime.InteropServices.JavaScript;
using System.Runtime.Versioning;

namespace Game.Web.Runtime;

[SupportedOSPlatform("browser")]
public static partial class BrowserBridge
{
    [JSExport]
    public static string Ping() => "jyxr .NET browser runtime ready";
}

internal static class Program
{
    private static void Main() { }
}
