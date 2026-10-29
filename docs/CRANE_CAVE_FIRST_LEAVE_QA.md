# Crane Peak Cave：原初谈第一次离开

**后续：**人物关系改编获授权后，12句新版中英已接入；只用本页真实初谈前档作一次7句英文→Leave验收，完整序列化结果与本页旧对白结果一致。见[新版回执](NEPHTHYS_CAVE_ADAPTATION.md)。以下为历史，原件与首次失败保留。

基线 `effdc5c7eb6783348bd090aa08744604975cde63`，同一工作区、唯一源码 writer、`feat/storybound-italian-battle`。只完成获准非战斗边界，不选择留下，不打洞内战斗或领取信物；未合并／部署。

## 实际内容改动

新增 `chapter-crane-cave.json`，在原chapters列表注册。只补洞内地图说明、原返回说明及两次菜单的英语，中文名称／说明／提示／选项逐字保留。第一菜单为“What do you do?”、Stay here／Leave；第二菜单为“Stay after that warning?”、Stay and face a fight／Leave。顺序、原跳转、map命令、战斗、条件及收益不变，第二菜单没有在本批进入。

4段12句身份相关对白仍原文。[候选关系审阅](CRANE_CAVE_IDENTITY_REVIEW.md)发现现有对应不能在当前严格边界下直接定稿，故未接入Nephthys名字、改演员状态或机械替换夏雪宜。**本批不是全英文洞内剧情交付**：初谈7页及NPC名字／说明仍有中文，待关系方向确定后再改。

首次流程QA发现：地图与洞外卡片共用原ID，新增洞内说明通过未分类fallback串到了洞外导航。没有改全局投影逻辑，而是在已有maps／locations两个catalog类别中明确同名地图与洞口卡片的名称和各自说明。洞外恢复已交付的“A small cave behind Crane Peak.”，洞内才显示“You duck through a low opening into a surprisingly roomy cave behind Crane Peak.”。原初次报告保留，最终分类显示另用真实原件验证，没有为此重走洞口或重复剧情。

## 一次实际进入，原条件重新核对

原源 `musashi-route-recheck-recruitment-complete-save.json`，71402 bytes，SHA `35352bb0356fc0d6ba95b9e4d3c5478e7dbb1f7e54dc238669199d01f31e0b0d`：Hidden Glade、11人、150银币、道德54、普通难度、丑时。源及3份既有报告先逐字节保全至 `backups/pre-crane-cave-leave-effdc5c/`，结束核原件／副本不变。

实际前重新核原夜间人前置不存在、何红药胜利标记不存在，原洞口宿主显示map／1时段，才正常保存并点击一次。若出现意外战斗或不符，脚本设计为立即停，不运行战斗控制器；本次没有遇到这种情况。

| 实际操作 | 原生结果 |
| --- | --- |
| 保护原档，正常进入洞口一次 | 丑→寅，phase=world、`华山山洞`，没有拦截战斗或新剧情标记 |
| 正常保存并导出洞内交谈前档 | 11人、150银币及原构筑／物品／profile均保留 |
| 点原NPC、逐页看初谈 | 实际7页原中文对白，未将其计为新版英文句数 |
| 第一次菜单选择index1 Leave | 回Hidden Glade，寅→卯；没有选择index0 Stay |
| 正常保存、刷新Load及导出 | 完整结局 `game`／`wonBattles`／`profile` 一致恢复 |

本批整个真实进入过程只执行一次。其余语言／视口案例正常导入这份真正的洞内交谈前档，再只走原初谈及第一次离开，不重新进入洞口、不刷概率，也不把各个QA副本的时间／标记累计到同一正式源。

洞内交谈前档 `crane-cave-leave-en-390-arrived-before-talk-save.json`，SHA `1f92b0e100b1de83669bead32fdf661d170cdb60e409717f69562391d93fc0b7`。首条正常完成档 `crane-cave-leave-en-390-complete-save.json`，SHA `a741132570fc91c674662f584574464078aaf5199f1c668fdac56e76e5a2c2b0`，保留为独立真实QA结果，不覆盖原丑时档。

## 原流程变化与冻结字段

进入相对原档只改变 `clock`、`location`；第一次离开相对真实到达档只改变 `clock`、`location`、`storyState`。实际总两时段，年月日不变；storyState只新增完成ID `碧血剑_何红药1`，lastStoryId也变为该ID。没有完成第二／第三／胜利段。

角色、队序、装备、属性／技能／教材、库存、仓库、货币、adventure（含道德／组织）、商店／特殊战斗／小游戏状态、战斗历史及完整profile均与原源相同：仍11人、150银币、profile死亡3／击杀131。没有新任务日志、信物、经验奖励、招募或“五毒教深处”解锁；世界触发状态与丹麦／飞狐／主线标记不变。正常读档比较的是动作完成档，不把原本应变化的时间和初谈标记写成“全程数据不变”。

## 实际界面、最终显示与测试

初谈离开流程以390×844／320×740中英4组运行：第一组11项、其余各10项限定检查通过，浏览器／HTTP／请求异常0。每组实际显示7句原文、第一菜单提示和2个原顺序选项，Leave按钮在固定底栏上方；保存刷新恢复完整完成档，隔离副本的原流程结果也逐字段与第一组一致。中文原始7句和菜单原文保留，英文仅保证本批新地图／返回／菜单文字，不保证原7句或整张洞图全英文。

分类显示修正后另做4组针对性检查，每组4项通过：正常导入原后山档与真实洞内到达档，逐个确认洞外短句、洞内说明、返回文字、320／390px换行；普通滚轮避开底栏、等待导入toast淡出后截图。每份只读导出与其来源完整game／profile／战斗历史一致，没有再进入、交谈或重复获取状态。实际查看320px英文菜单和最终洞内图，原NPC卡片中文残留仍明确保留。

内容、TypeScript／Vite前端构建通过；原runtime-loader及较大chunk警告保留，未重建.NET宿主。最终内容下22项现有流程／内容冻结与8项投影回归通过；原12句身份对白逐条相同，全部运行定义／人物名／地图事件保持原值。原包SHA仍 `c348d1bc161dbe3a9f9a321232526da75b8d3c7638db7fb2b089d30981e9bcd3`。

工作区 `src/Game.Web/test-results/` 的流程报告：

| 文件 | SHA-256 |
| --- | --- |
| `crane-cave-leave-en-390.json`，15963 bytes | `c8e7fd6a8f699727c01f80812281c3094fd5eb958900ddf4ec508a7b86e22fbe` |
| `crane-cave-leave-zh-CN-390.json`，14723 bytes | `20b5b689a01ab10f0398997a9a8850f22bfb4fcb892439e65112c18c2b453d4a` |
| `crane-cave-leave-en-320.json`，14650 bytes | `5ce98ba968fa7009892aad3c8ff48b996e0486291db3f741f52f36f2e72cda62` |
| `crane-cave-leave-zh-CN-320.json`，14723 bytes | `d35ebdf512452dd4741fff7d6c1835b2eb39f518cfff8d8d8cb1ae5cfd0c79d4` |

最终分类显示报告 `crane-cave-display-scope-{en,zh-CN}-{390,320}.json`均passed=true、浏览器／HTTP／请求异常0；前后截图、真实到达／完成档及脚本另列 `crane-cave-first-leave-evidence-manifest.json` 的bytes／SHA。演员表与原候选素材、前三章成果、旧失败／山战中断及全部源档保留。

NOT_RUN：第二次菜单／两次Stay、战斗／胜败／超时、3句胜利收尾、物品／后续解锁、其它洞内分支、真机。没有测试培养或切换角色能力；没有对剩余剧情作选择或新增全游戏完成百分比。
