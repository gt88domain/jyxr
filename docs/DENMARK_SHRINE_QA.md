# 丹麦调查后：雨中祠堂QA

后续已用本页另存的失败恢复QA档给凯装备并做两次正常研习，达到招式4阶后单独再试一次，仍单人战败；本页旧失败与源档均保留。最新[培养与一次准备后尝试](KAI_PREPARATION_QA.md)记录独立350银币档及不同profile，不把它们拼接成通关。

## 验证前记录

基线 `9b31c76c671e5e0372d3fa8d7e13c21e326f4cc2`，仍为原工作区与 `feat/storybound-italian-battle`，未另建writer。接续的是[取药独立QA](DENMARK_NIGHTSHADE_QA.md)十人330银币档，不是替受保护296银币九人档选择分支。

源档 `test-results/denmark-nightshade-spare-complete-save.json` SHA-256为 `eb4052669e2c0fae10232c51ca5b34a6947c6b08cbb8506280d95ad61cc1da7e`。源档、推进及显示报告、第一次概率复核失败、九人基线均逐字节备份至 `test-results/backups/pre-denmark-shrine-9b31c76/`。源档profile另提取备份，SHA为 `6015cee73e472db862cbd45f4d0e21bf31f34c78c6762502e5b64992831de7c6`；只备份，不修改或回写。

原包SHA仍为 `c348d1bc161dbe3a9f9a321232526da75b8d3c7638db7fb2b089d30981e9bcd3`。世界地图→Rainmarket→Rain Shrine，是原 `大地图/衡阳`、`衡阳/湘妃庙`。祠堂事件要求原调查段 `雪山飞狐_苗人凤居.田归农来战.胜利.2` 和放过药师段 `.七星海棠.胜利.不杀`，一次性，**本入口没有chance或昼夜条件**。另一个凤天南事件有独立前置与50%概率，不属于本批，不通过它刷时间。

原场景814为药师向旧同伙敲诈，进入三人战：只有凯是必选，并非药师或主角都必选。胜利段815接供述、`leave('阎基')`和凯单人对两敌的连续战斗，没有地图休整；强化敌人为原15级、2500HP／MP、持Dragonfang Sword，另一个为原10级药师、1000HP／800MP。两战失败与超时均gameover。原凯单战胜利段816才给Dragonfang Sword1把、Trailguard Sword上限＋1及原日志，不更改奖励。

人物表中田归农→The Mirror Troll仍为候选，本批先使用 **The Guildmaster／组织首领** 职业称呼，普通及强化形态同一显示身份；不锁定魔镜恶魔、不加父子关系。相邻三段围绕未命名旅人的旧中毒决斗，药师与首领暴露同谋；保留冲突与原死亡结果，不把最终杀死两人改成劝退。

本次计划：新的隔离云端浏览器context，正常导入十人档→正常到祠堂→保存、导出真实战前档→从现有构筑尝试一次原两战；不购物、培养、重排、刷时间或注入标记，仅允许用已有药品。当前凯6级、无装备、未研习，不能预计必胜。自然失败保留结果，可正常使用失败页Load核恢复，不重打；入口不可达则停止。不选择或拼接另一条杀路线。

当前HP／MP保存恢复的[既有边界](MAP_SAVE_VITALS.md)不修改；profile称号、死亡与击杀统计单独记录。保留原十人档、profile及九人基线，不把QA分支覆盖成正式结果。

## 结果

**首战获胜，凯的单人战失败，本段未打通。** `denmark-shrine.json` 中 `journeyOutcome=lose`、`progressVerified=false`、`recoveryVerified=true`。其 `passed=true` 仅表示7项入口／操作／失败恢复检查通过，不是章节通关；没有重试、练级或改数值。

| 步骤 | 实际结果 |
| --- | --- |
| 隔离导入 | 新context的cookies、origins及初始localStorage为空；导入原十人330银币QA档，主角13级、凯6级，道德54 |
| 原入口 | 正常世界→Rainmarket→Rain Shrine，组织首领事件可达；冒险114日丑→116日午，未绕路刷时间 |
| 首战阵容 | 实际主角、匹诺曹、凯；凯从后排按原必选规则部署，药师没有被强行加入战斗 |
| 首战胜负 | Normal手动win，tick425，非超时；原6级首领加六名随机敌人全部倒下 |
| 首战资源 | 主角1740HP／1260MP→1740／63；匹诺曹1500HP→1366；凯640HP／520MP→531／392，正常升7级，最大HP／MP变760／580 |
| 首战操作 | Iron Seal Strike16级8次、凯Frontier Cleave3级2次、匹诺曹Twin Cleavers7级1次；另移动与休息，没有在首战用药 |
| 首战结算 | 银币330→362，原收入32；随后剧情中药师暴露同谋，执行原leave，九名活跃成员保留 |
| 连续单人战 | 未回地图、没有补满资源；首次可操作截图为tick100，凯371HP／392MP，敌人已经行动，不能把它当作tick0开战值 |
| 实际药剂／攻击 | tick200凯35HP时正常使用已有Last-Light Remedy1份；tick300时482HP／580MP，再施展Frontier Cleave3级1次（128能量） |
| 单人战结果 | tick393真实lose、非超时；凯0HP，两敌仍活着：强化首领2500HP、药师666HP。未获得Dragonfang Sword或Trailguard Sword上限奖励 |

药师离队时，实际roster为 `placement=reserve`、`formationStatus=story-away`，`canRejoin=false`。这不是可以立刻从队伍菜单调回来助战的普通后备；没有修改原离队或单人参战规则。

这次只证明原入口与连续战斗可执行，以及**这一份未额外培养的凯、这套操作没有通过单人战**。不据此认定所有构筑都失败或核心平衡有错。下一次若继续，应先从真实装备、教材研习与正常练习准备凯；不能以主角较强代替必选伙伴培养，也不靠重排队伍绕过单人战。本批按范围止于失败与恢复，没有自动补练再试。

### 失败页Load与profile

真实gameover页显示Load saved game；直接点击后回到祠堂战前手动档，活跃成员恢复十人、凯6级、330银币、道德54、冒险116日午，装备、研习、物品与剧情记录和保存前相同。Last-Light Remedy的试战消耗与首战收入／等级没有混进恢复后的游戏档；原九人基线、原十人源档和profile备份均未覆盖。

设备profile按既有机制保留本次死亡和击杀统计：deathCount0→1，killCount113→120；不是所有profile字段回滚。称号和技能上限奖励没有新增。本批没有新增mainStory标记或世界触发器进度；收到第一封信 `mainStory_黑暗的阴影` 的原证据保留，仍未回访格林。恢复后与源档相比没有新增故事标记，包装版本2／game版本24／packId `jyx` 保持。[当前HP／MP读取恢复机制](MAP_SAVE_VITALS.md)未改，不声称精确资源恢复已修复。

| 证据 | SHA-256 |
| --- | --- |
| 原330银币十人源档，未改 | `eb4052669e2c0fae10232c51ca5b34a6947c6b08cbb8506280d95ad61cc1da7e` |
| 真实祠堂战前档 `denmark-shrine-before-encounter-save.json` | `9ddac9d16bcc2ec7c856159749132d9c3a9d466a420c7105c673591d66a354dd` |
| 失败页Load后导出 `denmark-shrine-restored-after-defeat-save.json` | `3155af47f4bc8180db8369a0e27c474a69f2e62d62bf350d43df1c1884d3dd12` |
| 受保护296银币九人基线，未改 | `9640c7272be664e848a4ba19ee60f34f54f9cba5dd7335b325bbfa4fea786d3d` |

报告、动作、血量／能量、两战胜败、截图及导出保留在工作区忽略产物目录，不随源码发布。原十人档profile仍是0次死亡／113击杀；失败恢复副本另存为1次死亡／120击杀，不回写或拼接两者。

### 英文与显示复核

`chapter-denmark-shrine.json` 新增三个原段、21句双语对白，两个战斗标题及原日志；药师敲诈旧同伙、两人相互揭露下毒事实、凯单独面对两敌，延续上一段未命名旅人的中毒决斗。The Guildmaster职业名覆盖普通与强化形态，不固定The Mirror Troll候选。祠堂地图、首领与返回按钮提供英文。首屏说明分清放过药师的两战与杀药师的另一说法，未把两路条件混为一谈。

原推进报告对实际对白、技能卡、地图及失败页的英文断言通过，但**没有扫描整个战斗页**。人工查看真实第二战截图发现toast仍为“The Apothecary: 参战 → 后备。”，因此不能把原 `englishCopyVerified=true` 当作全场零中文证明；额外保留 `denmark-shrine-copy-observed.json` 和原截图。现仅在UI词法层翻译这类既有队伍状态通知，显示为“The Apothecary: Active → Reserve.”，不修改activity原记录、存档、离队或队伍状态。

真实样本、英文姓名、返队、随行及幂等显示的回归通过。新增测试初版还误把UI文本翻译器当成剧情命令处理器，使用了职责外的断言；日志保留为 `/tmp/jyxr-denmark-shrine-ui-command-assumption.log`。修正该测试前提，没有因此改命令执行或引入兼容分支；原命令不变由既有14项冻结规则检查核对。

修复后的**现场战斗toast未重跑**，不为文案重复战斗发奖。另用三份真实源／战前／恢复导出做只读复核，`denmark-shrine-review.json` 4项通过：英文准备说明、角色两形态称呼正确、首屏动作至少44px且高于底部导航、无横向溢出；没有旅行、激活剧情或重新试战。这也不是把失败改成通关。

### 最终检查与未验

内容生成、TypeScript检查与最终前端构建通过；8项章节流程、14项开场／规则冻结、25项术语／指引检查通过。实际推进7项操作／恢复检查、只读显示4项通过，浏览器异常、请求失败及HTTP错误为0；**实际旅程仍lose**。未把静态源奖励当成已获得。

单人战胜利及后续原小屋谜底未到达；另条杀药师／攻击老勇士、困难难度、自动战斗、中文实玩、真机／触摸、完整丹麦与整游仍未验。共享素材、玩法、数值、成长经济、条件／概率、奖励、存档结构及.NET运行时未改；没有.NET SDK，沿用既有WASM。没有合并或部署。

```sh
GAME_WEB_URL=http://127.0.0.1:4230 node src/Game.Web/tests/denmark-shrine-smoke.mjs
GAME_WEB_URL=http://127.0.0.1:4230 node src/Game.Web/tests/denmark-shrine-review-smoke.mjs
```

前者是一轮真实尝试与失败恢复，后者只查看其真实导出。不要为显示复核重跑前者覆盖原失败。当前可继续准备的独立QA档可以选未改的十人源档或另存的失败恢复档，必须说明profile差异；不能覆盖受保护九人基线。
