# 武藏三项天赋：英语显示与原文保留

基线 `9e6ca0a668eac8f5e4782881b055a184a5fe78a8`，同一工作区、唯一源码 writer、`feat/storybound-italian-battle`。本批只补已有三项天赋的英文名称／说明，未改界面代码、样式、原内部ID、触发、概率、数值、效果、成长或存档。没有合并／部署。

## 实际改动与依据

产品只修改 `chapter-equipment-copy.json` 的 `definitions.talents`，新增以下3条显示映射；中文名称与说明逐字保留原文。投影通过现有天赋 `details/summary` 显示，不新增天赋选择或开关。

| 真实天赋ID | 新英文名 | 已核原效果，未修改 |
| --- | --- | --- |
| `令狐冲的怪病` | Lingering Cough | 行动开始前原40%概率请求跳过行动；若同一战场、同阵营有原ID `平一指` 且HP≥2，则不因该病跳过 |
| `嗜酒如命` | One More Drink | 行动就绪前原15%概率给自己醉酒II，持续3回合 |
| `浪子剑客` | Wandering Swordsman | 原最终属性修正 `jianfa × 1.2`，向下取整，是剑术熟练，不新增伤害倍率 |

对照冻结包、`IllnessBattleEffect`、`BattleEngine.Timeline`、`DrunkennessBattleEffect`及 `AffixProjection.EvaluateStat`。咳嗽保护需要医师实际参战，不能写成只要在队伍中就生效；英文使用当前既有地点 Healer's House 的医师职业称呼，没有替未定人物锁定新身份。

醉酒原状态可丢失行动或填充怒气、攻击可能追加一击，英文据原buff及处理器说明，不改醉酒状态本身。没有要求消耗新酒类道具、增加天赋切换或承诺无条件额外攻击。以上是原定义／实现的只读核对，**本批不进入战斗，不声称概率、连击或保护条件已实战复现**。

咳嗽天赋在原角色定义中仅当前形态使用；嗜酒／浪子天赋被武藏4个原形态共享，沿既有同ID词典一致显示，没有拆出新天赋或编辑其它角色定义。其它形态没有本批运行验收。

## 实际页面与保存

同一真实源 `musashi-route-recheck-recruitment-complete-save.json`，71402 bytes，SHA `35352bb0356fc0d6ba95b9e4d3c5478e7dbb1f7e54dc238669199d01f31e0b0d`。源及4份既有报告先逐字节备份到 `test-results/backups/pre-musashi-talents-9e6ca0a/`，结束核原件与副本全部SHA不变。旧山战中断、武藏招募／高级说明成果及素材均未覆盖。

先在改动前实际打开3个原天赋，保留中文残留的正常页面报告（9项限定检查通过，不等于英文完成）。然后构建新候选，使用独立context测试：

| 页面组 | 实际结果 |
| --- | --- |
| 英文390×844 | 3个真实ID／新名称／完整说明一致，无天赋区中文残留 |
| 中文390×844 | 3个名称和说明逐字为原文，中文模式没有被英文覆盖 |
| 英文320×740 | 三项说明可完整阅读、换行正常，无横向溢出或段落截断 |
| 中文320×740 | 原名称／说明可读，窄屏自然换行，无截断 |

每组9项限定检查，均通过。原生summary逐一展开／收起，首项还实际按Enter；没有新增UI控件。逐条记录段落可见矩形和scrollWidth，实际查看320px英文／中文截图。使用云端无头Chromium、鼠标与键盘，不是真机或触摸；未改其它页面。

每组正常保存、导出、刷新Load后，完整序列化 `game`、`wonBattles`、`profile` 均与原源档一致，原三ID及收起状态重新出现。仍11人、150银币、道德54、主角13级、武藏11级、原装备／教材／技能／属性／时钟／剧情及profile死亡3／击杀131。没有战斗、培养、切换天赋、旅行或奖励；当前HP／MP既有恢复机制与存档结构不改。

## 构建与可核证据

内容、TypeScript／Vite前端构建通过，原runtime-loader非模块及较大chunk警告仍在；未重建.NET宿主。22项现有内容／流程冻结检查及8项投影回归通过。另核中英运行包全部原定义逐字段一致；原包SHA仍 `c348d1bc161dbe3a9f9a321232526da75b8d3c7638db7fb2b089d30981e9bcd3`。只有英文catalog新增3条，中文名称／说明保持原值。

工作区 `src/Game.Web/test-results/`：

| 报告 | SHA-256 |
| --- | --- |
| `musashi-talents-before-en-390.json`，6327 bytes | `1be48422a2e8fd60cdce5431d2dd1bc817aff51f065b987beb8f401a82fb680c` |
| `musashi-talents-after-en-390.json`，6905 bytes | `e4dbf2888c38bd91984b68006a00e010646c00e3fc963c39b14dc200ac0c3985` |
| `musashi-talents-after-zh-CN-390.json`，6335 bytes | `bc00c7351b729f5127732b4f8ff004080edc2c7a23c8454da0a2dd57a40e932c` |
| `musashi-talents-after-en-320.json`，6879 bytes | `6bb565f5e23833d54f82a61d14a8c60468f3eb667916588f674d25f335fd92e5` |
| `musashi-talents-after-zh-CN-320.json`，6289 bytes | `dcf8847d01d0482f2910860d91d266479c4c38d3f32141a516ec5a5ad7bef5cc` |

五份报告passed=true、浏览器／HTTP／请求异常均0。各组原生导出、完整完成档及12张改后截图另列 `musashi-talents-evidence-manifest.json` 的bytes／SHA；导出包装时间不同，不以文件SHA相同冒充数据一致，实际比较完整游戏／战斗历史／profile字段。

本批不补其它角色、其它天赋、美术或国家剧情。实战、其它武藏形态、真机、后续求医、道德拒绝及旧山战结算仍未验；英文页面的地图／其它未验内容也不因这3条显示修正而计为完成，不新增全游戏百分比。
