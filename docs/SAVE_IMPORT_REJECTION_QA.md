# 存档导入提示、空选择与拒绝恢复

基线 `4fe8c3b6cc7eda2466e474105a37e9a25fd6abc1`，同一工作区、唯一源码 writer、`feat/storybound-italian-battle`。本批未发现所测路径需要修复的产品缺陷，**没有修改产品代码、文案、存档格式或核心**；只交验证记录，不为了提交数制造变化。人物候选与12句身份对白继续冻结，未合并／部署。

## 先复用已有证据

[洞内第一次离开实录](CRANE_CAVE_FIRST_LEAVE_QA.md)已在真实11人存档的390／320px中英路径核过正常保存、导出、刷新Load及完整完成档恢复；其它近期说明／天赋批次也有相同正常检查。本批不再跑剧情或单独重做普通Save流程，只补当前标题页可见导入入口的空选择、无效文件拒绝及之后的实际恢复。

实现审阅：导入选择没有文件时立即返回；宿主先校验外层版本／内容归属，再在独立candidate中验证后替换当前会话；前端 `applyResult` 遇错误抛出，后面的slot写入与成功toast不会继续；`persistProfile` 对ok=false不写玩家档案。旧通用browser-smoke源码已有活动会话malformed检查，本批没有据源码存在便宣称重新跑过整套旧smoke。

成功／失败提示的现有英文字典项已齐全。实际英语使用“Save imported.”、“Journey resumed.”以及“Cannot import this file. Use a save exported by this version.”，没有因为测试而新增确认流程或声称取消也导入成功。

## 原件与隔离输入

本次有效原件为 `crane-cave-leave-en-390-complete-save.json`，71513 bytes，SHA `a741132570fc91c674662f584574464078aaf5199f1c668fdac56e76e5a2c2b0`：11人、150银币、道德54、卯时、原初谈已完成，profile死亡3／击杀131。旧11人后山源、真实洞内到达档、这份离开档及原实录共4份先逐字节备份至 `test-results/backups/pre-save-rejection-4fe8c3b/`，结束核原件和副本SHA不变。

仅在隔离Chromium context导入有效原件建立测试保存记录；两种自制文件位于 `test-results/save-rejection-inputs/`，均无可玩角色或进度：

| 输入 | 内容／分支 | SHA-256 |
| --- | --- | --- |
| `malformed-json.json`，22 bytes | 截断的 `{"browserSaveVersion":`，JSON解析失败 | `1bad94b41382b1da19d4cdc0cf108dc3afc4632f9aa7f522bf08f97c12e517f6` |
| `unsupported-format.json`，42 bytes | 外层browserSaveVersion=999、packId=jyx，不支持的外层格式版本 | `aafe764280b647550292ab376a2aac1a6833e8469df6efb3e9c55f4f84008a35` |

没有删改用户原件、构造培养成果、改宿主校验、注入剧情标记或尝试迁移版本。

## 实际玩家路径与结果

四组为英文390×844、中文390×844、英文320×740、中文320×740。正常标题页Import按钮实际打开浏览器FileChooser，再传入测试输入；不用地图上不存在的可见导入按钮模拟玩家路径。

1. **应用空选择分支**：文件选择器打开后以Playwright `setFiles([])`返回空选择，观察到input／change、文件数0。应用没有弹成功或错误toast，全部有效保存记录不变。**这不是原生系统Escape／取消键实测**，也未伪造cancel事件。
2. **两种拒绝输入**：输入复位，显示本语言错误提示，没有“导入成功”误报；各有1条匹配输入原因的已处理console.error，原异常原文保存在expectedErrors，不忽略其它错误。
3. **先比持久记录，再恢复**：每次拒绝后，在任何Load／导出之前，用只读IndexedDB事务读取全部keys及values，与本组基线逐字段／字节比较完全相同。实际存在 `slot:jyx`、`profile:jyx`；两条记录和导入前元数据均未覆盖。没有在拒绝后先点Save来掩盖覆盖问题。
4. **正常Load及导出**：直接正常Load，不先调用调试命令清除宿主错误，再从行囊下载JSON；完整game、wonBattles、profile与原文件相同。恢复后持久记录仍与基线相同，下载名为英文 `Storybound-Rowan.json`／中文 `童话旅人-Rowan.json`。

每组6项限定检查通过，2条预期验证错误另存；其它浏览器console／page／HTTP／请求异常为0。标题错误提示和Load提示均检查320／390px可见矩形、横纵scroll尺寸，实际查看320px中英文错误截图；全文未裁切，英语提示无中文残留。没有修改产品设置逻辑、地图、剧情、资源、成长或存档内容；测试静音偏好只写入隔离context，不影响用户浏览器。

## 首次失败保留

英文390px首轮通过。中文390px首轮在空选择后的正常Load提示等待上超时：测试仍期待“旧事续上，江湖如故。”，现有中文幻想界面实际已转换为“旧事续上，故事世界如故。”。失败截图和页面表明已经正常回到11人、150银币世界，没有导入或读取异常；这次没有完成后续两种坏文件测试，不能将它记为该组拒绝验收通过。

保留该false原报告，只修正QA预期，另用新报告补中文390、英文320、中文320；不重跑已通过的英文390，也不修改产品翻译来迎合旧断言。四组有效结果都核完原存储与恢复字段，没有把首次失败改成passed。

## 回执与边界

工作区 `src/Game.Web/test-results/`：

| 报告 | SHA-256 |
| --- | --- |
| `save-rejection-en-390.json`，8487 bytes，passed | `96604edcd6c10f28609f04db50391c028c0363ae693d482d152ab0c137680196` |
| `save-rejection-zh-CN-390.json`，3640 bytes，首轮false | `ead1ecc6500dfd4a88b628ed52a0284809da27cdc847995d5f057acb088593bf` |
| `save-rejection-recheck-zh-CN-390.json`，8628 bytes，passed | `eb122b31f8ea0b7eb02c4a3a138c6572e5c794a644c956e6d81d9d99a5051934` |
| `save-rejection-recheck-en-320.json`，8485 bytes，passed | `d8888f37a795e69d8d61e16579fa98a44e10619895979863eb9af81ea5eaae29` |
| `save-rejection-recheck-zh-CN-320.json`，8518 bytes，passed | `0f26c6b32e056e3502897b2177d149273b1836fb5eb4a824728bb3088cef75fa` |

每份passed报告含本组基线保存hash、各拒绝后的相同hash、空选择事件、完整提示矩形、两份错误原因及恢复导出的SHA。原件、无效测试输入、失败／补验、截图与脚本另列 `save-rejection-evidence-manifest.json` 的bytes／SHA；没有把hash记录说成已上传原始数据库文件。

本批产品未变，未重新构建或重复运行现有30项内容／投影回归；复用基线已通过结果，新增的是上述真实浏览器拒绝恢复验证。未验：物理设备／系统选择器取消键、深层人物引用损坏、存储配额／写盘失败、版本迁移、自动槽与手动槽竞争等。不能据两种输入和两条实际保存记录宣称任意损坏／任意存储故障都已覆盖。
