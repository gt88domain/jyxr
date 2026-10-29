# 丹麦取药分歧：只读审阅与英文候选

基线 `a2dadf110b3c7f3bb02cb3f92dc2d26c2623972c`，仍为 `feat/storybound-italian-battle`。本批只读检查原包、命令实现和已保全存档，**没有打开游戏推进、掷取药事件、战斗或选择分歧**。下列英文为文档候选，尚未加载到游戏；不能称这段已英文实玩通过。

原包SHA-256为 `c348d1bc161dbe3a9f9a321232526da75b8d3c7638db7fb2b089d30981e9bcd3`。原始场景、地图引用、战斗、物品与称号提取保留为工作区忽略产物 `src/Game.Web/test-results/denmark-nightshade-source-audit.json`。实际救援结果与旧失败见[上一批实录](DENMARK_REMEDY.md)。

## 入口与开战事实

| 项目 | 原配置／本批结论 |
| --- | --- |
| 入口 | `大地图/阎基居`，原events/1、事件id `2`，显示 Apothecary's Hut |
| 条件原文 | `(story_completed('雪山飞狐_药王庄.程灵素.求药')) && chance(0.5)` |
| 次数 | `repeatMode: once`；50%是入口事件机会，不是战斗胜率 |
| 无额外条件 | 此入口未要求等级、时间、道德、物品或格尔达当前在队；不能为更顺畅而补门槛 |
| 入口段 | `雪山飞狐_阎基居.七星海棠`，legacy segments/801 |
| 战斗 | `阎基居.战斗.七星海棠`，主角和凯必选，共两个友方位置 |
| 敌方 | 原10级药师（1000HP／800MP）加六个tier1随机敌人；不只是上一场寻页的单个药师，也不是毒信战的三人 |
| 后果 | 胜利跳segments/802，再显示杀／不杀；失败、超时均 `legacy_flow('gameover')` |

296银币档已完成求药，具备事件的故事前置，但本批没有检查当次50%机会是否实际可选，更没有证明该构筑能赢此战。原药师没有在这场配置中新增“夜影花毒云”技能；对白可写他企图用花伤人，不能据此宣称战斗真的新增该技能或特殊机制。

## 第一次选择的实际差异

原选择在 `雪山飞狐_阎基居.七星海棠.胜利`：prompt“杀还是不杀呢？”，顺序为“杀”→`.胜利.杀`、“留他狗命”→`.胜利.不杀`。不得把顺序或目标反转，也不能改成含义较轻的“赶走／劝说”。

| 结果 | 杀：segments/803 | 放过：segments/804 |
| --- | --- | --- |
| 道德 | `change_morality(2)` | `change_morality(-2)` |
| 固定道具 | `item('七星海棠', 1)`，显示 Nightshade Blossom | 同样1株 Nightshade Blossom |
| 称号／设备档案 | `legacy_nick('七星海棠')`，解锁原成就 | 此段没有该解锁命令 |
| 伙伴 | 此段没有加入命令 | `join('阎基')`，加入药师；正常九人基线且他此前未加入时预计变十人，尚未实测 |
| 情报 | 不保留药师提供的指控 | 药师指控老勇士在过去的中毒决斗中害死凯的父亲；原故事是胡家父仇，西方人设后续需一起改写，见下文 |
| 地图命令 | 明确 `map('大地图')` | 没有显式map命令，实际返回呈现待验 |
| 日志 | 药师被杀 | 记录药师对老勇士的指控 |

上述是**分支固定命令**，不含实际战斗可能结算的经验／银币／掉落，不能静态推定战后余额。若选择前道德仍为56，则这两个命令分别使其58／54；不以通用“善恶”叙述解释或翻转原数值。两个分支都没有在这些步骤扣除银币、移除现有教材、让凯／格尔达离队，亦不等于所有后续没有损失。

Nightshade Blossom原为不可丢弃、不可直接使用的任务物品（`type: quest_item`、`consumeOnUse: false`、空useEffects）。不能提示玩家在背包点击使用来治好伤者。后续“救治”及“对峙”段也没有显式消耗花的命令，不擅自补扣道具；整条后续的最终持有情况尚未实玩。

`legacy_nick` 在 `BrowserBridge.Flow.cs` 调用 `ProfileService.UnlockAchievement`，不只是更换一段日志。同一设备的普通Continue读取会保留设备档案，不能仅把游戏剧情存档退回就当分歧验证已隔离。

## 回小屋后仍有分歧，不是选完直接结束

- **杀药师**：原小屋事件4要求取药胜利及`.胜利.杀`，进入 `雪山飞狐_苗人凤居.救治`（805）；敷药后直接跳 `...田归农来战`，还要打原援护战。获胜后进入调查段 `...田归农来战.胜利.2`（809），给 `胡家刀法手抄本`1本，再返回世界。这里没有自动完成整个丹麦。
- **放过药师**：原小屋事件6要求取药胜利及`.胜利.不杀`，进入 `...阎基对峙`（810）；先敷药，再出现第二次“是否杀苗人凤为胡斐报仇？”选择。
- 第二次选择“上”进入 `苗人凤居.阎基对峙.杀苗人凤_战斗`，**开战前道德－4**；失败／超时仍gameover。原胜利会强化凯与药师、给教材和称号，不能用“切磋一下”掩盖其叙事后果。具体战后成长还没有实测，不把源码奖励当成已经获得。
- 第二次选择“不上”直接跳上述调查段809，给原手抄本1本并返回世界；这条跳转本身不经过前述援护战，不能为两路“对称”而加战。
- 调查后，原湘妃庙入口又按药师杀／不杀标记分开。后续存在药师离队、相信／不相信及其他战斗；此处只核对首个相邻节点，不宣称已穷尽全丹麦结局或所有成长收益。

当前药师仍显示 **The Apothecary**。Ole Lukoie、Holger Danske、The Steadfast Tin Soldier、The Mirror Troll均仍是相关旧角色的候选，不通过这次审阅升格固定。尤其不能把凯直接写成锡兵之子、把奥勒写成投毒抢劫者。旧父仇上下文横跨救治、对峙、调查与后续回忆，不能只把首次指控换名后声称整条西方故事已自然连贯。

## 英文候选：进入、战后与选项

保留原8句进入对白、5句战后对白及其原说话顺序；没有奖励或新命令夹入。杀／放过两段在游戏中仍待完整改写，这里先提供审阅候选，不改变上线内容。

| 段落／说话人 | 美式英文候选 |
| --- | --- |
| 801／The Apothecary | Back again? I'm beginning to charge myself for these visits. |
| 801／Hero | We're looking for a Nightshade Blossom. Someone needs an antidote. |
| 801／The Apothecary | Flowers? I run a respectable practice. |
| 801／Kai | Then help us. The champion at Winter Cottage was poisoned. |
| 801／The Apothecary | No blossoms here. Try a florist. |
| 801／Hero | Then why is there one behind the counter? |
| 801／The Apothecary | Ah. That one. You should have left it alone. |
| 801／Kai | Step back. He's reaching for it! |
| 802／The Apothecary | Please! I'm much more useful alive. |
| 802／Kai | You've tried robbing us and poisoning us. That's quite a résumé. |
| 802／The Apothecary | I know a secret about the champion! |
| 802／Hero | Then talk. |
| 802／The Apothecary | Promise you'll spare me first. That's my final offer. |
| 802／prompt | What do you do with the apothecary? |
| 第1选项 | Kill him. |
| 第2选项 | Spare him. |

术语固定 Nightshade Blossom（材料）、antidote（配出的解药）、The Apothecary（职业角色）、the champion / Winter Cottage（伤者与地点）。不使用“获得花就治好了”“从背包喝掉花”“解毒术代替任务”等表达。

杀分支可保持简短、严肃：Hero “You tried to poison us. You're done hurting people.”；药师 “Wait—!”；格尔达在原发花后说“We have the blossom. Let's get back to Winter Cottage.”。不把杀人改写成缴械，也不在这里另加守卫、审判或道具。

放过分支的可用方向是：药师以一场旧中毒决斗的指控换命，凯要求当面对质，格尔达坚持先救人；原加入命令保留。这个方向避免给凯凭空补一个已固定的父亲，但必须与后续对峙、调查及回忆一起审稿后再接入。此处不将这项叙述方向当成已决定的全线重写，也不改原分歧的战斗、收益或条件。

## 指引候选与隔离验证方案

当前游戏首屏仍停在已验的格尔达同行阶段，未新增自动取药按钮。未来候选提示可写：

> Gerda needs a Nightshade Blossom. The apothecary may have one. His follow-up encounter has a 50% chance when the world-map event is checked. Save before going: you and Kai must fight, and defeat or timeout ends the journey. Winning leads to a lasting choice; both options provide the blossom, but their Morality, companion and later-story outcomes differ.

不写“下一次一定触发”、必胜、免费、额外指定伙伴或自动治愈。精确后果可放展开说明：杀道德＋2／称号；放过道德－2／药师加入／后续对峙。是否采用剧透程度由下一小批审定，不借提示改规则。

保全的真实基线为 `denmark-remedy-complete-save.json`，SHA-256 `9640c7272be664e848a4ba19ee60f34f54f9cba5dd7335b325bbfa4fea786d3d`；296银币、道德56、九人、无取药分歧标记。五份上批存档／报告逐字节备份至 `test-results/backups/pre-denmark-nightshade-a2dadf1/`，原286／276档和首次英文缺漏证据保留。

建议下一次实际验收分开授权范围：

1. 先用独立云端浏览器context，通过正常网页导入未编辑九人基线；正常核入口。不可通过改时间、重掷存档、改50%或添加完成标记来强制出现。
2. 如果入口可达，真实战斗；自然失败原样记失败，不降难度。胜利到选择时先记录实际选项；不假设当前宿主支持在选择中途导出可恢复存档，也不注入一个“分歧前档”。
3. 父端确定要验哪条后，再在分别隔离的context／localStorage中验对应路径；两条都验则各从同一真实基线正常推进，分别保存报告、游戏导出及设备档案，不拼接分支收益或合并称号。
4. 原九人基线保持不变；分支结果另命名。读取核验任务、物品、道德、队伍及profile称号，另列[当前HP／MP恢复边界](MAP_SAVE_VITALS.md)。若无法正常战胜或保存，报告具体阻塞，不改核心。

网页显式ImportSave按包与版本校验并从导出恢复profile；普通Continue的ImportStoredSave保留设备profile（`BrowserBridge.cs`、`BrowserBridge.Profile.cs`）。当前包装版本2、game版本24、packId `jyx`，无需迁移。英文候选不进入命令／ID／存档；本批未改任何保存结构。

## 本批验证与未验

只读核对原始故事／地图／战斗／命令实现，完成五份备份的SHA比较；再次确认原始标记只有先前的 `mainStory_黑暗的阴影`，没有其回访会面、没有新世界阶段，取药前缀为空。未运行浏览器，未重做救援或任何发奖。

本批只改文档，运行内容与最近通过类型／前端构建、14项最终英文保存复核的a2dadf1完全相同，因此不重复构建或声称新增类型检查通过。本次取药入口、实战、两条选择、设备称号分离、后续战斗及整丹麦全部 **NOT_RUN**。文案候选也尚未实玩。没有.NET构建、新素材、合并或部署。
