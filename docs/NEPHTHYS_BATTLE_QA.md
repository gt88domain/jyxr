# Nephthys cave: one original combat route

Tested product HEAD: `be55c789f5bf488f221ead57a5a18687d0c477b0`, `feat/storybound-italian-battle`; initially clean. No product changes were needed. This batch adds the actual combat/victory evidence missing from [the adaptation delivery](NEPHTHYS_CAVE_ADAPTATION.md), rather than repeating the accepted Leave route. No merge or deployment.

## Source and bounded route

The genuine cave-before-talk save was protected and imported into a separate empty Chromium context: `crane-cave-leave-en-390-arrived-before-talk-save.json`, SHA `1f92b0e100b1de83669bead32fdf661d170cdb60e409717f69562391d93fc0b7`. Source, old Leave result, new Leave result/report and chapter copy were backed up with hashes under `test-results/backups/pre-nephthys-battle-be55c78/`. All five originals and backups remained unchanged at the end.

Actual path, once: Nephthys → seven English lines → first Stay → warning → second Stay → threat → original fight → victory → original token/journal/map instructions → Save → refresh → Load → export. All 12 authored English lines appeared. No Leave replay, random reroll, shopping, practice, party reordering, time/flag injection or numerical/core edits. The existing QA geometry/controller was reused with fresh host targets and reachable cells; only visible controls changed game state. Cloud Chromium at 390×844 with mouse, not a real phone.

## Real encounter

Normal difficulty, original party order, 11 members and 150 silver. Three deployed allies:

| Actor | Level | Opening Health / Energy | Ending Health / Energy |
| --- | ---: | --- | --- |
| Rowan | 13 | 1740 / 1260 | 1676 / 492 |
| Pinocchio | 15 | 1500 / 1500 | 1457 / 1386 |
| D'Artagnan | 17 | 1700 / 1250 | 1661 / 962 |

Opening encounter snapshot was tick48, after native scheduling reached the first player action. Nephthys had 800/800 Health and 800/800 Energy. The six naturally generated Vigil Attendants had maximum Health 560,560,490,490,700,560. Source Nephthys definition is level13; **enemy live levels and full skill lists are not exposed by the current view**, so source level is not presented as a measured runtime level. Random tier1 is not level1. All seven actual enemy definitions/positions/resources remain in the report.

One battle won at **tick189**, all allies alive, all seven enemies at0 Health. Seven legal moves and eight confirmed native casts: Rowan used Force Hammer four times, D'Artagnan Petalstorm Fist twice, Pinocchio Threefold Swordplay twice. Movement used current host reachable cells; casts used current host-authorized aims, actual MP and SkillCast events. Non-legend footprints matched the frozen geometry helper. No medicine or rest was used.

Observed enemy casts were Snowpeak Sword, Dawnlight Palm, Thousand Hands and Venom Fist. Nephthys herself had no observed SkillCast before defeat; this does not establish her full available skill set. This one build/random draw succeeding does not prove every build or draw succeeds.

## Actual settlement and storage

- Original postfight three lines appeared, after the two warning/threat lines: the previously static five are now actually observed in English. Received exactly one Venom Circle Token, 0→1; no other inventory additions or consumption. Silver150→184, party remains11, morality54.
- Character experience: Rowan+198, Pinocchio+192, D'Artagnan+192. Rowan's Force Hammer experience287→451. Pinocchio's Threefold Swordplay rank4/exp0→rank6/exp113 through the original study mechanism. No training data was injected. All other character fields, including equipment, and party order remain exact.
- Original four completed IDs added: `碧血剑_何红药1`, `碧血剑_何红药2`, `碧血剑_何红药3`, `碧血剑_何红药胜`. New won-battle ID: `何红药_战斗`. Profile deaths remain3, kills131→138; all other profile fields unchanged.
- Returned to Hidden Glade; year1/month5/day8 Yin→Mao. Original journal entries retained, one actual stored English entry appended: “Faced Nephthys’s wrath and received a Venom Circle Token.” This was checked in the exported journal; the journal UI was not separately reopened.
- Save→refresh→Load→export restored complete serialized `game`, `wonBattles` and `profile` exactly. Different file hashes reflect wrapper metadata, not different game results. Existing map recovery semantics remain; no claim of live battle continuation or exact battle-ending HP/Energy persistence.
- World-trigger state, prior main-story and Danish records unchanged. The downstream Venom Circle entrance checks the original victory flag, not token possession; its unlock execution was **not** visited or tested.

## Evidence and limits

Run: 2026-10-29 17:39:57–17:40:35 UTC. All three harness checks passed, console/page/request/HTTP errors0; sampled skill-menu Chinese gaps0. Actual battle and settlement screenshots inspected: no horizontal overflow or new overlapping names; existing ellipsis, unit numbers and legacy sprites remain. No art acceptance or all-page English claim.

Local artifacts in `src/Game.Web/test-results/`:

| Artifact | Bytes | SHA-256 |
| --- | ---: | --- |
| `nephthys-battle-once.json` | 802669 | `c2b7658cb3da85b09c0df2a182cb9bd19a017a29c30b07ebe07bc401a5bf96d4` |
| `nephthys-battle-once-victory-save.json` | 72428 | `0cbef847d269ac4eb9a1ac10a4cae9a2162dd675b8f201cfc7818d38f5a1b1b9` |
| `nephthys-battle-once-complete-save.json` | 72394 | `bc5ab14f2369bb8649d5a27c18f79d527a3aa77fcb2328c194fac3d1bc80a861` |

The post-run read-only audit initially requested nonexistent serialized property `equipment`; its KeyError is retained in `nephthys-battle-post-audit-first-error.txt`. Corrected comparison used actual keys and confirmed only experience/externalSkills changes. That was an audit mistake, not a game failure or second combat attempt. See `nephthys-battle-result-audit.json`.

No source fixes, full build, broad regression rerun, .NET rebuild or damaged-import retest: the product was unchanged and the previous batch's builds/30 checks remain applicable. Frozen package SHA remains `c348d1bc161dbe3a9f9a321232526da75b8d3c7638db7fb2b089d30981e9bcd3`. All earlier Denmark/Arthur failures and interrupted mountain battle evidence are retained; this win does not replace them.

NOT_RUN: cave loss/timeout/recovery, second-menu Leave, downstream unlock, other cave branches, Chinese combat route, other difficulties, new art and real phones. The selected Nephthys encounter is verified through victory/storage; the Egyptian chapter and full game are not complete. Next separate text scope is the adjacent Osiris/Isis/Horus family dialogue, whose original father/daughter and romantic phrasing still needs local adaptation; no such changes were made here. PR API `Forbidden` remains the previously recorded limitation; no new PR is claimed.
