# Hostile parcel follow-up: Crane Hall and the Iron Sword Token

Base `3e3425f9152e5434aa76108e27de7a5141776624`, initially clean; same workspace, branch and sole writer. Used the existing ownership/native-entry inventory to select a complete unadapted hostile continuation. The completed display fix, dual-mentor text and unlocated pursuit caller are not replayed or researched again.

## New writing: four scenes,46 bilingual slots

New owner `chapter-hostile-followup.json` contains:

| Original segment | Original steps | New dialogue slots |
| --- | ---: | ---: |
| `bixuejianShyou_包裹线end4` |7|5|
| `bixuejianShyou_包裹线end5` |11|7|
| `bixuejianShyou_包裹线end6` |27|22|
| `bixuejianShyou_包裹线end7` |18|12|

All63 steps retain46 original speaker positions and17 exact non-dialogue steps. Anubis/Thoth confront the traveler after the earlier theft and threats. Imhotep and Set form an uneasy defense of their tradition. The protagonist wins, extorts the token and manual, then faces Set's counterattack and final serpent reprisal. This remains an aggressive player route; it is not rewritten into friendly recruitment, an extra moral choice or an automatic reconciliation.

Existing Anubis, Thoth, Imhotep, Set and locked Horus identities remain. The stronger Anubis alias is explicitly displayed without changing that source form. Set's mixture of pride, bargaining, trickery and a final defense of the order is original fantasy adaptation; no claim is made that the plot is historical or canonical mythology. The old martial-family brotherhood, external-novel joke, profanity and named comparisons to unrelated internal skills are replaced with US English and matching fantasy Chinese. No new named character, modern-film wording, image or animation.

The previously untranslated map `华山派` now displays **Crane Hall / 鹤峰会馆**, with a neutral location description. Its ID, picture, position, connections and events are unchanged. Anubis's active caption signals the theft-related hostility. Three original battles receive titles. The existing mastery/manual, notes, sword and token names are reused.

## Source-backed original entry

Map `华山派`, location `黄真`, event1 remains once-only:

```
action: story('bixuejianShyou_包裹线end4')
when: (story_completed('bixuejianShyou_包裹线end'))
```

This is the earlier hostile parcel result, not the friendly sealed-parcel/Isis flag or a newly invented possession/morality condition. No caller is added, repeat rule changed or source condition tightened to require the later end3. The prior opened-parcel scenes and original Horus leave remain unchanged.

## Original battles, gift timing and final price

All three battles keep four ally party slots and required hero:

| Battle ID | Original enemies | Loss/timeout |
| --- | --- | --- |
| `华山仙境_灭华山` |strong Thoth, strong Anubis, Sobek, **Horus**|gameover|
| `华山仙境_灭铁剑1` |Imhotep, Set|gameover|
| `华山仙境_灭铁剑2` |strong Set|gameover|

Horus remains an opponent after the earlier betrayal, not a newly restored ally. No line-up, difficulty, random participant, skill, AI or damage change. Only original victory advances to the next scene.

Reward order is preserved rather than moved to the final victory:

1. After first victory, scene5 gives **Sharp Mind Notes×1** and **Awakened Serpent Sword×1**, before the second fight.
2. Scene6 gives **Iron Sword Token×1** and original title ID `铁剑掌门`, then **Iron Banner Mastery Manual×1**, before the third fight.
3. Only the final original victory reaches scene7 and applies hero **max Health−200, max Energy−200, 根骨−5, 臂力−5**, followed by the original world-map return.

The items are inventory awards, not auto-equipped weapons or automatically learned talent/mastery. No items, silver, morality, JOIN/leave, affiliation, skill clearing, surrender mechanic or new map/faction deletion is added. The demand to break a sword is refused in dialogue; no weapon-disarm mutation occurs. Venom explains the existing attribute loss; no new Poison buff, antidote, cleanse or restoration rule is implemented. Persistence/rollback after a later defeat is not claimed tested.

Per-ID display names the original achievement **Iron Sword Usurper / 铁剑篡位者**, describing forced possession of the token. It remains the original unlock call at the original position; it does not make the player an actual new school leader. The same-ID talent's existing view and all raw achievement metadata remain unchanged.

## Necessary acceptance

One content build passed:162 maps/1887 story segments. One Python/Node bilingual pair passed first run. Source-flow checks cover the native entry, all46 lines/63 positions,17 exact non-dialogue steps, all three fatal loss/timeout targets, original ally/enemy positions including enemy Horus, the four items and original title timing, final four stat losses, and world-map return. Exactly these four compiled bodies change; every other story, runtime definition, condition and original achievement record remains exact. Only the selected scoped title display changes.

Projection fixtures check five speaking identities, saved Rowan, the new map/native caption with original event data, all seven original enemy labels/forms, existing notes/sword/token/mastery names, three battle titles, and the ID-scoped title without altering its same-ID talent. These are source/host-shaped isolated views, not actual battles or unlocked achievements.

No frontend/.NET build or existing code-unit suite rerun: this batch changes only content/registration/receipts and uses the already accepted per-ID display mechanism. No browser/DOM/320/390px, physical phone, normal arrival, fight, item use, title unlock, stat mutation or Save/Load. No forced script, fake prerequisite, probability retry, new training or party reorder. Prior failed/interrupted evidence remains.

## Preserved evidence and current boundary

Original source SHA remains `c348d1bc161dbe3a9f9a321232526da75b8d3c7638db7fb2b089d30981e9bcd3`. Original four scenes, registration/cast, prior full bilingual packs and two genuine194-silver saves are preserved under `src/Game.Web/test-results/backups/pre-hostile-followup-3e3425f/`, with bytes/SHA manifests. Cast and genuine saves remain byte-identical:

- Grimm return:73000B, SHA `a0689799c943503d71577b9bae10c782a8a28c8f9fccee9217f3e0975c3993f3`.
- One-visit ferry arrival:73006B, SHA `d55544821f8ee1462dbd671775bbdf035868a6f87ef93aabf53af89cf9c3f843`.

Ignored local artifacts:

| Artifact under `src/Game.Web/test-results/` | Bytes | SHA-256 |
| --- | ---: | --- |
| `hostile-followup-frozen-audit.json` |2702|`aa868bfc1d4267163e058f0482969f0e0661c5726967ae375bdd75ab2b5721b6`|
| `hostile-followup-projection-audit.json` |4413|`150f56d4ea85b90ed11ebc1b4d72ee0d6d5100b6676e50eac5bf3648d7da4e8f`|
| `backups/pre-hostile-followup-3e3425f/original-hostile-followup.json` |11146|`eaed5b6612b5626624a686b52f79f19b12ca04c3f820fb0b9429deb5c63fff45`|

Neither genuine save completed `包裹线end`, so **all four scenes/three fights and their consequences are NOT_RUN**. No hostile predecessor was injected, actor changed side in a save, reward given or stat penalty applied. Byte preservation is not in-game Save/Load or exact live-vitals restoration. Original app/prose, existing candidate art and all previous saves/failures are retained. This is46 new text slots, not another clear or complete Egypt route.

## Next bounded source candidate

Remaining checked prefixes include a source-backed sacred-place/cave chain: `碧血剑_五毒教圣地1/2`, `碧血剑_五毒教金蛇窟`, `碧血剑_五毒教金蛇剑`, four scenes/eight original dialogue slots. At `五毒教` / `五毒教深处`, the original won-Nephthys event precedes the `true` fallback; `金蛇窟` / `金蛇剑` has an original `true` story entry. The genuine194-silver source already contains `碧血剑_何红药胜`. The full route connections, item/choice conditions and current normal reachability still need checking before any visit; no arrival or sword award occurred here.

The legacy VIP-named ferry group and unlocated pursuit caller remain separate, unimplemented/untested scope. The checked prefixes are not a census of every Egypt/cross-country story. No new unproven next entry or whole-region completion percentage is claimed.

Existing candidate branch only; no merge/deployment/new PR. Suggested title: `feat(worlds): adapt hostile hall and token follow-up`. Body: “Adapt four source-backed hostile follow-up scenes/46 bilingual slots with existing Western cast and necessary display. Preserve63 steps, original three fatal battles including enemy Horus, four item awards, title timing and final hero penalties. Content build and targeted bilingual frozen-flow/projection checks pass; all actual scenes and battles NOT_RUN because genuine saves lack the hostile predecessor.” Prior GraphQL Forbidden is not retried.
