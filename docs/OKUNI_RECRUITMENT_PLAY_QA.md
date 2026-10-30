# Okuni: one normal-route recruitment attempt

2026-10-30, original cloud workspace and `feat/storybound-italian-battle`, starting at clean product HEAD `7d43413d0eaff35511e8a7747fb521eacf7a1781`. This batch contains two small display corrections and **one actual recruitment battle**, which won at tick 365. It does **not** establish a saved/restored post-recruitment journey.

## Actual route and source

The genuine normal-difficulty source is `denmark-rank8-heavy-once-restored-save.json`: 74032 bytes, SHA-256 `6ae6d002e157042b9ea1f74734f69d881bd6327a932ebd2cbf0baf2f22f58633`. It has hero level 14, 13 members, 356 silver, Musashi in the party, no Okuni, neither Okuni victory nor the excluding Westlake-inquiry completion. This satisfies the original Musashi entry; no new night requirement or level threshold was invented.

A fresh headless Chromium cloud context imported a copied source through the normal file input. The normal visible route was Rain Shrine (`湘妃庙`) → Back to Rainmarket (`衡阳`) → Rainwood (`潇湘古林1`) → Left path → Rainmarket Outskirts (`衡阳郊外`). The original 5% mountain encounter did not occur; it was not retried or disabled.

The first run stopped **before any dialogue or battle** on an actual display mismatch: the card showed its generic rehearsal description instead of its selected event's battle warning. That `passed:false` report remains unchanged. Its normally exported real arrival file, `okuni-recruitment-once-interrupted-save.json` (73959 bytes; SHA-256 `188c78c58c0433562237e1cb276efac2f2f274c98157ba975ef150eeb42d85c5`), was the only continuation source. No travel, random entrance or battle was replayed.

## Display fixes

1. The new chapter's category-level location description overrode the host-selected event description during presentation. The generic rehearsal description now has its own exact source-text label; the location mapping supplies only Okuni's name. This lets the original selected event retain its authored warning. **No general projection code or event-selection rules changed.**
2. The long warning was visibly clipped by the existing card. It is now `With Musashi: fight. Save.` / `武藏同行时开战，请先保存。`. In a separate final display-only check from the same genuine pre-battle arrival, the entire warning fit English 390/320px and Chinese 320px. No NPC interaction, travel or battle was performed in that check. Its exported game was unchanged except elapsed play time.
3. The actual post-victory toast still showed native title `古琴知音`, although the achievement catalog had the localized name. A single exact UI label now maps that title to `A Place in the Troupe` / `剧团新伴`, consistent with the existing achievement display. The real raw notification and count-suffixed summary were checked through the existing UI translator; **the victory was not replayed to regenerate a toast**.

The generic-description fix and warning compression are one entry-display correction; the title label is the second correction. All 25 dialogue lines and 30 original steps are unchanged from the previous content commit. The original/new dialogue CSV is byte-identical.

## What was actually played

After importing the real arrival export into a new isolated context, normal Save/export and supported `?lang=zh-CN` / `?lang=en` entries with title Load verified the actual Chinese 320px and English 390px map, name, event description and saved pre-battle progression. This was not an in-game language-toggle button test and not physical-phone testing.

The existing Okuni card was clicked once. All **13 encounter lines and seven victory lines** were read through the real Continue control, with original speakers and the new English text. The 390px dialogue checks found no horizontal overflow and visible Continue buttons at least 44px high. The five-line no-Musashi fallback was not entered.

The native battle was `曲非烟_战斗`, displayed as **Stand with Okuni**:

| Side | Actual opening units |
|---|---|
| Party slots and guest | Rowan 1860 Health / 1340 Energy; Pinocchio 1500 / 1500; Musashi 1000 / 500; guest Okuni 800 / 1200 |
| Enemies | Benkei 2500 / 1500, plus 14 Temple Guards, each 500 / 500 |

The host retained hero/Musashi requirements; no party reordering or equipment change was used. Read-only host snapshots supplied current legal targets, reachable cells and action budgets. Normal mouse controls made 15 legal moves, 14 confirmed ordinary skill casts and two rests. Each selected attack had a host target and native `SkillCast` confirmation; its reported impact geometry was checked. No potions, shopping, training, stat-point allocation, special-skill injection or core AI changes were used. The control code chose ordinary attacks; it was not an exhaustive player-strategy comparison.

Okuni actually cast Sun and Moon Lash four times, at ticks 92/183/274/365. Each cost 112 Energy: 1200 → 1088 → 976 → 864 → 752. Musashi actually landed Ninefold Sword for 919 damage on Benkei. Three Musashi `ActionSkipped` events also occurred; their reason was not exposed and is **not attributed to a guessed cause**.

The battle ended with native **win at tick 365**, all four allies alive. Hero ended at 1611/1980 Health, 12/1420 Energy; Pinocchio 1371/1620 and 1500/1560; Musashi 863/1120 and 371/560; guest Okuni 246/800 and 752/1200. These battle values are not a claim about persisted current vitals; existing map restoration remains unchanged.

## Rewards observed, save boundary retained

After the seven victory lines, the original JOIN/item/title/map commands executed normally. The actual host snapshot showed:

- 13 → **14** party members, with **Izumo no Okuni** present.
- **356 → 420 silver**, original settlement, no test grant.
- Sun and Moon Lash Tome **0 → 1**; an additional native `粗布道袍` inventory count **1 → 2**. No original medicines were consumed.
- Earned title `古琴知音`, projected as **A Place in the Troupe**, description **Izumo no Okuni joined the party.**
- Hero **14 → 15**, experience **3085 → 3346**; no artificial leveling.

That natural level-up immediately satisfied the original next-letter trigger. On return to the outskirts, the host entered the first new Grimm-letter line: **“A note from Grimm. Let's hope he's the one waiting at his house this time.”** The screenshot shows that actual line and a disabled Save button.

The QA controller stopped at this unexpected extra story boundary without clicking Continue, then closed its isolated context. This is a **test stop, not game defeat, timeout, an unreachable map, or a demonstrated save bug**. Continuing the existing three-line letter could normally reach the next map checkpoint, but was not done in this attempt. Do not imply that the live encounter can still be resumed.

The retained browser storage was inspected read-only: its effective game slot is still **level 14, 13 people, 356 silver, at the outskirts before the fight**. Its separate profile contains the earned title and kill count 181 → 196, with death count remaining five. This is not a complete victorious game save, and the profile must not be combined with an edited game to fabricate one.

Consequently, raw `okuni-recruitment-continuation.json` has `passed:true` for its bounded checks, but `recruited:false` and `recoveryVerified:false`: the script sets its completed-recruitment flag only after obtaining the expected stable world checkpoint, which the automatic letter interrupted. The 14-member snapshot, item and title events establish the **observed JOIN/rewards**, while **post-victory save/reload, rendered party/title panels and their Chinese gameplay display remain NOT_RUN**. The raw flags are not edited to look complete. Obtaining a future genuine victorious saved checkpoint would require another authorized normal playthrough; no battle was repeated here.

## Checks and evidence

- Final content generation: 162 maps / 1887 segments, passed.
- Final frozen audit: 25 dialogue slots / 30 steps / five non-dialogue steps exact; 1884 other scenes per locale, all raw gameplay definitions and browser rules unchanged. Catalog deltas are only the existing Okuni display scope plus the title's exact UI label. CSV unchanged.
- Three permanent focused tests in `tests/okuni-entry-presentation.test.mjs`: host-selected event warning in both locales, generic-description translation and input immutability, plus the actual raw/count-suffixed title notification. Passed.
- Final `GAME_MODULE=worlds npm run frontend`: TypeScript/Vite passed. Existing runtime-loader and bundle-size warnings remain; no .NET runtime rebuild.
- 74 protected original/source/candidate/six-backup/failure files remained byte-identical. The one authorized chapter display file was explicitly excluded from that immutable set; its previous version was copied into the backup. No Denmark/Britain battle, RNG adjustment, time edit, condition edit, state injection, merge or deployment.

Ignored evidence in `src/Game.Web/test-results/`:

| File | Bytes | SHA-256 |
|---|---:|---|
| `okuni-recruitment-once.json` — first actual warning failure, no fight | 2733785 | `d2e791d51b63d5778f1d3612719fcccc2cb20da6abc195160363e10cb2b35f4e` |
| `okuni-recruitment-continuation.json` — one battle and boundary | 3934796 | `096b9445da3e74ca6d5b3f617abeafeec539262e401acc08591b39c8841d243c` |
| `okuni-recruitment-continuation-stopped-storage.json` — pre-battle game slot plus updated profile | 85450 | `63babb35a8e073ced3ca3e513714c4a9d7539391798429f5cd46b4f96cec2708` |
| `okuni-warning-final.json` — actual final warning display, no battle | 3859 | `945b9762ec225de35f021bd8e67317c32def375d5752f1c69aa4dfc0aadf43bb` |
| `okuni-live-frozen-audit.json` — final allowed display changes | 4317 | `70b6d69fce8fdfc486063390e9a3f8fbfd5dc9fbb4705ddfc91b1cace943113e` |

Representative actual screenshots: `okuni-warning-final-en-320.png`, `okuni-warning-final-zh-CN-320.png`, `okuni-recruitment-continuation-battle-result.png`, `okuni-recruitment-continuation-stopped.png`. These are distinct from the previous batch's component previews. No new art; existing portraits remain.

The original [copy-batch report](OKUNI_RECRUITMENT_COPY_QA.md) remains a historical record of its static delivery. The present report adds only this route attempt and its explicit incomplete-save boundary; it does not claim a complete Japanese story, all builds viable, or a saved recruitment loop.
