# Crossroads and Rainmarket: complete local relief scenes

Baseline `4a23b9577e8a7d5063991d38e5554d674f7aa2c9`, original writer/workspace and `feat/storybound-italian-battle`. This batch completes both short town encounters and their immediate victory endings: **four segments, eight dialogue slots /17 steps**, in American English and corresponding Chinese.

| Segment | Dialogue slots | Steps |
|---|---:|---:|
| `mainStory_紧急.洛阳` |3|6|
| `mainStory_紧急.洛阳胜` |1|3|
| `mainStory_紧急.衡阳` |3|6|
| `mainStory_紧急.衡阳胜` |1|2|

The [eight-row review CSV](TOWN_RELIEF_DIALOGUE_REVIEW.csv) preserves original text, stable speaker IDs and step indexes. Native source SHA-256 remains `c348d1bc161dbe3a9f9a321232526da75b8d3c7638db7fb2b089d30981e9bcd3`.

## Existing roles and text

The approved towns remain **Crossroads / 十字镇** and **Rainmarket / 雨集镇**. Attackers retain **Masked assassin / 蒙面刺客**. The player protects the residents and, following the original win, notes that the attackers have withdrawn. The two encounters use different wording, without adding an evacuation quest, reward or new choice.

The cast table already classifies `酒楼老板` (`actor-2a7e5140e6a4`) and `民女2` (`actor-26d67b2c25c4`) as `archetype / classified / shared-archetype`, both **Town resident / 当地居民**, with no named figure. The chapter applies that existing classification as display names; it does not assign a famous identity, approve a proposed figure or merge the two IDs. Their existing portraits are retained. These display aliases also apply when those same IDs appear elsewhere, but those other scenes are not counted as translated dialogue.

Two original map-card descriptions gain exact display labels: `洛阳告急！` → **Crossroads under attack! / 十字镇遇袭！**, and `衡阳告急！` → **Rainmarket under attack! / 雨集镇遇袭！**.

### NPC label defect found during presentation QA

The first fixture failed when the Rainmarket speaker remained `民女2`: its native character name is `民女`, so the generated character-name alias alone did not translate the stable speaker ID. `BrowserBridge.Media.cs` resolves names only for party/reserve characters; a non-party resident retains the raw speaker ID.

An intermediate fixture incorrectly substituted the native definition name for that non-party ID. Its apparent pass is **not accepted as verification** and is preserved separately. After correcting the fixture to match the actual bridge contract, the product gained one exact display-label mapping, `民女2` → **Town resident / 当地居民**. No host, projection algorithm, character definition or ID changed. The final faithful fixture then passed in both languages and widths. The first failure and invalid intermediate result remain available; no original battle was replayed to test this label.

## Frozen flow and checks

- Each original town entry remains once-only, requiring `story_completed('mainStory_紧急4')`. No probability, level, map connection or event condition changes.
- Both encounters retain exact `襄阳_战斗` definitions and win jumps to their respective source victory segments. Lose/timeout still call `legacy_flow('gameover')`. All nine non-dialogue steps, including background/music, Crossroads mastery-cap reward and both world-map returns, remain exact. No journal command is added or changed.
- Bilingual content generation passed:162 maps,1887 segments. The directed audit passed: these four changed scenes only; **1883 other scenes per locale exact**. All native rules match; browser differences are restricted to two classified-archetype display entries and three exact labels (two town descriptions plus the raw NPC speaker ID). Skin changes only register the new chapter once.
- All113 protected original/candidate/backup/cast/source/prior-evidence files remain hash-identical. `backups/pre-town-relief-4a23b95/` holds previous packs/skin, all four original segments and protected manifest.
- Final faithful English/Chinese×320/390 fixture checks passed for every line using the current dialogue renderer, source styles, compiled packs and existing display projection. Exact text/speakers, full paragraphs, no horizontal overflow and Continue≥44px; no page/console/network/HTTP errors. English320 Rainmarket resident and Chinese390 Crossroads resident were visually reviewed.
- Final `GAME_MODULE=worlds npm run frontend` passed TypeScript/Vite after the NPC-label fix. Existing runtime-loader/bundle warnings remain. No .NET rebuild or unrelated suite was run.

## Same-scope remainder and decisions

The same fixed15 original mainline segments /106 top-level slots are used. This batch contributes eight newly adapted Han-containing slots: **9→5 segments**, **43→35 Han-containing slots**, **5→5 punctuation-only slots**. Remaining original slots are **48→40**. These are text counts, not whole-game completion.

The remaining five segments are held in two identity-dependent scene groups:

| Group | Segments and slots | Exact dependency |
|---|---|---|
| Highbridge arrival, confrontation and aftermath | `mainStory_紧急2` 3; `mainStory_紧急3` 14; `mainStory_紧急4` 5 | `吕文德` / `actor-f05fa7d93790` is proposed John Watson, not approved or applied. The entire22-slot group remains reserved as instructed, including its5-slot aftermath. Existing Masked Duelist remains unchanged; the separate Zorro candidate is not selected. |
| Final opponent and direct defeat speech | `mainStory_最终决战1` 13; `mainStory_最终决战2` 5 | `神秘使者` / `actor-2aa34155c15b` is proposed Professor Moriarty, not approved or applied. No generic alias is introduced to bypass this decision. |

No further scene in this fixed scope is implemented in this batch. The identity dependency receipt is `remaining-mainline-identity-dependencies.json`; this list is not additional development or real ending acceptance.

## Evidence and limits

Ignored evidence under `src/Game.Web/test-results/`:

| Artifact | Bytes | SHA-256 |
|---|---:|---|
| `town-relief-frozen-audit.json` |1556|`b615d541a7b30089cf672bdf34965e8cf265119319bfa539b332b9e9a891b005`|
| `town-relief-presentation.json` (final faithful run) |25393|`7eb6718a3a28bf3861137f2be61a7627e5fee7bf0b699a1437916de0f5484ffa`|
| `town-relief-presentation-first-id-fixture-failure.json` |758|`9f38b044b380fdd87c66c28ffe68dcd073da8bea3b2c8e584c48b4dba3cfccf0`|
| `docs/TOWN_RELIEF_DIALOGUE_REVIEW.csv` |1046|`05914fa0880bc48b03f305430ae2449ec4c1878e2bb4793c6872314add8413c9`|

`town-relief-presentation-invalid-name-fixture.json` preserves the rejected intermediate fixture. Its projected-output report happens to match the final output; only the final run uses the correct raw NPC-ID input. Screenshots are `town-relief-presentation-{en,zh-CN}-{320,390}-{0,4,7}.png`.

**NOT_RUN:** real level25 progression, either town's natural access, actual battles/rewards/map returns, late-game Save/Load and physical-phone testing. The fixture initializes no game runtime or qualifying progress. The raw-NPC contract is checked against the existing bridge source; no live NPC scene was forced. No travel, old battle retry, leveling, injected state/resources, new identity/artwork, merge or deployment. Original saves, six backups and prior failure evidence remain untouched.
