# Crane Peak: young Horus's apprenticeship

Base `a1b93d6df0271ba5990eedd84f4eda134f4f93dd`, initially clean, same branch/workspace and sole writer. This batch completes the original early apprenticeship encounter from its trail greeting through both immediate outcomes. Highbridge and the previously completed Osiris/Stonebridge stories are unchanged.

## New copy: four scenes,36 bilingual slots

New owner `chapter-crane-apprenticeship.json` contains:

| Original segment | Original steps retained | Dialogue slots |
| --- | ---: | ---: |
| `bixuejianShyou_华山学武1` |14|11|
| `bixuejianShyou_华山学武2` |9|6|
| `bixuejianShyou_华山收徒1` |16|11|
| `bixuejianShyou_华山收徒2` |13|8|

All four scenes/36 slots are newly adapted;52 original steps include16 unchanged non-dialogue steps. Original speaker IDs and all positions remain. Original JYX prose is preserved in the source package, Git history and the local pre-edit backup, rather than replaced in the original app.

Shu, recovering from the earlier rescue, brings young Horus to Thoth before returning to his duties. Geb greets them with clear gestures and leads them inside. Horus introduces himself as a student before Thoth has agreed; Thoth asks to see what he has learned. Both outcomes accept the inexperienced student, but their departures and rewards differ exactly as in the source. Humor concerns the climb, premature introduction and first lessons; it removes old insults about crying, profanity, transformation jokes and irrelevant family history.

Horus's locked identity and all four form IDs remain. Shu/Thoth reuse existing display names, Geb adopts the existing proposed `eg.geb` candidate locally. `cast-map.json` approval metadata is unchanged; no new globally locked identity. Shu is a guardian/former student here, not a newly asserted biological uncle. No dead-father claim is made about Osiris. Geb's gestures are story expression, not a claim that the traditional deity is mute or a new interaction mechanic. This is original fantasy dialogue using historical/public-domain figures, without modern screen dialogue, likeness or artwork.

Geb's source-ID speaker label and the existing trail-entry description receive bilingual display copy. The original test title displays **Thoth's First Lesson**. Existing **Orchardkeeper's Peach / 守园人的蜜桃** naming and description are reused, with no new item owner or effect change.

## Entry, battle and two different results

The original `华山后山4` / `哑仆` event remains once-only, with exactly:

```
(story_completed('bixuejianShyou_脱险')) && (!story_completed('mainStory_黑暗的阴影1'))
```

No team requirement is added to this original entry. The nearby5% trail encounters and all original map links/probabilities are untouched. No shortcut, event-preview manipulation or time change is used.

The test still uses `华山仙境.战斗`: two ally slots, required childhood Horus, against original Thoth (`穆人清`). It is not rewritten as a new solo battle or guaranteed easy victory. Win leads to `华山收徒1`; loss and timeout lead to `华山收徒2`, both nonfatal original endings.

| Result | Original direct behavior retained | Copy matches the difference |
| --- | --- | --- |
| Win | `leave('儿时袁承志')`, `item('王母蟠桃', 3)`, world-map return. Shu is **not** removed. | Horus stays with Thoth; Shu offers to accompany the hero down the mountain. Thoth gives three peaches for the road. |
| Loss/timeout | `leave('儿时袁承志')`, `leave('崔秋山')`, world-map return. No peach command. | Horus stays to learn; Shu says goodbye and returns to camp. No gift is promised. |

No new transformation, JOIN, immediate skill/stat growth, points, training duration or guaranteed return is added. Future companionship is a possibility in dialogue, not a new unlock promise. The three peaches remain inventory items, not automatic consumption or stat growth.

## One real display gap found during targeted acceptance

The first content build and Python frozen-flow check passed. The first Node projection check failed on the displayed speaker `儿时袁承志`. `BrowserBridge.Media.cs` returns a party character's Name when found, otherwise the raw source speaker ID. The existing Horus mapping translated the source character Name `袁承志`, but did not cover this form's raw fallback ID. The native entry does not itself require the childhood form to be in the party, so hiding the fallback by assuming party membership would not cover the host behavior.

Added the missing **view-only** `uiLabels['儿时袁承志']`→Horus/荷鲁斯. IDs, actor/form metadata and host code are unchanged. After that product change, content was rebuilt and the focused Python/Node pair rerun. Both passed. The first failure is retained here; it is neither an actual game loss nor a false “first-run pass.” No Highbridge replay or broad suite rerun.

Final frozen audit proves exactly these four compiled bodies changed against pre-edit fingerprints; all other story bodies, original definitions, battle/entry conditions, speakers,16 non-dialogue steps and departure/reward differences remain exact. Projection fixtures cover all36 authored lines in both languages, five speaking identities, the childhood form's party Name **and** raw fallback ID, Geb entry with unchanged events, battle title/participants and the existing peach term/description. Saved hero name Rowan and fixture inputs remain unchanged.

These are compiled-content and isolated view checks, **not** browser UI, narrow-screen, physical-phone or gameplay tests. No frontend/.NET build, full suite, actual battle, departure, peach award, transformation or Save/Load occurred. The final content build contains162 maps/1887 story segments.

## Protected source and actual boundary

The source SHA remains `c348d1bc161dbe3a9f9a321232526da75b8d3c7638db7fb2b089d30981e9bcd3`. Original four scenes, registration, cast, prior compiled fingerprints and both genuine194-silver saves were preserved under `src/Game.Web/test-results/backups/pre-crane-apprenticeship-a1b93d6/`. Cast and genuine saves remain byte-identical:

- Grimm return:73000B, SHA `a0689799c943503d71577b9bae10c782a8a28c8f9fccee9217f3e0975c3993f3`.
- One-visit ferry arrival:73006B, SHA `d55544821f8ee1462dbd671775bbdf035868a6f87ef93aabf53af89cf9c3f843`.

Local ignored evidence:

| Artifact under `src/Game.Web/test-results/` | Bytes | SHA-256 |
| --- | ---: | --- |
| `crane-apprenticeship-frozen-audit.json` |3172|`97cb8443bb22b2df68128cbc16331aed174067345bad29c287ec7bde6beaf2b9`|
| `crane-apprenticeship-projection-audit.json` |2177|`cb41263dda1e77aaae75ed02fa791d03eea50d76ff115eb67efd50b65cb0192b`|
| `backups/pre-crane-apprenticeship-a1b93d6/original-crane-apprenticeship.json` |7889|`a9648687d0aa912dfa6ad5317fb783dd4c313a1a1cd51c16f56d5adb8887f395`|

Both genuine saves' `storyState.completedStoryIds` already contain `mainStory_黑暗的阴影1`; neither has childhood Horus. The original negative-stage condition therefore closes this entry. **Entire actual apprenticeship route: NOT_RUN.** No childhood form/flag was injected, stage rolled back, trail walked, probability retried or reward granted. Byte-preserved saves are not an in-game save/reload acceptance or live Health/Energy restoration claim. Earlier Denmark/Arthur and mountain-interruption records remain untouched. This text increment does not increase claimed gameplay clears or complete the Egypt chapter.

The earlier pursuit (`东厂追杀`,10 source slots; `东厂已追杀`,2) remains a potential next cohesive text batch, with its original battle/fatal loss and existing rescue follow-up to be read before adapting. Neither scene was modified or executed here. Later Iron-Sword, transformation, capital/army stories and full normal-route verification remain separate unfinished work.

Candidate stays on the existing branch; no merge/deployment. Suggested PR title: `feat(worlds): adapt young Horus's Crane Peak apprenticeship`. Body: “Adapt four early apprenticeship scenes/36 bilingual slots, Geb's greeting and the test title; cover childhood Horus's raw speaker-ID fallback in display projection. Preserve52 steps, original stage window, battle and distinct departure/gift outcomes. Content build and focused frozen-flow/projection checks pass after fixing the discovered label gap. Actual route NOT_RUN because genuine saves are past the original window.” Prior GitHub GraphQL Forbidden is not retried; no new PR creation is claimed.
