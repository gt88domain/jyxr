# Grimm's emergency briefing: complete next scene

This batch adapts **`mainStory_紧急1`**, the complete return-to-Grimm briefing following the urgent letter: **15 dialogue slots,18 total steps**. American English is the main text; corresponding Chinese is included. The exact original text, original speaker IDs and step indexes are retained in the [15-row comparison CSV](EMERGENCY_BRIEFING_DIALOGUE_REVIEW.csv).

Baseline `b6884782bde8e627a2ee433b04fce601e10f923c`, original writer/workspace and `feat/storybound-italian-battle`. Native package SHA-256 `c348d1bc161dbe3a9f9a321232526da75b8d3c7638db7fb2b089d30981e9bcd3`.

## Adaptation and frozen scope

`chapter-grimm-emergency-briefing.json` owns only this scene and is registered once after the urgent-letter chapter. There was no previous authored translation for this ID. The source's alternating Grimm/player speaker order remains exact, ending with Grimm. No actor identity, portrait or display catalog is changed.

Grimm reports an attack on **Highbridge / 高桥城**, using the existing mapping for 襄阳 and its fortified-crossing setting. Masked fighters resembling the earlier attackers are among the attacking army. The player's dry humor concerns a secret organization keeping its name hidden despite having hundreds of members; Grimm brings the conversation back to the town's danger. The final line makes the destination and possible immediate fighting clear without inventing a preparation screen or save point inside this uninterrupted scene.

The text uses an unnamed attacking army rather than assigning an unapproved country, commander or new cultural identity. Original river geography is expressed as the crossing and other river towns, without naming a new equivalent for 临安. The established masked attackers and their unnamed master remain unnamed; no new faction name or plot condition is introduced. All new prose is original fantasy dialogue, not a quotation from a modern adaptation.

The original three non-dialogue steps remain exact:

1. `background('地图.主角之家')`
2. `music('音乐.紧张感')`
3. Final jump to `mainStory_紧急2`.

There are no choices, rewards or battles inside this segment. The following city-gate scenes `mainStory_紧急2` and `mainStory_紧急3` are outside this batch; their scene change is why they are not appended to the home briefing. Existing level25 global-letter conditions, eight-friend requirement, once behavior and Grimm-home event10 remain unchanged. No progress was created to qualify for that event.

## Directed checks

- Generated bilingual packs retain162 maps and1887 segments. The frozen audit passed: only this one segment changed per locale; **1886 other segments per locale** are identical to their previous localized versions. Every gameplay definition outside story text matches the native package; browser configuration, display catalog and all non-dialogue steps are unchanged. The skin only adds one chapter registration.
- All97 protected original/candidate/backup/cast/source/prior-evidence files remain hash-identical. The pre-edit localized packs, skin, exact native scene and protected manifest are preserved under `src/Game.Web/test-results/backups/pre-emergency-briefing-b688478/`.
- English/Chinese ×320/390 checks passed for every one of the15 lines using the current dialogue renderer, source styles, real compiled locale packs and existing display projection in an isolated presentation fixture. Exact text/speakers, full paragraph visibility, no horizontal overflow and a visible Continue control at least44px high were verified. No page, console, request or HTTP errors occurred. The English320 final destination line and Chinese390 opening were visually reviewed.
- `GAME_MODULE=worlds npm run frontend` passed TypeScript/Vite. Existing runtime-loader and large-bundle warnings remain. No .NET rebuild, old battle retry or unrelated suite was run.

## Same-scope remaining counts

This uses the same fixed15 original segments and106 top-level dialogue slots documented in the [Gathering recount](GRIMM_GATHERING_COPY_QA.md). Slots containing a Han character are counted separately from punctuation-only slots.

| Measure | Before | After |
|---|---:|---:|
| Segments still containing native Chinese |13|12|
| Top-level slots containing Han characters |77|62|
| Unchanged punctuation-only slots |11|11|
| Remaining original slots requiring complete segment adaptation |88|73|

This batch contributes exactly15 newly adapted slots. The fixed scope still contains106 slots overall; this is a text-coverage count, not a whole-game completion percentage.

## Evidence and limits

Ignored evidence under `src/Game.Web/test-results/`:

| Artifact | Bytes | SHA-256 |
|---|---:|---|
| `grimm-emergency-briefing-frozen-audit.json` |1919|`7b21fa9240f71a5a8bc22f058ebd1995e99ecd7ad6fa1f89049a7b17490658dd`|
| `grimm-emergency-briefing-presentation.json` |47094|`47a82b2905074b0b6908285d17e479e05293a4c402cb6c69a4a09981049d4a8f`|
| `docs/EMERGENCY_BRIEFING_DIALOGUE_REVIEW.csv` |2643|`161f4844f8dab211e686aa48f5df66ffc1dd287c25d9b277584289c1464fffd0`|

Screenshots use `grimm-emergency-briefing-presentation-{en,zh-CN}-{320,390}-{0,9,14}.png`.

**NOT_RUN:** actual level25 access, completion flags, travel to Highbridge, subsequent battle/ending, late-game save/reload and physical-phone testing. The fixture initializes neither Game.Core/WASM nor a qualifying character and is not real story acceptance. Existing original saves and backups are unchanged. No leveling, injected flags/resources, Denmark/Britain/Okuni retry, new artwork, merge or deployment.
