# Young Horus: pursuit copy and existing rescue transition

Base `f02d6a2e4f9ef36c10b9431ed8ec91b1da4ed39b`, initially clean; same workspace, branch and sole writer. This batch first read the already adapted rescue before writing its preceding pursuit. It delivers text, not a newly connected playable entry.

## Actual increment: two scenes,12 bilingual slots

New `chapter-horus-pursuit.json` owns:

| Source segment | Original steps | New bilingual slots |
| --- | ---: | ---: |
| `bixuejianShyou_东厂追杀` |13|10|
| `bixuejianShyou_东厂已追杀` |2|2|

Both scenes were previously unadapted. Total15 original steps include3 unchanged non-dialogue steps. Shu demonstrates existing **Stoneclaw Strike / 岩爪击**, asks young Horus to use it responsibly, then hears approaching assassins. Ptah offers cover while Shu protects Horus; the hero joins the defense. The other scene is a short existing departure exchange with no added command, navigation or second fight.

Ptah locally adopts the existing proposed `eg.ptah` candidate for `孙仲寿`; approval metadata is unchanged. Shu and the locked Horus forms reuse existing labels. The original father/last-heir political story is replaced by a straightforward rescue, without inventing Osiris's death or changing kinship. These are original public-domain fantasy-character combinations, not modern screen dialogue or historical claims. Ptah's covering role is narrative; no Ptah combatant, death, JOIN or reward is added.

The battle title displays **Hold the Line / 守住阵线**, without inventing a new city/map. Existing Stoneclaw Strike and Masked Assassin labels are reused. No new art, casting-table reshuffle, global lock or core code change.

## Existing rescue read, accepted and left unchanged

`chapter-companions.json` already owns the rescue `bixuejianShyou_脱险`: its four adapted slots acknowledge escape, Shu's injury and sharing the road. They are compatible with the new pursuit and the completed apprenticeship, where Shu has recovered and seeks a teacher for Horus. No dialogue contradiction or adjacent untranslated rescue slot required a rewrite.

The existing four rescue slots and owner file remain byte-identical. They are checked for continuity/projection, **not counted as four new lines**. Its original two JOIN calls and world-map return remain unchanged. No earlier shrine lesson, separate route or whole chapter is rewritten.

## Frozen gameplay and unresolved entry

The original `learn_external('儿时袁承志', '伏虎掌', 8)` remains at step6, between the same dialogue runs. The promise not to bully is story expression, not an extra moral condition, reward or talent.

Battle `广州.战斗` still requires the hero, with one hero party slot plus fixed childhood Horus and Shu, against five original `东厂杀手`. Ptah is not inserted into that lineup. Original victory jumps to `bixuejianShyou_脱险`; loss and timeout remain gameover. The rescue retains `join('儿时袁承志')`, `join('崔秋山')` and `map('大地图')`. The two-line `东厂已追杀` scene remains only dialogue.

**Entry is unresolved in the current source, rather than a proven closed pursuit window.** A recursive frozen-package scan finds neither pursuit ID referenced in string values outside segment `name` fields. Focused searches of the current runtime C#/content-building Python sources also found no literal caller. There is no map ID `广州` in the frozen map list, although that legacy battle ID exists. These are specific static findings, not proof that no possible dynamic caller exists. No caller, map, trigger, stage condition or fallback route is manufactured here.

The previous apprenticeship has a separately proven negative world-stage condition; that does **not** establish an identical condition for this unlocated pursuit entry. Both current194-silver saves lack childhood Horus and already completed that world stage, but this batch cannot claim their stage alone explains the pursuit's availability. Actual pursuit, alternate exchange and rescue transition are all **NOT_RUN**. Before any gameplay acceptance, locate a source-backed normal caller; do not force a script, inject a flag, roll time back or edit the stage to simulate one.

## Necessary verification

One content build passed:162 maps/1887 segments. One focused Python/Node bilingual pair passed first run. Exactly the two new compiled story bodies change against the pre-edit fingerprints. All other bodies, including the existing rescue, apprenticeship and Highbridge scenes, remain unchanged. All runtime definitions, entry conditions, IDs, battle stats/lineup, skill ranks, economy, command order and save format are original.

Frozen checks cover12 new slots/15 steps, original speakers, rank8 instruction position, three battle outcomes, fixed allies/enemies, unchanged rescue joins and map return, and no commands in the alternate two-line exchange. Projection fixtures cover the12 new slots plus the4 unchanged rescue slots, Horus/Shu/Ptah/saved Rowan, fixed non-party speaker IDs, the existing technique/enemy labels and new battle title. Inputs, IDs and battle participants remain unchanged in the view check.

These are compiled/static and isolated view fixtures, **not** browser UI,320/390px rendering, physical-phone, learning, battle, recruitment, rewards or in-game Save/Load. No frontend/.NET build, broad suite, old battle, risky trail or probability reroll was run. No additional pass is needed for the unchanged apprenticeship/Highbridge code. Earlier failed and interrupted QA records are retained.

## Original preservation

Original source SHA remains `c348d1bc161dbe3a9f9a321232526da75b8d3c7638db7fb2b089d30981e9bcd3`. The two source scenes plus original rescue, existing rescue owner, cast, registration and both genuine194-silver saves were backed up under `src/Game.Web/test-results/backups/pre-horus-pursuit-f02d6a2/`, with pre-edit bilingual fingerprints. Cast, rescue owner and source saves are verified byte-identical. The saved files remain:

- Grimm return:73000B, SHA `a0689799c943503d71577b9bae10c782a8a28c8f9fccee9217f3e0975c3993f3`.
- One-visit ferry arrival:73006B, SHA `d55544821f8ee1462dbd671775bbdf035868a6f87ef93aabf53af89cf9c3f843`.

Ignored local evidence:

| Artifact under `src/Game.Web/test-results/` | Bytes | SHA-256 |
| --- | ---: | --- |
| `horus-pursuit-frozen-audit.json` |1974|`fd6969fbe196367b370f6e2d3b443ec9f949fb4a86e48e7f4ddd5e90f3fd4a09`|
| `horus-pursuit-projection-audit.json` |1270|`f793d5f1512fe0a247e756cfb206839d955cdc6b209646bf50533563e617d968`|
| `backups/pre-horus-pursuit-f02d6a2/original-pursuit-rescue.json` |4191|`07c63a4db257cf375b1931164246ca8d6ab591d7810f9d046f12d9d7c1e68fbd`|

The original app/prose, old saves, art candidates and prior failure evidence are preserved. No merge, deployment, new PR, credential or service. Suggested PR title: `feat(worlds): adapt young Horus pursuit and preserve rescue`. Body: “Add12 bilingual slots in two original pursuit scenes and Ptah/battle display. Preserve15 steps, rank8 teaching, original fatal battle outcomes and existing rescue/joins. Content build and targeted frozen-flow/projection checks pass. Static caller is unresolved and actual route NOT_RUN; no entry or stage condition is added.” Prior GitHub GraphQL Forbidden is not retried.

This leaves source-backed entry research as an explicit separate gap. Later Iron-Sword, transformation, capital/army routes and full Egypt playthrough remain unfinished; text completion here is not another gameplay clear.
