# First-screen goal: story ownership

The first-screen “Next step” card now shows the selected step's existing `storyTitle` above its objective. For the retained physician-progress save, the unchanged objective “The old duel needs investigating” now visibly belongs to **Denmark · Kai and Gerda**. Chinese shows **故事 丹麦·凯与格尔达** above **继续调查旧决斗**.

The change is limited to `world-dashboard.ts` markup and one wrapping style in `guided-interface.css`. Labels use the active content language, escape the authored title, and wrap instead of truncating it. Steps without a story title, including starter goals, do not receive a guessed owner. Other stories retain their existing authored titles; no country is inferred from a character or place name.

The selector, four-guide configuration, priorities, map actions, flags, host rules, rewards and save fields are unchanged. This does not add tracking controls or physician/material/poet recommendations, and does not mean the Denmark quest is complete. The “All goals” panel is unchanged.

## One focused validation

`src/Game.Web/test-results/check-objective-owner.mjs` builds the actual dashboard renderer and existing styles into a private, isolated static fixture. Headless Chromium uses mouse viewports, not a physical phone. No game runtime, normal save import, localStorage writes, travel, random events or battles are involved.

All **24 cases passed**, covering English and Chinese at **320×568** and **390×844**:

- The existing genuine physician-progress snapshot retains its selected `denmark-investigation` stage and objective title, with the correct Danish-story owner.
- Source-derived presentation fixtures select each of the other three existing guides, showing their own titles: Trouble at the Windmill / 风车风波; The Cardinal's Ledger / 枢机主教的账册; The Paired Seals / 双印记. These are isolated recorded-fact fixtures, not new playable progress or edited saves.
- A starter-goal fixture shows no story-owner row.
- Long English/Chinese owner labels wrap, including unbroken text and HTML-special characters, without horizontal overflow or HTML interpretation.

Normal objective titles and owner rows remain in the first viewport; renderer inputs remain byte-equivalent after rendering, random draws are forbidden during the pure render, and no page errors were recorded. The English 320px and Chinese 390px card screenshots were also inspected visually. Evidence: `objective-owner-presentation.json` and `objective-owner-{en,zh-CN}-{320,390}.png` in the ignored `test-results` directory.

`GAME_MODULE=worlds npm run frontend` passed TypeScript checking and the production frontend build. The initial command omitted `GAME_MODULE=worlds`: TypeScript passed, then Vite correctly refused the default `jyx` app against the existing `worlds` content. Both logs are retained; no content regeneration or .NET build was needed. Vite's existing bundle-size advisory remains.

The original 13-person/306-silver save, Snow Lotus non-harvest records, first unavailable river opportunity, and the earlier 20-file diagnosis/handoff ZIP are retained unchanged. No gameplay or full-route acceptance is newly claimed. Physical-device interaction and a fresh live-runtime walkthrough are NOT_RUN in this bounded presentation batch. No merge or deployment.
