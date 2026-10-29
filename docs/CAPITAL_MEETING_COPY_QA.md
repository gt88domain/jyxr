# Royal Apartments meeting and capital text coverage

Base `253d1aee70a640e741fbd112a9d131c1dbc46312`, initially clean; same workspace/branch and sole writer. This batch completes the two remaining capital meeting/recruitment scenes, keeping the already adapted rescue, recovery, Iron Sword return and paired growth copy unchanged.

## New writing: two scenes,26 bilingual slots

`chapter-capital-meeting.json` owns:

| Source segment | Original steps retained | New dialogue slots |
| --- | ---: | ---: |
| `bixuejianShyou_京城行1` |25|22|
| `bixuejianShyou_京城行2` |8|4|

All33 steps,26 speaker positions and7 non-dialogue steps remain. Horus unexpectedly finds Cleopatra at the palace. A guard arrives under Ramesses's orders; Cleopatra hides Horus behind a folding screen and talks the guard through a brief inspection. Their humor comes from nearly knocking over the lamp, not the old bedroom/ownership scene. Cleopatra chooses to travel with the group and the hero welcomes her before the original JOIN/map calls.

The new Royal Apartments title/description and exact entry-description label match the existing Palace Gate button. The entry-description source string is unique to this original location, avoiding a global character-description override that could replace the already correct healing-location copy. Existing Castle Guard, Cleopatra, Horus and Ramesses identities remain; casting metadata, forms, Osiris/Isis family relationships and original artwork are untouched. This is original US English with equivalent fantasy Chinese and no modern-film dialogue or new named character.

Screen, lamp, window and guard search are **scripted story expression**. They do not create stealth checks, controllable objects, a window route, search probability, a timer, a new interaction or a way to get caught. The two original scenes have no choice or battle, and none is added. The recruitment is not conditional on a new romance, payment, morality or skill test.

## Original entry and direct result

Map `公主寝宫`, location `阿九`, once-only event1 still calls `story('bixuejianShyou_京城行1')` under exactly:

```
(!(in_team('温青青'))) && ((in_team('袁承志') || in_team('华山袁承志') || in_team('儿时袁承志') || in_team('炼狱袁承志')))
```

The four-form Horus test and exclusion of the specific original Isis form `温青青` remain. This is not expanded to every Isis form, a mother-related new narrative requirement or an additional Cleopatra test. The story does not invent a reason to change that source gate.

Scene1 retains its original music/background and jump to2. Scene2 retains its original music/background, `join('阿九')` and `map('大地图')`. No JOIN/leave duplication, reward, stat, economy, morality, learning, battle, option or save change. Actual party capacity and runtime JOIN behavior are unverified, not inferred from the text.

The earlier rescue remains a separate original gate at Palace Gate requiring `阿九` in the team and completed scene2. The new text connects to that existing gate; it neither automatically starts the rescue nor adds a flag to force it. Likewise the original healing condition still checks scene1 rather than scene5; that rule is untouched.

## Necessary checks and first fixture failure

One final content build passed:162 maps/1887 segments. The focused Python frozen-flow audit passed first run: exactly these two bodies change against baseline fingerprints, all other bodies and all runtime definitions/conditions remain unchanged. All7 non-dialogue steps and original speakers remain exact. No old rescue battle or full suite was rerun.

The first Node projection check failed because it compared the **projected** gate event's translated description to the original Chinese string. That description had already been translated by the accepted rescue display. The fixture was corrected to check the description per locale and retain exact action, image, ID and condition fields. Only the Node check was rerun and passed; no product edit or second content build was needed. This initial fixture failure remains recorded here and is not a game failure or first-run acceptance claim.

Projection checks cover all26 bilingual lines, four speaking identities, saved hero name Rowan, room title/description, Cleopatra's native entry and unchanged events, return text, gate-to-room title consistency and the still-correct Imhotep healing-location description. Inputs remain unmodified. These are isolated view fixtures, not DOM,320/390px, physical-phone, actual hiding/search, arrival, JOIN, map travel or Save/Load. No frontend/.NET build, broad suite, random retry, edited save or old-route replay.

## Text complete versus actual play

This is an inventory, not another writing increment or repeated rescue acceptance:

| Local capital set | Scenes | Authored bilingual dialogue slots | Original steps | Actual route |
| --- | ---: | ---: | ---: | --- |
| Meeting/recruitment1–2, new this batch |2|26|33|NOT_RUN|
| Gate/rescue3–5, previous batch |3|18|30|NOT_RUN|
| Entire five-scene capital set |5|44|63|NOT_RUN|

The five source scenes now have dedicated bilingual copy with unchanged gameplay flow. This is not a complete army/political arc, Egypt chapter, successful recruitment, recovery sequence or full-game clear. The original meeting/rescue source prose and old app remain. Prior notes saying the26 meeting slots were pending are historical; the text gap is now filled, while play remains unverified.

## Protected source and evidence

Original source SHA remains `c348d1bc161dbe3a9f9a321232526da75b8d3c7638db7fb2b089d30981e9bcd3`. Original two scenes, registration/cast, previous rescue owner and both genuine194-silver saves are preserved under `src/Game.Web/test-results/backups/pre-capital-meeting-253d1ae/`, with pre-edit compiled fingerprints. Cast, rescue owner and genuine saves remain byte-identical:

- Grimm return:73000B, SHA `a0689799c943503d71577b9bae10c782a8a28c8f9fccee9217f3e0975c3993f3`.
- One-visit ferry arrival:73006B, SHA `d55544821f8ee1462dbd671775bbdf035868a6f87ef93aabf53af89cf9c3f843`.

Ignored local artifacts:

| Artifact under `src/Game.Web/test-results/` | Bytes | SHA-256 |
| --- | ---: | --- |
| `capital-meeting-frozen-audit.json` |2254|`adc4c3a722dcf33dc31f991273a86b789e14f7bfa4f24707d695e3f0280c2ca9`|
| `capital-meeting-projection-audit.json` |1719|`d2e61a4f99088db59081d2d9c8126efd57089cdb1ce5465707a8a4ba6a7fa77e`|
| `backups/pre-capital-meeting-253d1ae/original-capital-meeting.json` |4633|`06fc3425f59894a37b5c8294f02f965b60d8c76674c22beddccd2e1f8aae3411`|

Both genuine saves lack Horus, so this native entry is not reached or fabricated. **Actual meeting/recruitment and the entire capital route remain NOT_RUN.** Byte preservation is not in-game Save/Load or exact live-vitals restoration. Original art candidates, saves and all earlier failed/interrupted QA remain. The unresolved pursuit caller and other army/Egypt routes are still separate gaps.

Existing candidate branch only; no merge/deployment/new PR. Suggested title: `feat(worlds): adapt Royal Apartments meeting and recruitment`. Body: “Add26 bilingual slots in two original meeting/recruitment scenes and room display, preserving33 steps and the original four-form Horus/specific Isis gate, JOIN and world return. Content build and targeted frozen-flow/projection checks pass after correcting a translated-description fixture expectation. Capital text inventory is now5 scenes/44 slots; every actual capital path remains NOT_RUN.” Prior GitHub GraphQL Forbidden is not retried.
