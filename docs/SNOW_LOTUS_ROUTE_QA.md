# Cloudpeak: one normal Snow Lotus route, no harvest

Base `dbb01d88b8254e0362e9f892b0147873ac286b41`, initially clean; same original workspace/branch/sole writer. This batch delivers actual missing display copy plus one bounded normal route. **Snow Lotus was not obtained.** No combat, reroll, alternate cave, NPC interaction, other ingredients, treatment, core change, merge or deployment.

## Real copy gaps delivered

New `chapter-snow-lotus.json`:

- Two previously raw-Chinese small maps: **Cloudpeak — Snow Trail / 云冠山·雪路** (`昆仑山山路1`) and **Cloudpeak — Sheltered Cave / 云冠山·避风洞** (`昆仑山山洞1`), with brief neutral descriptions.
- Original mountain-entry description, cave-ahead cue and both return captions receive natural English/matching fantasy Chinese. The already translated parent **Cloudpeak / 云冠山** name/description is reused without a second owner.
- The already displayed **Nezha / 哪吒** keeps that identity; only the old Ming-cult NPC caption becomes sheltering from the wind. His own story is neither rewritten nor clicked, and cast/portraits are unchanged.
- One existing collection line becomes **“Snow Lotus. Let's keep it safe.”** / “雪莲花。先好好收着。” It is valid before or after meeting the physician and adds no quest prerequisite. The actual collection command remains `item('雪莲花', 1)`.

No new map, route, monster, texture, icon, sound, actor decision, item effect or medicine quantity. The generic existing Snow Lotus quest-item description is reused. Three other caves and the wider Cloudpeak story are not claimed localized.

## Frozen original rules

One line / **two original steps**, same hero speaker and exact +1 command. Original runtime source SHA remains **`c348d1bc161dbe3a9f9a321232526da75b8d3c7638db7fb2b089d30981e9bcd3`**. All other1886 story bodies, native definitions/maps/items/battles/achievements and cast remain exact.

Snow Trail right turn retains first-priority **5% `雪山中等级2_战斗`**. Otherwise the70% cave cue and `true` fallback both lead to cave1. The plant retains **`true && chance(0.5)` / once**, keyed to the original map/location/event. No successful-harvest guarantee, new cave shortcut, hint to a different branch, probability change or compensation grant.

## One actual route and allowed stop

Protected original: `hippocrates-victory-recovery-complete-save.json`, **76917B**, SHA **`5e34e7627d4711eeef473b26d391aaf1eef6a4f504e7ac45797f4bf943e57894`**,13 members/306 silver/all three materials0, normal difficulty, physician map. Copied intact before work under `backups/pre-snow-lotus-dbb01d8/`, together with prior bilingual packs/cast/registration and bytes/SHA manifest.

Used a new isolated cloud headless Chromium390×844 mouse context, **not a physical phone or local Mac**. Normal file import and visible controls; runtime calls only read `state`. No manipulated clock, flag, RNG, party, equipment, skill, money or inventory. Normal Save/export at import confirmed serialized game/profile/wonBattles equal to the original. A separate full candidate was saved at the mountain foot before the risky trail.

Actual path:

1. Healer's House → Crossroads → world → Cloudpeak → Snow Trail, all native `map` actions and expected maps.
2. **Right-click count1**, no random encounter; arrived at the original first cave.
3. Cave's actual available locations were **Nezha** and **Back** only. The Snow Lotus entry did not appear under its original50% condition.
4. **Harvest-click count0 / harvestTriggered=false.** Stopped immediately, retained state/storage/screenshot. No save/reload at this stop to redraw the event, no second cave, no return/re-entry, no Nezha click and no fight.

Both newly titled maps and relevant navigation were actually displayed. Cave title wrapped cleanly to two lines at390px; sampled route/cave had no document/modal horizontal overflow. Images were viewed. No Chinese/320px DOM/touch/phone checks. The one authored harvest line is **static-only**, never displayed during this visit.

## Resources and persistence boundaries

Actual final read-only world snapshot: cave1, **same13 people,306 silver, identical inventory and displayed party records** as the imported source. Snow Lotus/Ancient Reserve/Mountain Ginseng remain **0/0/0**. No growth, rewards, new companion or old-item consumption. Normal travel advanced the in-game clock; no manual time or15-day cure advancement.

The independent full candidate is **before the trail**, at `昆仑山` / Cloudpeak, Year1/month5/day18 You, with the original resources. It is not a saved cave arrival or a harvested continuation. Boundary browser storage and a read-only cave snapshot preserve evidence; they do not prove the cave can be resumed at the same RNG state. The original physician file stays byte-identical.

**Harvest reward/once completion and Save/Load after a harvest are NOT_RUN** because no material was acquired. No replacement test or fabricated successful save was created. The harness report is `passed:true` for respecting the one-visit boundary and seven checks; it is explicitly **not a successful item-collection report or treatment progress**.

## Necessary verification and first fixture correction

One content build:162 maps/1887 segments. TypeScript/Vite frontend build passed once so the actual preview used this copy; unchanged external runtime-loader/large-chunk notices remain. No .NET rebuild, full-site regression or old fight/rejection test repeated.

One Python frozen audit passed: exact original line count/command,5%/50%/once/priority, all other story bodies/rules/cast/source save, and only two map-category display changes. Bilingual projection checks pass for the root/selected maps, exit/cue labels, existing item and Nezha names, unchanged event behavior and source inputs.

First projection fixture incorrectly demanded raw common description `返回大地图` already be English after content projection. The actual UI applies the existing generic `translateUiText` layer, which returns **Back to the Story Roads**. Corrected only the fixture to include that existing layer; preserved the first failure. No generic navigation product change was made for that assertion. No further product change after the actual one-visit result, hence no rerun.

Actual one-visit report has **seven checks**, no console/page errors, failed requests or HTTP failures. No unsupported battle controller or hidden action. Existing source snapshot comparisons were performed offline after closing, without another runtime draw.

Ignored evidence under `src/Game.Web/test-results/`:

| Artifact | Bytes | SHA-256 |
| --- | ---: | --- |
| `snow-lotus-frozen-audit.json` |1394|`06696c27d8589e586d22d98df04445836fa4f9dd77acf99569adca0d4718bfb9`|
| `snow-lotus-projection-audit.json` |4882|`cada43394c26d96ca0ff29c9410d2eee00f680d434029622cbfb566be73c419a`|
| `snow-lotus-once.json` |828693|`4ebdf2ac740d8e725bfb8eef5f44c149becb768797bc028f8b888889284cae31`|
| `snow-lotus-once-before-trail-save.json` |76888|`fbdeed712bde37e541f573056a520d520bd2a85b973eac388d3e72b888773e7e`|
| `snow-lotus-once-boundary-storage.json` |175190|`dd64614d3d36b000112471ff64564a7bcd90f5acc153a11438ded1ea2c7c39b4`|

## Remaining

Actual screenshots also show the existing first-screen objective **The old duel needs investigating** while traveling for materials. That panel did not become a Snow Lotus step. Its selection/priority has not been diagnosed here; no new quest, objective rule or automatic pin change was added. This is a recorded presentation follow-up, not another claimed fix.

NOT_RUN: actual harvest dialogue/reward, harvested once-key, post-harvest Save/Load, random-battle stop case, other caves, Nezha, other materials, physician treatment/cure and Chinese/320px/physical-phone displays. Nothing here starts the nine-battle ginseng line or chooses a companion-leave result. Earlier France/Italy/cultivation wins, old saves/failures/interruption and unknown Musashi ActionSkipped reasons are retained.

This batch stops at the original probability boundary. No software failure justifies retrying this draw; a later normal visit would need its own bounded scope and cannot be reported as a rerun that made this attempt pass. Candidate branch only, no merge/deployment/new PR or retry of the existing PR403. Suggested PR: `feat(worlds): localize Cloudpeak snow trail and cave`. Description: “Localize two existing map displays/navigation and the original one-line Snow Lotus pickup, preserving all probabilities, once conditions and +1 reward. Content/frontend builds and targeted bilingual checks pass. One normal right turn reached cave1 without combat; the50% plant entry was absent, so QA stopped without collecting, rerolling or claiming post-harvest recovery.”
