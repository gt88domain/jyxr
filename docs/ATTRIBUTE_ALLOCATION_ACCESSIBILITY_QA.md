# Attribute allocation: bilingual accessible names

The English Character page's ten existing `＋` attribute-allocation buttons
had Chinese accessible names. The preliminary source review reproduced
`增加Strength`; the actual unchanged browser page more precisely showed
`增加臂力`, `增加定力`, etc., because the renderer uses pack stat labels.
The visible attribute text translated independently, while the concatenated
Chinese prefix prevented the same locale pass from translating the label.

`src/Game.Web/src/panels.ts`, `character()`, now chooses the prefix with the
existing `copy()` helper only when `appConfig.id` is
`jyxr-fantasy-worlds`. English uses `Increase `, Chinese uses `增加`.
Other applications keep the old Chinese prefix even in an English document.
The existing locale pass translates the remaining attribute label, yielding
**Increase Strength**, **Increase Spells**, and names matching all ten
visible attributes. No general translation pattern was added.

The template still escapes the label, displays `＋`, and retains the exact
`allocate-stat` action, `data-stat` IDs and disabled conditions. No point
amount, cost, requirement, stat calculation, handler, save or content rule
changed. No layout, global accessibility rewrite or new component.

## Targeted evidence

- Before-fix: a real unchanged-save import into isolated Chromium390px
  reproduced all ten Chinese accessible names. Report
  `attribute-labels-before-en-390.json` is retained as diagnostic evidence;
  its passing reproduction check does not mean the old labels were English.
- After-fix: **English/Chinese × 320/390px, four actual runtime UI cases**.
  Each normally imported the genuine save, opened Party→Kai→Character,
  read all ten aria-labels, and located each button by its exact browser
  accessible role/name. Chromium's `ariaSnapshot()` contains, for example,
  `button "Increase Strength"` and `button "Increase Spells"`. Chinese
  names retain `增加…`. No English control name contains Chinese characters.
- Every existing button still had its original stat ID/action, enabled
  state and visible `＋`. Focus was tested without clicking or pressing
  Enter/Space; **four unspent points remained four**, and no stat changed.
  The character grid did not overflow horizontally at either width.
- Normal export after each inspection matched every original serialized
  game field except naturally advancing playTimeSeconds; profile, battle
  history, study assignments and formation also matched. No Save/Load
  replay was necessary, no allocation was performed, and source bytes
  were never overwritten.
- **Four isolated renderer cases** additionally loaded the actual
  `panels.ts` through Vite SSR with the real `worlds` and `jyx` manifest
  application IDs × both document languages. `jyxr-modern-jyx` retains
  the original Chinese names in both languages, and command attributes,
  `＋`, enabled state and input data are unchanged. These are rendering
  fixtures, not an original-game playthrough or original-browser runtime.
- `GAME_MODULE=worlds npm run frontend` passed TypeScript and production
  build. Existing non-module runtime-loader and large-bundle advisories
  remain. No content/.NET rebuild or full-game regression was run.

Actual browser checks used cloud headless Chromium mouse viewports,
not a phone. They verify browser accessible names/tree; actual screen-reader
speech, touch/voice control and all original-game runtime modes remain
NOT_RUN. No battle, practice, travel, gear change, purchase or item use.

## Preservation and artifacts

Input `denmark-rank8-heavy-once-restored-save.json`, 74,032 bytes, SHA-256
`6ae6d002e157042b9ea1f74734f69d881bd6327a932ebd2cbf0baf2f22f58633`:
the real restored 13-member/356-silver heavy-armor candidate, with Kai
role6 and four unspent points. This is not a fabricated character or a
replacement for the protected original baseline.

Ignored local files in `src/Game.Web/test-results/`:

- `attribute-labels-after-{en,zh-CN}-{320,390}.json`: all passed, zero
  browser/request/HTTP errors, ten names and actual AX snapshot per case.
- Matching screenshots and normal `-inspected-save.json` exports.
- `attribute-application-render.json`: four original/fantasy renderer
  cases; not an actual original-app browser session.
- `backups/pre-attribute-labels-d8a9b47/manifest.json`: 39 pre-existing
  source/evidence paths rehashed unchanged, including original baseline,
  six backups, rank8 candidates, native defeats, previous QA failures and
  the scoped review. No earlier report or candidate was replaced.

Original rule-pack SHA-256 remains
`c348d1bc161dbe3a9f9a321232526da75b8d3c7638db7fb2b089d30981e9bcd3`.
No game completion percentage or additional playable route is claimed.
Candidate branch only; no merge or deployment.
