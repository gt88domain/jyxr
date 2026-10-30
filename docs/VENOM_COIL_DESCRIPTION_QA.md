# Venom Coil description: display-only correction

The genuine rank-8 Kai save showed **Viper's Hex — Venom Coil** in English,
but its expanded description was still `歹毒的鞭法`. The name already had a
display mapping; that description key did not. The frozen source uses this
description only for `毒龙鞭法.银龙毒鞭`.

`src/Game.Web/content/worlds/chapter-equipment-copy.json` now maps this one
description in English and the Chinese comparison view. It explains the
star-shaped area around the caster, Poison III for 3 turns on a hit,
resistance, rank-8 unlock, base Rage cost 4 and cooldown 5. It directs the
player to live costs and highlighted targets rather than promising that
every cast poisons every target. The existing buff ID displays as **Poison**.

Sources checked: the original form definition; hit/buff processing in
`BattleEngine.Effects.cs`, resistance in `BattleBuffResolver.cs`, Star
geometry in `BattleEngine.Impact.cs`, and parent Energy-cost inheritance in
`FormSkillInstance.cs`. No new effect, geometry, damage, unlock, cost,
condition, command, reward, ID or save field was introduced. The original
description remains unchanged inside the runtime rule definition; only its
existing display projection translates it.

## Validation

- Content build and `GAME_MODULE=worlds npm run frontend` passed. Existing
  non-module runtime-loader and large-bundle advisories remain. No .NET
  rebuild was needed or performed.
- Existing `test_grimm_skin.py`: **18 passed**, including runtime rule
  preservation and rejection of damage/reward/flow changes.
- Existing `presentation.test.mjs`: **10 passed**.
- **Four actual UI cases passed**: English/Chinese × 320/390px, each in a
  fresh cloud headless Chromium mouse context. Each normally imported the
  genuine rank-8 export, opened Party → Kai → Character, expanded and
  collapsed the existing disclosure, matched its locale text, and checked
  the row and paragraph for horizontal overflow. The summary remains at
  least 44px high. English390 and Chinese320 screenshots were also viewed.
  This was not a fixture, touch test or physical phone.
- Actual host skill fields remain rank8, Energy96, Rage4, cooldown5,
  castSize0, impactSize4. Party, roster, currency, time, map, journal and
  owned-item identities/quantities remain unchanged during read-only UI
  inspection. Selecting Kai changes contextual equipment/study eligibility
  views; it does not alter ownership or requirements.

The first English390 and English320 runs displayed the corrected text and
passed layout checks, but failed an extra QA assertion that incorrectly
compared the hero's item-eligibility view with Kai's. Those reports remain
`passed:false`. Only the QA comparison was corrected to check stable
ownership fields; no game code or content was changed to satisfy it. The
four successful rechecks are separate reports, not rewritten failures.

Workspace evidence is under `src/Game.Web/test-results/`:
`venom-coil-copy-recheck-{en,zh-CN}-{320,390}.json` and matching screenshots;
original failed reports retain the `venom-coil-copy-en-` prefix. These are
ignored local evidence files, not uploaded attachments.

## Preservation and limits

Source `kai-viper-last-one-complete-save.json`, 74,166 bytes, SHA-256
`8b769259e0d4d77b02ba4558243cae1c051282d55132f0554058772245090448`,
is unchanged. The preservation manifest
`test-results/backups/pre-venom-coil-copy-470e31c/manifest.json` covers 25
existing paths, including this candidate, original baseline, six previous
backups and historical failed/interrupted evidence; all hashes match.

The original rule-pack SHA-256 remains
`c348d1bc161dbe3a9f9a321232526da75b8d3c7638db7fb2b089d30981e9bcd3`.
Both rebuilt runtime locales also match every original top-level definition
outside the allowed browser/story projections.

No battle, practice, travel, shopping, item use, stat allocation or skill
toggle occurred. No save-format changes or repeat Save/Load testing were
needed: the prior rank-8 batch already proved normal persistence. This
batch does **not** verify an actual Venom Coil cast, poison application,
combat geometry or a Danish victory. No merge or deployment.
