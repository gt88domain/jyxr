# Final-battle aftermath: Grimm's complete conversation

Baseline `14aeb131cadd3f315dd9ac7d0b7eb7283f9c817c`, original writer/workspace and `feat/storybound-italian-battle`. This batch completes **`mainStory_最终决战3`**, one natural conversation of **18 original dialogue slots /22 total steps**. The [18-row original/English/Chinese comparison](FINAL_GRIMM_DIALOGUE_REVIEW.csv) retains source speakers and step indexes, including the original six punctuation-only responses.

Native package SHA-256 remains `c348d1bc161dbe3a9f9a321232526da75b8d3c7638db7fb2b089d30981e9bcd3`.

## Adaptation and existing identities

This scene uses only the established player and Grimm, alternating for nine pairs. The destination retains the approved **Crane Peak / 鹤峰** mapping. The original tournament is described as a tournament at Crane Peak, rather than introducing another named event, country or character. The pending Watson candidate and all22 highbridge scene slots remain untouched; no alternative alias is used for that slot.

The player is tired after the battle but thinks about unexplored places, techniques and people. Grimm mentions the possibility of another journey, then returns the focus to finishing this one: the final tournament. Dry humor comes from sore feet and one more “but first,” without the original genre/brand jokes or treating romance as an inventory goal. Six original ellipsis/question-only slots become short contextual replies. Slots and order remain exact; this is18 authored slots, not18 formerly Han-containing slots.

The dialogue does **not** launch another journey, promise carryover rewards or assert a completed ending. The original replay suggestion remains a conversational possibility before the last trial. It adds no restart control or rule.

Two adjacent displays are localized:

| Original | English | Chinese |
|---|---|---|
| `华山论剑！` |Tournament at Crane Peak!|鹤峰比武大会！|
| `蒙古大军败退。` |The attacking army has retreated.|进攻的军队已退却。|

The first is an exact entry-label mapping. The second uses existing `commandText` to localize only the human-readable argument of the existing journal command, without adding a record, changing its position or changing a save field/schema.

## Frozen flow and directed checks

- All22 steps and18 original speaker slots remain. The three non-dialogue commands other than journal display text remain exact: `background('地图.沙漠')`, `music('音乐.天龙八部11')`, and `legacy_maxlevel('基本内功', 1, 'legacy.mainStory_最终决战3.基本内功')`. Journal stays last; no jump or travel command is inserted.
- Original incoming `mainStory_最终决战2` still jumps here, unmodified. The world-map `华山` event1 still calls `story('original_华山论剑')` once, conditioned on `story_completed('mainStory_最终决战3')`. Text authoring does not make that event accessible in the current test save or skip its preceding battle.
- Content generation passed:162 maps,1887 segments. The bilingual frozen audit passed: one changed scene, **1886 other scenes per locale exact**, all native gameplay definitions exact, and only the one entry-label text mapping differs in browser configuration. Cast, previous scenes, battle parameters, triggers, reward commands, IDs and save structure stay unchanged.
- All108 protected originals/candidates/backups/cast/source/prior-evidence files remain hash-identical. `backups/pre-final-grimm-14aeb13/` preserves both previous locale packs, previous skin, exact original scene and protected manifest.
- All18 lines passed English/Chinese×320/390 checks in an isolated fixture using the current dialogue renderer/source styles, compiled packs and display projection. Exact text/speakers, full paragraphs, no horizontal overflow, Continue≥44px and no page/console/network/HTTP errors. English320 tournament explanation and Chinese390 destination line were visually reviewed.
- `GAME_MODULE=worlds npm run frontend` passed TypeScript/Vite. Existing runtime-loader and large-bundle warnings remain. No .NET rebuild or unrelated suite was run.

## Same-scope remaining text

The fixed scope remains15 original late-mainline segments and106 top-level dialogue slots. This batch adapts12 slots containing Han characters plus6 punctuation-only slots.

| Measure | Before | After |
|---|---:|---:|
| Segments still containing native Chinese |10|9|
| Top-level slots containing Han characters |55|43|
| Punctuation-only slots still pending |11|5|
| Remaining original slots pending complete adaptation |66|48|

These counts describe this frozen text scope, not world completion or ending acceptance. The original95-Han/11-punctuation recount is unchanged.

## Evidence and limits

Ignored evidence under `src/Game.Web/test-results/`:

| Artifact | Bytes | SHA-256 |
|---|---:|---|
| `final-grimm-frozen-audit.json` |1226|`41bb788c620bf057bee52daeb8f1315078ec784fc54b6b57281ab9accdea79af`|
| `final-grimm-presentation.json` |55894|`650c43877c185b3c7124c7c50cc1b9aae065cc87c350cdcdc52e90ff21b44c00`|
| `docs/FINAL_GRIMM_DIALOGUE_REVIEW.csv` |2724|`5a79e53168947340c1b3ae32ba1b5b4045adeb2879a34784b00f7eae838378c7`|

Screenshots are `final-grimm-presentation-{en,zh-CN}-{320,390}-{0,15,17}.png`. The exact entry-label and journal text were checked in generated data; the live map-card/journal-panel views were not exercised.

**NOT_RUN:** real late-mainline access, final-battle victory, this scene's completion flag, original mastery-cap gain, actual journal creation, tournament travel/play/ending, new journey and late-game Save/Load. The fixture initializes no game runtime or qualifying character. No old battle retry, leveling, injected state/resources, new identity, artwork, merge or deployment. Original saves, six backups and previous failed evidence are retained.
