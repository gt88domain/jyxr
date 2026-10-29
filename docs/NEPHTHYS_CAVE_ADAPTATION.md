# Nephthys cave: bilingual fantasy adaptation

Base: `6cb3a194b560ff1d155a3c5b9802100580069872`, same workspace and `feat/storybound-italian-battle`. At17:12UTC on2026-10-29 the user allowed adapting Western figures, relationships, motives and dialogue. The earlier identity hold is resolved for this scene. This is original fantasy writing, not literal translation or a definitive account of Egyptian mythology.

`chapter-crane-cave.json` now owns Nephthys's local speaker name, cave NPC description, four original segments /12 bilingual dialogue slots, attendant/battle labels and victory journal copy. Newly written US English and fantasy Chinese tell the same story. Nephthys mourns her brother Osiris and guards the dead; Isis is her sister and Horus is Isis's son. Her request for privacy explains the original Leave options; persistent intrusion leads to the existing fight. Later victory text sends her back to Osiris in the Duat rather than repeating the original character's suicide wording. The existing reward remains the Venom Circle Token.

This adopts the existing proposed candidate locally without globally locking cast metadata or implying user approval of artwork. Horus's locked identity stays. Other Egyptian scenes, including old father/daughter and romantic references, still need separate writing passes. Source figures are ancient mythology; no modern movie quotes, actor likeness or new artwork. The portrait is still a legacy placeholder.

## Frozen flow and originals

All12 slots, speaker IDs, menu order, branches, instructions and reward positions remain. Conditions, probabilities, combat/stats, growth/economy, rewards, map connections, internal IDs and save schema are unchanged. Runtime definitions including legacy names remain exact JSON values; new labels use the existing display catalog.

Original package SHA: `c348d1bc161dbe3a9f9a321232526da75b8d3c7638db7fb2b089d30981e9bcd3`. Before editing, previous chapter, cast table, genuine arrival/old-result saves and extracted original four segments were preserved under `src/Game.Web/test-results/backups/pre-nephthys-copy-6cb3a19/`, with hashes in its manifest. Original JYX app, frozen package and Git history are retained.

## One actual acceptance run

One isolated Chromium run imported the genuine before-talk save, SHA `1f92b0e100b1de83669bead32fdf661d170cdb60e409717f69562391d93fc0b7`. No cave re-entry, reroll, time/flag edit or fight; gameplay used visible controls, runtime only read state.

- Actual390px NPC name/description showed Nephthys; same browser resized320px for all7 English pages and first menu. No horizontal overflow, Leave above bottom bar. Screenshots inspected. Cloud mouse viewport simulation, not physical phones; one screenshot retains the import toast, so overlay polish is not claimed complete.
- Index1 Leave returned to Hidden Glade, year1/month5/day8 Yin→Mao; only `碧血剑_何红药1` newly completed. Still11party,150silver,morality54,profile deaths3/kills131. No token, victory, recruitment or downstream unlock.
- Complete serialized `game`, `wonBattles`, `profile` exactly equal the old-dialogue Leave result, golden SHA `a741132570fc91c674662f584574464078aaf5199f1c668fdac56e76e5a2c2b0`. Normal Save→refresh→Load→export retained those values. Wrapper metadata explains differing file hashes; original files unchanged. Exact live battle HP/Energy persistence is outside this check.
- Eleven harness checks passed; console/page/request/HTTP errors0. No second route run or repeat damaged-import tests.

Evidence under local `src/Game.Web/test-results/`:

| File | Bytes | SHA-256 |
| --- | ---: | --- |
| `nephthys-opening-one-pass.json` |6047|`e5066868b006d412eabbfa484b5a48da38593cc5614c2ed932a9865fdd4579f1`|
| `nephthys-opening-one-pass-outcome-save.json` |71671|`9767ec2b111711a65f66bbeb6f30f4b457da1408aefe1c66c881c4641f59a127`|
| `nephthys-opening-one-pass-complete-save.json` |71664|`6dc9443e2eeb78c6655cc901493ee631ac6c069514af693aa32383e69d4cb333`|

Content/TypeScript/Vite passed; existing runtime-loader/large-chunk warnings remain. Existing22Python+8Node checks passed. Static audit verified both compiled languages' exact rule definitions, all4 segments' slot/speaker order and12 authored lines. Its first invocation mistakenly compared the added displayCatalog as a rule; error retained in `nephthys-static-first-audit-error.txt`. Matching the compiler's existing catalog-exclusion contract passed; no product change or gameplay rerun needed.

NOT_RUN: remaining5 later/victory lines in gameplay, second menu, Stay, combat/outcomes, token, downstream unlock, Chinese route, physical phones. Both languages statically verified. No.NET rebuild, art binding, merge or deployment; not a completed Egyptian chapter/full game.

## Suggested PR

Title: **Adapt the Crane Peak cave encounter as Nephthys's vigil**

The cave still exposed original Chinese dialogue and conflicting reskinned relationships. Replace four segments with bilingual fantasy dialogue and matching NPC/encounter/journal labels, keeping original IDs, instructions, choices, combat and rewards.

Validation: content/frontend builds,30 existing checks, bilingual frozen-flow audit, one seven-line opening→Leave→Save/Load matching the prior result. Later fight/victory static-only. GitHub GraphQL PR discovery returned `Forbidden`; no new PR claimed or alternate credentials used.
