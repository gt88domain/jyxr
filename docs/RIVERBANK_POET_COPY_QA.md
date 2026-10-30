# Great Riverbank: Shakespeare's ten scenes

Base `cbac86bff738bad2670bc75eb73d6c1e619a93db`, initially clean. Same original workspace/branch/sole source writer. This is **text/catalog source delivery only**: no travel, river visit, random meeting, inventory award, book use, title unlock, Save/Load or core change. The Snow Lotus visit remains a non-harvest; it was not repeated. No new writer, merge, deployment or PR.

## Complete ten-stage writing,26 new bilingual slots

New `chapter-riverbank-poet.json` adapts all `original_李白1` through `original_李白10`, preserving the original speakers' internal IDs, **26 dialogue slots /40 total steps /14 non-dialogue commands**. The first nine retain two lines each; the tenth retains eight at the original positions around the awards.

The player meets a fantasy **William Shakespeare / 威廉·莎士比亚** trying out short scenes by the river. The dialogue uses natural US English, a dry theatrical voice and matching fantasy Chinese. The hero gives nine distinct early reactions, replacing repeated silent contemplation. No quiz, remembered answer, extra visit, payment or recruit is added.

| Stage | New scene idea |
| --- | --- |
|1|The world's stage, a river drowning out the actors; hero identifies Shakespeare|
|2|Travelers' explanations and the hero's improbable Grimm beginning|
|3|A king who dislikes a sensible exit|
|4|A moving forest whose trees want better roles|
|5|An innkeeper's tragedy about unpaid tabs|
|6|A sonnet for the moon; shorter words and applause for mosquitoes|
|7|Two captains who have never rehearsed listening|
|8|One love poem addressed to three people|
|9|A happy ending with everyone home and dinner warm|
|10|Recognition of ten meetings, audience/payment jokes, original bottle/book and farewell|

Grimm remains the original lead guide; this guest author does not replace the opening or create another main plot. These are invented fantasy exchanges, not claimed historical conversations or authentic unpublished Shakespeare passages. The exact opening **“All the world's a stage”** is the public-domain phrase from *As You Like It*, Act II, Scene VII. The moving-forest joke broadly references public-domain *Macbeth*; other dialogue/Chinese wording is newly written. No modern-film dialogue, actor likeness, modern translation or new image is used.

## One permitted candidate reassignment, existing locks preserved

Checked the cast first: old Li Bai slot `actor-b23f840ff52e` was **proposed**, not locked. Shakespeare had no actor assignment or figure entry. Under the user's permission to adapt public-domain figures and dialogue, this same actor slot now proposes **`gb.william-shakespeare`**, fixed homeGB, matching bilingual names. It remains **proposed**, not user-approved/locked. Existing actor ID, original identity/definition ID `李白`, form fingerprint, level/skill source, empty reference evidence and non-recruitable status remain unchanged. Its related-country record becomesGB to match the figure; no cross-country reference evidence or new traveler is invented.

Added one existing historical-author figure to the paired `figures.tsv`/`figures.json` library and its bilingual `source-labels.json` entry. **Original `cn.li-bai` remains in the library**, and all other figures/actors stay exact. No bulk seed/regeneration script ran. The full existing validator passes **513 source definitions /417 actor groups /25 locks /13 story countries**, with one library addition to475. No unrelated locked identity, game-country selection or source character rule changes.

The original portrait/background resource references are retained. No Shakespeare portrait or updated published cast page is claimed. This updates the catalog inputs and runtime display copy, not a deployed catalog/game.

## Original event chain and awards frozen

At world location **Great Riverbank / `长江岸边`**, all12 native event records stay exact: two preceding Hong Qigong events and ten poet stages. Each poet event keeps its original prior/next-stage conditions, **50% and once**. No immediate reward, skipped stage, guaranteed meeting, reroll helper or fixed travel time. Ten stages still require ten actual successful meetings, not ten guaranteed clicks. All ten `background('地图.湘江')` commands remain at step0.

The tenth stage preserves zero-based positions:

| Step | Exact original command |
| --- | --- |
|8|`item('万年醉', 1)`|
|9|`item('青莲诗集', 1)`|
|11|`journal('长江之滨聆听诗仙真意。')`|
|12|`legacy_nick('太白诗仙')`|

**Ancient Reserve / 陈年佳酿** keeps its existing name and all physician-material uses. The second gift's display becomes **Tavern Versebook / 酒馆诗集** instead of the generic Drunken Brawl Scroll. Its existing unique owner in `chapter-us-catalog.json` is updated, not duplicated. Source item ID/type/price1000/non-drop status/requirements stay exact: it is a **consumed-on-use special-skill book** teaching the same `诗酒飘零` / **Drunken Brawl / 醉酒乱斗**. The tooltip and final gift line explain this truth; receiving the book does not learn it automatically. No use occurred and no new skill, boost, combat family or drunken-status effect was designed.

Original achievement ID `太白诗仙` now displays **The Bard's Audience / 诗人的听众**, describing the ten scenes. Its raw metadata and original unlock position remain unchanged. The displayed journal names Shakespeare/Great Riverbank/actual gifts. Title description and journal are separately scoped, despite the original title description sharing the old journal wording. No save ID or internal text-based rule name is translated.

## One necessary static acceptance

- Existing cast validator passed once, retaining all25 locks, unique figures and source coverage. The audit confirms only the Li Bai proposed actor changed, and only its figure/name/home/related-country fields; all other actor records and lock-file bytes match the backup. Old figures are exact; one new figure is registered consistently with TSV/source labels.
- Content build passed once:162 maps/1887 segments. No frontend/.NET/site build, deployment, live display, random draw or full-suite rerun. Earlier previews do not validate these new names or dialogue.
- Python frozen-flow audit passed first run: precisely ten changed bodies/26 slots/40 positions,14 exact commands, all original maps/conditions/50%/once/priority, original gift/journal/title order, book mechanics and every other1877 story body/raw definition/achievement metadata preserved. Only character`李白`, item`青莲诗集`, title`太白诗仙` category displays change.
- Bilingual projection audit passed first run: all26 authored lines and two speaking identities including saved Rowan, nine distinct hero reactions, actual river caption, reward names versus learned-skill/consumed-book explanation, unchanged event behavior, and independently scoped title/journal. English journal uses the existing UI locale helper; Chinese is dictionary-only, not DOM. No CJK in the sampled English dialogue and US **theater** spelling. No first failure in this batch.

Source SHA stays **`c348d1bc161dbe3a9f9a321232526da75b8d3c7638db7fb2b089d30981e9bcd3`**. Runtime character`李白` and all original rule definitions still carry their original names/values; Western names live in display/catalog fields only.

## Evidence and actual progress boundary

Backup `src/Game.Web/test-results/backups/pre-riverbank-poet-cbac86b/` contains original ten scenes, prior bilingual packs, old cast/library/source labels/locks/book owner, genuine306-silver source and the one-stop Snow Lotus candidate/report, with bytes/SHA manifest. Original306 source, mountain-foot candidate and Snow Lotus report remain byte-identical. No old failure record is overwritten.

| Ignored artifact under `src/Game.Web/test-results/` | Bytes | SHA-256 |
| --- | ---: | --- |
| `riverbank-poet-frozen-audit.json` |6789|`d4112292dd641e71cff17efe5b7f54fc1713892434a51ac6e3cbae6bf253327c`|
| `riverbank-poet-projection-audit.json` |2761|`c36da6afc80ec0525382ba9e06db1c26579919d16ace7f9574ae85a6cb5fc151`|
| `riverbank-poet-cast-validation.json` |629|`940b70fe8c8942e5a177e8cb3aea4f873e6cfd093d0dd209d6b6294ab8a2c8da`|
| `backups/pre-riverbank-poet-cbac86b/original-poet-scenes.json` |5624|`9441bbed8c958312210f2a1eab256d984da051b70c2077a4e8b22cacba6a963a`|

**All ten stages remain NOT_RUN in normal play.** Genuine physician source is still13 members/306 silver/three materials0/no poet-stage flags; same76917B SHA `5e34e7627d4711eeef473b26d391aaf1eef6a4f504e7ac45797f4bf943e57894`. No Ancient Reserve, versebook, title or journal was earned here. No book use, learned skill, live status, reward/save compatibility, Chinese/320/390px DOM, physical phone or live cast-page check. Snow Lotus remains unharvested; ginseng long line and its leave choice remain untouched. Existing old-duel goal selection and unknown Musashi ActionSkipped reasons are recorded separately and were not changed.

This delivers complete text coverage of the ten-stage chain, not material acquisition, a new companion, a gameplay clear or whole-game completion. Any later normal meeting must use its own bounded scope; no repeated random sampling is part of this batch. Candidate branch only, no merge/deployment/new PR or retry of GraphQL403. Suggested PR: `feat(worlds): adapt riverbank poet to Shakespeare`. Body: “Adapt all ten riverbank stages/26 bilingual lines with an existing unlocked poet slot proposed as William Shakespeare, plus truthful Tavern Versebook and scoped title/journal displays. Preserve40 steps, all50%/once prerequisites, gifts, internal IDs and original book effects. Cast/content/frozen/projection checks pass; no actual meetings or rewards run, genuine13-person306-silver progress and Snow Lotus non-harvest evidence retained.”
