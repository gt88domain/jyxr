# Browser runtime

This host compiles the existing C# domain, content, application and presentation libraries for browser WebAssembly. Combat runs through `BattleService`, `BattleEngine`, and the existing AI; JavaScript renders snapshots and stores opaque save strings.

## Build and validate

```bash
source /workspace/.cloud-setup-jyxr/env.sh
dotnet workload install wasm-tools --skip-manifest-update
python3 src/Game.Web.Runtime/scripts/verify-wasm-workload.py
dotnet build src/Game.Web.Runtime/Game.Web.Runtime.csproj
dotnet publish src/Game.Web.Runtime/Game.Web.Runtime.csproj -c Debug
dotnet run --project src/Game.Web.Runtime/Smoke/Smoke.csproj
```

The SDK 10 development bundle is `bin/Debug/net10.0/wwwroot/_framework/`; the complete published static bundle is `bin/Debug/net10.0/publish/wwwroot/_framework/`. Copy the chosen `_framework` directory into the web app's `public/runtime/`. Hot reload is explicitly disabled because the host is served by Vite without the .NET development server. SDK 10 inlines its boot configuration into `dotnet.js`. The development bundle is approximately 40 MB before HTTP compression; this build deliberately preserves reflection metadata required by content loading and expression command registration. Release size, trimming and AOT remain separate measurements.

The verification helper checks all eight installed WASM workload pack archive groups under `$DOTNET_ROOT/packs` plus the SDK pack under `$DOTNET_ROOT/library-packs`; the current pinned SDK retains nine archives. It fails on a missing archive or any failed signature verification and never changes NuGet trust settings. Run it immediately after installation and before using workload artifacts. Certificate revocation servers may produce network warnings; retain those diagnostics in setup logs. If copying a regenerated runtime while Vite is running produces HTML responses for existing WASM files, restart the development server to refresh its public-file index.

## JavaScript contract

```js
const { dotnet } = await import('/runtime/_framework/dotnet.js');
const runtime = await dotnet.create();
const exports = await runtime.getAssemblyExports('Game.Web.Runtime');
const api = exports.Game.Web.Runtime.BrowserBridge;
const initial = JSON.parse(api.Initialize(contentJson));
const next = JSON.parse(await api.Dispatch(JSON.stringify({type: 'createCharacter', name: '小虾米'})));
```

Exports:

- `Initialize(contentJson): string` loads a `ContentPackage` plus v3 `storyScripts` objects and returns a snapshot.
- `Dispatch(commandJson): Promise<string>` executes one command and returns `{ok,error,state}`.
- `ExportSave(): string` returns an opaque versioned browser save containing the existing `SaveGame` and `GameProfileRecord`. A pending conversation or unfinished battle returns an error object instead.
- `ImportSave(saveJson): string` validates into a candidate session before replacing the current one. It returns a snapshot. Existing raw `SaveGame` JSON is also accepted.
- `Ping(): string` reports host availability.

Commands:

| type | Fields and behavior |
| --- | --- |
| `createCharacter` | `name`, optional existing `GameDifficulty` enum name; uses the real `主角` definition and begins `新手村_出生`. Opening attribute questions are not yet migrated. |
| `interact` / `talk` | `locationId`: `南贤`, `武师`, `南贤居`, or `小村`; the first two invoke migrated original stories, the latter two navigate existing maps. |
| `next` | Acknowledge pending dialogue or suggestion. |
| `choose` | `index`: the opaque index provided in `state.choices`; original trainer choices and conditions run through `StoryService`. |
| `startTraining` | Only in `小村`; runs the original `新手村_武师7` branch before its real battle. |
| `move` | `x`,`y`, validated by the domain engine. |
| `attack` | `skillId`, and either `targetId` or `x`,`y`; the engine validates costs/range/targets, finishes the action and advances enemy AI. |
| `rest` / `defend` | Executes the domain rest command and enemy turns. |
| `autoTurn` / `advance` | Runs the existing battle AI for one player action and advances enemy turns. |
| `leaveBattle` | After outcome settlement, returns to the suspended original story. |
| `enterMap` | `mapId`, an existing map definition. |
| `playStory` | `storyId`, an existing migrated story segment. |
| `state` | Read current snapshot. |

Snapshots include `phase`, `hero`, `silver`, `inventory`, `map`, `battle`, `dialogue`, `choices`, and `logs`. Battle includes the real grid dimensions, unit positions and resources, current actor, skill availability and reachable positions. The 14 migrated opening/trainer segments and their actual rewards/choices/battle branches are executable; other map interactions report an explicit migration gap. Map event selection, other services and the full world are not implemented in this slice.

The legacy random equipment affix-count distribution is preserved from `jyx-legacy-dll/JyGame/Item.cs` `Generate(bool)`: conditional chances 0.1, then 0.2, then 0.4, else yield unconditional weights 100/180/288/432 for counts 4/3/2/1.
