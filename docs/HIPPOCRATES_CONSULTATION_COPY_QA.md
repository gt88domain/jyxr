# Hippocrates consultation: text and original battle boundary

Base `674a875519eb4085b04d5295c93ef9546870244b`, initially clean. Same original workspace, branch and sole writer. **Content-only batch: no travel, physician interaction, battle, JOIN, materials, treatment or Save/Load.** Previous Circe recruitment and sword fight were not repeated. No merge, deployment, new PR or art.

## Delivered: four scenes /28 new bilingual slots

`chapter-hippocrates-consultation.json` adapts the complete consultation plus its directly related greeting, reminder and treatment prelude:

| Original scene | Dialogue slots | Original steps / direct result |
| --- | ---: | --- |
| `笑傲江湖_平一指1` |1|1; ordinary greeting |
| `笑傲江湖_平一指2` |21|24; journal, physician JOIN, immediate battle |
| `笑傲江湖_平一指3` |2|2; supplies reminder |
| `笑傲江湖_平一指治疗` |4|5; original jump to the cure scene |

**32 original steps / four non-dialogue steps** stay at their exact positions. The immediate battle victory has no extra authored aftermath: its original result simply returns to the physician map. No new victory dialogue, items, healing or diagnosis reward is invented.

Hippocrates is an observant, dry physician rather than the old “heal one, kill one” persona. Circe teases Musashi's unsuccessful duel with his own lungs; his replies continue the already adapted practice-dummy/breathing premise. The clinician distinguishes temporary battlefield assistance from a cure. Benkei interrupts with suspicion of Circe's magic; the hero objects that a consultation has somehow become a fight. These are original fantasy exchanges using existing public-domain/historical candidates, not historical quotations or modern-film dialogue.

Hippocrates, Circe and locked Musashi retain their existing identities. Source `费彬` reuses proposed **Benkei / 武藏坊弁庆**;14 repeated `嵩山弟子` display generic **Temple Guard / 寺院守卫**, without assigning14 unique people. Cast metadata/forms/locks remain byte-identical. The cure's existing proposed Tomoe identity is not rewritten or locked in this batch.

Existing **Healer's House / 医师居所** gains a neutral herb-filled description, matching physician/entry/return labels and a clear pre-consultation battle warning. The battle has a display title. Existing **Lingering Cough** text is clarified in its established owner `chapter-equipment-copy.json`, with Chinese `久咳`; no duplicate definition owner remains. All internal names/IDs, map pictures and native definitions are unchanged.

## Three actual inventory gates, fourth narrative component

The original consultation and raw journal mention four old material names. The **actual first-priority treatment condition** is:

- One of the four original Musashi forms in the party;
- Circe and Hippocrates in the party;
- `雪莲花`×1, `万年醉`×1, `长白人参`×1.

The existing displays are **Snow Lotus / 雪莲花**, **Ancient Reserve / 陈年佳酿**, **Mountain Ginseng / 高山人参**. `万年冰蚕` is **not an item definition or entry condition** in this source; the untouched later cure scene supplies its narrative answer through another character. It now reads **Frostsilk / 霜蚕丝** as a story component. No new inventory item, fourth collection gate or acquisition route was created.

Consultation, reminder, prelude and displayed journal consistently ask the player to bring the three real supplies, keep the three required companions, and then discuss the remaining component. The raw original `journal(...)` command stays exact; only its full displayed text is translated. The prelude still jumps to `笑傲江湖_平一指治好`, rather than granting a cure or silently skipping it. No material removal, stock deduction or item grant is added: original quantities/conditions are frozen.

**The downstream cure scene is deliberately untouched:35 original dialogue slots /45 steps.** Its Tomoe exchange, JOIN,15-day advance, talent removal,40 points, Sword+30, max Health/Energy+1000 each, original skill-level cap and journals remain exactly as before, including untranslated prose. Neither its numerical growth nor any part of it ran. This batch is not a completed treatment storyline.

## Precise cough assistance

Read the original talent parameters and `IllnessBattleEffectHandler`, without running or changing the core:

- BeforeActionStart,40% chance of losing the action to coughing;
- A **living same-team deployed unit** whose character definition ID is `平一指`, with **Health≥2**, prevents this cough skip;
- Merely joining the traveling party does not provide this protection;
- This is neither permanent talent removal nor immunity to other action-skipping effects, and2 Health is a threshold, not a payment or damage cost.

Both languages and the consultation now state these limits. The original talent ID/affix/timing/priority/parameters remain exact. Existing English already stated40% and2 Health; this batch names Hippocrates, explicitly distinguishes deployment and supplies accurate Chinese. No illness balance, healing, range, AI or action-order code changes.

## Original entry priority and immediate battle

`平一指居` / `平一指` retains this original order:

1. Once-only treatment, when all original companions and three inventory gates hold.
2. Reminder after consultation completion, until cure completion.
3. Once-only initial consultation with Musashi/Circe, before reminder/cure flags.
4. Ordinary `true` greeting.

In consultation, using zero-based step indices, raw journal remains at12, **JOIN at19**, three final lines at20–22, then **battle at23**. There is no interposed menu, preparation pause, manual-deployment selection or friendly practice. We did not insert one.

| Original battle fact | Preserved source value |
| --- | --- |
| ID | `平一指_战斗` |
| Required IDs | `主角`, `令狐冲` (native selector reserves required IDs actually active) |
| Ally slots | Four, original party indices0–3 and positions |
| Enemies | Benkei×1 plus Temple Guard×14;15 fixed enemies |
| Source Benkei | Level17, Health2500, Energy1500, two original rank10 skills |
| Source guard | Level7, Health500, Energy500, original rank10 sword skill |
| Random participants | None |
| Win | `map('平一指居')` |
| Lose / timeout | `legacy_flow('gameover')` |

Read `BattleService.SelectDefaultCombatants`: reserve active required members, fill remaining four places in current party order, and preserve that order. From the **real protected12-person242-silver file**, the source-based expected deployment is **Rowan14, Pinocchio15, D'Artagnan17, Miyamoto Musashi11** (`主角/袁冠南/陈家洛/令狐冲`). These are the saved levels, not a live preflight. The newly joined physician would be13th member; he and Circe would not automatically be among these four. Accordingly no line promises cough protection in this immediate battle. No roster was cleared, benched or reordered to force it.

## Necessary validation / first failures

Final content build passed:162 maps/1887 segments. One targeted Python frozen-flow audit and one bilingual projection audit passed after the corrections below. No frontend/.NET build, browser, DOM viewport, combat/controller, material collection, live lineup, treatment/growth or saved-state mutation in this content-only batch. An actual preview must be refreshed/built before future display verification; the earlier Circe browser run cannot validate this new text.

The frozen audit checks exactly four changed story bodies,28 slots/32 positions, exact journal/JOIN/battle/jump, all native event priorities/material gates, four ally slots/15 enemies/fatal outcomes, original cough parameters, every raw definition/map/achievement and all other scenes, including the untouched cure. The scoped talent catalog change is only `令狐冲的怪病`. Three protected genuine saves and cast remain byte-identical. Original raw source SHA stays `c348d1bc161dbe3a9f9a321232526da75b8d3c7638db7fb2b089d30981e9bcd3`.

Projection fixtures check28 authored lines, five speaking identities plus saved Rowan, map/entry warning/return, all native events, battle/enemy names, three actual item labels, original affixes and exact displayed journal. English journal uses the existing `translateUiText` helper; Chinese journal is dictionary-checked, not a DOM claim. No CJK in the sampled English lines; no fixture injected a quest or title.

First failures remain:

- The first content build correctly rejected duplicate ownership of the cough display because it was initially added to the new chapter. Removed that duplicate and updated only the existing owner's three display fields, preserving its original file. Final content build passed. **Compiler behavior was not weakened.**
- The first frozen-audit assertion assumed every current scoped talent key existed in the old category and raised a KeyError. Corrected only the QA comparison to use the union of old/new keys; all rule checks had already passed. Bilingual audit pair then passed. No fake browser win or product-rule change.

Backup directory `src/Game.Web/test-results/backups/pre-hippocrates-consultation-674a875/` retains prior packs, original five-scene graph, cast/registration, old talent owner and genuine194/242 files, with byte/SHA manifest. Ignored local evidence:

| Artifact under `src/Game.Web/test-results/` | Bytes | SHA-256 |
| --- | ---: | --- |
| `hippocrates-consultation-frozen-audit.json` |7283|`d274077b02c23b16d0ac6564540e50c9c7c91d2919417a1fb719971364afd73d`|
| `hippocrates-consultation-projection-audit.json` |3940|`1bf9d2108a73517cf6bb578b73c4f7ae550224cba7714e3b17f5a425f735eac6`|
| `hippocrates-consultation-first-content-build.log` |2075|`0bf10cda7a1e852853c283d9810d720b4a99a3ad0b768262c7d94cdc2e460f2e`|
| `backups/pre-hippocrates-consultation-674a875/original-physician-chain.json` |11155|`71d9df3ea21c2a58f46f44f703077b0d1ad6c17c78691f1776bbd4a8f8f09862`|

Latest genuine continuation remains **75163B**, SHA `5d1620d5d0aeaf1c706bc5837287828a712baf9bc113bf4f1a3bb99357c22c73`,12 members/242 silver, sanctuary. Three required treatment items each have quantity0; no physician record or initial-consultation/reminder/cure flags. Original194 and11-person242 sources remain untouched. Old wins/failures/interruption reports and art are retained.

## Proposed single future QA boundary, NOT_RUN

This is a concrete plan for a separately authorized attempt, not an executed journey:

1. Build/serve current copy, import the protected12-person file into an isolated browser. Back from sanctuary → Fjordhaven → world map → Crossroads → Healer's House, using only actually available native entries. World Crossroads has earlier urgent/other-story conditions; their prerequisite flags are absent in this file, but verify the actual host before each click and stop on anything unexpected.
2. Save/export before the physician. Verify the actual initial-consultation event, then show the21 lines and native physician JOIN. Do not click through under the assumption that no battle follows. No materials, flags, time edits, shopping, practice or forced party changes.
3. At the single live battle, verify actual four deployed units,15 enemies and fresh host skills/targets/reachable/action state before any controller action. Source projections above are not live evidence. If tools cannot perform legal actions, retain interruption instead of calling it defeat or balance failure.
4. If won, verify only the original map return, journal, physician membership/native battle settlement and normal Save/Load; stop before another consultation/treatment. If lost/timed out, retain the result and use normal Load of the protected pre-consultation checkpoint, recording independent device-profile changes. No retry or guarantee of victory.

An alternative unblocked content batch is the still-Chinese35-slot cure scene with existing Tomoe, keeping its original45 steps and growth. No ingredient injection or endgame/time advance is authorized by writing it. Whole-game completion is not asserted.

Candidate branch only. Suggested PR: `feat(worlds): adapt physician consultation and clarify deployment`. Body: “Adapt four physician scenes/28 bilingual slots plus journal, entry warning and accurate cough assistance display. Preserve32 steps, original physician JOIN followed by a four-person fatal battle, three-material gates, all outcomes and untouched cure growth. Final content build and targeted bilingual frozen/projection checks pass; all gameplay remains NOT_RUN. Retain first ownership/audit failures and protected12-person source.” Prior PR GraphQL Forbidden is not retried.
