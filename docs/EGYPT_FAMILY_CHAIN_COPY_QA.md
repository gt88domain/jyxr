# Osiris family trial and treasure chain: narrative completion

Base `9a179690c2edd800adf83b1940a6a9778a1ed373`, clean before editing, same workspace/writer/branch. This completes the known adjacent writing gaps as one batch. It is content delivery and static acceptance, not a campaign playthrough.

## Cohesive scope

`chapter-egypt-family.json` now owns all six original segments in this local trial/treasure chain. Four segments /10 dialogue slots are new in this batch; the previous11 lines remain unchanged.

| Segment | Original steps retained | Dialogue slots | Status / purpose |
| --- | ---: | ---: | --- |
| `bixuejianShyou_金蛇郎君` | 8 | 5 | Prior batch: parents Osiris/Isis and son Horus begin the trial. |
| `bixuejianShyou_金蛇胜1` | 4 | 1 | New: Horus demonstrates Golden Serpent Sword; Isis watches. Removes “乖女儿”. |
| `bixuejianShyou_金蛇胜2` | 27 | 1 | New: stronger trial success gives gifts; map becomes a souvenir and the old cache is left alone. Osiris returns to work. |
| `bixuejianShyou_金蛇败` | 27 | 6 | Prior batch: alternative trial outcome leads to Osiris joining the family's treasure outing. |
| `bixuejianShyou_取宝藏` | 9 | 6 | New: find the cache in Highbridge, then encounter the existing masked assassin. |
| `bixuejianShyou_得宝藏` | 11 | 2 | New: Osiris leaves after recovering the treasure; rewards follow in original positions. Removes daughter/son-in-law farewell. |

Total: **6 segments,21 dialogue slots,86 steps** in each language. No known daughter/dowry/son-in-law conflict remains in these21 bilingual lines. This is not a claim about all Egyptian scenes.

Nephthys remains Osiris/Isis's sister; Osiris and Isis are Horus's parents. Horus's locked identity and all original IDs/forms are unchanged. No cast-map edits or new figures. The masked assassin uses the already classified `actor-7bb5dadbab3f` archetype, with its existing name “Masked assassin” / “蒙面刺客”; its shared display alias also applies to existing uses of that same actor elsewhere, but their dialogue bodies are untouched. The general's house is a generic place description, not a new casting choice for Xu Da/Wen Zhong.

New jokes include the hero predicting an ambush, then wishing he had predicted a picnic. The final line observes that their guide suddenly remembers his job. Original US English and matching fantasy Chinese; no modern film quotes, actor likeness or new artwork. Names match existing display terms **Golden Serpent Sword / 金蛇剑术** and **Highbridge / 高桥城**. The unique original treasure-entry description now displays that Osiris is studying his old map, distinct from the trial-entry description.

## Preserved branches, originals and rules

Trial3 still leads on victory to the original second trial; its loss/timeout remain gameover. Trial4 still branches to the original success gifts or the original alternative join outcome. The stronger success does not promise the separate cache route. The treasure entry still requires a Horus form, Isis, `bixuejianShyou_金蛇败` and original50% chance. No altered conditions, probability, clock, choices, battles, stats, economy, growth, rewards, map connections or save IDs/schema.

All65 non-dialogue steps across six scenes remain exact. In the treasure ending, `leave('金蛇郎君')` remains **between** the two dialogue slots, followed by original item/silver instructions and map return. No reward was merged between branches or text used to claim a different game outcome.

Before editing, prior chapter, cast table, genuine11-member/184-silver Nephthys victory save, previous two audit reports and the original four tail segments were preserved with bytes/hashes under `src/Game.Web/test-results/backups/pre-egypt-family-chain-9a17969/`. Prior compiled segment fingerprints also retained. All backup payloads and unchanged original artifacts verified. Original JYX source/app/Git history remain; source SHA `c348d1bc161dbe3a9f9a321232526da75b8d3c7638db7fb2b089d30981e9bcd3` is unchanged.

## Focused validation

One necessary content build passed. One Python frozen audit passed for English and Chinese: exactly the four tail segments changed against pre-edit compiled hashes; all other story bodies, including the previous11 family lines and accepted Nephthys encounter, remain unchanged. All86 steps,65 non-dialogue instructions, speaker IDs and runtime rule definitions retain their original structure/values. The existing frozen-flow validator passes.

The Node projection audit initially failed because its fixture passed the source `主角` speaker ID instead of the saved player's name that the host actually resolves. That fixture error is preserved in `egypt-family-chain-first-projection-error.txt`. Correcting the fixture to use the protected real save's hero name passed the **failed check only**; no product edit, second build, repeat Python audit or gameplay attempt followed.

Final projection checks cover all21 lines in both languages, five projected speakers, three distinct trial/treasure entry descriptions, exact localized skill/destination names, no old relationship terms or CJK in authored English, and unchanged fixture inputs. These are isolated views from real definitions/catalogs, not screenshots or a normal unlocked scene.

| Local artifact in `src/Game.Web/test-results/` | Bytes | SHA-256 |
| --- | ---: | --- |
| `egypt-family-chain-frozen-audit.json` |2421|`6d2e6f0c6fb4520d7003bb50e796ed71c238c7807a6a046d13b8ff1cae5e373f`|
| `egypt-family-chain-projection-audit.json` |1485|`b6e9d09bbb44b7d3c26c26bfbfeea9e814c6480ed30662c954d699b388b94b61`|
| `backups/pre-egypt-family-chain-9a17969/original-chain-tail-segments.json` |6909|`9ca97ebb53bb78d28d042c03e3c60cfb007c908c6d6b49a9ee3479d08f4d9ea3`|

## Actual play boundary

The protected normal save still lacks Horus/Isis and the original world-stage prerequisite; the original treasure-branch flag also is not present. No normally reachable noncombat representative was established. Actual display, battles, rewards, leave/join and Save/Load for this family chain are **NOT_RUN**. No forged arrival, state injection, probability/time manipulation or extra battle. Existing Nephthys win and prior Denmark/Arthur failures remain separate and untouched.

No full regression suite, frontend/.NET rebuild, physical-phone check, new art, merge or deployment. Whole Egyptian chapter, other family appearances and full-game completion remain outside this batch. There is no remaining known text conflict in these six authored scenes, but their real route still requires normal progression and later acceptance. PR API discovery previously returned `Forbidden`; not retried and no new PR claimed.

Suggested PR title: **Complete Osiris's family trial and treasure dialogue**

Suggested description: Finish the remaining four scenes of the existing Osiris/Isis/Horus family chain, including trial bridge, alternate success send-off, treasure ambush and final departure. Preserve all original slots, battle/reward branches and IDs; use the existing masked-assassin identity and localized skill/map names. One content build and focused bilingual flow/projection checks pass. Actual route remains untested because the protected real save lacks original prerequisites; no battle or core changes.
