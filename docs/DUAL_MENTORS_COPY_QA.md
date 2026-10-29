# Dual mentors: five scenes and four original outcomes

Base `c5b20d2c8621e6b27d4306cee78a51334d4fc120`, initially clean, same workspace/branch and sole writer. The achievement/skill category fix was already committed and pushed as that base. This is the subsequently authorized five-scene content batch, not a repeated submission or replay of the display fix.

## New copy: five scenes,45 bilingual slots

`chapter-dual-mentors.json` newly owns:

| Source segment | Original steps | New dialogue slots |
| --- | ---: | ---: |
| `碧血剑_穆人清` |12|11|
| `碧血剑_穆人清胜利` |21|8|
| `碧血剑_穆人清失败` |15|7|
| `碧血剑_穆人清胜利简单模式` |20|10|
| `碧血剑_穆人清失败简单模式` |17|9|

All85 original steps include40 unchanged non-dialogue steps, with original speaker IDs and positions. Imhotep and Thoth argue over a board game and which teacher deserves credit. Isis, **Horus's mother**, suggests letting him face both teachers. Their rivalry continues through the four mutually exclusive outcomes. The old honeymoon, spouse, sexist and game-difficulty jokes are replaced by original US English and equivalent fantasy Chinese. No new biological relationship, marriage, named figure or modern-film dialogue/art.

The two original mentors and locked Horus/Isis identities are reused. The board game is narrative, not a new chess/minigame command. No battle requirement, teacher stat, growth formula, participant, faction or save field changes.

## Original entries and difficulty selector

On `华山仙境` / Crane Peak — Hidden Retreat, both original locations `穆人清` and `木桑道长` call `story('碧血剑_穆人清')`, once, requiring one of the original four Horus forms, original Isis form `温青青`, completed `bixuejianShyou_金蛇郎君` and `mainStory_神秘剑客1`. Original conditions, repeat modes, event images and IDs remain; only the relevant descriptions and battle title receive display copy.

Battle `穆人清_战斗` retains required ID `袁承志`, one party-index0 ally slot and original Thoth/Imhotep opponents. No Isis or hero combat slot is added. The source explicitly selects the legacy “简单模式” ending when **`difficulty == 'normal'`**; every other value follows the original fallback endings. No new Easy difficulty or rewritten comparison.

Loss and timeout both use the original nonfatal failure paths. No gameover, world-map call, retry action or consolation gift is added. These endings finish through the existing host flow, not a new map transition.

## Four original reward sets retained

Every outcome teaches existing **Arcane Rain / 奥术之雨** at rank10 and adds Sword+5. Other effects remain distinct:

| Original selector/result | Max Health/Energy each | Points | Gauntlet | Spells | Other original effects |
| --- | ---: | ---: | ---: | ---: | --- |
| fallback victory |+500|25|+30|+30|Primal Attunement; Fleetfoot Training Notes×1; Primal Palm/Primal Mastery limits+1 each; victory journal/title|
| fallback loss/timeout |+500|20|0|+50|failure journal/title|
| `normal` victory |+300|15|+15|+15|Primal Attunement; victory journal/title|
| `normal` loss/timeout |+200|5|0|+5|failure journal/title|

The fallback loss's Spells+50 exceeding the victory's+30 is intentionally preserved, not “balanced” into a common reward. Only fallback victory promises the Fleetfoot Training Notes; no notes or limit increases are implied for Normal. Direct spell/talent learning remains where the original commands grant it. No extra JOIN/leave, silver, morality, form replacement, manual consumption or recovery rule. Raw journal strings, title IDs and profile limit keys remain unchanged.

## Title copy scoped by ID, without altering a prior title

The original failure title `铁剑传人` shares its raw description with the earlier footwork title `百变不传`. That description falsely suggests learning footwork here, whereas both failure outcomes teach Arcane Rain. Changing the shared global string would also damage the already correct Highbridge description.

The existing display-definition convention now accepts **`definitions.achievements`**, limited to bilingual name/description fields by original achievement ID. Like other display definitions, it cannot change an ID, unlock condition or other rule field. Compilation keeps the original browser achievement metadata in the runtime pack and uses the per-ID copy only in `byCategory.achievements`. Display schema remains1 and the host payload/TypeScript projector are unchanged from the preceding fix. The display-only validator allowlist accepts achievement name/description changes while rejecting ID/unlock mutations.

This batch names the two original titles **Two Masters' Legacy / 双导师传承** and **Iron Sword Student / 铁剑学徒**, with separate descriptions for passing the trial or studying afterward. Only those two of113 scoped title records change. The earlier Highbridge footwork description and the Sky Dragon Sword achievement/skill separation remain correct. Receiving a title does not change organization membership.

## Necessary verification

Five focused Python tests passed: shared skill/title ID behavior, untranslated-title ownership, the new per-ID/shared-description case, rejection of ID/unlock mutations, and runtime rule/name-based-combination preservation. They cover the compiler/validator changes; the unchanged TypeScript projector's ten-test suite was not rerun. Final content build and frontend `tsc --noEmit`/Vite build passed. Existing large-chunk/external-runtime notices remain; no .NET runtime build or chunking change.

One final Python/Node bilingual content/projection pair passed first run. Checks explicitly cover both source entries, all45 lines/85 positions, all40 exact non-dialogue steps, the literal Normal selector and every win/loss/timeout target, original one-versus-two lineup and every distinct growth/item/limit/talent/title result. Exactly these five story bodies change; all other bodies and runtime definitions remain exact. The runtime's **original achievement metadata is fully unchanged**, despite the two new display records.

Isolated view fixtures verify four speaking identities, mother/son context, two NPC/event descriptions, Arcane Rain/Fleetfoot names, journals through the existing English UI helper (Chinese dictionary check), battle title, two per-ID titles, and unchanged Highbridge/Sky Dragon views. Source inputs are not mutated. No normal visit, board interaction, battle, reward, title unlock, profile edit, Save/Load, DOM/320/390px or physical phone is claimed. No old encounter, complete game test suite, time/probability retry or forced script.

## Preserved evidence and real-play boundary

Source SHA remains `c348d1bc161dbe3a9f9a321232526da75b8d3c7638db7fb2b089d30981e9bcd3`. Original five scenes, pre-edit compiler/tests, registration/cast, old bilingual packs and genuine194-silver saves are preserved under `src/Game.Web/test-results/backups/pre-dual-mentors-c5b20d2/`, with bytes/SHA manifests. Cast and genuine saves remain byte-identical:

- Grimm return:73000B, SHA `a0689799c943503d71577b9bae10c782a8a28c8f9fccee9217f3e0975c3993f3`.
- One-visit ferry arrival:73006B, SHA `d55544821f8ee1462dbd671775bbdf035868a6f87ef93aabf53af89cf9c3f843`.

Ignored local receipts:

| Artifact under `src/Game.Web/test-results/` | Bytes | SHA-256 |
| --- | ---: | --- |
| `dual-mentors-frozen-audit.json` |5868|`da0d169549656202217fc142988a5350724b1339452dfe3911320675f77a2310`|
| `dual-mentors-projection-audit.json` |3131|`69ccbdad41005739a1cf4cdf47702d9083df780245d7eca7ab33cf22816a0f4d`|
| `backups/pre-dual-mentors-c5b20d2/original-dual-mentors.json` |13568|`a3c073c44a46b71186b53c9b6be7f0b82c2803188671676573c241e18fba9bda`|

Both genuine saves lack Horus/Isis, the Osiris encounter and later world flag. **The intro, actual battle and all four outcomes remain NOT_RUN.** No missing predecessor, participant, resource, time or story flag is fabricated. Byte preservation is not in-game Save/Load or exact live-vitals restoration. Earlier gameplay failures/interruption records, original app/prose and candidate art remain unchanged.

This is45 new bilingual dialogue slots with preserved difficulty branches, not four playthroughs, a completed Egypt chapter or full-game clearance. Earlier reports listing these45 slots as pending are historical; text is now complete while actual play remains unverified. The pursuit caller and other later/hostile-route gaps remain separate, with no unproven next entry claimed.

Existing candidate branch only; no merge/deployment/new PR. Suggested title: `feat(worlds): adapt dual-mentor trials with scoped title copy`. Body: “Adapt five source-backed dual-mentor scenes/45 bilingual slots with mother/son context and all four original difficulty outcomes. Preserve85 steps, exact reward differences, raw achievement metadata and every condition/command. Add ID-scoped name/description authoring so the new failure title can describe its actual lesson without rewriting the earlier Highbridge title. Five focused Python tests, final content/frontend builds and bilingual frozen/projection acceptance pass; all actual outcomes remain NOT_RUN.” Prior GraphQL Forbidden is not retried.
