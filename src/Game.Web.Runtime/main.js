import { dotnet } from './_framework/dotnet.js';

const runtime = await dotnet.create();
const config = runtime.getConfig();
const exports = await runtime.getAssemblyExports(config.mainAssemblyName);
globalThis.jyxrRuntime = { runtime, api: exports.Game.Web.Runtime.BrowserBridge };
console.log(exports.Game.Web.Runtime.BrowserBridge.Ping());
