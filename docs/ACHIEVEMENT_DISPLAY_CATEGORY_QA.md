# Achievement descriptions: preserve the category behind a shared ID

Base `252e4a701111de613edc72c67f7ccd20b6ee127a`, initially clean; same workspace/branch and sole writer. This fixes the recorded display bug before adding more dialogue. No new story writing, battle or achievement unlock is used for acceptance.

## Before and after

The host filters the original achievement list by profile unlock state, then returns each achievement's own `id`, `name` and `description`. Its consumer is the existing achievements section in the journey panel. Achievement `天外飞龙` shares an ID with the Sky Dragon Sword skill. The generic `byId` projection took the skill's description for the achievement:

| View | Before | After |
| --- | --- | --- |
| Skill: Sky Dragon Sword | “An active sword skill. Check its range, energy cost, and rank bonuses in the skill details.” | Same skill description |
| Achievement: Sky Dragon Sword | Same unrelated skill description | “Horus learned Sky Dragon Sword from Thoth.” |

Chinese receives the corresponding independent achievement description. Both names and both original IDs remain unchanged. The description matches the existing rank12 learning instruction; no new learning or unlock effect is added.

## Small display-contract change

- Content compilation adds `byCategory.achievements` from the original browser achievement metadata and current display labels. It includes each title's own source text when untranslated, so absence of a translation cannot cause a foreign skill/item description to be borrowed.
- `projectPresentation` selects the achievements category for that existing array. If an achievement is missing from the category, it keeps its own text rather than falling back to an unrelated `byId` template.
- The existing `DisplayCatalog` already supports arbitrary category names. Schema stays1; host/TypeScript achievement payload shape and all stable identifiers remain. No .NET interface, unlock filter, profile/save format or cached-pack lifecycle is modified.
- Existing `byId`, every older category and older text-label entry remain exact. Eight new description labels are the only changes to the old global text table. The original browser achievement definitions themselves remain unchanged.

This resolves the lookup responsibility rather than renumbering a title, overwriting a skill description, issuing a replacement achievement or changing legacy calls.

## Same-class effects and bilingual copy

Checking all113 original achievements found nine descriptions that had borrowed other template descriptions. **All113 names remain exactly as previously displayed.** The corrected descriptions affect IDs `七星海棠`, `俗家弟子`, `六脉神剑`, `天外飞龙`, `如来神掌`, `斗转星移`, `狂风快剑`, `玄冥神掌`, `血海魔功`.

The target description lives with the camp mentor copy. Seven other previously untranslated source descriptions are now localized in `achievement-copy.json`, registered through the existing chapter mechanism. These are direct descriptions of original metadata, not new trigger criteria or story branches. They preserve killing versus sparing the apothecary, existing obtained/learned rewards, mystery resolution and original opponents; they do not adopt new named-character candidates. Existing names such as Shaolin Temple, Sixfold Strike, Nightshade Blossom, Storm Pass and Crane Peak are reused. Source/cast approval metadata remains unchanged.

Bloodtide Mastery's source description is empty; it stays empty instead of inheriting a skill description or receiving invented completion criteria. The corrected eight nonempty descriptions are English in the English catalog, with equivalent fantasy Chinese. This does not claim every original achievement or story has been fully localized.

## Targeted validation and fixture correction

Three focused Python tests passed: bilingual shared-ID achievement compilation, preservation of an untranslated achievement's own description, and the existing rule/name-based-combination preservation check. Ten presentation tests passed, including shared-ID bilingual skill/title separation, unknown-achievement isolation and existing items/shop/mastery/character/cache/hero-name behavior. These code tests were run once; no old story, complete game suite or .NET test/build was repeated.

The first integration comparison mistakenly ran the **new** projector against the old pack and expected the old bug. The new unknown-title fallback correctly retained the original title text instead. That fixture was corrected to load the actually backed-up **old projector plus old pack**, reproducing the reported wrong skill description. Its rerun passed; no product change was needed for that fixture correction. The initial integration failure is retained here, not reported as a game failure or first-run integration pass.

After inventory exposed the seven other untranslated collision descriptions, those display labels were added. Final content and frontend builds passed, including `tsc --noEmit` and Vite. Final frozen/projection checks cover both compiled languages after that copy change. No code-unit tests were repeated solely for the additional text. The frontend build retains its existing external-runtime-loader and large-chunk notices; no runtime binary, chunking or loading policy is changed.

Exact before/after package comparison proves **only `browser.displayCatalog` changes**: all1887 story bodies, browser game rules, original achievement metadata/IDs, runtime definitions, commands, conditions, numeric values and rewards stay exact. Old catalogs are preserved for the comparison. No source data is silently rewritten to match the display.

Isolated source/host-shaped fixtures check the actual shared ID, all113 title IDs and every changed description. Existing item, external/internal skill, talent, buff, sect, character, location, inventory, shop and Rowan-name view fixtures match their old-projector/old-catalog output. Inputs remain immutable. All nine changed title names remain the same, and the original empty description remains empty. No character, item or actual profile is unlocked or injected.

## Evidence and boundaries

Original source SHA remains `c348d1bc161dbe3a9f9a321232526da75b8d3c7638db7fb2b089d30981e9bcd3`. Compiler/projector/test sources, camp copy, old bilingual full packs, cast and genuine saves are preserved under `src/Game.Web/test-results/backups/pre-achievement-category-252e4a7/`; pre-edit registration was copied from the exact base Git blob. Backup manifests include bytes/SHA. Cast and both genuine194-silver saves remain byte-identical:

- Grimm return:73000B, SHA `a0689799c943503d71577b9bae10c782a8a28c8f9fccee9217f3e0975c3993f3`.
- One-visit ferry arrival:73006B, SHA `d55544821f8ee1462dbd671775bbdf035868a6f87ef93aabf53af89cf9c3f843`.

Ignored local final receipts:

| Artifact under `src/Game.Web/test-results/` | Bytes | SHA-256 |
| --- | ---: | --- |
| `achievement-category-frozen-audit.json` |1066|`ce3df35d9fa973b5a1f8e17d0f1d6546e8a7640186bf3415c49ece76adc4aa34`|
| `achievement-category-projection-audit.json` |10014|`c165ab020f75f0a7348fb1a73e84db7666780590a8989d912062bf138ef1b5e6`|

Acceptance is compilation, code regression and faithful isolated projection, **not a browser screenshot,320/390px check, physical phone, actual achievement unlock, battle or in-game Save/Load**. No profile editing or forced script. The source unlock path is not replayed just to obtain a title. Prior failed/interrupted QA and live-vitals restoration limits remain untouched.

The camp receipt's earlier UNFIXED status is historical: this display defect is now fixed in the candidate. All previous story-route NOT_RUN boundaries still apply, and no gameplay-clear count increases. The five-scene45-slot dual-mentor source-backed group remains the next content task; this fix does not claim its dialogue is written or its routes played.

Existing branch candidate only; no merge/deployment or new PR. Suggested title: `fix(worlds): separate achievement and skill display descriptions`. Body: “Give achievements a scoped display category so shared legacy IDs cannot substitute skill/item descriptions. Preserve all original IDs, metadata, unlock rules and save data. Correct nine title descriptions, localizing seven same-class source descriptions while preserving the original empty one. Three focused Python and ten presentation tests pass; final content/frontend builds and exact bilingual package/view comparisons pass. Verification uses isolated host-shaped fixtures, without unlocking achievements or replaying battles.” Prior GraphQL Forbidden is not retried.
