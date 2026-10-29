# Horus at Windsong Ferry: coherent gold-choice batch

Base `8df777bdc4004bc1e1f270ff22784d0dd891f438`, clean before editing, same writer/workspace/branch. Original194-silver progress is protected. No merge/deployment, new characters/art or core changes.

## Names, story and scope

The real existing destination is **Windsong Ferry / 风歌渡口** (`风陵渡口`), not “Windrider Crossing” used in earlier reports. The next native destination for these gold branches is **Stonebridge Hall / 石桥会馆** (`石梁派`), not Threadhall or the old unmapped Quzhou reference. Neither map ID/link changed.

Isis and Horus are mother/son throughout. Isis recovered stolen gold and expects it returned; Horus objects to taking it for himself. The hero's gold choice is explicit about keeping it. On decline, Isis carries the story prop away herself, so the text no longer puts an untracked gold parcel into the hero's inventory. Horus joins to follow her, with original gifts. On acceptance, the hero tries to keep some gold and Horus demands it back; the original duel remains. Winning/losing continuations, sealed-parcel choice and immediate fare dispute/ending are all rewritten together, avoiding a return to old Chinese directly after an English menu. No old disguised-girl revelation, suitor or romance framing remains in these scenes.

The original local resident `船老大` is displayed by his functional role **Ferryman / 船夫**; same archetype/ID, no new famous figure or cast-map change. Its shared alias applies to existing uses of that actor too, but no unrelated dialogue body is rewritten. Horus's locked identity/forms and Isis's existing alias remain. New US English and equivalent fantasy Chinese are original writing, with no modern movie dialogue or actor likeness.

New `chapter-horus-ferry.json` owns the complete nearby port subtree. Two formerly isolated recruitment scenes and their parcel menu move out of `chapter-companions.json`, retaining one owner per key. That chapter now owns18 dialogue segments rather than20; its character identities are unchanged.

| Original segment suffix (`bixuejianShyou_…`) | Original steps | Dialogue slots |
| --- | ---: | ---: |
| 风陵渡口 |7|4|
| 接黄金 |10|7|
| 接黄金2 |10|4|
| 接黄金3 |9|7|
| 不接黄金 |17|10|
| 得黄金 |5|1|
| 付船资 |5|2|
| 不付船资 |4|2|
| 不付船资胜利1 |3|1|
| 不付船资胜利2 |8|5|

Total **10 segments /43 bilingual lines /78 original steps**. Of these,8 scenes/29 source dialogue slots were previously unadapted. The other2 had9 authored lines; their coherent rewrite now has14 lines, restoring5 original decline slots previously compressed away. The43 are not claimed as43 previously missing slots. Three original menus have bilingual prompt/options in unchanged order.

## Rules and originals retained

Original trigger50%, morality−3/+3, JOIN targets, all item/quantity/stat/currency commands, battle outcomes, nested option targets, map links, original speaker IDs and save schema remain exact. All35 non-dialogue steps are retained at original positions. In particular:

- Decline retains Horus JOIN, Golden Serpent Sword Fragment×1, Serpent-Gold Sword×1, Black Silk Vest×1, Lifebloom Elixir×3.
- Accept still leads to the original Horus battle, whose outcome determines the next scene. Winning retains its original JOIN/gifts and parcel menu. Opening still grants20,000silver/hairpin and changes Focus−10; no added condition or rewritten amount.
- Losing still leads to the fare choice. Payment remains10,000silver; refusal still enters the original two-fight fare chain. VIP item commands remain original. Dialogue no longer promises an unverified20% service discount; actual VIP service behavior was not changed or tested.

The ten original segments, previous registration/companion/cast files and real194-silver source were backed up with bytes/hashes under `src/Game.Web/test-results/backups/pre-horus-ferry-8df777b/`. Previous compiled fingerprints retained for both languages. Old prose remains in original package, backups and Git. Source SHA unchanged: `c348d1bc161dbe3a9f9a321232526da75b8d3c7638db7fb2b089d30981e9bcd3`.

## One actual visit: no encounter selected

Source `grimm-return-once-main-complete-save.json`, SHA `a0689799c943503d71577b9bae10c782a8a28c8f9fccee9217f3e0975c3993f3`: world map, normal,11members,194silver,morality54, hero13, May10/Yin. Original stage1 flag exists, no Horus form in the party and no completed ferry meeting. Italian crossing victory is already complete, so its earlier toll encounter does not intercept this visit.

One isolated Chromium context imported the genuine source, verified full serialized values, then used the native map search “Windsong Ferry” and the actual map entry once. **The50%Horus encounter was not selected.** The native map omitted Horus and displayed only Back; the initial screenshot was inspected. There was no click of an absent NPC, second preview, refresh, reload or re-entry to obtain a different result.

The actual arrival was normally saved/exported, then this attempt stopped. Only `clock` and `location` changed: May11/Si, ferry map, world position(1237,429). Still11members,194silver,morality54; all characters/inventory/story/world-trigger fields, profile and battle history match the source. No dialogue, gold choice, morality award, JOIN or item reward was executed. No battle occurred. The original194-silver source is unchanged and the arrival result is separate; no Save/Load claim for a successful recruitment.

Run2026-10-29 18:50:49–18:50:58UTC; three harness checks passed, console/page/request/HTTP errors0. Actual390×844 headless cloud Chromium with mouse, not physical phone. Existing Denmark goal remains visible because that branch is unfinished; this screenshot is not proof of the new dialogue/name cards being displayed. Other ferry actors and broader UI are not claimed fully rewritten.

## Focused verification

One content and TypeScript/Vite frontend build passed; existing runtime-loader/large-chunk warnings remain. One Python/Node bilingual audit pair passed: exactly these10 compiled story bodies changed; all other bodies, including Grimm, Nephthys and the family chain, remain unchanged. All runtime definitions and original conditions/probabilities are exact. All78 steps/43 dialogue slots, speaker IDs, commands and choice targets match source structure, including restored decline slots.

Projection fixtures verify43 lines per locale, Isis/Horus/player/ferryman names, three menus, two local descriptions and exact Windsong Ferry/Stonebridge Hall terminology. They are static fixtures, not an unlocked scene. No whole-site suite, old battle or damaged-import test repeated.

The first post-run summary script requested a missing `hostHorus` report key; unavailable NPCs are omitted by the host and undefined keys by JSON. That KeyError is retained in `horus-ferry-first-result-summary-error.txt`. Optional-key reporting correctly records absence; no product change or second visit followed. The actual gameplay QA itself passed.

| Local artifact under `src/Game.Web/test-results/` | Bytes | SHA-256 |
| --- | ---: | --- |
| `horus-ferry-once.json` |218859|`5ff4197916c0a3f8276ccbfa554b41aa49cf10dfa4456d71e2fa7c94d86cb410`|
| `horus-ferry-once-not-triggered-arrival-save.json` |73006|`d55544821f8ee1462dbd671775bbdf035868a6f87ef93aabf53af89cf9c3f843`|
| `horus-ferry-frozen-audit.json` |2858|`7322f7b604ffcf84ef985253f46cfd61e074c59d03739bdf08abc990cecf42d5`|
| `horus-ferry-projection-audit.json` |2832|`b8fdca2d3a9779468467d990b938777bee1678a0e1915d82939f0724a332e1fb`|

NOT_RUN: the14-line intro/decline path, actual morality/JOIN/gifts, all acceptance/parcel/fare gameplay, native insufficient-funds behavior, Chinese playthrough and real phones. Those results remain static, not passed recruitments. Stage progress did not advance on this visit. Future normal travel can revisit this original probabilistic event, but this batch does not retry it. After a naturally completed decline route, Stonebridge Hall is the original next path; its events and Isis recruitment require another coherent batch. VIP teleport service is outside this subtree.

Suggested PR title: **Rewrite Horus's ferry meeting and nearby gold branches**

Description: Use a consistent Isis/Horus mother-son story for the existing gold choice and immediate parcel/fare consequences, with bilingual text and explicit existing destination names. Consolidate two old recruitment fragments under the ferry chapter, retaining all78 original steps and every rule/reward. Builds and focused bilingual checks pass. One native visit did not select the50%event and stopped without reroll; actual recruitment and combat branches remain untested. No merge/deployment; previous PR API `Forbidden` is not retried and no new PR is claimed.
