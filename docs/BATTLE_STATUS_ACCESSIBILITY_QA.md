# 战斗状态组的可访问名称

基于 `f412be1f023eeb7ad9255566e756a9ac72b46ff5`，同一 writer、工作区与 `feat/storybound-italian-battle`。本批收尾[已确认的状态标签缺口](BATTLE_STATUS_COPY_QA.md)，一次检查该战斗状态组件相邻的aria-label／title／装饰肖像alt，不扩到战斗操作栏或其它系统。没有重打战斗、推进世界、发奖、导入或修改游戏存档。

## 确证问题与唯一产品改动

修前真实帧的DOM标签为 `Rowan的状态`；普通div没有状态组角色，Playwright可访问性快照仅有 `- text: Deep Wound 3 2 turns`，没有该组名称。修前复现记录保留在工作区 `src/Game.Web/test-results/battle-status-accessibility-before.json`，SHA-256 `875a3355d49041c4fd1f24a8e878644585ee02d0dc51cf5cefd770a99e7df257`。

[battle-view.ts](../src/Game.Web/src/battle-view.ts)只改原状态容器的一处HTML模板：增加 `role="group"`，英文名称使用 `Status effects for ${unit.name}`，中文仍为 `${unit.name}的状态`；完整名称经过原HTML转义函数。没有新增焦点、改状态条title、数值、排序或显示条件。没有状态时依旧不渲染空组。

相邻状态title在上一批已按当前语言正确呈现；本批采样中没有发现需要再修改的同类语言残留。装饰肖像alt仍为空。未为凑批次另改文案或添加界面功能。

## 实际验证

复用已有静态呈现入口，工作区脚本 `src/Game.Web/test-results/check-status-accessibility.mjs`编译真实视图、内容显示投影和本地化。读取受保护亚瑟报告中的tick48空状态、tick331单状态、狮鹫战tick186多状态帧；多状态包含等级2的Defense Up和等级0的Deep Wound，正负、等级、回合和原顺序均逐项核对。

| 范围 | 实际结果 |
| --- | --- |
| 中英 × 320／390／1440px × 空／单／多个状态 | 18组通过。无空状态组；有状态时用真实 `getByRole('group', {name, exact:true})`找到唯一正确名称，AX快照包含该名称；原buff ID、等级、回合、正负样式和tabindex不变 |
| 特殊字符姓名 | 中英 × 320／1440px共4组，以仅用于呈现的 `O'Rourke & <Rook> "Vale"`核对姓名、HTML解码后的标签和真实可访问名称均完整，无多出的Rook标签 |
| 长姓名窄屏 | 中英320px共2组，仅呈现长姓名；可访问名称保留全文、状态条与回合文字不出容器、页面无横向溢出 |
| 相邻属性检查 | 所有24组逐项读取该组件aria-label／title／alt；英文标签／提示无中文残留，中文名称及title格式正确。只对这些采样组件作结论 |
| 构建与现有检查 | worlds前端TypeScript／Vite生产构建通过，现有 `presentation.test.mjs` 8项通过；没有内容或.NET构建。既有大分块和运行时脚本提示保留 |
| 浏览器 | headless Chromium鼠标视口，24组整体通过；错误、请求失败、HTTP错误均0。工作区状态组件裁剪截图已查看，不当作完整战斗画面 |

实际英文AX结果为 `- group "Status effects for Rowan": Deep Wound 3 2 turns`；中文为 `- group "Rowan的状态": 防御提升 2 3轮 重伤 3轮`。这里等级0不在状态名旁显示，与原规则一致，不是漏掉其原剩余3回合。

最终报告 `src/Game.Web/test-results/battle-status-accessibility.json`，SHA-256 `c0567bb7846b7fbc41682ad2f04190d416b0ec53089ce13c05aa1ed7e66edcdd`。真实帧只读；特殊／长姓名只用于内存中的显示夹具，不写正式角色、内容或存档。该夹具不加载WASM或游戏命令，没有战斗和奖励结算。

12份旧来源、53份法国／意大利记录、原亚瑟报告、结算v3及状态v4报告校验值均复核未变；所有旧失败记录保留。原亚瑟首胜、狮鹫超时、Load恢复与未加入的结论不变，没有新增通关完成度、合并或部署。

## 未验边界

本组件采样没有其它确证的同类语言缺陷，不新增臆测修复项。未采样页面不声称全英文。真机触摸、实际读屏软件语音、原生title浮动提示、完整战斗交互和其它buff组合未验；本批通过的是浏览器可访问性树及呈现检查，不是辅助技术全平台认证或战斗通关。
