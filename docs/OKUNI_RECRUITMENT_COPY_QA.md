# Okuni: entry variants and recruitment copy

This batch adapts the existing three-scene companion encounter into bilingual fantasy dialogue for **Izumo no Okuni / 出云阿国**. It keeps every original dialogue slot, speaker, non-dialogue step, map event, battle and reward. It delivers text and display mappings, **not a completed recruitment playthrough**.

Baseline: `7b4ceb06c8e1af3a93952ce12090789eb6178231` on `feat/storybound-italian-battle`. Original JYX package SHA-256: `c348d1bc161dbe3a9f9a321232526da75b8d3c7638db7fb2b089d30981e9bcd3`.

## Complete scope

| Original segment ID | Dialogue slots | Total steps | Function |
|---|---:|---:|---|
| `笑傲江湖_曲非烟1` | 5 | 5 | Brief encounter without Musashi |
| `笑傲江湖_曲非烟2` | 13 | 14 | Recognition with Musashi, then the original fight |
| `笑傲江湖_曲非烟胜` | 7 | 11 | Enemy withdrawal, invitation and original rewards |
| Total | **25** | **30** | Two entries and one shared victory result |

All 25 slots are newly adapted. Previously 23 held Chinese prose and two held only ellipses. They are not 25 newly added story steps. The exact original text, speaker IDs and zero-based step positions are retained beside the two new texts in [the 25-row comparison CSV](OKUNI_DIALOGUE_REVIEW.csv).

`chapter-okuni-recruitment.json` is registered once in `grimm-skin.json`. Its display scope is limited to:

- Names for both existing Okuni character forms and her existing map card; both forms remain the same identity, with no new transformation label.
- Rainmarket Outskirts / 雨集镇郊外 and its existing map/location descriptions.
- The existing event description, warning that meeting her **with Musashi** leads to battle, plus the existing return description. The already translated forest navigation hint remains owned by `chapter-denmark-remedy.json`.
- Existing battle title **Stand with Okuni / 与阿国并肩迎敌** and title **A Place in the Troupe / 剧团新伴**, whose description states that Okuni joined.

Sun and Moon Lash / 日月法鞭 and Sun and Moon Lash Tome / 日月法鞭法术书 retain their previously compiled names. This chapter does not take ownership of those skill/item definitions or alter their requirements and effects. Receiving or carrying the tome is explicitly distinguished from studying it.

## Identity and narrative

The existing cast spelling is `jp.izumo-no-okuni`, actor `actor-8ba17cc7d832`. That cast record remains **proposed**, not newly locked or globally approved. Musashi stays `jp.miyamoto-musashi`; Benkei stays the already applied candidate `jp.benkei`. No cast file, identity status, family tree or art is changed.

Okuni is a dancer and spellcaster frustrated by a broken-up performance. Musashi recognizes her, and her practiced stage fall explains why he thought she had been struck down. Benkei's existing hostile role and temple guards interrupt; after victory she chooses to travel with the party and brings her spell tome. The no-Musashi encounter remains a brief conversation rather than promising an unavailable recruitment.

The old flirtation, grandfather's death, paired musicians' deaths and Musashi's unrelated romance are removed from this short scene. No replacement ancestor, partner, offscreen death or new quest condition is invented. Humor concerns rehearsal, audiences and retreating before the ending. These are original lines in the project's fantasy crossover, **not quotations or biographical claims about historical Okuni, Musashi or legendary Benkei**. The chapter does not imply that real Benkei historically attacked Okuni's troupe, nor copy a modern film/game characterization. Later unadapted Japanese scenes remain outside this batch; their text is not claimed consistent or complete.

## Frozen entry and results

The original map is `衡阳郊外`, reached from the existing forest path. Its event IDs, priorities and conditions are unchanged:

- Event 1 calls `笑傲江湖_曲非烟2` when one of four original Musashi forms is present, before Okuni's victory and before the excluding Westlake inquiry. It does **not** gain a night or chance requirement.
- Event 2 calls `笑傲江湖_曲非烟1` without those forms, still restricted to its original night slots and 50% condition.
- The approach path retains its original 5% mountain encounter and existing navigation behavior. No safe shortcut, extra map connection or guaranteed encounter is added.
- `曲非烟_战斗` retains three party slots with hero and Musashi required, **plus guest Okuni**: four allies against Benkei and 14 temple guards, 15 enemies total. Positions, stats, skills and required lineup are unchanged. Loss and timeout still lead to the original gameover.
- After the seven victory lines: `join('曲非烟')` → `item('日月鞭法秘籍', 1)` → `legacy_nick('古琴知音')` → `map('衡阳郊外')`, unchanged and in that order. No capacity bypass, automatic study, extra coin or healing is added.

All five non-dialogue steps (including the battle and its nested outcomes) match the native source exactly. All IDs, conditions, growth, inventory rules, JOIN behavior and save fields remain frozen.

## Checks actually run

1. **Content generation:** `python3 scripts/build-module.py --module worlds` passed: 162 maps, 1887 story segments. The first attempt correctly rejected a duplicate navigation-label owner; the duplicate was removed, leaving the existing chapter's wording intact. Failure evidence remains in ignored `okuni-copy-first-build-failure.txt`.
2. **Frozen structure and comparison:** `audit-okuni-copy.py` passed. Both locale packs retain 30 steps/25 speakers/5 non-dialogue steps, all raw rule definitions, all browser fields outside the display catalog, and **1884 other scenes per locale** exactly. Catalog differences are restricted to the explicit character/map/location/battle/title/entry display keys. Cast, locked identities, identity notes and 66 protected source/candidate/backup/failure files are byte-identical. CSV contains all 25 original/new pairs, with LF endings.
3. **Bilingual narrow presentation:** `check-okuni-presentation.mjs` passed English/Chinese × 320/390px, 25 lines per variant. It uses the real dialogue renderer, current styles, compiled locale packs and display projection in an **isolated browser presentation fixture**. Each text and speaker matches; English dialogue contains no Chinese; no horizontal overflow; every Continue control is visible and at least 44px high. Projected map, entry, title, battle and tome names match the chapter/current dictionary. Representative screenshots were visually inspected, including wrapped `Izumo no Okuni` at 320px. No page errors, console errors, failed requests or failed HTTP responses were recorded.
4. **Frontend:** `GAME_MODULE=worlds npm run frontend` passed TypeScript and Vite. An earlier command omitted the module variable and was correctly rejected by the existing module guard; that command error is preserved in `okuni-frontend-default-module-failure.txt`, not hidden by changing the guard. Existing runtime-loader/non-module and large-chunk warnings remain. No .NET runtime rebuild was performed.

Fixture checks are **not actual story progression, Continue-driven gameplay, mobile hardware or save restoration**. New assets were not made: the preview still uses existing original portraits. The first shared navigation-label conflict and mistaken default-module frontend command are retained; they are not represented as first-attempt passes.

## Evidence and remaining acceptance

Ignored evidence lives in `src/Game.Web/test-results/`:

| Artifact | Bytes | SHA-256 |
|---|---:|---|
| `okuni-frozen-audit.json` | 4265 | `6fa253f0bb33db742b4b872a3ef33e2bd7e6c596ce33b79db97ee7734490f989` |
| `okuni-presentation.json` | 83600 | `6e19a182c3660cb9037d8a36b6fc20513927b200566ad3c01c7a29dc05ea69f3` |
| `backups/pre-okuni-copy-7b4ceb0/protected-manifest.json` | 12516 | `1fe1699e74bbcfb40f5a7bb0f0fa09ef97540850d40840255fe37830fb4a57a1` |
| `docs/OKUNI_DIALOGUE_REVIEW.csv` | 5518 | `b95d30f30fe49bd9992055515943c5116a07deafa1cc1141cb32c0ebfd1fa939` |

The backup also preserves both prior locale packs, the previous skin registration and the three native segments. Existing original saves, the six protected backups, the recent level-14 Grimm-boundary candidate, and every old failure record remain unchanged.

**NOT_RUN:** normal forest travel, either actual encounter, the 15-enemy battle, defeat/timeout, Okuni's actual JOIN/capacity handling, tome/title receipt, subsequent saving/loading, later growth forms and physical-phone interaction. No Denmark or Britain fight was retried, no progression was injected, and no materials were collected. This does not complete the Ginseng or physician-cure chain. No merge or deployment.
