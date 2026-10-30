# Grimm's urgent letter: complete next mainline segment

This batch completes **`mainStory_紧急`**, the next original segment after `mainStory_组织1`. The original segment has **three dialogue slots, three steps**, all now adapted in American English and corresponding Chinese. The original/new text, speaker IDs and indexes are retained in [the three-row comparison CSV](URGENT_LETTER_DIALOGUE_REVIEW.csv).

Baseline `64c23f98c30f4d881356650a0b652e26c1c5aae2`, original writer/workspace and `feat/storybound-italian-battle`. Native package SHA-256 `c348d1bc161dbe3a9f9a321232526da75b8d3c7638db7fb2b089d30981e9bcd3`.

## Text and frozen scope

`chapter-grimm-urgent-letter.json` owns only this complete letter and is registered once after the Gathering chapter. No previous authored translation existed for this ID. The speaker order stays player → Grimm → player. Existing Grimm/player identities, portrait mappings, home location and **Urgent News** milestone naming are unchanged.

The player receives another pigeon-carried note; Grimm asks them to return to his house and promises to explain in person. The dry joke concerns the pigeon getting a better briefing. The pigeon already appears in the native letter's wording; no named animal, item, quest, timer or new delivery mechanic is created. The text makes the destination clear without revealing the following military briefing or choosing a new cultural mapping for it.

There are **no music/background commands, choices, battles, rewards or jumps** in this source segment. All three steps and original speakers remain in place; no command was removed or added. The following fifteen-line `mainStory_紧急1` briefing remains outside this batch.

- Original `legacy-global-4` remains hero≥25, friend count≥8, completed `mainStory_组织1`, original once behavior and action `story('mainStory_紧急')`.
- Grimm's home (`南贤居`) → Grimm (`南贤`) event10 still requires this letter's completion and calls `story('mainStory_紧急1')`. The player still uses the original return/interaction route; the letter adds no teleport or automatic briefing.
- Conditions, levels, step order, cast, maps, combat, growth/economy, rewards, pack identity and save format remain frozen. No new setting or identity decision was needed.

## Checks and exact remaining counts

- Content generation passed:162 maps,1887 segments.
- Frozen audit passed for both locales: the three original slots/speakers are exact, **1886 other segments per locale** remain identical to their previous localized packs, all raw gameplay definitions match the native source, and the entire browser configuration/display catalog is unchanged. Skin changes only add this chapter registration. All92 protected original/candidate/backup/cast/source/prior-evidence files remain hash-identical.
- English/Chinese×320/390 presentation checks passed for all three lines, using the actual dialogue renderer/current styles/compiled locale packs in an isolated fixture. Exact text/speakers, full paragraphs, no horizontal overflow, visible Continue≥44px; no page/console/network/HTTP errors. English320 letter and Chinese390 player reply were visually inspected.
- `GAME_MODULE=worlds npm run frontend` passed TypeScript/Vite. Existing runtime-loader/bundle-size warnings remain. No .NET rebuild or unrelated repeated suite was run.

The remaining-count scope and method are unchanged from [the corrected Gathering ledger](GRIMM_GATHERING_COPY_QA.md): the same15 original segment IDs, counting top-level dialogue slots containing a Han character separately from punctuation-only slots.

| Measure | Before | After |
|---|---:|---:|
| Segments still containing native Chinese |14|13|
| Top-level slots containing Han characters |80|77|
| Unchanged punctuation-only slots |11|11|
| Remaining original slots requiring complete segment adaptation |91|88|

The fixed scope still contains106 slots total. This batch contributes exactly **three newly adapted slots**. The previous batch's original95-Han/11-punctuation recount is retained; no return to the inaccurate99 count and no whole-game completion percentage.

## Evidence and boundaries

Ignored evidence under `src/Game.Web/test-results/`:

| Artifact | Bytes | SHA-256 |
|---|---:|---|
| `grimm-urgent-letter-frozen-audit.json` |1962|`e0a63e3db02d95cc0ce31a4a570868fba27e0dea0cb781fde28d30c7be93013b`|
| `grimm-urgent-letter-presentation.json` |10229|`515943c5f45630d58bd2a2e1b4ae2ef4a97c70fca9ca51d2c3fdeb30a1d15fb8`|
| `docs/URGENT_LETTER_DIALOGUE_REVIEW.csv` |703|`9fe2611c780fabc1c793833760b38ab3e19ebbbec2cfb012adab5ef7d188a264`|

The backup folder `backups/pre-grimm-urgent-letter-64c23f9/` preserves both previous localized packs, previous skin, exact native segment and protected manifest. Screenshots are `grimm-urgent-letter-presentation-{en,zh-CN}-{320,390}-{0,1,2}.png`.

**NOT_RUN:** actual level25 trigger/access, natural letter completion flag, travel back to Grimm, the following briefing, later battles/endings and save/reload from that late progression. The rendering fixture does not initialize Game.Core/WASM or create a qualifying character; it is not a real story acceptance run. No leveling, injected progress, Denmark/Britain/Okuni retry, new artwork, merge or deployment. Existing saves and their backups are retained.
