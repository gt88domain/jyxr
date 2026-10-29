# 状态提示英文与回合格式

基于 `05e1afa4d144680061b78f5e060a921da2c6f492`，同一 writer、工作区与 `feat/storybound-italian-battle`。续接[上一批的真实缺口](BATTLE_RESULT_PRESENTATION_QA.md)：只修状态提示的“程度／剩余”、状态条回合文字及英文窄屏排版。没有重打亚瑟战、改变世界阶段、发奖或导入／写入游戏存档。

## 源码差异

- [battle-view.ts](../src/Game.Web/src/battle-view.ts)：英文title将效果说明与等级／回合分两行，使用 `Rank 3; 2 turns remaining`，单回合为 `1 turn remaining`；状态条显示 `2 turns`／`1 turn`。原buff名称和效果说明继续来自内容显示投影，ID、等级、剩余回合、正负状态与键盘焦点均保留。中文title仍为原 `程度 3，剩余 2 回合`，状态条仍为 `2轮`；没有翻译或更改规则字段。
- [battle-status.css](../src/Game.Web/src/battle-status.css)：仅英文状态条允许flex换行，让较长的回合文字在空间不足时另起一行，避免把名称挤成碎行。中文样式不变。

最终英文实际title：

> Deep Wound: Rest and items restore half as much Health and Energy. Life steal and damage conversion also restore half as much Health.
>
> Rank 3; 1 turn remaining

这是提示文字，不改Deep Wound的恢复规则。零等级原来不显示在状态名旁的规则也保留，没有新增效果、延长回合或削弱敌人。

## 实际验证

复用工作区静态呈现夹具 `src/Game.Web/test-results/check-status-presentation.mjs` 与上一批的 `presentation-entry.ts`：编译真实战斗视图、显示投影和本地化，读取受保护报告的首战tick378（重伤等级3、剩1回合）和tick331（同等级、剩2回合）真实帧。报告本身是英文投影快照，夹具先按同buff ID取原定义的名称／说明，再走当前语言的正式显示投影；不改快照的数值、ID、等级、回合或原文件。

| 检查 | 结果 |
| --- | --- |
| 英文／中文 × 320、390、768、1440px × 两个真实回合帧 | 16组通过；英文状态条和title无中文，1／2回合单复数正确；中文title及回合文字与原格式逐字比较一致 |
| 实际DOM | 原 `data-buff-id=重伤`、tabindex=0与焦点保留；状态条及回合文字在容器内、页面无横向溢出 |
| 320px长名称夹具 | 英文 `Extraordinarily Unyielding Protection`、中文 `异常持久且不屈的保护效果`均可换行，名称与回合不相叠；仅改DOM标签，不写入正式内容 |
| 构建与现有检查 | worlds前端TypeScript检查／Vite生产构建通过，既有大分块与运行时脚本提示保留；现有 `presentation.test.mjs` 8项通过。本批未改内容包，不重建.NET或重跑战斗 |
| 浏览器 | headless Chromium鼠标视口；错误、请求失败、HTTP错误均0。读取原生title文字并检查焦点，不声称已验证原生浮动提示的真机交互 |

最终报告 `src/Game.Web/test-results/battle-status-presentation-v4.json`，SHA-256 `f21d3c0150d95ea1f938171018802160466a1b3158dcf3e0f7450396c2da236c`；截图 `battle-status-presentation-v4-320.png`、`-long-en.png`、`-long-zh-CN.png`保留，已查看窄屏及英文长名称。夹具没有加载WASM、Board画布或正式美术，截图只作为状态组件呈现证据，不当作完整游戏画面／新素材缺失的证据。

首轮仅8组英文通过，中文断言发现夹具误用快照中的旧英文名称和说明，整体失败报告 `battle-status-presentation.json`（SHA `b157145c422d15f6263ae3991bc5ebbc8db6a43aa23bd63af0b4d37e68164850`）保留。按同编号原定义恢复显示字段后v2通过16组与长名称检查，但截图发现英文回合挤占名称空间，于是增加仅英文的flex换行，再以v3完整复核。v2／v3结构化报告的字符串及布尔结果相同、SHA相同（`b2c3808a2a684c6696ecaa093c33944717819118c7a01fb3ef813193657b40db`）；实际排版差异另有各自截图保留。最后将英文说明与等级分两行，避免句号后紧接分号，以v4完整复核通过。不覆盖或宣称首轮已全部通过。

原内容包SHA仍为 `c348d1bc161dbe3a9f9a321232526da75b8d3c7638db7fb2b089d30981e9bcd3`。12份旧来源、53份法国／意大利记录、原亚瑟试战报告及上一批结算v3报告的校验值均复核一致；亚瑟首胜、狮鹫超时、正常Load恢复的事实不变。没有新增招募或通关完成度、合并或部署。

## 下一处有证据的缺口与未验

英文状态容器的读屏标签仍是 `Rowan的状态`，本批16组报告中的 `containerLabel` 已实测记录，源为 `battle-view.ts` 的容器aria-label。下一小批可将该标签改成自然英文，保留中文与原buff事实；本批不扩大到该项，也不推测其它未采样页面已全英文。

真机／触摸、读屏软件实听、原生title弹出行为、完整战斗场景和其它buff组合未验。本批只验证渲染与文本，没有通过修改快照或游戏数值来制造战斗结果。
