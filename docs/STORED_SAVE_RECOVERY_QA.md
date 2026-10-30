# Stored-save selection and failure recovery

This fixes a narrow-screen readability defect: on the modern title screen, the existing bottom toast could cover **Load manual save** just when a newer damaged automatic slot failed to load. A single scoped CSS rule places title-screen feedback below the header on viewports ≤760px, keeping the existing recovery choices readable. The toast already had `pointer-events:none`; this was visual obstruction, **not blocked clicks or lost save data**.

Baseline: `38b1f8c3ab2bc3f961403d5713d0b60d12b8e503`, original workspace/writer/feature branch. Product change: one rule in `src/Game.Web/src/modern-ui.css`. No buttons, load/fallback behavior, gameplay, save schema, parser or migration changed. Desktop, classic interface and world/battle feedback keep their previous selectors/placement; only modern mobile `.title-app` feedback gets the override.

## Existing coverage and actual gap

The earlier [import-rejection report](SAVE_IMPORT_REJECTION_QA.md) already covered invalid external-file import, empty file selection and normal recovery. This batch does not present those old checks as new. It adds a distinct real application path: **a damaged automatic record selected as latest, alongside a valid manual record**.

Relevant unchanged implementation:

- `storage.ts` selects the newer automatic/manual timestamp and exposes the manual slot separately.
- `world.ts:titleView` renders Continue journey, Load manual save and Import a save backup when applicable.
- `main.ts:load` uses the existing stored-save parser, catches failure and leaves the existing choices available.
- `ui/ui-en.json` already translates the error to **Could not read the save file.** No new error wording was required.

The original actual browser run passed its data/recovery checks. Visual inspection then found the title error toast covered the manual-save label: at320×844 its recorded rectangle intersected the manual button by approximately140×67px. That first passed report and screenshots remain unchanged; they establish working recovery plus the missed visual obstruction, not a first-attempt layout pass.

## Disposable inputs and isolation

No unique player save or existing player browser database was opened. The normal input was copied from the already preserved QA backup `test-results/backups/pre-huntsman-once-38b1f8c/source-save.json` into `test-results/save-load-recovery-inputs/normal-copy.json`:

- 72353 bytes, SHA-256 `b37a86d32c6ce9176f9ae7aa8bf0c2d9192433e500f57f0c3797fc9bfbde8267`.
- Normal difficulty; hero13,11 members,184 silver, Grimm home. No travel or story interaction took place.
- Self-authored invalid data `truncated-auto.json`:22 bytes, `{"browserSaveVersion":`, SHA-256 `1bad94b41382b1da19d4cdc0cf108dc3afc4632f9aa7f522bf08f97c12e517f6`.

A fresh disposable headless Chromium context had empty cookies/origins before setup. Normal file import created the valid manual/profile records. An explicitly labeled **storage-corruption fixture** copied that manual slot's metadata into `auto:jyx`, used a one-second-later **slot timestamp** for ordering and replaced only that new record's payload with the truncated test JSON. The playable data and game clock were not modified. This setup is intentional fault simulation in a new test database, not a normal player action, a migrated save or fabricated progression. Only the project's existing parser received the invalid string; no external code or archive was executed.

## Actual UI sequence and result

The complete path was run before and after the one-line layout correction, in separate fresh contexts:

1. Normal title load displays **Continue journey — Damaged test copy · Level13** and **Load manual save — Rowan · Level13**. The first name is fixture metadata, not a new player character.
2. Click Continue journey once. The stored parser rejects the truncated automatic record. The readable English failure toast appears; no resumed/imported-success message is shown.
3. Before any recovery, read all test-database keys/values with readonly transactions. Valid manual/profile **and the damaged auto record** are byte-for-byte unchanged. The application does not silently delete or rewrite either choice.
4. At390 and320px, verify the actual error text is complete, within the viewport and separate from New game, Continue journey, Load manual save and Import controls. After the correction all four action rectangles have zero intersection with the error toast. Both final screenshots were visually inspected.
5. Open the real Import file chooser and return `setFiles([])`. This tests the application's empty-selection/cancel-return path, **not a physical system Escape key**. It produces no success/error toast, preserves all test records, and leaves the manual choice available.
6. Normally click Load manual save. **Journey resumed.** appears; the host returns to Grimm home, hero13,11 members,184 silver. The existing manual control was reachable and75px high at320px.
7. Download the recovered copy through the normal Bag export control. Full `game` matches the copied source except elapsed `playTimeSeconds`; profile, won battles, study assignments and reserve IDs also match. Characters/equipment, inventory, chest, story, currency and clock were not changed. All persisted test records still match the post-fixture baseline, including the untouched damaged auto copy.
8. Retain the actual export and browser-storage evidence before closing. No new gameplay or unique unsaved achievement was produced; the isolated database was safe to discard. Normal restored state and retained records were verified, not merely inferred from a toast.

One expected handled parser error per run is retained separately. Final page/console unexpected errors, failed requests and failed HTTP responses: **0**. These were actual local cloud game/parser/UI checks, not a component preview or a new gameplay completion. No battle, random visit, growth, purchase, world stage or artwork was involved.

## Validation and evidence

- Post-fix actual full-flow check: `check-stored-save-recovery-fixed.mjs`, English390/320, passed. It adds action/toast non-overlap assertions to the original data-preservation and manual-load checks.
- `GAME_MODULE=worlds npm run frontend`: TypeScript/Vite passed. Existing runtime-loader and large-bundle warnings remain. No .NET/runtime rebuild or broad unrelated suite was run.
- Main load handler, storage layer, title renderer, bridge, normal input copy and first raw report are hash-identical to the pre-fix backup. No original/deep save or six-backup file was written. This round does not claim a new byte audit of unique player originals; the test reads only its known backup-copy input and isolated records.

Ignored evidence in `src/Game.Web/test-results/`:

| Artifact | Bytes | SHA-256 |
|---|---:|---|
| `stored-save-recovery.json` — first functional pass with visual overlap | 170153 | `98f0011c7aeb0097ec84120847aef832000dfa156aa79b77f13fdd6fef69f942` |
| `stored-save-recovery-fixed.json` — post-fix actual flow and non-overlap | 172734 | `7a1c0c0d50bd92bcdffe14a3224858135d3699800901894ac5c5964f02cf427f` |
| `stored-save-recovery-fixed-restored-save.json` — real exported recovered copy | 72302 | `989637ab2b0ee4ea7f9cf17b6de2c5f632c65464b7500ad71f11b6f4944dbbf9` |

Before: `stored-save-recovery-failed-320.png`. After: `stored-save-recovery-fixed-failed-320.png`, `-390.png`, `-manual-choice-320.png`, `-restored-320.png`. `backups/pre-title-toast-38b1f8c/` retains the prior CSS, relevant unchanged source and first report, plus measured overlap. `stored-save-recovery-fixed-complete-storage.json` contains only disposable QA records and the intentionally broken test record.

Not newly tested: Chinese actual stored-slot recovery, physical chooser cancellation, touch/physical devices, storage quota/write failures, corrupted metadata/profile, migration, desktop visual layout or arbitrary malformed save schemas. The original English/Chinese external-import checks are prior evidence, not substitutes for these untested stored-slot cases. No merge or deployment.
