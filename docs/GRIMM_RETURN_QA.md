# Grimm return: original world-stage encounter

Base `792bd835e787539432c3c0c725a75b23a98ec421`, initially clean, same writer/workspace/branch. One real route from the protected11-person/184-silver save; no replay of Nephthys, Denmark, Arthur or previous family audits. No merge/deployment.

## Product change

`chapter-grimm-return.json` adds **5 segments /18 bilingual lines**, registered in the existing skin:

| Original ID | Steps retained | Dialogue slots |
| --- | ---: | ---: |
| `mainStory_黑暗的阴影1` | 5 | 2 |
| `mainStory_黑暗的阴影2` | 5 | 2 |
| `mainStory_黑暗的阴影胜` | 5 | 2 |
| `mainStory_黑暗的阴影负` | 5 | 2 |
| `mainStory_黑暗的阴影3` | 14 | 10 |

The hero answers Grimm's short letter, encounters an uninvited masked scout, and then hears Grimm's suspicion that someone is meddling with the stories. This replaces old restart-the-game jokes and a retrospective claim that the new opening had explained an evil shadow. Original US English and equivalent fantasy Chinese keep the light tone without adding a named villain, a new country-count objective or new quest mechanics. The already classified masked-assassin identity and Grimm stay unchanged.

The existing battle displays **The Uninvited Guest / 不速之客**. Its actual skill reference matches **Blackfire Lance / 黑焰法枪**. The journal gives the same plot fact and practical preparation guidance through the original journal instruction. Grimm's home description is neutral books/notes/visitor space, so it no longer promises Grimm is sitting reading while an assassin is waiting. The already-authored invitation's warning about permanently closing unfinished encounters remains untouched.

All34 steps and original speaker IDs remain. Both battle outcomes still converge on the same10-line Grimm explanation and original world-map return. No changes to conditions, order, battle parameters, stats, growth, economy, rewards, map links, IDs or save format. The only altered command string is display-only journal text at its original position. Runtime rule definitions retain original values and names; labels use the existing projection catalog.

Original five segments, registration file, cast and genuine save were preserved before editing under `src/Game.Web/test-results/backups/pre-grimm-return-792bd83/`, with bytes/hashes and previous compiled segment fingerprints. Original JYX source/app, old writing and Git history remain. Frozen package SHA remains `c348d1bc161dbe3a9f9a321232526da75b8d3c7638db7fb2b089d30981e9bcd3`.

## Native entry and one actual route

Source `nephthys-battle-once-complete-save.json`, SHA `bc5ab14f2369bb8649d5a27c18f79d527a3aa77fcb2328c194fac3d1bc80a861`: normal,11party,184silver,morality54, hero13, Hidden Glade, May8/Mao. The invitation was already completed; return-stage flag was absent.

Original NPC event8 requires that invitation. Earlier event7 is an uncompleted once-only home chat with40% chance; tutorial events also retain original priority. The isolated QA was limited to one native interaction: stop/recover if that chat took priority rather than reroll. **This run naturally selected the main opening on the first click.** No incidental home reward or proficiency was claimed.

Actual path: Hidden Glade Return→Crane Peak Return→world-map destination search “Grimm”→native home→save before visit→click Grimm once. Direct return links have no mountain ambush. One original fight followed, then the winning branch and Grimm explanation returned to the world map. Source enemy definition is13; live enemy levels/full loadouts are not exposed by the battle view.

| Actual deployed ally | Level | Opening Health/Energy | Ending Health/Energy |
| --- | ---: | --- | --- |
| Rowan | 13 |1740/1260|1740/892|
| Pinocchio |15|1500/1500|1500/1428|
| D'Artagnan |17|1700/1250|1700/1106|
| Milady de Winter |11|1200/1040|1200/1040|

The original masked assassin had1800Health/600Energy. First player-action snapshot tick48; **win at tick95**, all allies alive. Four legal moves, four native casts: Rowan used Iron Seal Strike and Force Hammer, D'Artagnan Petalstorm Fist, Pinocchio Threefold Swordplay. Actual host targets/reachable cells, MP changes and non-legend footprints were checked by the existing controller; no unsupported geometry, medicine, rest, changed AI or repeat attempt.

Exactly16 current-branch English lines were observed in runtime and dialogue DOM. The two losing-branch lines are static only. At390px the home and battle checks found no horizontal overflow; battle and result screenshots inspected. Existing ellipsis/unit numbers and legacy sprites remain. This is headless cloud Chromium with mouse, not a physical phone, and not a claim every world-map card is English.

## Real consequences and storage

- Silver184→194; one original random **Traveler's Robe** drop (`粗布道袍_00000014`), with its actual generated affix retained in the exported save. All prior inventory entries unchanged; no items consumed. This is an observed random result, not a promised fixed quest reward.
- Character experience: Rowan+52, Pinocchio+49, D'Artagnan+49, Milady+46; no character level changes. Party stays11 in the same order, morality54. Profile deaths remain3, kills138→139; all other profile fields unchanged.
- Newly completed `mainStory_黑暗的阴影1`, `mainStory_黑暗的阴影2`, `mainStory_黑暗的阴影胜`, `mainStory_黑暗的阴影3`; original won-battle ID added. May8/Mao→May10/Yin through normal travel/interaction. World-trigger record remains `legacy-global-1` only.
- One journal entry appended, previous entries retained: “A masked scout attacked at Grimm’s home. Someone is watching our travels. Keep the party prepared and follow the clues.” Stored journal verified; its separate UI panel was not reopened.
- Normal Save→refresh→Load→export restored complete serialized `game`, `wonBattles`, `profile` exactly. Existing map recovery semantics remain; no live-battle HP/Energy persistence claim. Different file hashes reflect wrapper metadata.
- The184-silver original and backups are unchanged. Stage advancement is in this independent194-silver QA continuation, not written over earlier branches. The new stage flag genuinely changes original route eligibility: nine source events include a negative check for it, affecting early appearances at Goemon's home, Kai's home, a camp, a town, a mountain servant, a tomb and an inn. This is **not** a claim nine currently open quests were lost. Original warning and all conditions remain; no blanket promise that unfinished routes remain available after advancing.

## Validation and artifacts

One content build, TypeScript/Vite frontend build and focused Python/Node bilingual audit pair passed. Existing runtime-loader and large-chunk warnings remain; no.NET rebuild or broad regression suite. Exactly these five compiled story bodies changed; invitation, family chain, Nephthys and all other bodies are unchanged. All runtime definitions/conditions and non-display instructions remain exact. Projection checks cover18 lines, Grimm/player/assassin names, battle title, exact skill term and original closure warning. No failed check or gameplay rerun in this batch.

Actual run: 2026-10-29 18:32:28–18:33:02UTC, four harness checks passed, console/page/request/HTTP errors0. Local `src/Game.Web/test-results/` evidence:

| Artifact | Bytes | SHA-256 |
| --- | ---: | --- |
| `grimm-return-once.json` |565941|`2e10a5d84fae676448a419419aff0d5b06aeac2c966df6f7cd22087c6e9690ba`|
| `grimm-return-once-main-outcome-save.json` |73022|`349c843446cf886fbbeee3fa587fdf7d9606aa6ad3f4a64b7886b093a3494263`|
| `grimm-return-once-main-complete-save.json` |73000|`a0689799c943503d71577b9bae10c782a8a28c8f9fccee9217f3e0975c3993f3`|
| `grimm-return-frozen-audit.json` |1747|`9dbbdf6897227ad0caa1709fd6df8ab7a50bfb3844f8959e9587a978a62307af`|
| `grimm-return-projection-audit.json` |764|`de5feeab8f91976df7aca29537cab9e2fb4ad673301abc70c607e16c3c7be75c`|

Read-only result/backup checks are in `grimm-return-result-audit.json`. All old failures and both earlier family audit artifacts are retained, not replaced by this success.

## Remaining / next native path

NOT_RUN: loss/timeout branch, priority home chat, Chinese gameplay, real phones, downstream chapters and all endings. This proves one original main-stage route on this build, not the whole game.

The continuation now satisfies the stage prerequisite for the original Horus meeting at Windrider Crossing (`风陵渡口`), but still has neither Horus nor Isis. That native entry retains50% chance. Its meeting has4 lines and two gold choices: accept leads to original morality−3 and a battle; decline leads to morality+3, Horus JOIN and original item commands. Both continuations require a separate coherent mother/son writing pass before acceptance; no choice was made or probability retried here. The next global main letter requires hero15 and at least8 friends plus this stage; hero is still13, so no such follow-up is claimed triggered.

Suggested PR title: **Adapt and validate Grimm's first world-story return**

Description: Replace the original return/ambush/explanation with18 bilingual lines, a matching encounter/journal title and neutral home description. Preserve the invitation warning and all gameplay. Builds and focused bilingual frozen-flow/projection checks pass; one native normal trip won at tick95, observed16English lines and restored full serialized state. Original184-silver source preserved,194-silver continuation separate. Losing branch/static Chinese only. Previous PR discovery `Forbidden` remains recorded; no new API retry or PR claimed.
