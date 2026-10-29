# 结算印记与 Deep Wound 说明

基于 `b8e25373976d30d1efcb42b99d01d954977422e8`，继续同一工作区、唯一 writer 和 `feat/storybound-italian-battle`。本批只改结算印记 CSS 与一个英文显示说明；不重跑[受保护的亚瑟两战](BRITAIN_RECRUITMENT_QA.md)，不改原初遇触发、胜败、药品效果、数值、成长经济、收益、存档或素材。此前首胜、第二战 tick3001 超时、正常 Load 恢复的结论不变，不能称亚瑟已加入。

## 实际修改

- [battle.css](../src/Game.Web/src/battle.css)：印记随文字宽度伸展，最大宽度受结算面板限制，过长词可换行；英文使用22px文字与内边距。`Insight`、`Victory`完整显示，保留原结算含义与 `leave-battle` 操作。中文仍为38px单字、58×66px印记。
- [chapter-us-catalog.json](../src/Game.Web/content/worlds/chapter-us-catalog.json)：只改 `buffs/重伤/description/en`，不改中文对照与运行包规则说明。英文为：

> Rest and items restore half as much Health and Energy. Life steal and damage conversion also restore half as much Health.

范围来自[原恢复配置](../src/Game.Web/scripts/legacy_survival_rules.py)：HP按 Rest／Item／Lifesteal／DamageConversion，MP按 Rest／Item，两者均乘0.5并截断；不是所有来源的任意回复都减半。[恢复解析器](../src/Game.Core/Battle/Engine/Resolvers/BattleRecoveryResolver.cs)分别处理HP／MP，原[生存规则验证](../src/Game.Web.Runtime/Smoke/Parity/SurvivalRules.cs)也已有休息、两种药品和重伤组合。本批只读这些代码，没有修改或重新运行.NET。

## 实际验证方式与结果

先完成 worlds 内容生成、TypeScript检查及Vite生产构建；沿用原WASM，没有重建.NET。保留既有大分块及非module运行时脚本的构建提示。现有 `test_world_chapter.py` 8项、`presentation.test.mjs` 8项通过，不新增单元测试。

云端headless Chromium使用隔离呈现夹具，直接编译现有 `battleShell`、`updateBattleView`、显示投影与UI本地化模块。读取原报告中的首胜／第二战超时快照、tick331的重伤与Mooncake帧，不加载WASM、不发送游戏命令、不导入存档、不战斗、不发奖、不写游戏存储。报告为工作区 `src/Game.Web/test-results/battle-result-presentation-v3.json`，SHA-256 `eee33d27abfc11641a853da9be6c0caace0efe5cab65959477dd531e5bf664e8`；夹具脚本同目录 `check-result-presentation.mjs`、`presentation-entry.ts`，不作为正式游戏入口。

| 检查 | 真实结果 |
| --- | --- |
| 原溢出复现 | 在390px视口恢复旧58×66px、38px英文样式，文字超出印记；没有用截图推测尺寸 |
| 实际结算显示 | 英文／中文 × 320、390、768、1440px × 原首胜／超时，共16组通过；文字在印记内、印记不叠下一行、面板在视口内、无横向溢出 |
| 英文实际尺寸 | `Insight`约105.91×66px；中文单字仍58×66px |
| 长英文压力夹具 | 仅在DOM将标签换成 `An extraordinarily instructive encounter`，320px下换行、约230×107.78px，无溢出或重叠；该句未写入游戏 |
| 重伤说明接入 | 从真实tick331单位帧经当前显示词典投影，原状态提示已读到新英文，旧的模糊说明不再出现；未重新施药或结算回复 |
| 静态夹具浏览器状态 | 错误、请求失败、HTTP错误均为0；鼠标视口模拟，非真机或触摸验收 |

工作区截图保留 `battle-result-presentation-v3-before.png`、`-320.png`、`-1440.png`、`-long-label.png`，已查看320px与长标签截图。不是重新取得胜利、失败或招募证据。

前两次开发夹具的16组布局和长标签检查已完成，但Vite客户端WebSocket连接报错，整体报告均保留为失败，分别为 `battle-result-presentation.json`（SHA `0e768396acfddc1544b9ce0d1935122c6b87f21d629759382bd8d8cdb850a823`）和 `battle-result-presentation-v2.json`（SHA `44e4f1fedef92f171010970a1ac9005aacd5a47dd99e8446192ace51ae3491ec`）。关闭开发热更新仍带有客户端，因此最终改为只提供编译后JS／CSS的静态夹具；没有修改项目Vite配置、屏蔽错误或调整权限。最终v3整体通过，旧失败不覆盖。

原包SHA仍为 `c348d1bc161dbe3a9f9a321232526da75b8d3c7638db7fb2b089d30981e9bcd3`。生成的中英文运行包，除既有 browser／storyScripts 呈现部分外，所有规则定义逐项与原包相同；重伤的两个原hook完整一致。12份旧来源及53份法国／意大利证据哈希、原招募报告SHA `c63848c94aca60b14cd2cff9f466696def96bce4d0b218715e652a75c85e4c96` 已复核，无覆盖。

## 未验与下一小批

本批不增加任何通关或招募完成度。原初遇重放未动；意外更改世界阶段、困难／自动、真机触摸、其它战斗策略、游戏资源精确保存均不在本批验证范围。隔离夹具核的是实际源渲染与文案，没有运行完整游戏场景或原两战。

另外发现原状态提示外层仍有“程度／剩余”等中文（实际title为 `Deep Wound：…; 程度 3，剩余 2 Turns`）。本批只替换效果说明，保留该缺口；可作为下一小批统一状态提示的英文格式和剩余回合显示，保持全部buff编号、等级、回合与效果不变。无需为此重打战斗。
