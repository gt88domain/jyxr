# 柳下小屋：非战斗入口与原概率回退

基于 `f630d910d894869b2c7bf159346d91fe8d67ba96`，同一 writer、工作区及 `feat/storybound-italian-battle`。回读[剩余范围](WORLD_COMPLETION_GAPS.md)与原英国路由后，选择不依赖亚瑟招募、不要求丹麦祠堂胜利的Willow Cottage（`程英居`）初遇。本批未重新挑战任何战斗、推进格林会面或改原条件。

## 原路由与安全范围

| 项目 | 原数据与本批边界 |
| --- | --- |
| 正常源档 | 亚瑟失败页Load后的真实世界档 `britain-recruitment-restored-after-loss-save.json`，SHA `4af129260c6b91f8b5fd86c123609806c5a60d2ec1185bfa54eb1ad2a5d6b932`；Normal、主角13级、150银币、十人、道德54、profile死亡3／击杀131 |
| 世界入口 | `大地图/程英居/events/0`；不带亚瑟及其松鼠形态、不带程英两形态、不带田伯光、未完成 `mainStory_神秘剑客1`，再按原 `chance(0.6)`。没有once限制或排除本初遇完成标记；本批不改变概率、时间或重复模式 |
| 正常概率回退 | 下一原事件为 `map('程英居')`、条件true；小屋地图只有原返回大地图入口，没有自动战斗或奖励 |
| 初遇 | `sdxl_程英.月下吹箫`，原背景／音乐、6句对白后按原道德判断：≥55进加入段，<55进婉拒。本档54，不为过门槛改道德或给资源 |
| 加入分支 | 原1句、`join('程英.初级')`、玉箫剑法秘籍及落英神剑掌秘籍各1、原journal、返回世界；本批只改显示文案，实际加入及奖励 **NOT_RUN** |
| 婉拒分支 | 原1句，无加入、奖励或新条件；本次因概率未触发，实际对白也 **NOT_RUN** |
| 世界阶段 | 主角仍13级，未完成格林回访 `_黑暗的阴影1`，不满足世界第二阶段；其余定时组织触发与本档圆桌组织不匹配。实际原世界触发／丹麦完成标记均不变 |

保全4份本批直接来源／英国报告／状态组件回执的字节副本及SHA清单至工作区 `test-results/backups/pre-willow-cottage-f630d91/`；原150／350／330／296与所有失败继续分别保留，没有拼接人物、profile或收益。

## 英文叙事与身份

[chapter-britain-willow.json](../src/Game.Web/content/worlds/chapter-britain-willow.json)保留三个原段、8个说话者槽位：初遇6句、加入1句、婉拒1句。以一段新写的轻松小调开场，不搬原《诗经》或现代影视台词；旅行者寻找一位总在早饭前惹上麻烦的骑士，玩家邀请同行。婉拒明确名声会影响是否愿意同行，不捏造新任务、约定或门槛。

初级／高级形态的显示名共用既有 `gb.guinevere`候选Guinevere／桂妮薇儿。actor `actor-ff496f0b2e18`、两形态ID、数值及原角色名在运行包中保持原样；仅通过 `speakerNames`生成显示词典。角色表仍 **proposed**，没有改锁定状态、另选身份或声称正式定稿。

实际概率回退后，[chapter-start.json](../src/Game.Web/content/worlds/chapter-start.json)仅在小屋地图说明中补：

> The cottage is quiet, and nobody is home. Return to the Story Roads to keep exploring.

这段显示在既有“Location notes & recent activity”，需要展开；没有把它说成首屏新提示，也没有改世界地图的通用介绍。原Back按钮继续在首屏可用，未新增按钮、刷新概率功能或更改地图事件。

## 本次真实过程与存读档

正常导入源档→原Back到The Story Roads→只走一次Willow Cottage。本次宿主预览为原 `map` 回退，旅行15时段，实际抵达空屋；对话页数 **0**。没有返回重刷、等待、修改时钟、换档凑出现率或进入别的剧情。`passed=true`只证明3项入口／回退／保存检查；`encounterVerified=false`、`joinVerified=false`、`recoveryVerified=true`。

原返回消耗1时段，旅行15时段：raw adventure第123日子→丑→第124日辰；保存时钟为year1／month5／day5／Chen，界面按原展示为Day125、7–9 a.m.。150银币、十人、54道德、主角13级、全部角色／装备／教材／物品、shopState、完整profile及战斗历史均未变，新增完成标记0。原丹麦未完与第一封信／`legacy-global-1`不变，不能把空屋访问当英国剧情或招募通关。

在小屋正常保存→刷新→Continue→独立导出，故事状态、时钟、地点、构筑、物品、收支与profile一致。HP／MP仍沿用[现有恢复机制](MAP_SAVE_VITALS.md)，未改存档格式，不声称精确战斗资源保存已解决。

| 工作区证据 | SHA-256 |
| --- | --- |
| `britain-willow.json`，原一次行程／回退／存读档，3项通过 | `f87cebc0237b88d3a02efffe4c2787a899923c8a3c3b8c21f1c5353c4861f157` |
| `britain-willow-outcome-save.json`，正常到达后导出 | `1bca1722de00027095f8b7684881eb456181dad8ac083dafd1de30e99af888f1` |
| `britain-willow-complete-save.json`，正常Continue后 | `cbdaa1b64f73b421643ce58e58444da6bac89ecf39d1e490d89a70309e5d3a5f` |
| `britain-willow-copy-review.json`，只导入已抵达空屋的档检查说明与Back | `2110e8dcca6d6eda14526b0fbe27ec421d03c236a505835294164677b06bb740` |

补说明后仅从上述已到达档正常导入核对，未再旅行或触发相遇：实际展开notes读到新英文，Back为179×76px、y≈623，390×844首屏可用，无横向溢出。两份浏览器报告异常／请求／HTTP失败均0。设备是云端headless Chromium鼠标视口，非真机或触摸。

## 静态保护与美术交接

内容生成、TypeScript／前端构建及22项现有内容／冻结检查通过；最终说明调整后重核8项内容检查与中英文全包流程／全部规则定义。三个原段的非对白步骤逐项一致：背景、音乐、道德阈值、JOIN、两本原教材、journal、map命令全保留。原包SHA仍 `c348d1bc161dbe3a9f9a321232526da75b8d3c7638db7fb2b089d30981e9bcd3`。沿用既有WASM，没有.NET重建或新玩法验证；构建既有大分块／运行时脚本提示保留。

本段运行资源没有缺失，仍用原画。正式西化的专属缺件先只交接一张头像：

| 字段 | 精确规格／状态 |
| --- | --- |
| 身份与资源ID | 候选actor `actor-ff496f0b2e18`／`gb.guinevere`；`程英.初级`、`程英.高级`共用 `头像.程英` |
| 数量、尺寸、锚点 | 1张512×512 PNG胸像；面部中心建议(256,205)，归一化约(0.5,0.4)，留出裁切边缘；不透明背景 |
| 动作帧 | 本次对话头像0帧动画；不将头像算成战斗动画、poster或整个人物美术完成 |
| 当前文件 | `art/legacy/images/400fa85aefd9dcb736a6.png`，实际123×128；原model `chengying`不动 |
| 拟交付／接入路径 | `content/worlds/art/guinevere-portrait.png`→`art/worlds/guinevere-portrait.png`；后续经worlds manifest `localAssets`登记实际SHA／字节数，并核显示资源表 `browser.media.resources['头像.程英']`覆盖入口，不能覆写旧图库或改角色规则ID。本批未实现该绑定 |
| 制作责任 | 当前没有该图唯一制作负责人接单证据，仅向协调方交规格；身份仍候选，未生图、未另建writer或声称在制 |

小屋仍使用共享原场景，列入既有全局美术缺件，不在本批另开资源包或覆写共享背景。

后续已补[候选头像制作输入](GUINEVERE_PORTRAIT_BRIEF.md)：现用格林风格参考、来源、精确prompt、原生高分辨率候选与512正式导出的界限，以及素材席去重核查范围。只交规格，没有生图、接入或另建writer。

## 未验与后续范围

新8句对白的实际显示、婉拒、≥55加入／教材与伙伴培养均未验。原概率是本次没有遇见人物的明确原因，不是核心阻塞；保持一次真实回退，不以连续重访凑通过。后续自然行程遇见后可验原7页对应分支，不能仅凭此静态改写声称招募已完成。

前三章选定路线已实测；丹麦祠堂、英国招募、其它国家与最终结局仍按[原盘点](WORLD_COMPLETION_GAPS.md)的边界保留。没有新全游戏百分比、困难／自动、真机／触摸或全英文通关声称；本批未合并或部署。
