# Musashi's treatment and Tomoe: complete cure-scene writing

Base `4c894e6d808549ed24a2fa222ddb557f8c1c680a`, initially clean. Same original workspace, branch and sole writer. New **content-only** batch; no travel, shopping, ingredients, physician click, cure execution, clock change, JOIN, growth or Save/Load. The real13-person306-silver continuation and all earlier files remain intact. No merge, deployment, new PR, assets or battle replay.

## New35-slot scene, complete direct result

`chapter-hippocrates-cure.json` adapts all **35 original dialogue slots in `笑傲江湖_平一指治好`**, preserving its45 steps. The four original dialogue runs remain at zero-based offsets **0/31 lines,32/1,40/1,42/2**; every speaker ID and interleaved command position is unchanged.

Tomoe Gozen arrives with the missing **Frostsilk / 霜蚕丝**, completing the previous three-supply consultation/prelude. She is a practical warrior and fellow traveler, not the old jealous wife. Musashi's breathing/practice jokes, Circe's teasing and Hippocrates's caution continue the existing local story. Tomoe agrees to accompany the group and insists on real recovery; a clearly stated15-day treatment/rest transition precedes the original cure effects. This is the native automatic time transition, not a request to train or manually wait15 days.

The final referral uses the already proposed **Oda Nobunaga / 织田信长** at the existing **Black Pine Cliff / 黑松崖**. It does not retain the old father/daughter claim, impose a deadline or teleport the party. Both raw journal calls remain unchanged, but their player-facing text now records the cough treatment and Nobunaga's request. This completes the entry-to-direct-result text of this scene, not Nobunaga's later storyline.

Existing candidates reused without reassignment/locking:

| Original identity | Existing cast | Status kept |
| --- | --- | --- |
| `任盈盈` |Tomoe Gozen / 巴御前, `jp.tomoe-gozen`, actor `actor-d764d4e4fd3a`|proposed|
| `任我行` |Oda Nobunaga / 织田信长, `jp.oda-nobunaga`, actor `actor-1a93c7b6ab63`|proposed|
| `令狐冲` |Miyamoto Musashi / 宫本武藏|locked|

Their relationships here are original fantasy adaptation, not historical kinship, shared-era claims or quotations. No modern-film lines/likenesses, new character, country, weapon category or portrait. Only the two previously missing character display entries are added; Circe/Hippocrates/Musashi displays stay consistent. Cast metadata/forms/locks remain exact.

## All ten original commands preserved

| Zero-based step | Frozen original action |
| --- | --- |
|31|`join('任盈盈')`|
|33|`advance_days(15)`|
|34|`remove_talent('令狐冲', '令狐冲的怪病')`|
|35|`grant_points('令狐冲', 40)`|
|36|`change_stat('令狐冲', '剑法', 30)`|
|37|`change_stat('令狐冲', 'max_hp', 1000)`|
|38|`change_stat('令狐冲', 'max_mp', 1000)`|
|39|`legacy_maxlevel('独孤九剑', 1, 'legacy.笑傲江湖_平一指治好.独孤九剑')`|
|41|`journal('令狐冲的怪病治好了！')`|
|44|`journal('圣姑有点想她爹了，让令狐冲去看看')`|

`grant_points` still calls the existing stat-point service; points are not automatically allocated. Sword+30, max Health/Energy+1000 each and the original Ninefold Sword level-cap command remain at their original positions, with the same original base Musashi ID/profile key. No growth-template/form replacement, additional battle, choice, heal/revive rule, equipment assignment, map unlock, silver/morality payment or new story flag. Tomoe JOIN still precedes the15-day command and all growth.

Original treatment entry is still once-only, requiring an original Musashi form, Circe, Hippocrates and **Snow Lotus×1 / Ancient Reserve×1 / Mountain Ginseng×1**. It still jumps into this scene after the four-line prelude. `万年冰蚕` is absent from the original item definitions/entry conditions. Frostsilk is solely the narrative component brought by Tomoe, not a fourth collectible, recipe gate, bag entry or consumed item. No material check, quantity or deduction was added/removed.

The original45-step scene contains no map command; Black Pine Cliff remains a referral, not an automatic journey. Its downstream availability, original growth/cap behavior and15-day effects were not executed or newly asserted.

## One necessary static acceptance

Content build passed first run:162 maps/1887 segments. Targeted Python frozen-flow and bilingual Node projection audits passed first run. No frontend/.NET rebuild, browser/viewport checks, old battle, old rejection tests or full suite: this batch changes only text/registration and has no authorized live treatment path with the current materials. No claim that an earlier preview is already showing this new copy.

Frozen audit verifies: only this one story body changes;35 exact authored lines/45 positions; all ten commands/order; original treatment entry/three-material conditions; no fourth item or consumption; exact raw rule definitions/maps/achievement metadata; all other1886 scene bodies including the four previous physician scenes; only Tomoe/Nobunaga character-category display changes; unchanged cast and four protected genuine saves. Source SHA remains **`c348d1bc161dbe3a9f9a321232526da75b8d3c7638db7fb2b089d30981e9bcd3`**.

Projection fixtures verify all35 bilingual lines/five speaking identities including saved Rowan, existing candidate names, exact Black Pine Cliff reference/time transition, both displayed journals and unchanged Lingering Cough/Ninefold Sword labels. English journals use existing `translateUiText`; Chinese is dictionary-checked, not a DOM claim. No old wife/father/jealousy/castration text remains in these authored slots. Fixtures show definition labels only; they do not pretend Tomoe is already recruited. There were no first failures in this batch; prior real QA assertion failures remain untouched.

The five physician scenes now have **63 adapted dialogue slots /77 original steps** in total. **Only the21-line initial consultation and its original battle have actual play evidence.** This batch adds35, not63; the greeting/reminder/prelude/cure are not newly claimed played. Physician story text coverage is not treatment/whole-game completion.

## Preserved evidence and current state

Backups under `src/Game.Web/test-results/backups/pre-hippocrates-cure-4c894e6/` contain original35-slot scene, prior bilingual packs/cast/registration and four genuine source files, with byte/SHA manifest. Current13-person306-silver source remains76917B SHA **`5e34e7627d4711eeef473b26d391aaf1eef6a4f504e7ac45797f4bf943e57894`**. It still has all three required materials0, no cure completion and no Tomoe member. Earlier194/11-person242/12-person242 files remain byte-identical. No items, stats, points, cap,15-day advance or cures were applied by the build.

Ignored local artifacts:

| Under `src/Game.Web/test-results/` | Bytes | SHA-256 |
| --- | ---: | --- |
| `hippocrates-cure-frozen-audit.json` |2536|`2f9a5951659de551e794eb757a581b3ec7ba50d64f4df310040875b1b51a4935`|
| `hippocrates-cure-projection-audit.json` |2526|`157f1af8d01169d667eb7e7d43cb7745f0cb7ae2723cd6190283e9517c639cbe`|
| `backups/pre-hippocrates-cure-4c894e6/original-physician-cure.json` |5672|`39bf37fd39b2b025a354304a2a0988bfef25aacc202da3064eb71151968df720`|

NOT_RUN: live cure/prelude/reminder/greeting, normal ingredient acquisition, Tomoe JOIN/capacity,15-day time progression, talent removal/stat points/Sword/Health/Energy/cap changes, journals in actual DOM, Nobunaga visit,320/390px Chinese/English DOM, physical phones and Save/Load after cure. No ingredient injection, calendar edit, force script or fake completion. The four earlier Musashi `ActionSkipped` events still have **unknown reasons**, not assumed cough; no event contract/core fix or new trial was made.

The genuine stop point remains before treatment at Healer's House,13 members/306 silver. Any future live cure validation must obtain original prerequisites normally in its own protected QA route; this content delivery does not authorize creating them. Other unmet routes and older failures/interruption remain as recorded.

Candidate branch only. Suggested PR: `feat(worlds): adapt Tomoe and Musashi cure scene`. Body: “Adapt the full35-slot cure scene and two displayed journals using existing Tomoe/Nobunaga candidates, matching the physician prelude and local cast. Preserve45 steps and all ten commands: JOIN,15 days, original talent removal/40 points/Sword+30/max Health/Energy+1000/cap+1 and journals. Content build plus targeted bilingual frozen/projection checks pass; live cure entirely NOT_RUN because genuine materials remain0.” Prior GraphQL Forbidden is not retried.
