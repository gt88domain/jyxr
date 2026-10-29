# Stonebridge Hall: complete ferry-duel-loss narrative branch

Base `3de29bae86fccbe3e1673e7041ff3740cab95757`, initially clean, same workspace/writer/branch. This batch completes one alternative from its native entry through original world-map return. It does not partially rewrite all three alternatives or replay the accepted decline-gold chain.

## Branch graph and chosen boundary

The three alternatives have no shared story-segment IDs, although some entrance dialogue is similar and battle definitions are reused:

| Native alternative | Segments through direct ending | Original dialogue slots | This batch |
| --- | ---: | ---: | --- |
| Opened parcel |4|33|Unchanged, pending|
| Sealed parcel |4|37|Unchanged, pending|
| Ferry duel lost/timed out |3|19|Complete bilingual narrative|

All three together are11 segments/89 source dialogue slots. The smaller complete loss branch was selected; its battle definition is shared with other routes, but its story outcome map remains distinct. No shared battle data was edited.

New `chapter-stonebridge-lost-gold.json` owns:

| Original segment | Steps retained | Dialogue slots | Increment |
| --- | ---: | ---: | --- |
| `bixuejianShyou_接金败石梁派1` |3|1|Previously unadapted|
| `bixuejianShyou_接金败石梁派2` |14|11|Previously unadapted|
| `bixuejianShyou_接金败石梁派3` |12|7|Coherently rewrites the old5-line fragment and restores2 original slots|

Total29 original steps/19 bilingual lines: **2 new authored segments/12 previously missing source slots**, plus one existing fragment rewritten to7 slots. The19 are not reported as19 previously missing lines. The old fragment moved out of `chapter-companions.json`, leaving17 dialogue-segment owners there; IDs and character aliases are unchanged.

## Coherent fantasy expression

The hero arrives during a dispute at Stonebridge Hall. Anubis asks the wardens to hear Hathor's claim; Amun and Bes insist on respect and proof of Horus's ability to protect the recovered gold. Anubis jokes that he weighs hearts for a living, and that feeding Horus indefinitely would cost the hall too much. The original battle follows. On victory, Horus apologizes for the ferry duel and agrees to travel with the hero toward **Highbridge**, where he needs to find a teacher. The original manual is offered as fighting notes.

Existing Anubis/Amun/Bes/Horus identities and the wider Isis family setting remain; no new person, canonical mythology claim, modern film quote, actor likeness or art. Teacher remains an unnamed role here rather than inventing a new casting decision. Other hall alternatives are not claimed consistent yet.

The original talk of a required gift was not backed by an item check or gift command in this branch. New text therefore asks for respect for the hall's rules, not a new donation, payment, fetch item or timed delivery. It does not claim gold was mechanically transferred to villagers. The story dispute/receipts are narrative; no new quest system is implied.

## Frozen original behavior

Native outer-hall event4 still checks `story_completed('bixuejianShyou_接黄金3')`, once. The segment1→2 jump remains. In segment2, the original `石梁派_战斗5` still wins→segment3 and loses/times out→gameover. It does **not** adopt the decline route's different outcome handling despite sharing a battle definition.

All10 non-dialogue steps across this branch, original speaker IDs and29 step positions remain exact. Segment3 ends with the unchanged `join('袁承志')`, `item('金蛇剑法秘籍',1)`, `map('大地图')`. This route recruits Horus, not Isis. No changed condition/probability, battle/AI, stats, growth/economy, currency, Focus, reward quantity, map connection, internal ID or save schema. Earlier parcel-opening rewards and other routes are untouched.

Original three segments, previous registration/companion/cast files and both genuine194-silver saves were backed up with bytes/hashes under `src/Game.Web/test-results/backups/pre-stonebridge-lost-3de29ba/`. Prior compiled fingerprints retained. Cast and saves remain exact. Original JYX application/source, old prose and Git history remain; source SHA `c348d1bc161dbe3a9f9a321232526da75b8d3c7638db7fb2b089d30981e9bcd3` unchanged.

## One focused static acceptance

One content build and one Python/Node bilingual audit pair passed, without failed checks or reruns. Exactly these three compiled story bodies changed; all other bodies, including47-line Isis/decline chain, ferry, Grimm and Nephthys, remain unchanged. Frozen-flow validation and exact runtime-definition comparisons pass. Branch-specific battle outcomes and final JOIN/manual/map instruction sequence explicitly checked; one content owner per migrated segment confirmed.

Projection fixtures verify19 lines per locale, names (including the existing Bes ambiguity resolution), exact Stonebridge Hall/Highbridge terminology, unchanged inputs, no CJK in authored English and no new gift/donation prerequisite. This is an isolated view test, **not scene arrival, UI screenshots, combat, reward execution or Save/Load**. No frontend/.NET build, broad regression or previous route test repeated.

Local artifacts under `src/Game.Web/test-results/`; earlier failures and accepted artifacts retained:

| Artifact | Bytes | SHA-256 |
| --- | ---: | --- |
| `stonebridge-lost-frozen-audit.json` |1817|`2c99539bd1a9657a2f4a73e8dc9e89f0e6c374579f24ee4d184e842154392523`|
| `stonebridge-lost-projection-audit.json` |902|`e0f96ac597995c2ec122ac0df3fbb7b53c9cb864f8a9cf7271893ce1f0519714`|
| `backups/pre-stonebridge-lost-3de29ba/original-lost-gold-branch.json` |5328|`fdb0f6377af949b94d04bae8e392aaba9fd5cdb79bb82d7d27f0c184716751db`|

## Actual prerequisites and remaining scope

Both real194-silver saves lack `bixuejianShyou_接黄金3`: the original sole ferry visit did not select Horus, and no acceptance duel was attempted. The actual entry does **not** add a separate Horus-in-party requirement; the missing original loss flag is the relevant gate. No forged arrival, edited flag, reroll or battle.

Actual three-scene route, its battle, Horus JOIN/manual, resource carry-over and Save/Load are **NOT_RUN**. No new progress/recruit/reward reported. Remaining alternatives are the sealed-parcel branch (4/37) and opened-parcel branch (4/33), totaling8 segments/70 original dialogue slots, plus later teacher/treasure material outside these direct endings. The next bounded writing batch can complete the sealed-parcel branch as one route; this is a next scope, not work already delivered.

Suggested PR title: **Complete Stonebridge Hall's ferry-duel-loss dialogue**

Description: Adapt one whole alternative entrance→dispute→battle-result→Horus recruitment branch using existing Egyptian characters and matching Chinese/US English. Rewrite19 source slots, including12 previously unadapted and2 restored from a compressed fragment. Preserve29 steps and all branch-specific rules/rewards; remove misleading prose about an unimplemented gift prerequisite. Content build and focused frozen-flow/projection audits pass; genuine saves lack the original loss flag, so gameplay remains NOT_RUN. Other hall branches remain pending. No merge/deployment; previously recorded PR API `Forbidden` is not retried and no new PR claimed.
