# 地图存档的当前生命与能量：仅诊断

结论：有两个已存在的边界。正常进入地图会恢复队伍资源；存档人物记录则不包含当前生命／能量，读档重建后按上限进入显示与下一场战斗。这不是本批显示换皮引入的变化，也不能算“当前资源精确恢复”通过。本批没有修复或改变它。

## 相同真实存档的两路复现

起点为新开局首笔购买的未编辑导出，SHA-256：`663c76a5dbc564e0244d41f5e0334d8ef2563a0c95a72219540def8d4931640f`。两个隔离浏览器分别导入，再正常回格林处交差，选择原有友好切磋任务。余额全程260。

| 步骤 | 当前／最大生命 | 当前／最大能量 |
| --- | --- | --- |
| 原新档 | 320／320 | 280／280 |
| 原奖励上限各加100，仍在格林居所 | 320／420 | 280／380 |
| 只打开并关闭指南 | 320／420 | 280／380 |
| 手动保存，不离开地图 | 320／420 | 280／380 |
| A：原地刷新后继续旅程 | 420／420 | 380／380 |
| B：不读档，正常点击返回大地图 | 420／420 | 380／380 |
| B：在大地图再保存、刷新并继续 | 420／420 | 380／380 |

A的地图仍为格林居所，因此变化不是由玩家移动触发；B证明地图切换本身已有恢复规则。两个分支的钱、永久上限和任务选择未因测试改变。这里未验证其他消耗、怒气或战斗中保存。

当手动档就是最新档，标题页只显示Continue journey，不再单列Load manual save；本次两路均使用这个实际可见入口。首次测试错误地强找单列按钮而失败的记录另存为 `map-save-vitals-control-assumption.json`，没有为通过测试增加按钮或改读档顺序。

## 代码依据

- [MapService.EnterMapCore](../src/Game.Application/MapService.cs) 在进入地图时调用队伍恢复。
- [BattleCarryoverService](../src/Game.Application/Battle/Settlement/BattleCarryoverService.cs) 与 [CharacterInstance.RestoreBattleResources](../src/Game.Core/Model/Character/CharacterInstance.cs) 将当前资源设为上限，同时重置怒气和技能冷却。这说明原规则不是“存档恢复才允许回血”。
- [CharacterRecord](../src/Game.Core/Persistence/CharacterRecord.cs) 不含CurrentHp或CurrentMp；[CharacterMapper](../src/Game.Core/Model/Character/CharacterMapper.cs) 也没有写入／恢复这两个当前值。实际网页导出的对应人物字段已核对。
- [BrowserBridge的角色视图](../src/Game.Web.Runtime/BrowserBridge.cs) 在当前值为空时显示上限；[BattleStateFactory](../src/Game.Application/Battle/Factories/BattleStateFactory.cs) 把当前值传给 [BattleUnit](../src/Game.Core/Battle/BattleUnit.cs)，后者为空时同样使用上限。因此不只是文字或进度条不同。

## 需要规则或格式决定的选择

| 方向 | 格式影响 | 玩法／验证影响 |
| --- | --- | --- |
| 保持本次边界，继续冻结核心 | 无 | 资源差异保留为未解决项；不能宣称完全按原值恢复 |
| 统一“故事结束回到地图”的恢复时机 | 可沿用既有格式和恢复服务 | 会改变同地图连续事件的入场资源；需先明确地图恢复规则，再验证受影响的战斗和剧情交接 |
| 要求当前生命／能量精确保存 | 至少要扩展浏览器保存数据与恢复逻辑；若放入共享CharacterRecord，涉及共享格式与迁移 | 改变读档后的资源延续；需兼容旧档，并验证地图恢复、失败分支与连续战斗 |

不把“保存时悄悄恢复”或仅把进度条画满当作修复，它们会引入新的行为或掩盖真实状态。本批选择保持核心冻结，仅提交上述证据和可选方向。

## 验证与范围

```sh
GAME_WEB_URL=http://127.0.0.1:4230 node src/Game.Web/tests/map-save-vitals-smoke.mjs
```

`map-save-vitals-load.json` 与 `map-save-vitals-travel.json` 分别通过1项诊断复现，无浏览器异常、请求失败或HTTP错误。通过表示差异被复现，不表示它已修好。两路为无头Chromium 390×844视口、鼠标输入，未用真机；C#与存档格式均未修改，也没有在本批重建.NET运行时。报告与原始网页导出留在工作区忽略产物目录，未部署。
