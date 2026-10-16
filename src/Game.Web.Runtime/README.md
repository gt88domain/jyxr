# Browser runtime

## Original management and challenge flows

`selectCharacter {characterId}` changes only the viewed character; it does not
advance time, reroll map events or check world triggers. `managedCharacter` and
`roster` expose the selected sheet and actual placements. Equipment, skill and
cultivation commands act on that selected active member. `allocateStat` accepts
only the ten base attributes and real available stat points. `setPartyPlacement`
can bench active companions or recall player-benched companions; story followers
and story departures remain locked. Narrative departures return equipment and
invalidate player recall, including when a character was already on the bench.

`chestDeposit` / `chestWithdraw` use ChestService at the configured original inn
or during its actual `chest()` interaction. They preserve quantities, capacity,
quest restrictions and equipment identity; assigned manuals cannot be removed.
`closeChest` completes the pending original map interaction.

Special flows call the existing SpecialBattleService and EquipmentRefinementService.
`combatantSelection` awaits `selectCombatants {characterIds}` and enforces slots,
required characters, distinct IDs and stage exclusions. Arena, tower, trial and
Zhenlong requests retain their actual request types during battle construction
and settlement. `renameHeroine {name}` completes the original name prompt.

Version-2 save wrappers additionally carry optional `companionCultivations` and
`formationReserveIds`. Imports validate ownership, learned skills, manual copy
counts and actual reserve placement before replacing a running session. Older
wrappers default these fields to empty; no rewards or recall eligibility are
invented for existing saves.

```sh
dotnet run --project src/Game.Web.Runtime/Smoke/Smoke.csproj -- --management src/Game.Web/public/data/content-package.json src/Game.Web/test-results/management-save.json
dotnet run --project src/Game.Web.Runtime/Smoke/Smoke.csproj -- --special src/Game.Web/public/data/content-package.json src/Game.Web/test-results/management-save.json
```

The first test creates an isolated money/item fixture, then uses actual original
training, recruitment, character services, chest transactions and combat. Special
tests distinguish original encounter outcomes from controlled wooden-dummy
opponents used to guarantee victory-branch coverage. These are adapter/state
checks, not proof of original boss difficulty or a complete campaign clear.

This host compiles the existing C# domain, content, application and presentation libraries for browser WebAssembly. Combat runs through `BattleService`, `BattleEngine`, and the existing AI; JavaScript renders snapshots and stores opaque save strings.

## Build and validate

```bash
source /workspace/.cloud-setup-jyxr/env.sh
dotnet workload install wasm-tools --skip-manifest-update
python3 src/Game.Web.Runtime/scripts/verify-wasm-workload.py
dotnet build src/Game.Web.Runtime/Game.Web.Runtime.csproj
dotnet publish src/Game.Web.Runtime/Game.Web.Runtime.csproj -c Debug
dotnet run --project src/Game.Web.Runtime/Smoke/Smoke.csproj
dotnet run --project src/Game.Web.Runtime/Smoke/Smoke.csproj -- --packs src/Game.Web/public/data/packs/jyx/content-package.json src/Game.Web/public/data/packs/frontier/content-package.json
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

- `Initialize(contentJson): string` validates a `ContentPackage`, v3 `storyScripts`, and its `browser` manifest into a candidate. Only after validation succeeds does it cancel the previous conversation/battle/shop and replace the active pack. An invalid candidate leaves the previous session usable.
- `Dispatch(commandJson): Promise<string>` executes one command and returns `{ok,error,state}`.
- `ExportSave(): string` returns an opaque version-2 browser save containing `packId`, the existing `SaveGame` and `GameProfileRecord`, independent cultivation selection, and settled battle IDs. A pending conversation, shop, story, or unfinished battle returns an error object instead.
- `ImportSave(saveJson): string` validates the pack binding and a candidate session before replacing the current one. Version-1 browser saves and raw `SaveGame` JSON remain supported in the `jyx` pack. They are rejected in `frontier`; a failed import preserves the current session and pending interaction.
- `Ping(): string` reports host availability.

Commands:

| type | Fields and behavior |
| --- | --- |
| `createCharacter` | `name`, optional existing `GameDifficulty` enum name; creates stable instance `主角` from the pack's `heroDefinitionId` and starts `initialMapId` / `initialStoryId`. Opening attribute questions are not yet migrated. |
| `interact` / `talk` | `locationId` from the current snapshot; resolves the current map's eligible event through `MapService`, including conditions, once completion, clock costs, and its actual story/map/shop command. |
| `buy` | `productId`, optional positive `quantity` (default 1); only in the active shop, uses `ShopService.Buy`. |
| `sell` | `entryNumber`, optional positive `quantity` (default 1); only in the active shop, uses `ShopService.Sell` and its half-price rule. |
| `closeShop` | Finishes the suspended shop command and map event. |
| `next` | Acknowledge pending dialogue or suggestion. |
| `choose` | `index`: the opaque index provided in `state.choices`; original trainer choices and conditions run through `StoryService`. |
| `startTraining` | Runs the pack's `trainingStoryId`, only when currently in its configured `trainingMapId`. |
| `move` | `x`,`y`, validated by the domain engine. |
| `attack` | `skillId`, and either `targetId` or `x`,`y`; the engine validates costs/range/targets, finishes the action and advances enemy AI. |
| `rest` / `defend` | Executes the domain rest command and enemy turns. |
| `autoTurn` / `advance` | Runs the existing battle AI for one player action and advances enemy turns. |
| `leaveBattle` | After outcome settlement, returns to the suspended original story. |
| `enterMap` | `mapId`, an existing map definition. |
| `playStory` | `storyId`, an existing migrated story segment. |
| `state` | Read current snapshot. |

Character and inventory commands require the map state, with no pending dialogue or battle. `equipItem {entryNumber}` uses `ItemUseService` to check real requirements and equip through `InventoryService`; `unequipItem {slot}` returns the actual instance to inventory. `setExternalSkillActive {skillId,active}`, `equipInternalSkill {skillId}`, and `clearInternalSkill` select existing learned abilities through the domain/application APIs. `useItem {entryNumber,targetId?}` uses the existing item service outside combat or `BattleEngine.UseItem` for consumables in battle; inventory is consumed only after successful execution. Unsupported story items and out-of-battle consumables report the existing limitation.

`setCultivation {entryNumber}` and `clearCultivation` manage an independent selected manual. This browser adapter fills a missing old-game path: `jyx-legacy-dll/JyGame/Role.cs`, `AddExp`, around lines 700–770, gives the skill from equipment slot 4 the same experience as the character. The modern core has only weapon/armor/accessory slots, so the browser save wrapper adds optional `cultivationItemId`. Selection checks `ItemUseService.AnalyzeTarget`, learns level 1 through `CharacterService.StudyInternalSkillFromBook` / `StudyExternalSkillFromBook` if necessary, and never consumes a manual or changes the running internal skill. Winning settlement applies its actual `ExperiencePerMember` once through `SkillExperienceProgression.TryAddExperience`, capped by the manual and global skill maximum. Clearing selection keeps learned skills. The existing `BattleEngine` separately gives use experience to cast skills and the running internal skill; this adapter adds manual training at settlement, not a second cast-experience rule. The original protagonist already knows and runs level-1 基本内功; original opening rewards and starting equipment remain unchanged.

Snapshots now expose real attributes, talents, learned skill progress, all three equipment slots (including empty slots), running internal-skill ID, independent cultivation progress, inventory categories and validated action flags. `battle.targets` lists domain-generated legal cast coordinates, without implying a guaranteed hit. `battle.events` contains sequenced domain facts/cues such as `Moved`, `SkillCast`, `Damaged`, and `Rested`; damage amounts and critical flags come from `BattleFact.Damage`. Old version-1 browser saves without cultivation metadata still load normally. Native smoke validates the original reward/manual battle flow and uses a separate temporary save fixture for actual 木刀 equip/unequip and instance persistence; it never seeds production inventory.

Snapshots include `phase` (including `shop`), `pack`, `hero`, `party`, `objectives`, `shop`, `silver`, `inventory`, `map`, `battle`, `dialogue`, `choices`, and `logs`. Battle includes the real grid dimensions, unit positions and resources, current actor, skill availability and reachable positions. Every team-1 participant can be controlled manually or through the same AI. Party membership comes from the actual `join` story command and `PartyService`; battle definitions determine their available party slots. Equipment and cultivation management target the selected active member; followers and reserves can be inspected but cannot be trained/equipped until legitimately in the active party.

The top-level `browser` manifest has `id` (`jyx` or `frontier`), `title`, `heroDefinitionId`, `initialMapId`, `initialStoryId`, optional training story/map IDs, UI text, `media`, and `objectives`. It is removed before domain content loading. `media.characters` / `portraits` key art by character definition ID, `media.maps` by map ID, and `media.battles` by battle ID, with optional defaults. Snapshot hero/party/units carry resolved `sprite` and `portrait` relative paths; map/battle carry `background`. The browser adds its deployment base path; the rules engine does not know a hosting URL or depend on wuxia names/art.

`objectives` use stable IDs, titles, and `kind` / `target`: completed story ID, party member ID, equipped item ID (or any equipment), selected cultivation item ID (or any), purchased shop ID (or any), and won battle ID. Story, party, equipment, purchase, and cultivation status derive from real session state; won battles are recorded only after victory settlement and preserved in the browser save. This progress does not grant rewards or replace original story conditions. The snapshot exposes each objective's current `completed` state. Optional `save` objectives record a successful save creation/import.

`shop.products` exposes `id,itemId,name,description,price,premiumPrice,remaining,purchased,canBuy`; `shop.sellable` exposes `entryNumber,id,name,quantity,price`. Buying cannot exceed the core's remaining claims; selling does not replenish those claims. All balances, inventory instances, and purchases are stored by the existing save service. Native pack smoke additionally verifies invalid candidate replacement, cancelling a pending old story, cross-pack rejection, legacy-save isolation, shop arithmetic, exhausted stock, and save persistence using an isolated fixture.

The legacy random equipment affix-count distribution is preserved from `jyx-legacy-dll/JyGame/Item.cs` `Generate(bool)`: conditional chances 0.1, then 0.2, then 0.4, else yield unconditional weights 100/180/288/432 for counts 4/3/2/1.

Original `qinggong` and `dianxue` story results now use `IMiniGameRuntimeHost`. `state.miniGame` contains only presentation assets and labels. The separate `MiniGameInput` export accepts `action` (`frame`, `start`, `move`, `hit`, `pause`, `resume`, `quit`) and move coordinates or a spawned target ID/generation. It returns a compact simulation frame, avoiding full map/inventory serialization during animation. A runtime stopwatch supplies elapsed time; no JavaScript score, duration, or reward counts are accepted. `finishMiniGame` succeeds only after collision, the thirty-second limit, or voluntary exit; the suspended Application service then applies the real earned result and original growth/reward dialogues. Unfinished games cannot be saved as complete.

Original scene results `huashan`, `restart`, `nextZhoumu`, `gameFin`, `gameOver`, `mainmenu`, and `tutorial` are translated into actual service/host transitions. Tutorial enters the original world then runs `original_教学开始`, matching GameEngine's scene behavior. The Huashan service runs its original stages and ending branch. `state.ending` suspends completed/failed/restart/next-round flows; optional save-wrapper `ending` restores that same boundary without replaying rewards. Its completed/target rounds are validated before replacing the running session. `beginRoundCreation` is available only at a legitimate restart/next-round boundary. Cancelling previews retains that boundary; confirming uses the existing SessionFlowService while keeping the host bound to the session's services, then starts a new opening.

Creation supports original C# round/trial item tiers; confirmed silver replaces the service's default instead of adding to it. Old party, formation, inventory and cultivation reset, while chest and profile carry. The application retains the equipment factory sequence when cloning the chest so future equipment cannot reuse carried IDs. `legacy_maxlevel` scopes original once-keys by round, preserving old round-one claims. Four original Huashan victories and the True Ending are tested with an isolated high-stat/prerequisite fixture; normal progression and original boss balance are not established by that fixture.

`Game.Presentation.MiniGame.TrainingSimulation` ports the existing Godot host parameters into engine-independent input state, with collision substeps and stale/duplicate target rejection. The browser scales a 1920×1080 logical field and reuses the original four portraits/item icons; no new art is required. Pausing and page hiding stop training time. Tests cover collision/time boundaries, positive/negative and item targets, host-time validation, original fees, persisted monthly cooldowns, and narrow-screen browser input. This does not claim frame-for-frame equivalence with the old Unity minigames.
