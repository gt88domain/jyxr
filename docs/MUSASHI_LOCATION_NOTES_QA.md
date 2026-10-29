# Crane Peak三处地点说明：英文与折叠阅读

基线 `90db062f488c93d661cd8d2c48f9fc99baacf1e4`，原工作区、唯一源码 writer、`feat/storybound-italian-battle`。先实际打开旧折叠说明确认3处中文，再完成本批显示修改；未合并／部署。

## 产品改动

仅补 `chapter-japan-musashi.json` 的3个 `maps.description`：Misty Fork描写云雾、陡坡与被遮住的景色；High Trail描写高处山路及忽隐忽现的视野；Hidden Glade描写开阔林地、野花、岩石和云中的来路。沿用Crane Peak命名，没有指示正确方向、提供捷径、承诺安全／恢复或增加剧情。

三个中文description逐字保留原文。既有标题、导航、目标、折叠控件、日志、地图ID、连接、时段、概率、触发、奖励与存档结构不改；没有任何UI／CSS／核心代码修改。两条原相同中文山路说明通过已有地图ID投影分别显示对应英文，真实页面已分别核对。

## 原件与只读操作

仍用三份真实到达档：`musashi-route-recheck-before-junction-0-save.json`（10人、山路3）、`musashi-route-recheck-before-junction-1-save.json`（10人、山路4）、`musashi-route-recheck-recruitment-complete-save.json`（11人、后山）。来源SHA与阶段见[上批地图实录](MUSASHI_MAP_COPY_QA.md)，没有编辑文件或拼接到达状态。三源及2份既有成果先保全至 `backups/pre-musashi-notes-90db062/`，结束核原件与副本不变。

仅正常导入原件、在现有 `.gw-notes` 展开／收起首个地点段落、普通滚动阅读、保存／刷新Load。没有点击任何方向、返回、洞口或剧情按钮，不行走、不领取物品、不战斗、不调时钟；不根据预览结果重试。折叠区的近期记录仅观察，不扩大修改。

## 保留首次失败与改进验证

首轮390px中英检查在窗口范围内通过，但未排除固定底栏遮挡，**不是完整无遮挡阅读的最终证据**。首轮英文320px在第三处失败：工具 `scrollIntoViewIfNeeded` 把长段落底端放到740.25px，窗口740px、固定底栏顶部678px；0.25px出界且末行被底栏覆盖。首份false、截图及前两页已完成结果均保留，没有改写成通过。

独立真实后山档诊断记录：再用一次普通滚轮后，段落top451.69／bottom545.25，底栏仍678px，全文可读。未发现段落高度裁切，也不需要修改排版；问题是测试只按窗口定位，没有避开固定底栏。本批没有用缩短说明、删除正文或改UI隐藏底栏来满足断言。

随后补强只读QA：每个原件／语言／视口案例只导入一次；需要时普通滚轮，等待整段位于底栏上方至少8px，再核文本、横向／纵向尺寸、展开／收起及正常存读档。保留原较弱报告，不据它们宣称最终无遮挡通过。

## 最终实际结果

| 独立组 | 结果 |
| --- | --- |
| 英文390×844／320×740 | 三处新英文逐段一致，无中文地点正文残留；长段落正常换行、不裁切，滚动后全段位于固定底栏上方 |
| 中文390×844／320×740 | 三处原文逐字不变；展开、滚动阅读、收起均正常 |
| 每组正常保存／刷新Load | 完整 `game`、`wonBattles`、`profile` 与各自原源档一致，说明重新收起 |

4组各9项补强检查通过，浏览器／HTTP／请求异常为0。仍各自10／10／11人、150银币、道德54、原时钟、构筑、物品、剧情和profile死亡3／击杀131；现行11人源档未覆盖。既有英文标题及世界目标区与上批对应源页面逐字一致。

另以同一真实11人后山档补320px中英两张清晰截图：等导入toast淡至opacity<0.01、普通滚动后再拍，避免瞬时提示覆盖说明；段落bottom545.25／524.69均高于底栏678px。两份正常导出也逐字段核与原源档相同，不把等待墙钟时间当作游戏时间推进。

使用云端无头Chromium、鼠标与原生Enter展开，非真机／触摸。没有新控件、DOM伪造、游戏命令注入、洞内夹具或实际剧情推进。

## 构建与证据

内容、TypeScript／Vite前端构建通过；原runtime-loader非模块与较大chunk警告保留，未重建.NET宿主。22项现有内容／流程冻结及8项投影回归通过，逐语言核全部原运行定义一致；原包SHA仍 `c348d1bc161dbe3a9f9a321232526da75b8d3c7638db7fb2b089d30981e9bcd3`。

工作区 `src/Game.Web/test-results/`：

| 报告 | SHA-256 |
| --- | --- |
| `musashi-location-notes-before-en-390.json`，10885 bytes | `865a727ebf8c37c5c8b6bbfc54c8a3d957d85c32a49ea2b770985d559e1480ee` |
| `musashi-location-notes-after-en-320.json`，9601 bytes，首轮false | `aa796f7bc05c1d3c3ca1e1d6a070c83b4b9bf515f566f9efdb48d9fd5425ef07` |
| `musashi-notes-scroll-diagnostic.json`，2794 bytes | `a3e0c06a8a80446018e49b2f069e2dfc4e57130c8d028a848b9745dcaa32de87` |
| `musashi-location-notes-scrollcheck-after-en-390.json`，12351 bytes | `76a0d28d8b751314e3c5de8e36c7dcc216b5fbe442ab6b107b97b33dea2e5af8` |
| `musashi-location-notes-scrollcheck-after-zh-CN-390.json`，11974 bytes | `5f19ad2953de19c53517ae8a3529f3dd17f8a9f4a7000e03b135cd8a90e2c59a` |
| `musashi-location-notes-scrollcheck-after-en-320.json`，12347 bytes | `42fb641e0e24443e12ecdc3c74a55ae6eadd99fa44c67c74b4513c6b998d989e` |
| `musashi-location-notes-scrollcheck-after-zh-CN-320.json`，11986 bytes | `d71f7479330050e0741244683987f8418d4bf02ebf8c74f2454db00bc85293f9` |

补强报告、首轮弱检查／失败、诊断、无toast补图、各组前后导出与脚本均留存，另列 `musashi-location-notes-evidence-manifest.json` 的bytes／SHA。旧山战失败／中断、前三章成果、武藏招募／技能／天赋候选及素材均未覆盖。

## 下一原路径只读事实

[洞内原路径审阅](CRANE_PEAK_CAVE_PATH_REVIEW.md)已核到：当前档不满足夜间人拦截前置，何红药入口只要求未完成其胜利段；可初谈后离开，连续两次留下才进入原3对7战斗。胜利原给Venom Circle Token、日志并回后山，胜利标记另开启五毒教“深处”入口；败／超时原gameover。角色西化身份仍proposed、4段12句和2菜单未英文化，未在本批推进或选择。

未验包括洞口／洞内实际呈现、任何对话／分歧／战斗／物品／解锁、其它地区与真机。没有新增章节完成度，也不能把本批说明可读当作旧山战结算或洞内通关。
