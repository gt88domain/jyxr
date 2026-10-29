# Osiris family: two-scene bilingual writing batch

Base `9ccf7369f7d9df8305ab547775f08b58f5ed066d`, initially clean, same writer/workspace/branch. This adapts the two requested scenes; it does not replay Nephthys combat or complete the Egyptian story.

## Exact product scope

New `chapter-egypt-family.json`, registered after the cave chapter:

| Original segment | Steps retained | Dialogue slots | Adapted situation |
| --- | ---: | ---: | --- |
| `bixuejianShyou_金蛇郎君` | 8 | 5, starting at step2 | Osiris takes a short break from the underworld to test Horus; Isis asks her husband to go easy on their son. |
| `bixuejianShyou_金蛇败` | 27 | 6, starting at step2 | Isis persuades Osiris to accompany the family and follow his treasure map. Family treasure replaces dowry framing. |

All 11 slots have original US English and matching fantasy Chinese. Examples: “Try teaching our son without flattening him, dear.” / “A short trip, a few directions, hardly any paperwork.” These are new jokes using ancient mythological figures, without modern film quotations, actor depictions or new artwork.

The local family agrees with Nephthys's scene: she is Osiris/Isis's sister; Isis and Osiris are Horus's parents. Horus's locked identity and forms remain untouched; Osiris/Isis candidates are not globally locked. No claim to a single definitive mythology or complete family-line rewrite.

The existing Osiris candidate receives its local speaker name. Exact description labels `金蛇郎君夏雪宜` and its punctuated event variant receive bilingual trial copy. This avoids a global actor-description override leaking the lesson onto his separate treasure location, which remains unchanged. Other old location copy can still be Chinese.

## Freeze and originals

Original speaker IDs, step counts/order, music/background commands, battle/outcomes and reward positions remain. In particular, all 21 non-dialogue steps in `金蛇败` still grant the same points/stats/skills/talent/max-level increment, join the same actor ID, award the same sword ID and return to the world map. No conditions/probabilities, combat, growth/economy, maps or save schema changed.

Frozen source SHA: `c348d1bc161dbe3a9f9a321232526da75b8d3c7638db7fb2b089d30981e9bcd3`. Before editing, the original two segments, registration file, cast table and genuine victory save were retained with bytes/hashes in `src/Game.Web/test-results/backups/pre-egypt-family-9ccf736/`. Cast/save originals remain exact; previous compiled segment fingerprints were captured for both languages. Original JYX application, source and Git history remain.

## One focused acceptance, static only

Content build and one Python/Node audit pair passed for both languages:

- Exactly these two compiled segments changed versus the pre-edit fingerprints; all other segments, including Nephthys, stay unchanged.
- Original 8/27 steps, 11 slots and speaker IDs retained; every non-dialogue step matches frozen source exactly. All runtime definitions outside browser/story presentation layers remain exact; existing frozen-flow validation passes.
- Isolated presentation fixtures show Osiris/Isis/Horus and 奥西里斯/伊西斯/荷鲁斯, translate both trial descriptions, preserve input objects and keep the other Osiris location's description separate. All11 compiled lines match their authored locale. English has no CJK or old daughter/dowry/son-in-law wording.

These are fixtures, **not actual scene arrival, gameplay or screenshots**. No frontend code changed; no new frontend/.NET build, broad regression, damaged-import test or old combat was repeated. The previous30-check result is historical, not rerun here.

Local evidence under `src/Game.Web/test-results/`:

| Artifact | Bytes | SHA-256 |
| --- | ---: | --- |
| `egypt-family-frozen-audit.json` |1123|`f0148682d4eafd7f9d5f8b19695e86581392594b4537a918f66cf67ca1d8cbbe`|
| `egypt-family-projection-audit.json` |1079|`6935e69ed2a07a500db086f73927bf04f52dbd252b77d3fcedd951272cd542e2`|
| `backups/pre-egypt-family-9ccf736/original-family-segments.json` |5056|`3458625f2a4bdeb5e894fdaa31a37ab52fcead0eaf17723ae2bbd263a0563e04`|

## Reachability and remaining work

The real preserved11-member/184-silver victory save has no Horus form or Isis in the party and lacks `mainStory_黑暗的阴影1`. The native entry requires all three. No normal noncombat shortcut was established; actual scene display, battle, rewards/join and Save/Load for these scenes are NOT_RUN. No forged arrival, edited save, forced flag or extra fight was used.

Adjacent `bixuejianShyou_金蛇胜1` still contains one original `乖女儿` line before its next battle. It is outside this requested two-scene batch and remains explicitly unadapted; the whole family sequence is not yet consistent. Other success/treasure scenes need separate writing. Next minimal text scope is that bridge and the adjacent success send-off, without changing battle/reward branches. No whole-chapter completion percentage.

No merge/deployment. Previously recorded PR discovery returned `Forbidden`; no API retry or new PR claimed.

Suggested PR title: **Adapt Osiris's family trial and treasure invitation**

Suggested body: Replace father/daughter, suitor and dowry dialogue in two scenes with a bilingual Osiris/Isis/Horus family trial and treasure outing. Preserve all11 slots and gameplay instructions. Content build and focused bilingual flow/projection audits pass. Actual route untested because the protected normal save lacks original prerequisites; adjacent bridge remains pending.
