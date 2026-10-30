# Mainline milestone names and prerequisite references

This corrects one English alias in the existing mainline hint group. The actual Goals panel showed **Masked Duelist** as a milestone, but a later prerequisite said **complete The Unknown Swordsman**. Players could read these as different events. The prerequisite now uses the already established **Masked Duelist** name.

Baseline `2485576259ebf7e500d719311f995fe84b8c2342`, original workspace/writer and `feat/storybound-italian-battle`. Product change: only `src/ui/ui-en.json` value for native display key `神秘剑客`, plus a focused regression test. No new character, place, relationship, story or terminology was selected. This is not a translation of new plot scenes or a change to task availability.

## Exact seven-name group, identified before editing

The frozen `browser.milestones` supplies the four titles and three prerequisite references. `panels.ts:questPanel` renders them inside the existing **Goals → All objectives, milestones & journal** section. The character/content catalog already maps `神秘剑客` to Masked Duelist / 蒙面剑客; the UI dictionary's old English alias disagreed when translating the prerequisite's embedded name.

| Native display text | Actual English before | English after | Existing Chinese display retained |
|---|---|---|---|
| `黑暗的阴影` | An Unwelcome Shadow | unchanged | 黑暗的阴影 |
| `神秘剑客` — projected milestone title | Masked Duelist | unchanged | 蒙面剑客 |
| `组织` | The Gathering | unchanged | 组织 |
| `紧急` | Urgent News | unchanged | 紧急 |
| `经历「黑暗的阴影」` | complete An Unwelcome Shadow | unchanged | 经历「黑暗的阴影」 |
| `经历「神秘剑客」` | complete The Unknown Swordsman | **complete Masked Duelist** | 经历「蒙面剑客」 |
| `经历「组织」` | complete The Gathering | unchanged | 经历「组织」 |

These are seven inspected name/reference strings, **not seven newly authored translations**. Only one dictionary mapping changed. The existing level/party requirements, received/not-yet-received status labels, approved narrative text and direct next-step recommendations were not rewritten. Other chapter prose was not swept for replacement.

## Actual current-save evidence

The source was the existing normal deep-save **backup copy** `test-results/backups/pre-okuni-live-7d43413/source-save.json`,74032 bytes, SHA-256 `6ae6d002e157042b9ea1f74734f69d881bd6327a932ebd2cbf0baf2f22f58633`. It was copied again under `backups/pre-milestone-copy-2485576/source-copy.json` before use: hero14,13 party members,356 silver, normal difficulty. Original/deep saves and six-backup lineage were not written.

Before editing, normal UI import → Goals → existing full-objectives expansion captured all four actual rows at390px. The row for `mainStory_组织1` explicitly showed the old **complete The Unknown Swordsman** text while `mainStory_神秘剑客` was titled **Masked Duelist**. This was an observed display disagreement, not inferred solely from native strings or a fixture.

After editing, fresh isolated cloud headless Chromium contexts normally imported the same copy for English and Chinese. In each, the same panel was opened and all four rows read at390 and320px. Names in every prerequisite matched the referenced displayed milestone. Every English row was compared to the before capture: titles stayed exact, requirements changed only by the one alias. English rows contained no Chinese; normal wrapping showed the full labels and paragraphs with no horizontal overflow or text truncation. English320 and Chinese390 screenshots were visually inspected. These were actual game UI checks, **not component previews, physical phones or newly played story events**.

The current copy remained level14. The level15 Masked Duelist requirement, level22 Gathering requirement, level25 Urgent News requirement and their party counts stayed unchanged. No event was opened, no level was granted, and no milestone was marked complete. The directly selected Danish next objective was not reprioritized or rewritten.

## Frozen structure and focused verification

- All original JYX and compiled English/Chinese content-package bytes matched the pre-edit manifest, including every story command, step, condition, reward, milestone configuration and display catalog. No content regeneration or .NET runtime rebuild was required.
- `main.ts`, `panels.ts`, `journey-panel.ts` and `ui/locale.ts` remained byte-identical. UI dictionary keys and ordering matched; the sole differing value was `神秘剑客`.
- Added one test in `tests/world-terminology.test.mjs`: read the real configured prerequisite references, project their target milestones through the real display catalog, and require the UI-translated prerequisite to use the same displayed title. It checks the relationship between the two display paths rather than just asserting a replacement literal. Its initial targeted run failed with the observed old/new names; that failure is retained in `milestone-term-regression-before.json`.
- All **22 existing/focused terminology tests passed** after the correction.
- `GAME_MODULE=worlds npm run frontend` passed TypeScript/Vite; existing runtime-loader and bundle-size warnings remain.
- Both actual UI language runs exported the copied journey normally before closure. Full saved `game`, excluding elapsed play time, plus profile, won battles, study assignments and reserve IDs matched the source. Browser-storage evidence was retained. There was no unique unsaved gameplay, so each isolated context was safe to discard.
- No page/console errors, failed requests or HTTP failures were recorded in the final actual UI runs. No battle, travel, random event, training, purchase, task command, art generation, merge or deployment occurred.

## Evidence and limits

Ignored files in `src/Game.Web/test-results/`:

| Artifact | Bytes | SHA-256 |
|---|---:|---|
| `milestone-copy-before.json` — actual pre-edit names | 3382 | `7299facb4cca1b20f17703d4f03d4f377ba55455cd31cd1ced45edac68afca60` |
| `milestone-copy-after-en.json` — actual English390/320 | 9802 | `9ac0ce078d5894483b171a85369e55f11274ac205b4be2da3de24d4a21e8faa9` |
| `milestone-copy-after-zh-CN.json` — actual Chinese390/320 | 9686 | `e54b4e3e1f660c1e48378b6decddc7139af53325821c4a337d9ac1ed37c19a9d` |

Before image: `milestone-copy-before-390.png`. Final images: `milestone-copy-after-{en,zh-CN}-{320,390}.png`. Each language report also records its real unchanged exported save's path/hash. The before capture was a successful evidence collection, not a passing terminology-consistency assertion; the separate regression test demonstrated the defect.

Not newly tested: story triggers, meeting Grimm, any milestone battle/reward, new-game progression, other story guides, classic interface, physical devices or touch. No completion percentage or route victory is added by this display correction.
