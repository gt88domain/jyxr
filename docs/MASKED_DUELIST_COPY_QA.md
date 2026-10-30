# Grimm's next letter and the Masked Duelist

Base `486fa2a7f01e3937d2c69c4fbe40fe0195c056f7`, same original writer,
workspace and `feat/storybound-italian-battle` branch. This batch completes
one connected five-scene text group. No gameplay attempt, core change,
new actor/art, merge or deployment.

## Delivered text and boundaries

`chapter-masked-duelist.json` adds **29 bilingual dialogue slots**, one
displayed victory journal and the encounter title. The original speaker
IDs remain exactly in place; no line was removed, compressed or reordered.

| Original segment | Dialogue slots | Original total steps |
| --- | ---: | ---: |
| `mainStory_神秘剑客` | 3 | 3 |
| `mainStory_神秘剑客1` | 11 | 14 |
| `mainStory_神秘剑客3` | 2 | 5 |
| `mainStory_神秘剑客4` | 8 | 11 |
| `mainStory_神秘剑客5` | 5 | 10 |
| Total | **29** | **43** |

The original graph is invitation, home briefing, mountain arrival,
confrontation, then victory aftermath. There is no segment2. These five
IDs previously had no authored segments/dialogue edits; the reference in
`chapter-three-tales.json` is a tracking condition, not finalized copy
being replaced. Two old ellipses are not counted as prior English writing.

The new conversation continues the already-adapted attack at Grimm's
home: someone has been watching the traveler's party. Grimm's note warns
the player to prepare companions and save before visiting; the briefing
makes clear this is a real fight, not a practice match. Its shortcut fits
the existing automatic background/jump transition, not a new teleport
control or player-selected destination. The mountain remains the same
story location, described as the mountain trail without inventing a new
country or map.

Humor comes from the suspiciously helpful note, Grimm's unhelpful drawing
skills, an imagined angry pumpkin and the enemy's rehearsed exit. The
Masked Duelist remains threatening, his master/order unnamed; the old
blame-the-game-writer exchange is replaced by the existing investigation.
No modern movie quotations or historical-author attribution is claimed.

Grimm and **Masked Duelist / 蒙面剑客** keep their applied identities. The
cast table's proposed Zorro is not adopted, reassigned or locked. The
aftermath refers to **Steadfast Mastery / 坚毅专精** training limits, not an
automatic skill rank, learned technique or point grant. The short journal
records defeating the group and preparing the party for further travel.

Original wording and both new languages can be reviewed slot by slot in
[the 29-row CSV](MASKED_DUELIST_DIALOGUE_REVIEW.csv), including stable scene,
zero-based step and speaker IDs. It is generated from the preserved raw
source and chapter file, not a transcript of a played encounter.

## Frozen mechanism evidence

The content audit compares both compiled locales with the exact saved
pre-batch packs and immutable original rules:

- **43 steps and14 non-dialogue steps remain exact**, including the same
  background/music calls, jumps, `神秘剑客_战斗`, win/loss/timeout handling,
  `legacy_maxlevel('基本内功',1,...)`, raw journal command and world-map
  return. The journal translation uses the existing display catalog; its
  original command text is unchanged.
- All29 original speaker IDs and dialogue positions match. **1882 other
  story segments per language** are unchanged, including Grimm's first
  return, partner recruitment, cure scenes and all unrelated countries.
- Every runtime top-level rule definition outside browser/story equals
  the frozen source exactly, including original skill/character names,
  battle participants/required characters, items, maps and world triggers.
- All browser fields outside displayCatalog remain exact. The only extra
  catalog changes are this battle's display name and the one journal text;
  no new actor display, map connection, objective priority or content rule.
- Original invitation still requires hero≥15, friends≥8 and the first
  Grimm-return stage. Home briefing still requires that letter and is
  once-only. The future organization trigger remains hero≥22 plus its
  original conditions. No save field, flag, number, reward or condition
  was added or relaxed.

Current genuine source is hero14 and has not received this invitation;
no level, story completion or map arrival was fabricated for acceptance.

## Builds and bounded presentation checks

Content generation passed (162 maps /1887 segments). The focused frozen
audit passed both languages and produced the CSV. TypeScript/Vite
production frontend build passed; existing runtime-loader/non-module and
large-bundle advisories remain. No .NET/runtime rebuild was performed.

Four isolated browser-display variants checked all29 source-rendered lines:
English/Chinese ×320/390px, using the actual `dialogueOverlay`, current
styles, real compiled packs, display projection and locale observer.
Rowan is the preview player name; Grimm and Masked Duelist names project
correctly. Exact authored text, journal and encounter title match; no
English CJK residue, horizontal overflow or hidden Continue button. The
existing Continue remains at least44px. English320 letter and Chinese390
aftermath screenshots were also visually inspected.

These are **presentation fixtures**, not eligible game states: no Game.Core
or WASM was initialized, no save imported, no story triggered, no Continue
action executed against the game, no combat or reward issued. They cannot
establish that the encounter is winnable or the normal route is completed.

The first fixture completed all four text/layout variants, but its overall
report failed on one console resource404. It did not record that request's
URL as a failed page response. The fixture was missing the explicit icon
declaration used by the real index; this declaration was added to the
fixture only. Separate v2 checks passed with zero console, request or HTTP
errors. The first report/screenshots remain intact; its passing text/layout
checks are not relabeled an overall pass, and the missing URL is not
presented as a fully traced original cause. No game code/copy was altered
to satisfy this fixture repair.

## Preserved artifacts and unverified gameplay

Ignored local evidence in `src/Game.Web/test-results/`:

| Artifact | Bytes | SHA-256 |
| --- | ---: | --- |
| Initial `masked-duelist-frozen-audit.json` | 5344 | `ba67c074ec6b49b57c76772df0cc88d74b4c718318e02732d1ad876bce9f1463` |
| Final `masked-duelist-frozen-audit-v2.json` | 5344 | `027b65a71798209b6161b89815a9d59adecdccd16c520747c57ff135668d595e` |
| First `masked-duelist-presentation.json`, overall false | 96533 | `f12e417e4d93ad39a33f077464e5bd7568f295b8f3b9b224475f5118fec45e8b` |
| `masked-duelist-presentation-v2.json`, passed | 95919 | `6f36043d083c75b3f219f7817d24e63a630bed1d0f78293a921c0ff8d9b99226` |

The generated CSV initially used CRLF, flagged by the Git whitespace check.
Its exact first export is preserved in the backup directory; the final
export uses LF with the same29 parsed row values. Only that exporter format
changed for the final audit; no additional content build, UI run or game
attempt was needed. Both frozen-audit reports are retained separately.

`backups/pre-masked-duelist-copy-486fa2a/` preserves the fixed original five
segments, both pre-batch compiled packs, registration, earlier Grimm copy,
cast, locks and identity notes. Its57-path immutable manifest also guards
the original baseline, six backups, rank8 candidates, actual defeats and
previous UI evidence. Those guarded sources remain byte-identical; only
the registered chapter and generated display packs change as intended.

Original source SHA-256 remains
`c348d1bc161dbe3a9f9a321232526da75b8d3c7638db7fb2b089d30981e9bcd3`.
Local preview/evidence files are not uploaded attachments.

**NOT_RUN:** normal letter arrival, eligible Grimm visit, the original
encounter configured with five party slots, either loss branch, mastery-cap award,
victory journal in real progression, original map return and Save/Load
after this story. Also untested: screen-reader speech and physical phones;
the display fixtures used cloud headless Chromium mouse viewports.
No Denmark/Britain retry, Okuni/cure-route expansion, material collection,
new main stage in a save or whole-game-completion claim.
