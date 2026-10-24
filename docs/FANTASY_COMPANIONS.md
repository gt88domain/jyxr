# 伙伴换装与加入条件

新版以探索、招募、培养和战斗组合为重点。直接进入格林引导的开放幻想世界，不为每个伙伴补新任务；只改玩家看到的名字、对白和描述。

[游戏试玩](https://gt88domain.github.io/jyxr/fantasy-worlds/game/) · [伙伴对应页](https://gt88domain.github.io/jyxr/fantasy-worlds/zh/?kind=companions) · [62个身份的中英CSV](https://gt88domain.github.io/jyxr/fantasy-worlds/data/companions.csv)

## 已定名的20个招募身份

这些名称已接入中英文运行包，成长形态沿用同一身份。表中的加入场景只指已有加入相关对白的改写，不表示整条前置路线已经改写或通关。

| 原角色 | 新版中文 | 美式英文显示 |
| --- | --- | --- |
| 乔峰 | 索尔 | Thor |
| 令狐冲 | 宫本武藏 | Miyamoto Musashi |
| 小龙女 | 湖中仙女 | The Lady of the Lake |
| 张无忌 | 哪吒 | Nezha |
| 李文秀 | 杜尔西内娅 | Dulcinea |
| 杨过 | 亚瑟王 | King Arthur |
| 狄云 | 德古拉 | Dracula |
| 石破天 | 赫拉克勒斯 | Heracles |
| 程灵素 | 格尔达 | Gerda |
| 胡斐 | 凯 | Kai |
| 苏荃 | 格琳达 | Glinda |
| 袁冠南 | 匹诺曹 | Pinocchio |
| 袁承志 | 荷鲁斯 | Horus |
| 郭襄 | 爱丽丝 | Alice |
| 郭靖 | 白雪公主的猎人 | The Huntsman |
| 阿珂 | 多萝西·盖尔 | Dorothy Gale |
| 陈家洛 | 达达尼昂 | D'Artagnan |
| 陈达海 | 堂吉诃德 | Don Quixote |
| 韦小宝 | 稻草人 | The Scarecrow |
| 黄蓉 | 白雪公主 | Snow White |

人物身份来自现有固定角色表，本批没有重新随机分配。堂吉诃德的加入段只有命令，仍保持原样；哪吒同时有正式路线和测试记录，测试段不改写。

## 记录范围与完成边界

冻结包有80条JOIN/FOLLOW指令，涉及65个角色形态、62个身份。这包含跟随、特殊与测试记录，不能直接等同于62个正常可招募队友。

- 20个招募身份固定，42个仍是待审候选。
- 34个身份的全部招募形态已按角色表换名，其中含20个固定身份和14个候选；已换名不表示候选已定稿。
- 本批改写24段现有加入相关剧情，连同埃尔原有加入段，再加组织出师段，覆盖26个带加入／跟随指令的剧情段。
- 全部已写内容合计141个剧情段、445句对白。白马线对白与选择已补齐；其他中后期路线尚有旧对白，不能称作完整英文版。

伙伴页把“身份固定／候选”和“游戏中已换名／尚未换名”分别标出。CSV每身份一行，含源形态、所在剧情、对白覆盖数及测试记录标记；[机器可读清单](https://gt88domain.github.io/jyxr/fantasy-worlds/data/companions.json)另含原始指令与源位置。

## 条件保留

道德值仍由原宿主计算。伙伴面板显示当前值，不提供修改按钮。数值更高不保证更容易加入：例如原令狐冲的一条加入分支要求 `35 ≤ morality < 65`，并且还有其他前提。新版显示宫本武藏，判定仍走原分支。

指定物品改显示名，编号、消耗、奖励和效果保持不变。例如格尔达求药仍依赖原七星海棠，显示为Nightshade Blossom／夜影花；净身者天赋仍是原阉人天赋，相关道具门槛不会因英文改名而消失。地图事件、队伍要求、选择分支、战斗胜负、概率、天数和周目也不改。

运行包中的角色名、技能名与天赋参数保留原值；新文案仅经 `browser.displayCatalog` 投影到界面，避免名称参与结算的组合失效。未给任何角色直接加入、解除条件、补完成标记或发放测试道具。

随机掉落也会暴露旧名称。本批为97个已有解锁招式补齐完整显示名，补足随机装备池中缺失的11项天赋文案，并统一15处旧技能别名。随机装备池的14个天赋均有中英文说明；抽取候选、概率、参数与原包一致。

## 内容与验证入口

- 身份来源：[cast-map.json](../src/Game.Web/content/worlds/cast-map.json)，固定锁仍沿用原表。
- 新对白：[chapter-companions.json](../src/Game.Web/content/worlds/chapter-companions.json)。
- 清单提取：[world_companions.py](../src/Game.Web/scripts/world_companions.py)，只读冻结包命令并与角色表核对。
- 条件与参数保护：[test_world_companions.py](../src/Game.Web/tests/test_world_companions.py)、[test_grimm_skin.py](../src/Game.Web/tests/test_grimm_skin.py)。检查两种语言保留全部原定义与加入命令，并拒绝道德值、物品条件或JOIN目标的更改。
- 浏览器前期流程：[FIRST_LOOP.md](../src/Game.Web/content/worlds/FIRST_LOOP.md)。这是已有埃尔招募、真实战斗与存读档路线；不代替其余伙伴的完整路线验证。
