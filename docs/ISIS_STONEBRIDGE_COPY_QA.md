# Isis recruitment: Stonebridge Hall decline-gold chain

**Subsequent alternative branch:** [ferry-duel-loss narrative](STONEBRIDGE_LOST_GOLD_COPY_QA.md) now completes its separate3-scene/19-line entry-through-Horus-recruitment branch without rewriting the47 lines below. Genuine saves still lack that loss flag; both branches remain unplayed. Opened/sealed parcel alternatives are still pending.

Base `fcbfac39cca4f783365d396cd9e89f82bfdaba40`, initially clean, same writer/workspace/branch. This is the direct Isis recruitment chain following the ferry's declined-gold outcome. It does not expand to all Egyptian stories or the other gold branches.

## Actual increment

New `chapter-isis-stonebridge.json`, registered after the ferry chapter, adds **8 previously unadapted dialogue segments /47 bilingual lines**, one original menu, related map/entrance/NPC copy, and display names for existing candidates. One command-only battle segment is audited unchanged, not counted as new writing.

| Original suffix after `bixuejianShyou_` | Original steps | Dialogue slots |
| --- | ---: | ---: |
| 不接黄金石梁派1 |8|6|
| 不接黄金石梁派2 |6|3|
| 不接黄金石梁派3 |10|7|
| 不接黄金石梁派31 |4|3|
| 不接黄金石梁派4 |14|11|
| 不接黄金石梁派5 |4|1|
| 石梁抢金子 |1|0, unchanged battle-only|
| 不接黄金石梁派6 |10|7|
| 不接黄金石梁派7 |20|9|

The nine-segment chain retains **77 original steps**, including30 non-dialogue steps. Previous ferry, Grimm, Nephthys and family dialogue bodies are unchanged; no old lines are recounted as newly delivered.

## Coherent fantasy story

Horus asks for his mother Isis, rather than mistaking her for a young male stranger or falling in love with her. The original flirtation and sexual-night narration become family supper over maps and disputed family stories. The following morning, Hathor asks for recovered relief gold; Khepri wants the claim checked, and Isis wants it carried safely to its owners. The original guarded-gold encounter becomes the hall's delivery test. Anubis advises the party before the second original fight; after the final victory, Isis agrees to travel with her son and the original treasure-map joke follows the original reward command.

These are original US English lines and matching fantasy Chinese based on the existing public-domain Egyptian candidates. It is a fictional combination, not a claim to a single canonical mythology. No modern movie quotation, actor likeness, new figure or new art.

Existing candidates adopted locally, without modifying cast metadata/status or Horus's locked identity:

- Khepri / 凯布利 (`温正`), reception and accounts.
- Hathor / 哈索尔 (`安小慧`), claimant on behalf of the villages, a familiar acquaintance of Horus rather than a romantic rival.
- Anubis / 阿努比斯 (`黄真`), the existing supporting role, not a newly added party recruit.
- Existing five wardens: Amun, Bes, Sinuhe, Ra, Khonsu, preserving their distinct original character IDs.

Several original warden definitions share the same name `温方义`. Their new names stay in ID/category-specific display entries; an explicit text alias resolves the actual Bes dialogue speaker. Fixture checks confirm five distinct displayed units while source rule names remain untouched. Aliases also affect existing appearances of those same actors elsewhere, but no unrelated story body is rewritten.

The existing outer name remains Stonebridge Hall / 石桥会馆. The inner map is Stonebridge Hall — Assembly Room / 石桥会馆—议事厅; its entrance is Assembly room / 议事厅. Explicit map/location categories keep the room's description separate from the entrance card. Isis's local description explains the guarded-gold question. This is not a claim that all other hall entries/return labels or alternate routes are English.

## Rules and original resources frozen

The original ferry-decline flag still gates the outer story entry. After scene4, Isis's native challenge requires that scene completed, `mainStory_神秘剑客1` not completed, and scene7 not completed. The source's “three days” was dialogue only: this chain has no three-day timer command. New writing avoids promising a countdown or changing the actual stage window. Supper/morning are narrative, not added clock, rest or healing commands.

Original menu order remains challenge→`石梁抢金子`, prepare→world map. The first battle (`石梁派_战斗5`) still goes to scene6 on **win, lose or timeout**; the second (`石梁派_战斗6`) still requires victory for scene7, with original gameover on loss/timeout. No balance, AI, effects, time/probability, selection targets, growth/economy, reward amount, map connection, ID or save-schema changes. Actual resource carry-over and whether this build can finish these fights were not tested.

The final scene retains all six original item commands (`黄金包裹二`, `万劫指`, `碧水剑`, `龙头拐杖`, `不二枪`, `软鞭`, each×1), original `join('温青青')`, treasure map×1 and world-map return, in the same positions between dialogue runs. No new delivery condition or automatic return of gold to a villager is implemented or claimed.

Original nine segments, registration file, cast table, genuine194-silver source and actual untriggered ferry arrival were preserved with hashes under `src/Game.Web/test-results/backups/pre-isis-stonebridge-fcbfac3/`. Both prior saves and cast remain exact. Original JYX package/application, old text and Git history remain. Source SHA unchanged: `c348d1bc161dbe3a9f9a321232526da75b8d3c7638db7fb2b089d30981e9bcd3`.

## One necessary content/static acceptance

One content build passed. Python frozen-flow audit passed once for both locales: exactly the eight authored story bodies changed versus pre-edit fingerprints; the battle-only segment and every other story body remain unchanged. All77 steps, original speakers and all non-dialogue commands/options/conditions/rewards remain structurally exact; all runtime definitions retain original values. JOIN and map reward positions were explicitly checked.

The first Node projection fixture omitted `name` fields on raw map locations, whereas the existing host returns `name:null`; the projection intentionally edits existing view fields. That fixture error is retained in `isis-stonebridge-first-projection-error.txt`. Correcting the fixture to the host contract passed the failed Node check only. No product edit, repeat content build, repeated Python check or gameplay followed.

Final fixtures verify47 compiled lines per locale, projected speakers, challenge menu, all five distinct warden names, both map descriptions, separate entrance name and Isis description, and immutable inputs. English has no hidden CJK/old romance or false three-day claim. These are isolated projections, **not real scene arrival or screenshots**. No frontend/.NET build or broad test suite was rerun; unchanged frontend logic uses the existing catalog.

Local evidence under `src/Game.Web/test-results/`; original failures and all previous accepted QA artifacts are retained:

| Artifact | Bytes | SHA-256 |
| --- | ---: | --- |
| `isis-stonebridge-frozen-audit.json` |3234|`15999b9dcacd27da73239b0985f7f96e761d87aa368f283a195a10bba86a4421`|
| `isis-stonebridge-projection-audit.json` |1807|`b676ee608f623ecbbabee24d1c469f9ca5d06cdf2a43b7401b946ebd07582592`|
| `backups/pre-isis-stonebridge-fcbfac3/original-stonebridge-decline-chain.json` |12804|`73fbcc1cff4818ae8a0eee9d2be133f98ec490dbfce6208a17172f4ccdc1a178`|

## Actual boundary and next path

Both real194-silver saves have no Horus form and no `bixuejianShyou_不接黄金` flag, since the sole native ferry visit did not select its50%event. No flag was injected, no arrival forged, no ferry re-entered and no battle played. **Actual chain is NOT_RUN:** all47 lines in gameplay, menu choices, final JOIN/items, combat outcomes and Save/Load for this chain. No new party member or reward is reported.

After a future naturally completed ferry-decline route, the original hall story is the next relevant path. Entry/meal/inquiry scenes end at the world map; the player can prepare before taking the existing two-fight challenge. The actual recruitment would then need normal play validation. The opened-parcel, sealed-parcel and ferry-duel-loss hall alternatives, later training/treasure stories, other Egyptian appearances and full-game completion remain outside this batch.

Suggested PR title: **Adapt the Stonebridge Hall route to Isis recruitment**

Description: Replace the direct declined-gold hall chain's disguise/romance with a consistent Isis/Horus family supper, recovered-gold claim and original guardian challenge. Add47 bilingual lines and localized existing candidate/entry labels; preserve all77 steps and every rule/reward. Content build and focused bilingual frozen-flow/projection checks pass. Current genuine saves lack the original ferry prerequisite, so actual route remains NOT_RUN; no state injection or repeated battles. No merge/deployment; previously recorded PR API `Forbidden` is not retried and no new PR claimed.
