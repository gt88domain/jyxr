# Dense battle names: narrow-screen presentation

The existing numbered board labels and expandable full-name roster were already implemented and accepted in [the earlier readability batch](BATTLE_READABILITY_ITALY.md). This batch preserves them. It fixes one additional, reproducible display defect: a long unbroken English actor name could expand the **current-actor sidebar heading**, creating horizontal page overflow.

Product baseline: `20382c7540f4c6121b5412b8251ceeb05ef734a4`. The only product change is `overflow-wrap:anywhere` on `.duel-turn h2` in `src/Game.Web/src/battle.css`. The heading retains its full text; the existing board numbers, ellipsis behavior and expandable full-name roster are unchanged. No battle coordinates, canvas geometry, pointer/hit regions, command handling, rules, statistics, growth, rewards or save data are modified.

## Existing evidence and finite fixture

The earlier `battle-labels.json` passed a real French battle's 16-person numbered roster and 320/390/1440px layout. That battle was not reopened.

The new isolated fixture reads `hippocrates-consultation-once.json`, SHA-256 `4b993fe5cf32ae8e73630044656c87a7c97fea437c24a74d90d04b8a6bab542b`, and uses its recorded opening positions: four allies and fifteen enemies. Grid size 11×4 comes from the existing `BattleStateFactory` constants. The old report's `passed:false` inventory assertion after its genuine victory is retained unchanged, not relabeled green.

`test-results/check-dense-battle-labels.mjs` bundles the actual Phaser `Board`, `battleShell`, `updateBattleView`, localization and styles into a private static fixture. It does not load WASM, import a game save, execute gameplay commands, advance a turn, draw game events, travel, award items or write localStorage. Board callbacks remain zero and the input state remains byte-equivalent after display checks. Missing recorded sprite assets use Board's existing fallback markers; this is not artwork or animation acceptance. The UI is paused for inspection.

Two sets of names are checked at each of 320px and 390px, in headless Chromium with mouse viewports (not a real phone): recorded names, and explicit stress names containing spaces, punctuation, HTML-special characters and a long unbroken component. Stress names exist only in the isolated renderer fixture; no content or save is renamed.

## Findings and correction

- The baseline's four cases found **zero** board-name/name intersections, name/neighbor-health-bar intersections, or labels escaping horizontally from their own cell. The expanded roster retained all 19 full names, including repeated guard identities distinguished by their original numbers.
- Both long-name cases nevertheless overflowed the page. A focused 320px inspection measured document width **1134px** and the current-actor heading width approximately **1102px**, while the sidebar's outer width remained 292px. The heading's unbroken token supplied the oversized grid minimum; this was not a canvas-label collision.
- After the one-property CSS correction, all four focused cases passed. Page widths are **320px / 390px**; heading widths are **256px / 326px**. Board label, neighbor-bar and cell-boundary checks still have zero intersections/escapes. Existing roster rows fit and preserve the complete names. No new full-name popup or interaction is added.

The first fixture run incorrectly queried `#battle-board` instead of the existing `#board-viewport`, stopping before a board was created. Its failed report/log remain as `dense-battle-labels-before.*`. This was a QA selector error, not a game failure. The corrected baseline, focused overflow diagnosis and post-fix evidence remain separately named, not overwritten:

- `dense-battle-labels-baseline-v2.json`: four baseline cases, `passed:false` due to the two page-overflow stress cases.
- `dense-battle-labels-overflow-detail.json`: focused pre-fix 320px layout measurements.
- `dense-battle-labels-after.json`: four post-fix cases, `passed:true`, page errors zero.
- `dense-battle-labels-{baseline-v2,after}-{320,390}-{actual,long}.png`: isolated arena/roster screenshots. The post-fix 320px recorded-name image was visually inspected; full-name text and the board numbers remain present. Sidebar wrapping was checked through browser bounds, not a fresh gameplay walkthrough.

`GAME_MODULE=worlds npm run frontend` passed TypeScript checking and the production build once after the CSS change. Vite retains its existing bundle-size advisory. No .NET rebuild, game battle, random attempt, prior-story replay or full-site acceptance suite was performed.

The retained saves, French/Italian/companion results, all historical failed evidence and the earlier 20-file objective/river handoff package remain unchanged. This finite fixture does not establish battle strategy, full English UI coverage, real-device behavior, animation-label interactions or readability at other board sizes. No merge or deployment.
