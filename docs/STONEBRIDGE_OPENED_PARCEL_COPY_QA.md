# Stonebridge Hall: opened-parcel branch and local coverage

Base `d6a362e3808c8546c52dfe0d89e7ab17a3912920`, initially clean, same writer/workspace/branch. This final adjacent alternative is delivered from original entry through its direct ending. Previously completed three routes are not rewritten or replayed.

## New writing: four scenes,33 bilingual slots

New `chapter-stonebridge-opened-parcel.json` owns:

| Original ID | Original steps retained | Dialogue slots |
| --- | ---: | ---: |
| `bixuejianShyou_打开包裹石梁派` |19|16|
| `bixuejianShyou_包裹线end` |10|8|
| `bixuejianShyou_包裹线end2` |9|7|
| `bixuejianShyou_包裹线end3` |7|2|

All4 scenes/33 slots were previously unadapted, with45 original steps retained. Current text and equivalent fantasy Chinese use the existing cast and original US English; no modern film quotes, new figures, actor likeness or artwork.

Horus recognizes Isis as his mother. The hero claims the parcel is missing, but Sinuhe spots Isis's hairpin from the opened parcel. Isis challenges the theft, Horus rejects the betrayal and the original leave instruction executes before the first fight. Hathor explains the recovered relief gold; Anubis protects the wounded and Horus stands with him. The hero's greedy/threatening responses remain a hostile player branch, rather than a false reconciliation or recruitment. The final retreat and world-map return follow the original sequence. Old disguise, granddaughter and unrelated martial-family relationships are removed from this local narrative.

Original achievement `丧心病狂` displays **Ruthless / 冷酷无情**, with a matching description about seizing relief gold. Its internal ID and original unlock command remain unchanged. Existing distinct Sinuhe/warden speaker labels are reused. No casting metadata or locked identity changes.

## Two separate original currency effects

The source has two different+20,000silver instructions. Both are intentionally preserved:

1. **Earlier opening scene `bixuejianShyou_得黄金`**, outside this batch: original+20,000silver, hairpin×1, Focus−10. Its authored text/body and all commands remain unchanged.
2. **This hall ending `bixuejianShyou_包裹线end3`**: original Field Medicine Handbook (`医术汇总`)×1, separate+20,000silver, original Ruthless achievement ID and world-map return. This is an existing later award, not a rerun of the opening scene.

No hairpin or Focus effect is repeated in the four hall scenes. No JOIN, extra payment, donation, countdown, parcel-opening call or delivery condition is added. Dialogue does not promise a fresh opening payout or an automatic return of gold to villagers. NPC threats are narrative; no disarm/hostage mechanic is introduced. Observed battle loot/currency totals are not claimed because no battle was played.

## Original conditions and consequences

Hall event1 still checks `story_completed('bixuejianShyou_得黄金')`, once; no new hairpin-in-inventory or gold-payment test. Horus's original `leave('袁承志')` remains immediately before battle1. Original `石梁派_战斗1`→`战斗2`→`战斗3` advances only on victory; each original loss/timeout remains gameover. These are this branch's original mappings, not the decline route's different first-fight handling.

All12 non-dialogue steps, original speaker IDs,45 positions, battle parameters/AI, stats, growth/economy, quantities, map links and save schema are unchanged. No replacement of the hostile consequence with a friendly reward path. End-of-branch handbook/silver/achievement/map commands remain together at their original positions.

Original four segments, registration/cast files and both genuine194-silver saves were preserved with bytes/hashes under `src/Game.Web/test-results/backups/pre-stonebridge-opened-d6a362e/`; previous compiled fingerprints retained. Cast and saves remain exact. Original JYX application/package, old writing and Git history remain. Source SHA unchanged: `c348d1bc161dbe3a9f9a321232526da75b8d3c7638db7fb2b089d30981e9bcd3`.

## Necessary content/static acceptance

Final content build passed. One focused Python/Node bilingual audit pair passed after the final copy revision; no failed check or audit rerun. Exactly these four compiled story bodies changed against pre-edit fingerprints. Every other body, including earlier opening effects and all previously completed routes, is unchanged. Frozen-flow validation and exact runtime-definition comparisons passed.

Checks explicitly cover all33 authored lines/45 steps, original speakers and non-dialogue instructions, three fatal loss/timeout mappings, Horus leave position, earlier opening silver/hairpin/Focus versus the independent final award, and no duplicated opening/extra JOIN. Projection fixtures check saved player name, existing non-party speaker IDs (including Sinuhe), translated achievement name/description with unchanged ID and existing Field Medicine Handbook label. They are **isolated view fixtures, not scene arrival, UI screenshots, combat, awards or Save/Load**.

No frontend/.NET build, broad test suite, prior route replay, ferry reroll or bad-save test. Final copy was compiled after a small gender-neutral wording revision; no gameplay test was repeated. Original failures and previous accepted artifacts remain.

Local artifacts under `src/Game.Web/test-results/`:

| Artifact | Bytes | SHA-256 |
| --- | ---: | --- |
| `stonebridge-opened-frozen-audit.json` |2805|`a60e8d422012266b2c968bb3ae94211c3e8b89fe5292930856cb29005144d0f3`|
| `stonebridge-opened-projection-audit.json` |1223|`c73c5b2da186cddeee692e134c24083d20dd31d9dbce3f28708949725a252bb4`|
| `backups/pre-stonebridge-opened-d6a362e/original-opened-parcel-branch.json` |8025|`6f0ba8ebc94e421499792914120f3d613187e7846ce4143db5a412e5724d762a`|

## Entire adjacent Stonebridge set: text versus play

This is a read-only coverage inventory, not additional writing counted in this batch and not a rerun of old acceptance:

| Direct gold-result route | Source segments | Authored dialogue slots | Original steps | Actual gameplay |
| --- | ---: | ---: | ---: | --- |
| Declined gold → Isis recruitment |9, including1 battle-only|47|77|NOT_RUN|
| Ferry duel lost → Horus recruitment |3|19|29|NOT_RUN|
| Sealed parcel → guarded-gold ending |4|37|56|NOT_RUN|
| Opened parcel → betrayal ending |4|33|45|NOT_RUN|
| **Local coverage total** |**20**|**136**|**207**|**No route claimed played**|

All four identified adjacent routes now have their direct dialogue/ending adapted. This does not mean all Egyptian stories, later training/treasure, the whole hall UI or the whole game is complete. Existing role aliases/title labels may affect the same IDs elsewhere, without rewriting unrelated story bodies.

Both real194-silver saves lack the opened-parcel flag. The only actual ferry visit did not select Horus; no fake flags, forged arrival, second encounter attempt or battle was used. **Entire new route NOT_RUN**, including actual33-line display, leave, fights/outcomes, final payout/achievement and Save/Load. No recruit, gold, handbook, Focus change or title was actually granted in this batch. Genuine source and untriggered ferry arrival remain preserved.

The next material gap is normal-progression acceptance of these prerequisites and a selected route, or a separate later teacher/treasure writing scope. This batch does not choose a new QA branch, reroll the50%event, lower combat difficulty or reopen old failed fights to manufacture progress. No merge/deployment; previously recorded PR API `Forbidden` is not retried and no new PR claimed.

Suggested PR title: **Complete Stonebridge Hall's opened-parcel betrayal dialogue**

Description: Add33 bilingual lines for the last four-scene adjacent gold branch using consistent Isis/Horus family roles, existing wardens and a hostile player consequence. Preserve45 steps, Horus leave, three fatal-defeat mappings, earlier opening effects and the separate original final handbook/silver/title award. Content build and focused frozen-flow/projection checks pass; current genuine saves lack the original opened-parcel flag, so gameplay remains NOT_RUN. Local four-route text coverage is complete, not a chapter playthrough.
