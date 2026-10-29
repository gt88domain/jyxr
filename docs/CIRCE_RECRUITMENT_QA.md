# Circe and Musashi: original sanctuary recruitment

Base `98d9e56da243d0cdd1a6f3cd29ed4fa201f6ad52`, initially clean. Same original workspace, branch and sole source writer. Protected the genuine194-silver source and independent242-silver cave-victory source before writing. No replay of the sword fight, merging, deployment, new PR or art.

## New writing: two scenes / eight bilingual slots

`chapter-circe-recruitment.json` owns `笑傲江湖_蓝凤凰1` (one greeting) and `笑傲江湖_蓝凤凰2` (seven recruitment lines), preserving **ten original steps**. These were still original Chinese before this batch.

Circe notices Musashi's shortness of breath, following the already adapted mountain introduction. The exchange uses her playful confidence and his dry humor: a potion might be parried, unless offered sensibly. It removes the old sexual invitation and affectionate Chinese nicknames. The final line names the existing physician/location, offers to accompany the party and identifies the actual tome award. It does not promise an immediate cure, automatic spell learning or an added fetch quest.

The referenced healer already has proposed identity **Hippocrates / 希波克拉底**, actor `actor-4f778e8cfbb8`, figure `gr.hippocrates`. Reused it and added only the corresponding original-ID speaker display; `平一指居` stays **Healer's House / 医师居所**. Circe remains proposed `gr.circe` / `actor-7aede0e7a7da`; Musashi remains locked `jp.miyamoto-musashi`. Cast metadata, countries, forms and locks are unchanged. These historical/mythic figures have original fantasy dialogue, not alleged historical quotations or modern-film lines. The physician's own scenes remain unadapted and unvisited.

The gift name is the already used **Viper's Hex Tome / 蝰蛇咒术法术书**, ID `毒龙鞭法秘籍`; its spell stays `毒龙鞭法` / Viper's Hex in the existing arcane family. No rename to Scroll, new spell category, item effect, learning condition or skill parameter is introduced. Possession does not select a study guide or train the hero automatically.

## Original entry and commands retained

Sanctuary `五毒教`, location `蓝凤凰`:

1. First event is once-only `story('笑傲江湖_蓝凤凰2')` when **one of the four original Musashi forms is in the party and Circe is not**. Original form IDs: `不败令狐冲`, `令狐冲`, `黑木崖超级令狐冲`, `松鼠令狐冲`.
2. Second event is the greeting `story('笑傲江湖_蓝凤凰1')` when **none of those forms is in the party and Circe is not**. Its original repeat behavior is unchanged; it is not an unconditional fallback.

The recruitment scene still ends with exactly **`join('蓝凤凰')` then `item('毒龙鞭法秘籍', 1)`**. No choice, combat, morality, silver payment, consumption, healing, stat change, map jump or new quest command. Cave `返回` keeps its direct `map('五毒教')` return, with no route reroll.

Read `PartyService.Join`, `Party.AddCharacter` and its pool behavior rather than inventing a limit or emptying the roster. The actual host appended Circe normally; no one was benched, reordered, removed or reassigned to force room. This proves the observed12-person outcome, not a global maximum or the number allowed in a particular battle.

## One actual bounded QA path

Normal imported source: `serpent-sanctuary-once-victory-restored-save.json`,73946B, SHA `fc13b9afffd059b40d45ae4e12d97e432d30b7972c74147baf7a0f605c8c8a01`. Normal difficulty,242 silver,11 members including Musashi, no Circe, cave map, original sword/title already earned. New isolated cloud headless Chromium390×844 mouse context; not a physical phone. All changes used normal visible UI; runtime dispatch was read-only `state`.

Actual journey: import intact → normal Save/export comparison → **Back once** → sanctuary → save before recruitment → **Circe once** → seven exact English lines → original JOIN/tome → view Circe's actual party card → normal Save → reload/Load → export. No fights, time edits, probability retries, learning, purchases, resource use, other interaction or manual changes to a save.

| Actual data | Before | After / normal Load |
| --- | --- | --- |
| Map | Serpent Cavern | Venom Circle Sanctuary |
| Silver | 242 | 242 |
| Party / full roster | 11 /11 | 12 /12 |
| Circe | Not recruited | Party order12, level10, Health800/800 |
| Viper's Hex Tome | 0 | 1 |
| Venom Circle Token | 1 | 1 |
| Serpent-Gold Sword | 1 | 1 |
| Clock | Year1/month5/day13 Si | Same day Wei |

Existing11 character records, equipment, skills, experience, inventory entries, party order, reserves/followers, world-trigger state, profile and won-battle list remain exact. The only new completed scene is `笑傲江湖_蓝凤凰2`. The native clock advances normally; it is not frozen or edited. The tome adds one inventory entry; it is not consumed or selected for study. After Load, Circe and tome remain, and her once-only sanctuary entry no longer appears. No second click or duplicate-award test.

Serialized **`game`, `profile`, `wonBattles`** match between the actual joined export and recovered export. Complete file bytes differ in presentation bookkeeping, so byte equality is not claimed. Existing current-Health/Energy map-entry restoration remains unchanged and is not exact live-vitals continuation.

## Necessary checks

- One content build passed:162 maps/1887 segments. One TypeScript/Vite frontend build passed so the preview used this text. Existing external runtime-loader/large-chunk notices remain. No .NET rebuild or unrelated/full-suite rerun.
- One Python frozen audit: precisely these two scene bodies change; eight slots/ten positions, original conditions/fallback/once priority, JOIN/item order, raw definitions/maps/achievements, all other story bodies and both genuine sources/cast remain exact. Original source SHA `c348d1bc161dbe3a9f9a321232526da75b8d3c7638db7fb2b089d30981e9bcd3` unchanged.
- One bilingual projection audit: eight lines, locked Musashi and existing Circe/Hippocrates names, exact tome and Healer's House references, original IDs/input objects preserved.
- One real browser attempt **passed,11 checks**, with no console/page errors, failed requests or HTTP errors. Actual seven-line English display, last-line readability, roster card, original reward and normal Save/Load passed first run. The final paragraph measured252px width/scrollWidth and118px height/scrollHeight; no clipping or horizontal overflow. Actual party card has English name and normal Gear/Mastery/Study controls. Screenshots independently viewed.

No first failure in this batch. Previous sword-controller field-name failure and independent successful export verification remain exactly as reported; no rewriting that historical report to green and no repeat sword fight.

Backups are in `src/Game.Web/test-results/backups/pre-circe-recruitment-98d9e56/` with original scenes, prior bilingual packs, registration/cast and both real saves, plus byte/SHA manifest.194-silver source remains73000B SHA `a0689799c943503d71577b9bae10c782a8a28c8f9fccee9217f3e0975c3993f3`;242-silver source retains the SHA above. The new12-person continuation is independent, not an overwritten official/player save. Ignored local artifacts:

| Artifact under `src/Game.Web/test-results/` | Bytes | SHA-256 |
| --- | ---: | --- |
| `circe-recruitment-frozen-audit.json` |1733|`1e8ad304dc26387b15a2342dc1a2947c1576d283cc2d6d8ac59e1ef6a731c08d`|
| `circe-recruitment-projection-audit.json` |1170|`ae2d5b1bd053117f4decc0b23f4fdd990e7c6fcbdd89574de3fe033b99981e62`|
| `circe-recruitment-once.json` |417768|`03b0543870408420e74ed67d1e5373444c7e4de18062250dac79345c789b6660`|
| `circe-recruitment-once-joined-save.json` |75163|`b430b6638e37769ee54963be5ff19b43135c539bfc23189e06eb1b8ad77a48ea`|
| `circe-recruitment-once-complete-save.json` |75163|`5d1620d5d0aeaf1c706bc5837287828a712baf9bc113bf4f1a3bb99357c22c73`|

## Remaining / next concrete boundary

NOT_RUN: no-Musashi greeting, other Musashi forms, a hypothetical genuinely blocked roster, physician visit/treatment, tome study/combat, Chinese/320px DOM and physical phone. This is one normal recruitment, not all forms, a cure or whole-game completion. Older Denmark/Arthur failures, mountain interruption, unmet later routes and original artwork remain.

Read-only next-entry check: `平一指居` / `平一指` has original prioritized treatment, reminder, consultation and greeting events. With Musashi and Circe but no physician or ingredients, the initial consultation candidate is `笑傲江湖_平一指2`: **21 dialogue slots /24 steps**, original journal then physician JOIN, **immediate `平一指_战斗` with fatal loss/timeout**. It is not a harmless seven-line extension. Treatment separately requires the physician in the party and three original items; no such items or flags were granted. The consultation, its direct results, identity context and actual route must be checked before any visit; this batch did not travel there or begin it. No automatic follow-through into the battle.

Candidate branch only; no new PR/merge/deployment. Suggested PR: `feat(worlds): adapt Circe recruitment with normal roster verification`. Body: “Rewrite two original sanctuary scenes/eight bilingual lines for Circe and Musashi, with the existing Hippocrates/Healer's House and Viper's Hex Tome names. Preserve ten steps, original form/no-Circe gates, JOIN/item order and all rules. Content/frontend builds and targeted frozen/projection checks pass; one isolated normal242-silver journey recruits Circe as12th member and preserves the tome through Save/Load. Greeting/other forms/treatment remain untested.” Prior GraphQL Forbidden is not retried.
