# Iron Sword: Cleopatra's return and Set's claim

Base `2b52838743e9e6c21c809e5e47bee4ad2c2d330b`, initially clean, same workspace/branch and sole writer. Unlike the preceding pursuit with an unresolved caller, this batch selects a short original chain with an explicit source-backed map event. The pursuit finding remains unchanged; it is not searched again or repaired with a new trigger.

## Selected scope and new writing

`chapter-iron-sword.json` newly owns four scenes/32 bilingual slots:

| Source segment | Original steps | New dialogue slots |
| --- | ---: | ---: |
| `bixuejianShyou_铁剑门0` |11|8|
| `bixuejianShyou_铁剑门1` |11|9|
| `bixuejianShyou_铁剑门2` |7|5|
| `bixuejianShyou_铁剑门3` |14|10|

All43 original steps, including11 non-dialogue steps, original speaker IDs and positions remain. The selected chain runs from a return visit through the original advanced-form JOIN, two fights and immediate item/achievement result. It does not extend through the earlier healing scene or later paired growth trial.

Horus asks after Cleopatra's training. She is ready to travel; the hero's surprise is about her confidence rather than her appearance or a forced romance. Set claims Imhotep's traditional authority with the recovered Iron Sword Token, then abuses that deference. The hero intervenes. After the first defeat, Set takes a dark pellet before the stronger original fight; crude bodily humor is removed. The original small golden serpent bites him and he collapses. Imhotep distinguishes leadership from obedience and entrusts the token and teaching manual to Cleopatra before departing. No marriage promise or change to Horus's parentage is invented.

Existing proposed identities Cleopatra (`阿九`/`九难`) and Set (`玉真子`/`炼狱玉真子`) retain one identity across their forms. Imhotep's existing local adoption and locked Horus remain. No casting metadata or approvals are changed. This is an original public-domain fantasy combination, not a claim that Imhotep and Set historically studied together or that this is a unique mythological canon. No modern film dialogue, actor likeness or new artwork.

Necessary display adds Set's two form aliases, **Crane Peak — Hidden Retreat / 鹤峰秘居** map title/description, the existing Horus return-location description, two battle titles and **Bearer of the Iron Sword / 铁剑传承者** achievement copy. Other unadapted locations on this shared map remain out of scope; the whole map is not claimed fully English.

## Native entry: exact source evidence

Original map `华山仙境`, location `袁承志`, once-only event1 calls `story('bixuejianShyou_铁剑门0')` under:

```
((in_team('袁承志') || in_team('华山袁承志') || in_team('儿时袁承志') || in_team('炼狱袁承志'))) && (!(in_team('阿九'))) && (story_completed('bixuejianShyou_华山派')) && (story_completed('mainStory_神秘剑客1'))
```

The event, map/location IDs, original absence test, earlier training/story flags and repeat mode are unchanged. No chance or wait condition is added. The earlier `华山派` healing/apprenticeship scene has its own original source event requiring the earlier Cleopatra form and capital-story flag; it is not rewritten, forced or counted here.

## Original JOIN, combat and rewards

- Scene0 keeps `join('九难')` at step8 before the battle chain. It does not rename, replace or merge the two Cleopatra definition IDs, inject a character or bypass capacity rules. Actual JOIN/capacity has not been played.
- First battle `铁剑门_战斗1` retains four ally slots, required hero, against original Set. It does not force Imhotep into the party.
- Second battle `铁剑门_战斗2` retains one ally slot, **party index0**, with no required-character override, against the stronger Set form. The dialogue does not promise a forced Horus duel or change party order.
- Both original loss and timeout outcomes remain gameover. Only original victories advance to scenes2 and3. Set's pellet is narrative; no inventory consumption, new buff or altered stats are introduced.
- The ending keeps exactly Iron Sword Token×1, Open Sky Sword Manual×1 and the original achievement ID `苍穹碧落`. No direct skill learning, stat growth, transformation, silver, new membership rule or map-return command is added. A teaching manual in inventory is not automatic mastery or equipment.

The achievement description says the token and manual were received, rather than the old prose's unsupported automatic sword mastery. Original item IDs/effects and unlock calls remain unchanged.

## Targeted checks and a terminology correction

The first content build succeeded, but both focused checks rejected the authored **Scroll** term: the existing `rpg-guides-v1` rule normalizes sword-study items and dialogue to **Manual**, while the new achievement prose still said Scroll. A read-only compiled projection confirmed the actual backpack label **Open Sky Sword Manual / 长空剑术手册**. The new dialogue and achievement copy were corrected to that existing terminology, not the learning system or source item owner.

After that product-copy revision, content was rebuilt and the same focused Python/Node bilingual pair rerun; both passed. This is a recorded initial failure and necessary correction, not a first-run pass. No old battle or broad suite was repeated. Final build:162 maps/1887 story segments.

Frozen checks prove exactly these four compiled story bodies changed against baseline fingerprints. All other story bodies, including healing, later paired growth, pursuit and prior Highbridge/apprenticeship scenes, are unchanged. Every original non-dialogue step/speaker position, map event, battle layout, required character, stat/effect, reward quantity and save structure remains original.

Projection fixtures verify all32 lines in both locales, five speaking identities, both Cleopatra/Set forms, map/entry labels with unchanged event data, the existing token/manual labels, achievement name/description with stable ID, battle titles, saved hero name Rowan and non-mutated inputs. No browser,320/390px rendering, physical phone, normal arrival, fight, JOIN, item grant, achievement unlock or Save/Load is claimed. No frontend/.NET build or broad test suite.

## Protected source and real-play boundary

Source SHA remains `c348d1bc161dbe3a9f9a321232526da75b8d3c7638db7fb2b089d30981e9bcd3`. Original four scenes, registration, cast and two genuine194-silver saves were backed up under `src/Game.Web/test-results/backups/pre-iron-sword-2b52838/`, with pre-edit compiled fingerprints. Cast and genuine saves remain byte-identical:

- Grimm return:73000B, SHA `a0689799c943503d71577b9bae10c782a8a28c8f9fccee9217f3e0975c3993f3`.
- One-visit ferry arrival:73006B, SHA `d55544821f8ee1462dbd671775bbdf035868a6f87ef93aabf53af89cf9c3f843`.

Ignored local evidence:

| Artifact under `src/Game.Web/test-results/` | Bytes | SHA-256 |
| --- | ---: | --- |
| `iron-sword-frozen-audit.json` |2749|`6009c8fd23cc5d36e355ae7785d9d41c9b68eb773bd86848255dae3315c70088`|
| `iron-sword-projection-audit.json` |3316|`c4d1d783951f659cca61968b72c96eed62be9c8f2478601cc58bc4062a30020d`|
| `backups/pre-iron-sword-2b52838/original-iron-sword.json` |7486|`c8514d07a149d1617cb94480796bc0e6c070af4842d6546295d75c44794c3cb4`|

Both genuine saves lack Horus, `bixuejianShyou_华山派` and `mainStory_神秘剑客1`. Thus the proven entry does not justify a visit from those saves: **whole actual chain NOT_RUN**. No forced script, flag, time change, random retry, reordered party, training or combat is used to fabricate arrival. Original apps/prose, saves, art candidates, prior failed/interrupted QA and live-vitals restoration boundary remain. This is a content increment, not another completed chapter or full-game clear.

The adjacent later paired growth trial `华山仙境变身01/02/03` has a separate source map entry requiring Horus, `九难` and completed `铁剑门3`. Its three scenes/four original dialogue slots and choice remain unadapted, and its original growth commands are not executed here. Earlier healing and capital/army stories also remain separate work. The earlier pursuit entry remains unresolved.

Candidate on the existing branch only; no merge/deployment or new PR claim. Suggested title: `feat(worlds): adapt Iron Sword return and Set encounter`. Body: “Adapt four source-backed return/test/reward scenes,32 bilingual slots and their necessary display. Preserve43 steps, original JOIN, party-index0 second fight, fatal outcomes and two-item/achievement rewards. Align new copy with the existing Manual naming. Content build and targeted frozen-flow/projection checks pass after the terminology correction; actual route NOT_RUN because genuine saves lack prerequisites.” Prior GitHub GraphQL Forbidden is not retried.
