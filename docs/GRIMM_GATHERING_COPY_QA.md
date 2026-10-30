# Grimm's Gathering briefing: complete15-line story segment

This batch adapts **`mainStory_组织1`**, the next mainline story segment after the already delivered Masked Duelist group. It contains **15 dialogue slots and17 total steps**. It was completely Chinese before this batch. All15 slots now have original American English and corresponding Chinese; the two original commands and all speaker/order/trigger data remain unchanged.

Baseline `b6a64fc50af530cd53f483279ae1956ca03cea80`, original workspace/writer and `feat/storybound-italian-battle`. Original JYX SHA-256 `c348d1bc161dbe3a9f9a321232526da75b8d3c7638db7fb2b089d30981e9bcd3`.

## Delivered scope and existing identities

`chapter-grimm-gathering.json` owns only this single segment and is registered once after `chapter-masked-duelist.json` in the existing skin. No previous dialogue owner existed for this segment; no approved scene was overwritten.

The only speakers are the locked Grimm (`南贤` / `de.jacob-grimm`) and the player (`主角`). Their display names, identity files, portraits and the current **The Gathering** milestone label are unchanged. There is no new person, place, named faction, relationship or cultural decision.

Grimm connects the masked scout's intrusion at his house with the Masked Duelist encounter. His research supports an organized threat, but he still cannot name its master or order. The player needles his short answer and filing system; the conversation ends with staying prepared and caring for companions. This uses the existing unnamed order from the preceding scene. It does not invent an investigation quest, required document, location marker or reward. The old threat to punch Grimm and repeated “very mysterious” ending are replaced with original character humor. No borrowed modern-film quotation or design is used.

The exact raw text, original speakers/step indexes, new English and new Chinese are retained in [the15-row original/new CSV](GATHERING_DIALOGUE_REVIEW.csv). This batch changes15 actual dialogue slots, not a menu/title audit or a gameplay completion.

## Frozen flow

- Original step0: `background('地图.主角之家')`.
- Original step1: `music('音乐.紧张感')`.
- Original steps2–16: fifteen dialogues, alternating Grimm/player and ending with Grimm. Speaker IDs and positions are exact.
- No choices, battles, item/currency grants, growth commands, JOIN/LEAVE, journal entries or new navigation are added. The original segment already has none of those outcomes.
- Original `legacy-global-3`: hero≥22, friend count≥8, completed `mainStory_神秘剑客1`; action `story('mainStory_组织1')`, existing once behavior unchanged. The condition is not silently strengthened to require a different Masked Duelist completion ID.
- Original next trigger `legacy-global-4`: hero≥25, friend count≥8, completed `mainStory_组织1`; action `story('mainStory_紧急')`. Its level, ordering and behavior are unchanged.
- All map/character/skill/item/battle/rule data, save schema, module identity, cast and existing milestones remain unchanged. No new proper name for the enemy organization is chosen.

## Corrected remaining-count ledger

The preceding review's **“99 top-level Chinese slots” was inaccurate**: it mixed counts of text containing Han characters with punctuation-only dialogue slots. This batch's first audit stopped on that incorrect expected baseline. The error was corrected by rereading the **identical saved pre-edit English pack**, not by changing source data or treating a count discrepancy as work delivered. Its failure summary remains `grimm-gathering-first-audit-count-failure.json`.

The fixed scope is the same15 segment IDs under `mainStory_组织*`, `mainStory_紧急*`, and `mainStory_最终决战*`. Counts are explicitly of **top-level dialogue steps**, not nested commands, whole-game dialogue, or completion percentage:

| Measure | Frozen before | After this batch |
|---|---:|---:|
| Segments in the fixed scope |15|15|
| Total top-level dialogue slots |106|106|
| Slots containing at least one Han character (`U+3400–U+9FFF`) |95|80|
| Slots containing only punctuation/ellipsis |11|11|
| Newly adapted English slots in this batch |0|15|
| Segments still containing native Chinese |15|14|

All remaining14 segments still need their complete original dialogue adapted: **91 slots =80 containing Han characters +11 punctuation-only slots**. The `紧急*` group has11 segments/55 slots (51 Han-containing +4 punctuation-only); `最终决战*` has3 segments/36 slots (29 +7). The11 punctuation slots are not English prose already delivered. Only15 actual new slots count as this batch's work. These numbers do not measure the rest of the game's unfinished content.

## Necessary checks run

1. `python3 scripts/build-module.py --module worlds`: passed,162 maps/1887 segments. Existing module/version registration remains unchanged except this chapter entry.
2. `audit-grimm-gathering.py`: final pass. In both locales, this segment retains17 steps,15 original speakers and the two exact commands. **1886 other story segments per locale** compare identical to their pre-edit packs. Every raw gameplay definition matches the native source; every browser field and the complete display catalog compare identical to the prior locale packs. The skin differs only by the single chapter registration. All87 protected original/candidate/six-backup/cast/source/prior-failure artifacts are hash-identical. Generated CSV has15 rows, UTF-8 BOM and LF endings.
3. `check-grimm-gathering-copy.mjs`: English/Chinese×320/390, all15 lines per variant passed exact-text/speaker checks. It uses the current actual dialogue renderer/styles and compiled content catalogs in an **isolated presentation fixture**. No horizontal overflow or paragraph clipping; existing Continue remains visible and≥44px high. Representative English320 last line and Chinese390 opening were visually inspected. Browser/page errors, failed requests and failed HTTP responses were0.
4. `GAME_MODULE=worlds npm run frontend`: TypeScript/Vite passed. Existing runtime-loader and large-chunk warnings remain. No .NET/runtime rebuild or repeated unrelated acceptance suite was run.

The presentation fixture renders authored lines directly; it does **not** unlock hero22, execute Game.Core/WASM, import an edited journey, advance the real story or test actual Continue-driven progression. Existing Grimm art is reused without changes. The real current continuation is still below the required level; no grinding, state injection or battle was done to qualify it.

## Evidence and unverified boundaries

Ignored evidence under `src/Game.Web/test-results/`:

| Artifact | Bytes | SHA-256 |
|---|---:|---|
| `grimm-gathering-frozen-audit.json` |2368|`d3ce435da4f586c5bd6c9098065ae1903b011b98e40b2372f54c5f2b3c7a0da8`|
| `grimm-gathering-presentation.json` |47443|`43146765e89c752d2442d04c0fa0afe46bccd19d90d647129e8e85de47de22db`|
| `docs/GATHERING_DIALOGUE_REVIEW.csv` |2783|`dab8d6383ec3d938023b24f1e5b4dcef83fc20c4e160c59d33991caa2fd66e11`|

`backups/pre-grimm-gathering-b6a64fc/` preserves both previous locale packs, old skin registration, the exact native segment and protected manifest. Screenshots use `grimm-gathering-presentation-{en,zh-CN}-{320,390}-{0,9,14}.png`; they are presentation evidence, not game progression.

**NOT_RUN:** normal level22 access, actual automatic trigger/scene execution, after-scene world return and save/reload, level25 emergency route, final battle/endings, physical devices/touch. No Denmark, Britain or Okuni fight, no physician reminder check, no new art, merge or deployment. This completes one content segment only.
