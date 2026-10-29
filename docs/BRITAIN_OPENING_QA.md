# 英国开篇交谈：实际英文与存读档

## 本批改动

源码基线 `0037e1bbcd0530d122de8c61cebaf80437cff7f4`，原工作区、`feat/storybound-italian-battle` 和唯一writer。接续[已核入口](BRITAIN_ENTRY_REVIEW.md)，只完成亚瑟初遇、原菜单、询问经历、告辞和狮鹫招呼；祠堂自动试战仍冻结。

新增独立[英国开篇文案](../src/Game.Web/content/worlds/chapter-britain-opening.json)，登记到既有skin章节清单。覆盖4个原段、16个原对白槽位、原菜单提示／四选项和两条人物卡说明；不改地图名、人物固定／候选身份、说话者顺序、位置、条件、命令、跳转或收益。中英文共用稳定ID，旧中文原版备份不动。

| 原稳定段 | 实际文字处理 |
| --- | --- |
| `sdxl_剑魔荒冢.杨过` | 10句，骑士／狮鹫／找旅伴的轻松初遇；不再是胖鸟、旧人名和原角色私人关系的换名直译 |
| `sdxl_剑魔荒冢.杨过2` | 1句，原菜单提示和四选项英文化；问经历／友好切磋／攻击／告辞各保留原索引与去向 |
| `sdxl_1` | 3句，湖中仙女托付古剑、国王不能靠挥剑解决所有问题、向狮鹫请教时少听一句加税建议；不把湖中仙女写成姑姑／恋人，不添加新誓言任务或招募门槛 |
| `sdxl_神雕` | 2句，只是叫声与回应，保留已有后续“狮鹫原来会说话”的反差，不新增身份或提前改成会话伙伴 |

示例是实际接入文字：

> Traveler: “Good thing I'm here for the company.”
>
> Arthur: “That's the first excuse it hasn't heard.”
>
> Arthur: “Then I became king. Everyone had a problem, and very few of them could be solved by hitting something.”

人物卡分别为“A king, a sword, and an unfinished story.”及“Arthur's watchful, tight-lipped companion.”。四选项是“Tell me your story.”、“Care for a friendly match?”、“Attack Arthur. (-3 Morality)”与“Just passing through. Goodbye.”。攻击文案明确原敌对行为及原3点道德损失，不伪装成友好选择。本批实际只点索引0和3；切磋、攻击及其后续对白／数值未验。

## 真实界面缺陷与修复

第一次 `britain-opening.json` 在初遇首句停止：人物卡英文及首屏已过，但Continue控件未达44px，未选分支、无战斗或奖励；失败报告保留SHA `64f2426c78c5b23bbcfc9b0b13eff5a3b898edd5b08b053f95dcfb7a4f5f66fc`。

独立正常副本只测控件到菜单，不选任何分支，`britain-dialogue-control-review.json` 实测Continue **35px**，四选项为52／62.375／62.375／62.375px。确认是Continue尺寸后，仅在既有UI样式给 `.dialogue-next` 增加 `min-height:44px`；不改交互命令或菜单。没有把未达标测试断言删掉来制造通过。

另外将初遇末句改成“I'll take that as a compliment.”，避免紧接原菜单时连续问两遍同样的问题。重建后采用独立 `britain-opening-rechecked` 报告，从原未改对话前档重新验证；原失败及控件测量都不覆盖。

## 实际路线与结果

源 `britain-entry-review-before-dialogue-save.json`，SHA-256 `9b1b555ddfc859161f97a4268a33ffa725894fe9e674c18a38316c33001f2ad4`，150银币、十人、道德54、主角13级，存档122日酉。与原150／330／296、三条丹麦战术报告及两种旧profile恢复记录等共10份文件逐字节备份到 `test-results/backups/pre-britain-opening-0037e1b/`；不编辑或拼接存档。

正常导入空QA context，直接在原地图点King Arthur：初遇10句＋原菜单前1句→选择问经历（索引0）→3句经历＋同一菜单前1句→选告辞（索引3）→原地图→点The Griffin→2句招呼→返回world phase。**16个唯一槽位实际显示17页**，因为菜单前那句会按原流程显示两次；没有新增循环跳转或重复触发奖励。

以下均为实际核查，非静态预测：

- 初始两张人物卡都在首屏固定导航上方，控件≥44px；两处原中文说明消失。
- 全部17页、两次原菜单以及返回地图均无可见中文残留。四个选项均在390×844首屏，Continue各页实测44px，无横向溢出。
- 正常保存→刷新→Continue后仍为Old King's Barrow，150银币、十人、道德54、人物／装备／研习／物品与战斗历史不变，存档122日亥。两次人物交互各消耗原一时段，没有刷时间或新奖励。
- 原始新完成标记仅 `sdxl_1`、`sdxl_剑魔荒冢.杨过`、`sdxl_剑魔荒冢.杨过2`、`sdxl_神雕`。没有进入 `sdxl_2`／`sdxl_3` 或任何战斗，没有招募亚瑟／狮鹫。
- 丹麦全部原故事标记不变；mainStory仍仅第一封信 `mainStory_黑暗的阴影`，世界触发仅 `legacy-global-1`。完整profile与源档相同，死亡2／击杀129，没有与旧3／136或3／137相加。

设备为云端headless Chromium、390×844鼠标；这是移动视口检查，不是真机或触摸。原图像／动画及音频继续保留，未制作新素材包。

| 本批真实证据 | SHA-256 |
| --- | --- |
| 修正后完整报告 `britain-opening-rechecked.json` | `749dea3444d2faea78e7bd0dcdf9e3a07bc60e85c754aff45d6822bf52c3e82e` |
| 交谈后导出 `britain-opening-rechecked-outcome-save.json` | `e728084123a555ac07f9c23c7d7b320ab57ee0fa19b9a3a2f0f9613f626a5544` |
| 正常存读档后 `britain-opening-rechecked-complete-save.json` | `3b03c34c2af98445e5dd35fdab4f6d25f9a9c476c02e44c7e8d97cdf437bea92` |

原始报告／导出及截图放在工作区忽略产物目录。新完成档是正常world存档，不是上批无法接续的tick400战斗快照；保留原对话前、150重甲、350培养／恢复、330十人、296九人与全部丹麦失败，不合并分支收益。

## 验证与未验边界

修正后实玩报告23项检查通过，浏览器异常、HTTP／请求失败0。8项章节检查与14项冻结规则检查通过；额外核两种语言均保持16个原说话者槽位。内容生成、TypeScript与前端构建通过，沿用原WASM，没有.NET SDK或新增宿主测试的声称。前端仅Continue触控尺寸一条样式，所有战斗／成长／经济／条件／收益及存档格式不变。

这只是英国线的独立开篇交谈，不是招募、战斗、完整英国章或整游通关。其余英国对白仍待改写；当前主引导仍显示原未完丹麦调查，本批不改任务优先级、借另一线绕过丹麦或推进格林会面。困难／自动、中文实玩、真机／触摸未验；未合并或部署。

```sh
GAME_MODULE=worlds npm --prefix src/Game.Web run content
GAME_MODULE=worlds npm --prefix src/Game.Web run frontend
GAME_WEB_URL=http://127.0.0.1:4230 BRITAIN_OPENING_RECHECK=1 node src/Game.Web/tests/britain-opening-smoke.mjs
```

本次原失败及修后报告各有独占启动标记，勿重跑覆盖。若继续英国线，先读原切磋／招募条件和既有人物上下文，另定一个可独立交付的小段；不要以这17页通过替代战斗及伙伴验收。
