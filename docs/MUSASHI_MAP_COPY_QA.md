# 武藏山路：标题与原导航英语显示

基线 `11c4e4152d03c003ecd2eb59802644cbf64a1f91`，同一工作区、唯一源码 writer、`feat/storybound-italian-battle`。只改显示文案，未合并／部署。

## 产品范围

只在现有 `chapter-japan-musashi.json` 增加3个地图标题和4个原文显示键，复用既有catalog投影；没有界面代码、地图ID、连接、坐标、耗时、概率、条件、命令、奖励或目标逻辑改动。

| 原地图ID | 英文标题 | 中文模式 |
| --- | --- | --- |
| `华山后山3` | Crane Peak — Misty Fork | 保留“华山后山3” |
| `华山后山4` | Crane Peak — High Trail | 保留“华山后山4” |
| `华山后山` | Crane Peak — Hidden Glade | 保留“华山后山” |

沿用已固定的Crane Peak名称。现有 Path ahead／Left path／Right path／Back保持原映射；补 `貌似前方有亮光……` → “Light ahead.”、`返回华山` → “Back to Crane Peak.”、`华山山洞` → “Crane Peak Cave”及该洞口卡片的原小洞说明。四个新键的中文值均为原文。没有显示正确路线答案、加入新入口或改变下一步推荐。

这些原文键沿既有词典机制共享，属于同一地点／通用提示的显示别名；没有为此编辑其它地区的定义或剧情，也不据别名复用声称其它页面已验。三张地图折叠的地点长说明、世界目标、人物和美术未扩改。

## 真实到达档，不重新走路口

使用此前正常路线实际保存的3份文件，全部先核SHA并逐字节备份。前两份为招募前10人历史到达档，第三份为已验证招募后11人当前档，不能混称三页都来自同一11人时点。

| 原件（工作区 `test-results/`） | 真实地点／阶段 | SHA-256 |
| --- | --- | --- |
| `musashi-route-recheck-before-junction-0-save.json` | 山路3，10人，戌时 | `c3832de58b838e1ec621d8175a523de1046db94ec9af8d0c65c7d049631beb85` |
| `musashi-route-recheck-before-junction-1-save.json` | 山路4，10人，亥时 | `4a3d233b089b43f8deb4d5896393baac0e1cd8c74772229baed77241f7d2035e` |
| `musashi-route-recheck-recruitment-complete-save.json` | 后山，11人，丑时 | `35352bb0356fc0d6ba95b9e4d3c5478e7dbb1f7e54dc238669199d01f31e0b0d` |

三份均150银币、道德54、普通难度。另保留招募前后山到达档、原招募报告和tick83中断报告，共6份原件及副本，台账 `backups/pre-musashi-map-copy-11c4e41/manifest.json`；结束逐一核SHA不变，没有覆盖现行11人进度或拼接历史档。

先用这些原件打开改动前英文390px页面，实际记录3个中文标题、亮光／返回说明、洞口名称／说明。改后分别在390×844、320×740的英文和中文独立context中正常导入原件，读取标题与原有导航，正常保存、刷新Load；**没有点击任何方向、返回、洞口或剧情按钮**。没有编辑存档伪造到达，也没有重新走一次随机路线。

## 结果与概率边界

4组各9项限定检查通过，覆盖每组3页的标题、导航与存读档。英文标题及现有导航卡的名称／说明无中文残留，320px长标题自然两行、390px一行；文字scrollWidth／scrollHeight均不超可见范围。导航描述也检查了竖向裁切，没有把两行截断当作完整可读。中文保留原三标题、原返回／亮光／洞口文案及此前既有中文方向标签。

中文390px检查山路4时，宿主将左路口预览为 `action=battle`，其余本次预览为原地图动作；没有点击该按钮，phase始终world。原70%亮光提示在独立读取时也可有不同预览，本批接受实际结果，不为出现／消失而重试。**预览解析不等于已开战或走过路口**，没有新增遭遇、胜败或结算；原5%／70%数据保持原值。

保存前后完整序列化 `game`、`wonBattles`、`profile` 均与各自源档一致：原人数、150银币、道德54、时钟、角色构筑／装备／研习／物品／剧情／世界阶段及profile死亡3／击杀131均不变。英文390／320的世界目标区与改动前对应源页面文字逐字相同。既有HP／MP恢复边界不改，不声称战斗现场可精确续存。

使用云端无头Chromium、鼠标，非真机或触摸。实际查看390px英文标题／洞口导航、320px英文标题和中文导航截图；导入时短暂toast可能覆盖局部，未修改该提示。标题在首屏可读，320px现有较长目标区仍可能使导航需要向下滚动，本批不宣称已经完成全首屏重排。

## 构建与可核证据

内容、TypeScript／Vite前端构建通过；原runtime-loader非模块和较大chunk警告保留，未重建.NET宿主。22项现有内容／流程冻结及8项投影回归通过。另逐语言核编译运行包全部原定义一致，包括地图连接、行走时段、事件和概率；原包SHA仍 `c348d1bc161dbe3a9f9a321232526da75b8d3c7638db7fb2b089d30981e9bcd3`。

工作区 `src/Game.Web/test-results/` 报告：

| 文件 | SHA-256 |
| --- | --- |
| `musashi-map-copy-before-en-390.json`，13357 bytes | `2b06c1bfce470f68896ff7a7c0b417d142a6a8283671be8a2adfd914e3c40416` |
| `musashi-map-copy-after-en-390.json`，14068 bytes | `a68a0a6fa98dd23e632e0eab7da9b720b8bbeed18b31102cb275cbf3e1fbe418` |
| `musashi-map-copy-after-zh-CN-390.json`，14036 bytes | `a97824e53dadca70f5a80382fc57981bf44af705468448d4b37205d4d81317b6` |
| `musashi-map-copy-after-en-320.json`，14068 bytes | `d2c37221174305b1e495ce1f66c2be9c2f5e299bc75fd5a97df1565c906ef52c` |
| `musashi-map-copy-after-zh-CN-320.json`，13985 bytes | `9eda75d09a9c90dd750ec9d3699e4efdf87df4dbc6ec1c1eb6c4551435beb1da` |

报告均passed=true、浏览器／HTTP／请求异常为0。三源各语言／视口的前后导出、标题与导航截图和脚本另列 `musashi-map-copy-evidence-manifest.json` 的bytes／SHA。原候选美术、前三章成果、旧失败和所有原件保留。

未验：重新实走山路、进入洞内、地图后续剧情、遭遇战／旧山战结算、其它地区、真机。三处当前页面均有真实安全到达档，不需要风险流程才能看标题；因此本批没有为显示验收开战，也不计新招募、章节通关或全游戏完成百分比。
