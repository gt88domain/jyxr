# Study-result skill names

The retained Denmark first-battle victory at tick279 displayed `Study: 毒龙鞭法 · XP +152 · Rank 3.`. The approved names already existed in `displayCatalog.byCategory.externalSkills`: **Viper's Hex** / **蝰蛇咒术**. This name was absent from the general `displayCatalog.text` dictionary, which the study-result formatter incorrectly used.

The original runtime format is `秘籍修炼「{skill.Name}」经验 +{AddedExperience}` with an optional `，提升至 {NewLevel} 级` and final punctuation (`BrowserBridge.Systems.cs/ApplyCultivationExperience`). The original runtime, skill IDs, names used by rules, XP, rank, save data and content packages remain unchanged.

`src/Game.Web/src/ui/locale.ts` now resolves the captured study subject with the existing skill-category lookup, as other skill notices already do. The same narrowly matched notice uses that lookup in the fantasy Chinese comparison view. Item names sharing a legacy skill ID remain in the item namespace; no general quoted-text translation or content-generation rule was changed. The resulting English line is `Study: Viper's Hex · XP +152 · Rank 3.`; Chinese retains the existing study wording and shows `蝰蛇咒术`.

Validation:

- Before-fix output was reproduced using the actual English catalog; the log is retained as `test-results/study-result-before.log`.
- All **21** related terminology tests passed. Added regression cases cover the actual category-only spell, optional rank text, repeated translation, a skill/item shared ID and an unmapped subject without inventing a translation.
- **8** isolated result-rendering cases passed: English/Chinese × 320/390px × with/without rank increase. They use the actual renderer, styles and retained first-battle ending. The raw study message is reconstructed from the runtime's deterministic format and the previously observed XP152/rank3; it was not stored as a raw log in the old battle JSON. These fixtures are presentation evidence, not a restored victory or new playthrough.
- The study row remains visible without horizontal overflow; numbers and raw input logs remain unchanged. English320px and Chinese390px screenshots were also visually inspected. Evidence: `test-results/study-result-presentation.json` and `study-result-{en,zh-CN}-{320,390}.png`.
- `GAME_MODULE=worlds npm run frontend` passed TypeScript checking and production frontend build. Vite's existing bundle-size advisory remains. No content/.NET rebuild, live battle, random visit or save operation was needed.

The original first-battle report SHA `f684920d1e12083ce2f6417600cbc319d9d382a0cbd6db0fbcf0c1af17fdb27d`, preparation/source saves, six prior backups, all failed records, old tick400 ongoing stop, and previous handoff package are retained. Kai's spell cast/hit and solo battle remain unverified; this display fix does not change that boundary. No merge or deployment.
