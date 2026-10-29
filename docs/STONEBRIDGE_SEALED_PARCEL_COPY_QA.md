# Stonebridge Hall: complete sealed-parcel narrative branch

Base `f23736a3edc947a601eda08b52be424c7e378086`, initially clean, same workspace/writer/branch. One complete alternative is delivered from its native entrance to the original world-map return. The opened-parcel branch is not partially rewritten here.

## Actual writing increment

New `chapter-stonebridge-sealed-parcel.json` owns **4 previously unadapted segments /37 bilingual dialogue slots**:

| Original suffix after `bixuejianShyou_` | Original steps retained | Dialogue slots |
| --- | ---: | ---: |
| 接金胜不开包裹石梁派1 |17|14|
| 接金胜不开包裹石梁派2 |14|11|
| 接金胜不开包裹石梁派3 |8|5|
| 接金胜不开包裹石梁派4 |17|7|

All56 source steps remain. No previously authored lines are recounted as new. Previously delivered companion/family material is not rewritten; the accepted ferry, decline-gold/Isis and duel-loss alternatives stay unchanged.

Horus recognizes Isis as his mother; there is no disguised-girl revelation, romantic jealousy or claim that the wardens are her grandfathers. The hero shows the still-sealed parcel, then asks who owned the recovered gold before it was stolen. Hathor argues on behalf of the villages. Isis wants the wardens satisfied the gold can be protected, and the original two fights remain. Afterward the gold and supplies follow the original reward commands, with distinct reactions from all five wardens and the original departure.

The existing cast remains Amun, Isis, Horus, Hathor, Bes, Sinuhe, Ra and Khonsu. Original US English and equivalent fantasy Chinese are newly written, without modern movie dialogue, actor likeness, new figures or art. The story does not implement or promise an extra donation, receipt item, countdown, handover condition or automatic delivery to villagers. Showing the parcel is dialogue, not a new removal/use instruction. “Two chests” is narrative inventory, not a new currency conversion or numeric reward.

## Display-only identity and title labels

Three original warden definitions share a source name with Bes. Their story-speaker IDs are distinct and, for these non-party NPCs, the existing host sends those IDs. Explicit dictionary labels for `温方山`, `温方悟`, `温方施` now display Sinuhe/Ra/Khonsu in the final reactions; unit views still use their ID/category-specific names. No character definition, rule-facing name, ID or casting status changed. These shared aliases also label the same speaker IDs in other existing appearances, without rewriting their dialogue bodies.

The original `石梁五祖` achievement displays **Stonebridge Victor / 石桥胜者**. Its internal ID and original `legacy_nick('石梁五祖')` instruction are retained; the existing host treats that instruction as an achievement unlock, not a player-name replacement. This is not a newly awarded title in QA.

## Original gates and outcomes frozen

Native hall event3 still requires `story_completed('bixuejianShyou_接黄金2')` and **not** `story_completed('bixuejianShyou_得黄金')`, once. It is a story-flag check; no new inventory-presence or sealed-item test is added.

Scene1 still jumps to scene2. Scene2's `石梁派_战斗3` must win to reach scene3. Scene3's `石梁派_战斗5` must win to reach scene4. **Both battles retain gameover on loss or timeout**: no copied decline-route “all outcomes advance” behavior. Battle definitions/AI, geometry, stats, growth/economy, map links and save schema are unchanged.

All19 non-dialogue source steps stay at their original positions. Scene4 keeps the six original×1 item commands (`黄金包裹二`, `万劫指`, `碧水剑`, `龙头拐杖`, `不二枪`, `软鞭`), original achievement ID and world-map return. No JOIN/leave, currency, Focus or opening instruction was added. Horus is already acquired in this route's earlier ferry-win branch; **this hall ending does not newly recruit Isis**. Parcel-opening20,000silver/hairpin/Focus−10 effects and all other story bodies remain unchanged.

Original four scenes, registration/cast files and both genuine194-silver saves were backed up with bytes/hashes under `src/Game.Web/test-results/backups/pre-stonebridge-sealed-f23736a/`; previous compiled fingerprints retained. Original JYX app/package, old prose and Git history remain. Source SHA unchanged: `c348d1bc161dbe3a9f9a321232526da75b8d3c7638db7fb2b089d30981e9bcd3`.

## One necessary content/static acceptance

One content build and one Python/Node bilingual audit pair passed without failed checks or reruns. Exactly these four compiled story bodies changed versus pre-edit fingerprints; every other body, including the opening-effect scene and completed alternatives, is unchanged. All56 steps, original speakers, all non-dialogue instructions and runtime definitions/conditions remain exact. Both battles' distinct fatal loss/timeout handling and original item/title positions were explicitly checked.

Projection fixtures verify all37 lines per locale, all five distinct warden reaction speakers and units, saved hero name, unchanged fixture inputs and the original achievement ID with its translated label. English contains no hidden CJK/old romance/family misidentification or modern film quote. Fixtures model the existing host's saved-player/non-party-speaker behavior; they are **not a scene unlock, screenshot or gameplay path**.

Local artifacts under `src/Game.Web/test-results/`; old failures and accepted artifacts retained. No broad regression, frontend/.NET build, old battle or bad-save test rerun.

| Artifact | Bytes | SHA-256 |
| --- | ---: | --- |
| `stonebridge-sealed-frozen-audit.json` |2256|`ad86dada6351b2283859ffcbe0cf8addc9aa699637827d13ab2b82f06c1b92a6`|
| `stonebridge-sealed-projection-audit.json` |1306|`3620723717d27773444101225f43d3708fa539d416d30a09557b7be45a3bdb62`|
| `backups/pre-stonebridge-sealed-f23736a/original-sealed-parcel-branch.json` |8768|`ab765829813c0778409aea93edbc297b767e3b586579c969024d8fa29d77cd30`|

## Actual boundary and remaining branch

The genuine194-silver source and ferry arrival lack `bixuejianShyou_接黄金2`; the only actual ferry visit did not select its50%meeting. No flag injection, arrival forgery, re-entry or combat occurred. **Entire sealed branch NOT_RUN**:37 lines in gameplay, both fights/outcomes, inventory/title award and Save/Load. No new item, title or party member reported.

The opened-parcel alternative remains **4 segments/33 source dialogue slots**, unchanged and still requiring its own complete narrative pass. Other later training/treasure, VIP services and all-game completion are outside this branch. The earlier duel-loss and decline-gold narratives remain delivered with their own unplayed-route limits.

Suggested PR title: **Complete Stonebridge Hall's sealed-parcel dialogue**

Description: Rewrite the four original sealed-parcel scenes with consistent Isis/Horus family roles, recovered-gold dispute, existing wardens and a complete two-fight ending. Add37 bilingual lines and ID-based warden/title display labels, preserving all56 steps, both fatal defeat/timeout outcomes, reward/achievement IDs and earlier opening/Focus behavior. Content build and focused bilingual frozen-flow/projection checks pass. Genuine saves lack the original ferry-win flag, so gameplay remains NOT_RUN. Opened-parcel writing remains separate. No merge/deployment; previous PR API `Forbidden` is not retried and no new PR claimed.
