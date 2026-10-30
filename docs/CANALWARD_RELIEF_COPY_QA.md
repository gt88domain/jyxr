# Canalward relief: complete encounter and immediate aftermath

Baseline `abdf068d33932017e73d2a1a5e52c76f262a65d2`, original writer/workspace, branch `feat/storybound-italian-battle`. This batch completes two adjacent segments, **seven original dialogue slots /15 steps**, in American English and corresponding Chinese:

| Segment | Dialogue slots | Total steps |
|---|---:|---:|
| `mainStory_紧急.杭州` |2|5|
| `mainStory_紧急.杭州胜` |5|10|

Exact originals, speaker IDs, step indexes and bilingual replacements are retained in the [seven-row comparison CSV](CANALWARD_RELIEF_DIALOGUE_REVIEW.csv). The native source SHA-256 remains `c348d1bc161dbe3a9f9a321232526da75b8d3c7638db7fb2b089d30981e9bcd3`.

## Why this scene can be authored now

The text uses only the existing **Canalward / 运河城**, **Highbridge / 高桥城**, **Masked assassin / 蒙面刺客**, Grimm and player mappings. It needs no Watson identity decision or new cast. `mainStory_紧急2/3/4` and the unapproved John Watson candidate remain untouched. Independence here concerns content authoring; this does not bypass those scenes' original gameplay prerequisites.

The attacker tells the traveler there is nowhere to run; the player answers that they came to stop the attacker. After the original victory, a tired player hopes for a chair. Grimm reports the renewed attack on Highbridge and advises training companions and checking their gear before returning. The brief joke yields to an explicit destination and preparation advice. There is no new mechanic, preparation requirement or guaranteed outcome.

Two related text displays are also localized:

| Original | English | Chinese |
|---|---|---|
| `杭州告急！` |Canalward under attack!|运河城遇袭！|
| `解蒙古大军之围。` |The attacks on the towns have been repelled. Highbridge is under attack again.|各地的围攻已被击退，高桥城却再次告急。|

The first is an exact UI-label mapping; the second uses the existing `commandText` display mechanism for the original journal command. No new journal record or state flag is added. The source command is preserved in the backup; only its human-readable text argument is localized in generated packs.

## Frozen flow and checks

- The world-map Canalward event remains once-only and requires original completion of `mainStory_紧急4`, `mainStory_紧急.衡阳胜` and `mainStory_紧急.洛阳胜`. No level, probability, map location or access condition changes.
- The original `襄阳_战斗` definition is unchanged. Win still jumps to `mainStory_紧急.杭州胜`; lose and timeout still call `legacy_flow('gameover')`. Background/music, original `legacy_maxlevel('基本内功', 1, 'legacy.mainStory_紧急.杭州胜.基本内功')`, journal position and final `map('大地图')` retain their source order and behavior. The eight non-dialogue steps have seven exact original values and one localized journal-text argument.
- Content generation passed with162 maps and1887 segments. The directed audit passed for both locales: only these two segments changed, **1885 other segments per locale remain exact**, and all native gameplay definitions match the original. Browser differences are restricted to the one entry-label text mapping. No names, character rules, battle values, rewards, save schema or trigger fields change.
- All103 protected original/candidate/backup/cast/source/prior-evidence files are hash-identical. `backups/pre-canalward-relief-abdf068/` preserves previous locale packs, previous skin, both exact source segments and the protected manifest.
- All seven lines passed English/Chinese×320/390 presentation checks using the current dialogue renderer/source styles, compiled packs and existing display projection in an isolated fixture. Exact speakers/text, no clipped paragraphs or horizontal overflow, visible Continue≥44px and no page/console/network/HTTP errors. English320 preparation advice and Chinese390 assassin greeting were visually reviewed.
- `GAME_MODULE=worlds npm run frontend` passed TypeScript/Vite. Existing runtime-loader and bundle-size warnings remain. No .NET build or unrelated repeated suite was needed.

## Same-scope remaining text

The fixed scope is still the same15 original late-mainline segments /106 top-level dialogue slots. This batch newly adapts seven Han-containing slots, without touching punctuation-only slots.

| Measure | Before | After |
|---|---:|---:|
| Segments still containing native Chinese |12|10|
| Top-level slots containing Han characters |62|55|
| Punctuation-only slots still pending |11|11|
| Remaining original slots pending complete adaptation |73|66|

These are text counts, not a whole-game completion percentage or proof of ending access.

## Evidence and unverified boundaries

Ignored evidence under `src/Game.Web/test-results/`:

| Artifact | Bytes | SHA-256 |
|---|---:|---|
| `canalward-relief-frozen-audit.json` |1342|`09af8e1a3f0b9aa3b662199b439d04d60b130a8d754b3055c85c6dd664a7f597`|
| `canalward-relief-presentation.json` |22641|`09a9ae37f01362e6db10a049314036dd4cb596be38ef40d7b2b03036b0bbb593`|
| `docs/CANALWARD_RELIEF_DIALOGUE_REVIEW.csv` |1372|`442db4e51b3f806b6294fbad0affc0beddb858eed51342577c6bff312eb7dbf9`|

Screenshots are `canalward-relief-presentation-{en,zh-CN}-{320,390}-{0,5,6}.png`. The exact entry-label mapping and journal text were checked in the compiled data; their live map-card/journal-panel rendering was not exercised.

**NOT_RUN:** level25 progression, natural access to this event, its battle and victory/defeat, reward application, actual journal creation, map return and late-game Save/Load. The fixture initializes no game runtime and creates no qualifying progress. No battle, travel, leveling, random retry, state injection, new identity, artwork, merge or deployment. Original saves, six backups and earlier failed evidence remain untouched.
