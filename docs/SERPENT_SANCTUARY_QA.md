# Venom Circle Sanctuary and the Serpent-Gold Sword

Base `7818d0cca6f9c774b325d00facd0142dd87cd863`, initially clean. Same original workspace, branch and sole source writer. No merge, deployment, new PR, new art or runtime rebuild.

## Delivered text and display

New `chapter-serpent-sanctuary.json` owns four source-backed scenes, **eight new bilingual dialogue slots / 12 original steps**:

| Original scene ID | Dialogue slots | Original result |
| --- | ---: | --- |
| `碧血剑_五毒教圣地1` | 1 | Guard refuses access; no grant or invented alternate route |
| `碧血剑_五毒教圣地2` | 4 | Permission conversation, then original inner-forest map command |
| `碧血剑_五毒教金蛇窟` | 2 | Original solo battle; victory jumps to sword scene |
| `碧血剑_五毒教金蛇剑` | 1 | Original sword item and title calls |

The guard recognizes the existing **Venom Circle Token / 毒环会信物**. The hero finds the **Serpent-Gold Sword / 蛇纹金剑** and discovers its wardens. Brief humor comes after victory, without promising extra powers, healing, recruiting or automatic equipment. Ten existing mountain/forest/sanctuary/cavern titles and descriptions receive matching natural English and fantasy Chinese; the existing city remains Fjordhaven. Return labels, the original insect/snake cues, sanctuary entrance/Circe captions, cave battle title and one ID-scoped achievement display are localized. All original map IDs, pictures, links and assets remain.

Circe is the already proposed `蓝凤凰` identity, reused locally without changing cast/lock metadata. Her own dialogue/recruitment is not rewritten or entered here. The fixed fight contains **eight instances of `五毒教圣使`**; their display is the generic **Sanctuary Warden**, rather than eight copies of the proposed mythic identity Taweret. No actor metadata, roster or unique-character assignment changes.

Achievement ID `金蛇传人` displays **The Sanctuary's Secret / 圣所秘藏**, describing the sword discovery. Original achievement metadata, unlock call and profile ID remain exact.

## Full native route and event priority

The route was checked before entry, including higher-priority events, rather than inferred from the Nephthys victory flag:

1. World map → `大理` (Fjordhaven). Its earlier capital-story event requires `鹿鼎记_阿九3`, absent in this genuine source, so the original map fallback applies.
2. Fjordhaven → `五毒教山中1`. The earlier pet event requires `tlbb.dy_闪电貂`, also absent; the normal trail map applies.
3. Mountain trail: **right → ahead → ahead → ahead**, through original maps1–4 to the sanctuary.
4. Sanctuary `五毒教深处`: original `story_completed('碧血剑_何红药胜')` event precedes the `true` refusal fallback. This genuine source has the victory flag. **There is no item-possession check or token-removal command**; none was added. Four dialogue slots lead to forest1.
5. Inner forest: **right → right → right → ahead**, through original maps1–4 to `金蛇窟`.
6. Cave sword location retains its original `true`, `once` event. It begins the fixed battle, not an unguarded pickup.

Each of the eight mountain/forest moves retains a first-priority **5% random battle** (`山中等级0_战斗` or `山中等级2_战斗`). The later 70% cue and fallback both lead to the same next map. Wrong turns and exits are untouched. QA policy was to stop at the first random encounter, not fight or reroll it. **None occurred in this one visit**; this is not a claim that the route is risk-free.

The cave battle retains required hero, **party slot0 alone versus eight original wardens** at their original positions, no random participants. Source wardens are level10, base Health/Energy600, `毒龙鞭法` rank4; these are source definitions, not invented live level displays. Victory alone advances; defeat/timeout still call `legacy_flow('gameover')`. Sword×1 then `legacy_nick('金蛇传人')` remain at their original positions. No choice, spell learning, token consumption, equipment assignment or new money command is added.

## One actual normal QA journey

Imported the protected genuine normal-difficulty **194-silver / 11-person** world-map save into a separate cloud headless Chromium context. Import and every gameplay action used normal visible UI controls; runtime calls were read-only `state`. No edited flags, clock, RNG, party order, equipment, training, purchases or rare-item use. Saved normally before risky steps. No local-browser focus or physical-phone claim.

All ten route transitions selected their original normal map actions. Reached the sanctuary and cave, viewed **seven actual English lines** (four permission, two cave, one victory). The single refusal line was only statically verified. At390×844, actual map titles, navigation and dialogue had no document/modal horizontal overflow; screenshots include the sanctuary and result. Bilingual content/fixture checks cover all ten maps and eight lines. **320px DOM, Chinese DOM and physical phones were not tested in this batch.** Original placeholder pictures are unchanged.

The one original solo battle **won at tick378**, with seven native-confirmed casts, seven legal moves and one Rest. Actual MP changes, host targets/reachable cells and native SkillCast/impact/damage events are retained. No medicines were used. All eight wardens died; the hero ended Health1740/1740, Energy190/1260. This is one existing prepared hero's result, not proof that every build or a fresh untrained hero wins.

| Actual QA data | Before | After |
| --- | ---: | ---: |
| Silver | 194 | 242 |
| Serpent-Gold Sword | 0 | 1 |
| Venom Circle Token | 1 | 1 |
| Party size | 11 | 11 |
| Hero level / cumulative XP | 13 / 2559 | 14 / 2788 |
| Device kills / deaths | 139 / 3 | 147 / 3 |

The48 silver and XP are native battle results, not new story rewards. Existing inventory, consumables, equipment and party remain unchanged; the sword is in the inventory, not automatically equipped. The three newly completed story IDs are precisely the permission, cave and sword scenes. Main-story completion flags and world-trigger state remain unchanged. No Circe conversation, other recruitment, closing world event or downstream plot was entered.

Saved after the actual reward, reloaded through normal Load and exported again. Serialized **`game`, `profile` and `wonBattles` match exactly**, including the sword and real `profile.unlockedAchievementIds` title. Full export bytes differ; live HP/MP are governed by the existing map-entry restoration and are not an exact battle-resume claim. The194-silver original and all earlier failed routes remain untouched. The242-silver continuation is an independent QA file, not a replacement player save.

## Necessary checks and first failures retained

Content build passed:162 maps /1887 story segments. TypeScript and Vite frontend build passed so the actual browser used this new copy; existing external runtime-loader and large-chunk notices remain. No .NET rebuild or unrelated/full-game test rerun.

One targeted Python audit confirms source SHA, original12 steps/eight slots, four exact non-dialogue steps, full map/event priority/5% conditions, solo/eight-enemy lineup, fatal outcome mapping, once reward, original item/title calls, unchanged raw definitions/achievement metadata and every other story body. One bilingual projection audit confirms maps/navigation, speakers, existing item names, generic wardens and scoped title. Original-source SHA stays `c348d1bc161dbe3a9f9a321232526da75b8d3c7638db7fb2b089d30981e9bcd3`.

Two **QA-only** first failures are retained and not described as product bugs:

- The initial projection assertion incorrectly expected a translated event description to equal its raw Chinese text. Raw runtime-map equality had already passed. Corrected the fixture to compare event behavior separately; projection passed. No game rules changed.
- After real victory, reward, Save/Load and exact serialized comparison, the journey controller checked nonexistent `profile.unlockedAchievements` instead of **`unlockedAchievementIds`**. Original `serpent-sanctuary-once.json` remains **`passed:false`** with this TypeError; it is not silently promoted to pass. The controller's field spelling was corrected for future use. **No battle or journey was rerun.** A separate read-only evidence verifier passed against the untouched actual report and both real exports, proving the victory/title/rewards, legal actions, intact supplies/source and serialized recovery. Browser console errors, failed requests and HTTP failures were all empty.

Backups, old packs/cast/registration, original scenes and genuine files are retained under `src/Game.Web/test-results/backups/pre-serpent-sanctuary-7818d0c/` with byte/SHA manifest. Ignored local evidence:

| Artifact under `src/Game.Web/test-results/` | Bytes | SHA-256 |
| --- | ---: | --- |
| `serpent-sanctuary-frozen-audit.json` |2935|`483e1ee02cc260b7eed9efc1f927eb60cc15c91ee4cfbb0e3ec6852ad0213a31`|
| `serpent-sanctuary-projection-audit.json` |17146|`fa0441e4a726f1ef25633a093b7431c8d3ee0075516d2c91acd4d9ab3db80daf`|
| `serpent-sanctuary-once.json` (first QA assertion failure) |3825030|`8134c0db35af5565e7b00de04038ce91184b477d7add78cf01f2a7a2d8f8e6b8`|
| `serpent-sanctuary-evidence-verification.json` |2559|`22a9553f7f479a7b14689ff428532437962d079b911adf14908ae8290494e8e0`|
| `serpent-sanctuary-once-before-fixed-fight-save.json` |73168|`2e86fdceda9196efb30667159c5ab0aceb890c64e8834a9244f8b7dddac7a52c`|
| `serpent-sanctuary-once-victory-save.json` |74013|`7144e0ec3a40d98b352a6c620580feea825e7bdf278803b258a37e18f9c1dd3f`|
| `serpent-sanctuary-once-victory-restored-save.json` |73946|`fc13b9afffd059b40d45ae4e12d97e432d30b7972c74147baf7a0f605c8c8a01`|

Protected original:73000B SHA `a0689799c943503d71577b9bae10c782a8a28c8f9fccee9217f3e0975c3993f3`; separate old ferry file:73006B SHA `d55544821f8ee1462dbd671775bbdf035868a6f87ef93aabf53af89cf9c3f843`. Both byte-identical. Test reports and saved files are local QA artifacts, not uploaded assets or a public playable deployment.

## Remaining and next bounded path

NOT_RUN: refusal fallback, original cave defeat/timeout recovery, Circe recruitment, Chinese/320px DOM, physical phone and exact live-vitals continuation. Existing Denmark/Arthur failures, old mountain interruption and all earlier unmet late-game prerequisites remain; this is one sword branch, not a whole-region or whole-game clear.

A concrete adjacent text gap is now confirmed: `笑傲江湖_蓝凤凰1/2`, **two scenes/eight original dialogue slots, ten original steps**. Their current compiled text is still original Chinese. Sanctuary location `蓝凤凰` has an original Musashi-in-party/no-Circe `once` event, then a no-Musashi greeting fallback. The actual11-person QA source contains Musashi; the recruitment branch ends in the original `join('蓝凤凰')` and `item('毒龙鞭法秘籍', 1)`, with no battle. Cave Back directly returns to the sanctuary. **This batch only read that entry, did not click it or recruit anyone.** Adapt the Circe/Musashi exchange and its already referenced healer consistently before a separately bounded normal recruitment check; keep IDs, JOIN, manual reward and capacity handling unchanged. The unlocated pursuit caller and legacy VIP ferry group remain separate gaps.

Candidate branch only. Suggested PR: `feat(worlds): adapt sanctuary and verify original sword route`. Description: “Adapt four sanctuary/cave scenes, ten existing map displays and the original sword title using matching fantasy English/Chinese. Preserve all12 steps, event priority, random encounters, original solo fight and rewards. Content/frontend builds and targeted bilingual frozen/projection checks pass; one normal isolated route wins at378 and preserves sword/title through Save/Load. Retain the QA field-name failure and independent export verification; refusal/loss routes and other recruitment remain untested.” Prior GraphQL Forbidden is not retried or bypassed.
