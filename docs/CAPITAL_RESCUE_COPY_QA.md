# Palace rescue: Cleopatra's injury and Imhotep guidance

Base `751fa85f0c61c1543c417717b4b8b44cd1b4733a`, initially clean; same branch/workspace and sole writer. Read all five original capital scenes, existing Cleopatra cast and completed recovery/training copy before selecting a finite rescue leg. This batch does not rewrite the earlier meeting, the completed45-slot recovery/return/trial text or the wider army/political arc.

## Selected increment: three scenes,18 slots

`chapter-capital-rescue.json` newly adapts:

| Source segment | Original steps | New bilingual dialogue slots |
| --- | ---: | ---: |
| `bixuejianShyou_京城行3` |4|1|
| `bixuejianShyou_京城行4` |13|10|
| `bixuejianShyou_京城行5` |13|7|

All30 steps,18 speaker positions and12 non-dialogue steps remain original. Ptah reports fighting in the palace. Cleopatra urges Ramesses II to leave safely; he treats her departure as betrayal and attacks. Horus intervenes, then honors Cleopatra's request not to execute him. Her left-arm injury leads naturally to seeking Imhotep at Crane Peak.

Ramesses II locally adopts the existing proposed `eg.ramesses-ii` candidate. The existing Castle Guard archetype is used for `太监`; Ptah, Cleopatra and locked Horus reuse their identities. Casting metadata is unchanged. The former father/daughter and Horus's murdered-father claims are replaced with an original royal conflict; no family relation is invented between Ramesses and Cleopatra. This is public-domain fantasy adaptation, not a historical event or modern-film dialogue/likeness.

The injury is expressed as a severe left-arm wound. Its original mechanical consequences remain. No new amputation, limb-regrowth, damage, status effect, sword handover/unequip or healing system is implemented. The mercy outcome remains fixed dialogue; no new kill/spare choice or morality award is added.

Necessary display covers Palace Gate title/description, Ptah's exact entry description, Royal Apartments button, return text using existing **Liberty Crossing**, Ramesses/guard names, the battle title, Palace Champion exact-name label, original achievement and journal text. No map is moved to a different country and no path is added. The shared city's other stories and original artwork are not claimed complete.

## Source-backed rescue entry and unchanged prequel

Map `天安门`, location `孙仲寿`, once-only event1 calls `story('bixuejianShyou_京城行3')` with exactly:

```
((in_team('阿九'))) && (story_completed('bixuejianShyou_京城行2'))
```

The earlier meeting has a separate proven entry at `公主寝宫` / `阿九`: Horus in one of the four original forms and original Isis-form `温青青` absent. It calls `京城行1`, which advances to `京城行2`; that original second scene owns the Cleopatra JOIN and world-map return. Those two bodies remain unchanged and still contain old dialogue. Their26 original slots are **not** part of this18-slot delivery, and the entire capital chain is not called English-complete.

## Frozen battle, injury and direct result

Scene3's original jump to4 remains. Scene4 keeps `崇祯_战斗`, required IDs `袁承志`/`阿九`, four ally slots, original Ramesses plus four Masked Assassins, and eight tier3 random Palace Champion participants. No random selection, AI, difficulty, stat, position or participant is changed. Original loss/timeout remains gameover; only victory advances to5.

Scene5 retains exactly its original music, `change_stat('阿九', '臂力', -30)`, `change_stat('阿九', '定力', 30)`, `journal('阿九断臂')`, `legacy_nick('剑光殿前')` and world-map return. No JOIN/leave, skill, item, currency, morality or extra reward command is added. The original achievement ID displays **Escape from the Palace / 脱离王宫**. The raw journal text/command stays `阿九断臂`; display explains the wound, Strength−30, Focus+30 and seeking Imhotep.

**The healing scene's original entry checks completed `京城行1`, not injury scene5 or a new wound flag.** This loose source condition is preserved. The new narrative guidance is not a mechanical prerequisite or a claim that the rescue must be completed before every possible recovery route. No new journal flag, story condition, timer or navigation command is introduced to force the intended order.

## Necessary verification

One final content build passed:162 maps/1887 story segments. One focused Python/Node bilingual pair passed first run. Exactly these three compiled bodies change; all others, including the26-slot meeting and previously completed recovery/return/training text, are unchanged. Frozen-flow and exact runtime-definition checks passed, covering original speakers, all12 non-dialogue steps, native entry, fixed/random lineup, fatal outcomes, both stat changes, original journal/achievement identifiers and map return.

Isolated view fixtures verify all18 lines, six speaking identities, gate/entry/navigation labels with unchanged events, battle title, an exact-name random-enemy fixture and achievement identity/copy. The journal's English display is checked through the existing `translateUiText` helper, matching the unchanged host journal string and its UI labels; Chinese is a dictionary check only. The journal is not appended, and no DOM or live journal UI is claimed. The random-enemy check does not validate runtime-generated suffixes or an actual random roster.

No frontend/.NET build, broad suite, actual browser/320/390px/physical phone, arrival, fight, wound/stat mutation, title unlock, recovery, JOIN or Save/Load. No flag injection, forced script, time change or probability retry. Earlier failed/interrupted battles remain untouched.

## Preservation and unverified boundary

Original source SHA remains `c348d1bc161dbe3a9f9a321232526da75b8d3c7638db7fb2b089d30981e9bcd3`. Original three scenes, registration/cast, compiled fingerprints and both genuine194-silver saves are backed up under `src/Game.Web/test-results/backups/pre-capital-rescue-751fa85/`. Cast and genuine saves remain byte-identical:

- Grimm return:73000B, SHA `a0689799c943503d71577b9bae10c782a8a28c8f9fccee9217f3e0975c3993f3`.
- One-visit ferry arrival:73006B, SHA `d55544821f8ee1462dbd671775bbdf035868a6f87ef93aabf53af89cf9c3f843`.

Ignored local evidence:

| Artifact under `src/Game.Web/test-results/` | Bytes | SHA-256 |
| --- | ---: | --- |
| `capital-rescue-frozen-audit.json` |2459|`50d032252097e39ee6146978b9fe9d5f9b8ebc38c54227ceaa519e2e10e7fa4b`|
| `capital-rescue-projection-audit.json` |2438|`0958ac486f57eb9d3272a9b1e9a395beba841a80736d37c7124620bb7ca5aad8`|
| `backups/pre-capital-rescue-751fa85/original-capital-rescue.json` |4641|`e8e927b653abb43b73925c21f0d052c6409946da029639eb13bbe677b4adf6b3`|

Both genuine saves lack `阿九` and completed `京城行2`, so the actual rescue and linked recovery sequence are **NOT_RUN**. No arrival or valid prequel is fabricated. Byte preservation is not in-game Save/Load or exact live-vitals restoration. Original app/source prose, prior candidate art and all earlier saves/failures remain.

Remaining within the immediate capital setup: `京城行1/2`, two source-backed scenes26 dialogue slots. Wider army/political stories, unresolved earlier pursuit entry, complete Egypt routes and real-play acceptance remain separate. This delivery adds18 slots only; it is not a new chapter clear or proof of full-game playability.

Existing candidate branch only; no merge/deployment/new PR. Suggested title: `feat(worlds): adapt palace rescue and Cleopatra wound guidance`. Body: “Adapt three original gate/rescue scenes/18 bilingual slots and necessary display. Preserve30 steps, required pair and random battle roster, fatal outcomes, original Strength−30/Focus+30 and journal/title calls. Content build and focused frozen-flow/projection checks pass; actual rescue NOT_RUN because genuine saves lack prerequisites. Earlier meeting remains a separate26-slot task.” Prior GraphQL Forbidden is not retried.
