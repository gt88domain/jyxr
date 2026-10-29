# Cleopatra: recovery, apprenticeship and paired Golden Serpent trial

Base `8191a11be68299da5e79b8df0d22d03debd8fe9a`, initially clean; same workspace, branch and sole writer. This cohesive batch completes the short unadapted healing/apprenticeship scene and the adjacent later paired-growth chain, rather than delivering four trial lines alone. The already completed Iron Sword return/reward scenes are not rewritten or replayed.

## Actual increment

New `chapter-cleopatra-training.json` owns four previously unadapted scenes,13 bilingual dialogue slots, one choice prompt and two option labels:

| Source segment | Original steps | New dialogue slots |
| --- | ---: | ---: |
| `bixuejianShyou_华山派` |12|9|
| `bixuejianShyou_华山仙境变身01` |4|2|
| `bixuejianShyou_华山仙境变身02` |3|1|
| `bixuejianShyou_华山仙境变身03` |19|1|

Total38 original steps include25 non-dialogue steps;24 remain exactly equal, and the one choice changes display strings only, retaining its speaker, option order and exact branch bodies. No other story body changes.

Imhotep tends Cleopatra's injuries and offers lessons while she recovers. Cleopatra intends to travel again; the exchange removes a forced marriage/monastic-name detour, without changing the original leave or later form. His invitation to return does not introduce a timer, appointment or new recovery rule.

In the later chain, Horus struggles to connect Osiris's techniques and Cleopatra proposes working through attacks from every side. This replaces the old claim that Horus found Osiris's bones, which contradicted the living Osiris family scenes. It frames the original trial as studying the Golden Serpent style without inventing new summoned characters. The four stronger Osiris opponent entries remain exactly as defined. The victory insight connects sword, gauntlet and spell techniques, matching the existing distinct growth calls.

The menu explicitly offers battle or skipping the trial and states that loss/timeout means Game Over. Skip retains the original empty branch; it does not promise a later retry, add a return-map call or award partial growth. The earlier once-only event is unchanged.

Horus's locked identity and both Cleopatra form IDs remain. Existing Imhotep/Osiris local candidates are used without changing casting/approval metadata. This is original public-domain fantasy adaptation, not canonical Egyptian family history or modern-film dialogue/artwork. No new character or image is produced.

## Two original map entries

Both entries are on `华山仙境`, currently displayed as Crane Peak — Hidden Retreat. Original four-form Horus checks remain intact in each condition:

| Location ID | Original call | Other original requirements | Repeat |
| --- | --- | --- | --- |
| `阿九` | `story('bixuejianShyou_华山派')` | Original `阿九` in team; completed `bixuejianShyou_京城行1` |once|
| `炼狱金蛇郎君` | `story('bixuejianShyou_华山仙境变身01')` | Original `九难` in team; completed `bixuejianShyou_铁剑门3` |once|

Full original conditions are captured in the frozen audit. Only the injury-location description and trial-location name/description change. No new map, path, prerequisite, probability or world-stage shortcut. The earlier pursuit entry remains unresolved; these proven entries do not repair or explain it.

## Original consequences and growth

Healing scene retains only its original music, `leave('阿九')` and world-map return. No heal command, immediate stat restoration, permanent injury rule, new membership system, rename, JOIN or manual is added. The already completed Iron Sword return still owns the later `join('九难')`; this batch does not repeat it.

Trial battle `袁九变身_战斗` retains two ally slots, required IDs `袁承志`/`九难`, and four enemy slots using `炼狱金蛇郎君`. Entry variants and required battle IDs are preserved as written; no new claim is made that every form has passed actual required-character handling. Victory advances to original scene03; loss and timeout remain gameover.

| Recipient | Original victory effects retained |
| --- | --- |
| Horus (`袁承志`) | max Health+1200; max Energy+1200; points40; Sword+40; Gauntlet+20; Golden Serpent Sword rank12; Golden Serpent Fist rank10; original talent grant. |
| Advanced Cleopatra (`九难`) | max Health+1200; max Energy+1200; points40; Sword+20; Spells+20; Golden Serpent Sword rank12; Serpent Bolt rank10; original talent grant. |
| Original shared limit instruction | `legacy_maxlevel('金蛇锥', 3, 'legacy.bixuejianShyou_华山仙境变身03.金蛇锥')` remains at the same position. |

The source calls this “变身,” but its listed commands apply growth and learned skills/talents, not a new character-definition replacement. No replacement/form conversion, inventory reward, silver, achievement, automatic book consumption or map command is added. Increased maximum vitals are not described as a new full-heal effect. The paired trial's own existing learning commands remain; receiving the previous manual is not rewritten as automatic learning.

## Scoped display: one ID has different meanings

The newly granted source talent `金蛇郎君` displays **Serpent's Edge / 灵蛇锋芒**. Its original hook adds0.5 to the critical chance for skill names containing `金蛇剑法`; the description accurately says **50 percentage points** for Golden Serpent Sword. Rule-facing names, affixes, probabilities, targets and IDs remain original. No guaranteed critical hit or bonus to all techniques is promised.

That ID is also the original Osiris character ID. Existing category projection is reused: talent objects and trait tags resolve to Serpent's Edge, while an explicit existing-identity text alias keeps raw NPC speakers displaying Osiris. The stronger Osiris character/location ID is likewise distinct in display: character units remain Osiris, while the location reads **Golden Serpent Trial / 金蛇试炼**. The existing projection implementation and interface are not modified. This avoids silently labeling an earned talent Osiris or renaming an actor as a location.

## Necessary acceptance

Content was compiled after copy preparation; the menu's decline wording was then tightened from “Not now” to “Skip the trial” before acceptance so it does not imply a new retry mechanism. The final content build passed with162 maps/1887 story segments. One focused Python/Node bilingual acceptance pair ran against final copy and passed first run; no test rerun or battle retry was needed.

Frozen checks cover all13 lines/38 steps, original speakers, the24 exact non-choice steps and one flow-equivalent choice, two native entries, leave/map behavior, both option bodies, fatal outcomes, original battle lineup, every growth/skill/limit command and the exact talent hook. Exactly the four selected compiled story bodies change; every other body and all runtime definitions/conditions remain equal to their original or pre-edit baseline.

View fixtures verify English/Chinese dialogue, both native location descriptions, unchanged character forms, the actor/talent and character/location ID collisions, old Osiris raw-speaker behavior, trait tags, skill names, choice prompt/options, battle title, hero Rowan preservation and non-mutated inputs. Both battle and non-battle menu labels are checked as display, not clicked gameplay.

No browser UI,320/390px rendering, physical phone, arrival, healing, leaving/rejoining, battle, learning, growth or Save/Load is claimed. No frontend/.NET build, broad suite, old Iron Sword/Highbridge route, probability reroll or risk-trail visit. Previously failed/interrupted QA remains unchanged.

## Protected evidence and actual boundary

Source SHA remains `c348d1bc161dbe3a9f9a321232526da75b8d3c7638db7fb2b089d30981e9bcd3`. Original four scenes, registration/cast, both genuine194-silver saves and compiled fingerprints were preserved under `src/Game.Web/test-results/backups/pre-cleopatra-training-8191a11/`. Cast and genuine saves remain byte-identical:

- Grimm return:73000B, SHA `a0689799c943503d71577b9bae10c782a8a28c8f9fccee9217f3e0975c3993f3`.
- One-visit ferry arrival:73006B, SHA `d55544821f8ee1462dbd671775bbdf035868a6f87ef93aabf53af89cf9c3f843`.

Ignored local evidence:

| Artifact under `src/Game.Web/test-results/` | Bytes | SHA-256 |
| --- | ---: | --- |
| `cleopatra-training-frozen-audit.json` |3188|`7f596d2000b0b059916e1065778160dcba4dee01f0d3eddb554737ea1747a3de`|
| `cleopatra-training-projection-audit.json` |3330|`3494f5dba5ee2a10268d10f4204ae92e5cc1e32c11f9eac089bac60100cbfe50`|
| `backups/pre-cleopatra-training-8191a11/original-cleopatra-training.json` |6150|`528e1096725e811f3e8c6d705ba939bd6b0a118cdc349441c471596339a72958`|

Both genuine saves lack Horus and either Cleopatra form, `京城行1` and `铁剑门3`. **Both actual routes and the complete linked Cleopatra progression are NOT_RUN.** No flags, form, time, resources or party order were injected to satisfy the entry. Byte preservation is not an in-game save/reload or exact live-vitals restoration claim. Original app/prose, source commands, saved progress and artwork are preserved.

Healing9 slots plus the earlier Iron Sword32 slots and this later paired trial4 slots now have coherent local text across45 original dialogue slots; only13 are new in this batch. This inventory is not a full Egypt chapter, protagonist unlock, completed training route or gameplay clear. Capital/army arcs, unresolved pursuit entry and other Egyptian routes remain separate work.

Existing candidate branch only; no merge, deployment or PR creation. Suggested PR title: `feat(worlds): connect Cleopatra recovery and paired-training copy`. Body: “Adapt four original scenes/13 bilingual slots and the two-person trial menu, with native-entry display and scoped talent/actor names. Preserve38 steps, original leave, fatal trial and every original paired-growth command. Content build and targeted frozen-flow/projection acceptance pass; both routes NOT_RUN because genuine saves lack prerequisites.” Prior GitHub GraphQL Forbidden is not retried.
