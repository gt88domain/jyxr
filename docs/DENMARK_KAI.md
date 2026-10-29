# 丹麦短段：初识凯

本页保留46631a7初遇批次实录。后续已从该真实结局完成[找回两页笔记](DENMARK_MISSING_PAGES.md)，余额286，八人；仍不是丹麦整章通过。

这批只完成凯的初遇、原单人切磋与加入，不包含寻找两页笔记、格尔达求药或丹麦整章。沿原唯一源码线，从[匹诺曹培养](OPENING_LEDGER.md)的266银币、七人真实新档继续。固定身份为凯 `actor-425b9c8b43bd / 胡斐`；格尔达 `actor-b50498c05b7b / 程灵素` 只在一句对白中提及，未入队。其他丹麦候选身份没有重新分配或宣布定稿。

## 保留的原流程

世界地图的 `胡斐居` 显示为Kai's Cottage。原入口条件为：

```text
!(in_team('胡斐') || in_team('华山胡斐'))
&& !story_completed('mainStory_黑暗的阴影1')
&& !story_completed('雪山飞狐_胡斐居.胜利')
```

没有昼夜条件，不需要刷时辰。原地图保留一次性入口及原第二条入口，不改事件重复方式。原段 `雪山飞狐_胡斐居` 是四句对白后进入 `胡斐居.战斗`，只部署主角；胜利跳转原胜利段，仍执行 `join('胡斐')`、原journal和返回大地图。失败／超时仍跳原失败段、返回地图，不发伙伴或胜利奖励。失败对白已改写，但本批没有自然败北，失败和实际重赛为NOT_RUN。

新文案在 [chapter-denmark-kai.json](../src/Game.Web/content/worlds/chapter-denmark-kai.json)。原五句胜利对白压缩为三句；命令、分支、战斗与收益保持原样。旧伙伴文件里的胜利段和对应journal显示文案移至这一唯一所有者，没有放宽重复定义校验。地图坐标、时间推进和存档编号不变。

## 玩家看到的内容

凯在摆弄冰片拼字，借用《冰雪女王》中他的冰片谜题形象，不增冰冻效果、谜题系统或寻找格尔达的新条件。切磋的目标仍是两页缺失的战技笔记，语气轻松：

- 凯：“Please don't touch the ice pieces. They're almost a word.”
- 主角看见战技笔记中间空缺，提议友好切磋。
- 凯：“Two pages are missing. If the answer is 'duck,' I'd rather learn it now.”
- 获胜后，凯同意找笔记，并说：“If Gerda asks, this was studying. Definitely not getting knocked over.”

这些是新创作的对白，不是安徒生原句。首屏指引提前说明主角ALONE、战前保存、赢后才加入，以及格林对应世界会面会关闭入口；按钮只指向原地图操作。Goals新增“Denmark · Meet Kai”短段卡，获胜后明确“This completes his first meeting, not the whole Denmark story.”，提供装备／研习入口，不补剧情标记。

## 同档实战与恢复证据

原匹诺曹培养档SHA-256为 `122199fa33f8b6253921f4dc86062fd99a094a2d4cbfe19aaf345b1ef9ba0dc0`，已复制至 `test-results/backups/pre-denmark-kai-e06a5cd/`。先正常从格林家返回大地图，运行态确认Kai's Cottage实际选择原story入口，再手动保存和导出。没有与格林交谈、额外练习、采购或为了盘点反复旅行。

第一次切磋实际win，tick 48，凯加入、收入10；但随后的测试没有展开嵌套旅途记录，就断言日志正文存在，导致报告失败、未取得最终导出。保留 `denmark-kai-journal-observed.json` 和截图，其中战斗胜利仍是真实记录，不能把测试断言失败算成游戏战败，也不把当时保存恢复算通过。

因此从它已正常导出的真实战前档 `denmark-kai-before-match-save.json`（SHA `5ca9a82156b10d1be1892feda917bc4b4122a9eb4ebc35df00101343dbcfd73a`）复验一次；没有根据报告重建或编辑存档，没有叠加第一次的收入。最终结果如下：

| 项目 | 真实结果 |
| --- | --- |
| 出发准备 | 主角12级，原装备、技能及七人队伍；266银币、道德56 |
| 实际战斗 | 原主角对原4级凯；两次主角操作为移动、Iron Seal Strike，win，tick 48，非超时 |
| 主角资源 | 开战1620HP／1180MP，结束1620HP／1004MP；无用药 |
| 原结算 | 银币266→276；主角经验1877→1894，仍12级；道德56，背包与原有七人保留 |
| 新伙伴 | 凯4级，第8位；Frontier Cleave 3级，Steadfast Mastery 5级，无装备、无研习；未额外培养或补装备 |
| 时间 | 原培养档第103日辰时→正常返回后巳时→凯结局第106日巳时，来自必要出行与交互 |
| 后续入口 | Apothecary's Hut实际为story入口；本批只读取状态，没有进去触发“两页笔记”后续 |
| 存读档 | 原保存按钮、刷新Continue与导出，核对八人构筑、物品、276银币、道德、时辰与章节状态；当前HP／MP仍单列原恢复边界 |

最终导出 `denmark-kai-recruited-save.json` SHA为 `d2435d738ed1ff64da79ee2328509d9e267697b7f5ffda57f9bd3bb601edf482`。原266银币档、第一份战前档及首次获胜／断言失败报告均保留。没有完成新的 `mainStory_*` 世界节点或关闭支线；收到格林来信的消息与完成其后续会面是不同状态。

12级主角打原4级凯非常快，这证明当前档的正常招募链，不证明未培养新手也轻松通过或战斗难度已经平衡。没有为难度观感强化凯或修改规则。

## 实际发现的显示修正与验证

展开Goals时发现两处实际问题：世界消息“黑暗的阴影 · 已发生”未译；详情标题仍沿用第一条西班牙故事，正文却是凯的内容。显示层现将前者译为“An Unwelcome Shadow · Received”，避免暗示其后续会面已完成；详情标题取当前故事的标题。仅修显示，不改消息接收、完成标记或世界触发。

最终 `denmark-kai.json` 的 `passed`、`progressVerified`、`englishCopyVerified` 均为true，5项检查，无浏览器异常、请求失败或HTTP错误，实际展开的剧情、人物页、旅途记录均未检出中文。`pinocchio-training-review.json` 另有6项只读回归通过，旧培养档的前三章完成卡保留，凯的短段仍正确待办；没有为了回归再打一遍前三章。

最后将生硬的“world-story meeting”改成“discussing Grimm's first letter”，使窗口提醒与玩家实际收到的信对应。`denmark-kai-review.json` 从真实战前／结局档完成5项只读检查：最终首屏说明与按钮、正确标题和嵌套日志、凯的原始未培养配置，英雄、伙伴、时辰、剧情与钱不变；没有为最后这次措辞调整再打切磋。

前端类型检查与构建、8项章节流程、13项开场／冻结规则、24项术语／指引测试通过。旧指引测试中“load an intact save”的过时文本断言已更新为实际Load manual save与覆盖提醒，未回改产品提示。手机检查为390×844无头Chromium鼠标视口，不是真机。中文对照、失败结算、重赛、凯实际培养和丹麦后续未实测；[当前资源恢复](MAP_SAVE_VITALS.md)保持原状。C#、规则、数值、经济、触发、收益与格式未改，未重建.NET、未生图、未部署或合并。

```sh
DENMARK_KAI_RESUME_REPORT=src/Game.Web/test-results/denmark-kai-journal-observed.json GAME_WEB_URL=http://127.0.0.1:4230 node src/Game.Web/tests/denmark-kai-smoke.mjs
GAME_WEB_URL=http://127.0.0.1:4230 node src/Game.Web/tests/pinocchio-training-review-smoke.mjs
GAME_WEB_URL=http://127.0.0.1:4230 node src/Game.Web/tests/denmark-kai-review-smoke.mjs
```

下一小批可从276银币结局副本核原“两页笔记”入口和对话，再决定可交付的短段；先审现有候选人物与情境，不直接把尚未改写的后续算成可理解的英文路线。其余国家与终局边界仍见[剩余清单](WORLD_COMPLETION_GAPS.md)。
