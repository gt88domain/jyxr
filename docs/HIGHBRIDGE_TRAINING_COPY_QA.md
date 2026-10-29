# Highbridge: footwork lesson and Horus's solo test

Base `825a30ab44ef83f397e64af4c36bb321de72881b`, initially clean; same workspace, branch and sole writer. This batch adapts one complete original training encounter from entry through both direct outcomes. It does not rewrite the completed Stonebridge or Osiris treasure scenes.

## New writing and display

`chapter-highbridge-training.json` introduces six previously unadapted scenes, **27 bilingual dialogue slots**. Every original step and speaker ID is retained:

| Original segment | Original steps | Dialogue slots |
| --- | ---: | ---: |
| `bixuejianShyou_襄阳大战` |5|3|
| `bixuejianShyou_神拳无敌1` |18|11|
| `bixuejianShyou_神拳无敌2` |4|1|
| `bixuejianShyou_神拳无敌3` |11|8|
| `bixuejianShyou_神拳无敌4` |20|2|
| `bixuejianShyou_神拳无敌5` |11|2|

Total:69 steps, including42 unchanged non-dialogue steps. Imhotep checks Horus's progress and demonstrates footwork to Horus and the hero. Sobek and Sekhmet challenge them, then Thoth asks Horus to face Sobek alone. Both the victory and lesser learning outcome acknowledge the lesson without promising victory or adding an evening appointment. Original ethnic insults, appearance jokes and modern celebrity references are replaced by original situational humor. Fantasy Chinese matches the English story; the original JYX text/package is preserved separately.

Existing proposed identities Imhotep, Thoth, Sobek and Sekhmet are adopted locally; Horus's locked identity remains. Sobek's stronger original form has the same visible identity. This is an original fantasy combination of historical/public-domain figures, without modern film dialogue or imagery, and does not claim authoritative mythological relationships. `cast-map.json` and identity approval metadata are unchanged.

The two repeated anonymous `神秘剑客` enemies display **Masked Duelist**, rather than presenting two Zorros or silently approving that source slot's proposed Zorro casting. `东厂杀手` displays **Masked Assassin**. These are shared display aliases for the existing source IDs, not new enemies, rule definitions or artwork. No claim of battle animation or art replacement.

Three battle titles, the Imhotep location description and two original achievement names/descriptions are translated. `百变不传` displays **Light on Your Feet**; `千招无敌` displays **A Worthy Student**. Internal achievement IDs and unlock commands remain unchanged. Existing Primal Palm, Gemshatter Fist, Primal Mastery and the three reward-book labels are reused without rewriting their owners.

## Three directly acquired talents

Names and descriptions are view-only; original affixes and rule-facing names remain byte-equivalent after JSON parsing:

| Source talent | English display | Verified rule reflected in copy |
| --- | --- | --- |
| `神行百变` | Elusive Footwork | 15% evasion check at Health ratio **at least0.8**,7% below. The original prose says greater than80%, but the existing hook is inclusive. No probability change. |
| `混元一气` | Primal Attunement | Equipped Primal Mastery multiplies incoming-damage Defense by1.5; Primal Palm critical chance receives+0.25, expressed as25 percentage points. |
| `铁拳无双` | Stunning Knuckles | Eligible Gauntlet hits have a base25% check for Stunned,2 turns. Existing additional talent raises this to37%; ally hooks exclude the existing protection talent. The description warns that unprotected allies can also be affected. |

These descriptions summarize verified definitions, not measured final damage, guaranteed evasion, unconditional immunity or new training abilities.

## Frozen entry and consequences

Highbridge's original `木桑道长` event is once-only, requires one of the four Horus forms, excludes the four original completed-story conditions, and retains its50% check. The complete unchanged condition is captured in the frozen audit. No navigation shortcut, time change, probability reroll, event flag or replacement prerequisite is added.

Original battle1 has four ally slots and requires Horus, facing two Masked Duelists and eight Masked Assassins. Battle2 has two ally slots, requires the hero and Horus, and faces Sobek/Sekhmet. **Both losses and timeouts still end the game.** Battle3 requires Horus in one ally slot against the original stronger Sobek form. Victory reaches original scene4; loss or timeout reaches original scene5, not gameover.

The common earlier lesson still teaches Elusive Footwork to Horus and the hero, adds their original Agility20/10 and unlocks the original achievement. Final outcomes remain distinct:

| Original outcome | Original direct effects retained |
| --- | --- |
| Solo victory | Horus points30, Gauntlet proficiency+40, max Health/Energy+1500 each; both techniques at rank12; two talents; three original level-limit increases; three original books; original achievement; world-map return. |
| Solo loss/timeout | Horus points15, Gauntlet proficiency+20, max Health/Energy+1000 each; both techniques at rank12; world-map return. No victory books, extra talents, level-limit increases or achievement added. |

All quantities, command order, battle layouts/requirements, conditions, runtime definitions and save schema remain original. No projected names enter legacy name-matching hooks.

## Necessary validation and preserved evidence

One final content build passed:162 maps,1887 story segments. One focused Python/Node audit pair checks both locales. Python passed first run: exactly these six compiled bodies changed, every other body and all rule definitions remain unchanged, original speakers/non-dialogue steps and distinct failure/reward mappings match the frozen source.

The first Node fixture failed because it wrongly required Sekhmet in the dialogue-speaker set; she has no original dialogue in these scenes. Only that fixture expectation was corrected. Its rerun passed, checking actual speaking roles separately from Sekhmet's existing combatant label. No product revision or second build was required. This first failure remains reported here; it is not a game failure.

Isolated projection fixtures verify27 lines, player-entered Rowan preserved, speaker names, stronger Sobek/anonymous enemy labels, three talent descriptions and original effects, battle titles, achievement names/descriptions/IDs, the location description and existing skill terminology. A separate read-only check confirms the three reward-book names/descriptions are already English. These are **static content/view fixtures, not browser screenshots or actual gameplay**. No 320/390px UI, physical phone, battle, learning, award, achievement unlock or Save/Load is claimed. No frontend/.NET build, broad test suite or old battle was repeated.

Original source SHA remains `c348d1bc161dbe3a9f9a321232526da75b8d3c7638db7fb2b089d30981e9bcd3`. Original six scenes, registration/cast files, prior compiled fingerprints and both genuine194-silver saves were preserved under `src/Game.Web/test-results/backups/pre-highbridge-training-825a30a/`. Cast and source saves remain exact:

- Grimm-return save:73000B, SHA `a0689799c943503d71577b9bae10c782a8a28c8f9fccee9217f3e0975c3993f3`.
- One-visit ferry arrival save:73006B, SHA `d55544821f8ee1462dbd671775bbdf035868a6f87ef93aabf53af89cf9c3f843`.

Local artifacts (ignored QA directory):

| Artifact under `src/Game.Web/test-results/` | Bytes | SHA-256 |
| --- | ---: | --- |
| `highbridge-training-frozen-audit.json` |2848|`9948f4c278fcb749fddcf1584ebf1bf2dbb0416bb3d4b247e5e9c259a88c21d8`|
| `highbridge-training-projection-audit.json` |5015|`ef31fa2be49712c6c41326790f943322dc9c64809c46cf494bdcdf0efef40e2c`|
| `backups/pre-highbridge-training-825a30a/original-highbridge-training.json` |10490|`3562680db9be0acb12c97ac70be48c2091112dfde3ad53f1c4bd2ac58873529b`|

## Actual boundary and next content

Both genuine saves lack Horus, so this entire Highbridge route is **NOT_RUN**. No Highbridge visit,50% retry, battle, stat increase or award occurred. It is not an Egypt chapter clear or proof that all normal builds can win. Earlier Denmark, Arthur and interrupted mountain-battle evidence remains untouched. Serialized-save compatibility checks here are byte preservation, not an in-game Save/Load or exact live Health/Energy resume.

A separate remaining short chain is Horus's earlier Crane Peak apprenticeship: `华山学武1/2` and `华山收徒1/2`, four scenes36 dialogue slots with one original test and two different outcomes. Its original entry requires `脱险` completed and **not** `mainStory_黑暗的阴影1`; the current194-silver source has already completed that world stage. Thus this is a potential **content-only** next batch, not a reachable next visit from the current save. Read its other existing cast candidates before adapting; do not erase the stage window, inject childhood Horus, or revisit the risky trail for acceptance. Later Iron-Sword training, transformation, capital/army stories and the actual full Egypt route remain separate unfinished work.

Candidate pushed on the existing branch only; no merge or deployment. Suggested PR title: `feat(worlds): adapt Highbridge training and talent descriptions`. Suggested body: “Adapt six original Highbridge scenes/27 bilingual slots and their direct talent, battle and achievement display. Preserve69 original steps, entry conditions and distinct fatal/nonfatal outcomes. Content build and targeted bilingual frozen-flow/projection checks pass; actual route NOT_RUN because genuine saves lack Horus.” Prior GitHub GraphQL Forbidden remains a limitation, so no new PR creation is claimed.
