# 原版剩余工作清单

<!-- Generated from src/restoration-tasks.json and the current rule audit by npm run content. -->

具体待办与当前规则配置审计；条目不是等权工作量，不能由名称数量换算完成百分比。未找到旧C#同名引用不代表原版未使用。

整体仍约90%（主观工程估算），完整路线验收后置。

- [ ] **rules-talents · 补齐尚未接入效果的天赋**（仅5项查证/其余已接入，战斗规则）
  原有旧C#依据的剩余27项天赋/阵法已接入；147项有配置或部分效果、5项条件联动。仅伤口撕裂、御剑、情花奇毒、摧筋破骨、软猬宝甲仍缺可靠执行依据，不按描述猜写。
- [ ] **rules-combinations · 完成已有天赋的全部组合与结算顺序**（关键管线已补/全顺序待核，战斗规则）
  已补精明待结算MP、反弹HP/MP、反弹后的濒死保护与float恢复；8个伤害特技进入命中、阵法和反应。原分伤延迟死亡、表现随机序列、装备/Buff混合层次仍待核对。
- [ ] **rules-buffs · 补齐特殊Buff行为**（普通HP/MP已补/仍有缺依据，战斗规则）
  易容、溜须拍马普通HP/MP保护与特技早退分支按源码区分，魔神必暴击可用。沾衣十八跌Buff、左右互搏拼写、坚守与狂战仍待原执行依据。
- [ ] **rules-legends · 逐条核对137条奥义**（部分实现，武学与成长）
  137条顺序及223个条件已对照；原概率顺序、基础悟性、屌丝野球拳及名称词条已接入，越女剑与碎裂的怒吼有后续效果。太玄起手和万劫闪电貂未支持条件仍单列；全部威力/范围、逐装备累加与原覆盖格回调次数待核对。
- [ ] **rules-special · 完善27个特技的共有战斗管线**（8个伤害特技管线已接入/完整时序待核，武学与成长）
  8个伤害特技接共同命中、反弹、分伤和反应，状态在有效命中后应用；按原顶层/特技早退分支配置最终修正。特技自伤、多目标、负伤害及非伤害特技的全部时点仍待核对。
- [ ] **rules-growth · 核对内功、秘籍与装备的全部加成顺序**（部分实现，武学与成长）
  已补狗杂种、臭蛤蟆、玄门罡气的专属内功联动；专属内功/武学奇才/装备/Buff的完整前置加成次序、浮点累加仍待核对，吴钩霜雪的根名/派生名疑点继续保留。
- [ ] **ai-evaluation · 让自动战斗正确评价复杂效果**（复杂效果已评价/随机组合待扩大，战斗规则）
  治疗按实际缺血量、控制/净化按目标状态、全队强化按新旧Buff、资源与自伤按实际代价评价。安全数字预览和单次候选缓存不消耗游戏随机数；随机天赋、全体阵法与原AI差异仍需扩大。
- [ ] **world-supplement · 接入上传版鹿鼎记补充剧情**（原资料无入口/继续隔离，剧情与伙伴）
  78段保留无损资料：39同名、39补充；又核对上传maps仍没有补充ID入口。双儿定义及版本接线缺证据，不能为提高百分比猜造入口或覆盖基线。
- [ ] **world-companions · 完善伙伴的所有招募和离队分支**（图册与当前条件已补/全路线待验收，剧情与伙伴）
  65形态80条指令、155条路线和219条件共用剧情编译器；图鉴补32处地图前置及155幅可下载图。新增阿朱、郭襄、袁承志、韦小宝正常路线，累计14名；所有离队/转形态/隐藏时限仍待完整验收。
- [ ] **world-missing · 寻找双儿及两类木人的真实定义**（缺原定义，剧情与伙伴）
  双儿、经验木头人、练功木头人在四份参考及上传包中均未找到正式定义；人物数值、武学、奖励不能自行编造。
- [ ] **world-invalid · 核对黑龙潭周伯通的非法事件类型**（原资料异常，剧情与伙伴）
  原地图把条件名not_has_time_key放进动作类型；没有可靠对应版本前保留隔离记录，不猜改为剧情动作。
- [ ] **items-quests · 核对剧情道具、特殊装备和掉率**（部分实现/待验收，道具与装备）
  物品、装备、药品、秘籍及商店已可用；特殊物品边界、全部词条联动、残章、掉率和各周目奖励仍需逐项校准。
- [ ] **save-noregrets · 补无悔模式实时存档**（待实现，系统与存档）
  需要完整持久化战斗与交互边界，保证战败和退出不能回退；目前常规浏览器存读档可用，不等于无悔模式完成。
- [ ] **save-longrun · 验证档案、继承和特殊玩法多轮运行**（自动恢复已接入/长期周目待验收，系统与存档）
  独立档案继续按世界隔离；新增独立自动进度与手动存档，刷新恢复、关闭自动保存及写入失败保留旧档有浏览器检查。无悔战斗存档和长期跨周目、多轮奖励仍待完成。
- [ ] **visual-audio · 扩大原版音乐与音效验收**（已接入/待长测，音画与发布）
  183段原音频、166个资源ID已接入场景/战斗/出招；手势解锁、两类音量、后台暂停、按需加载已有浏览器验证。剩余长时间听感、全部演出回调与更多浏览器播放检查。
- [ ] **visual-skills · 补完整招式特效和动作时序**（102个ID已有现代演出/原粒子待复刻，音画与发布）
  原角色动作与真实命中格驱动102个原动画ID的配置化矢量演出；受击/败退、暂停、减少动态效果已有检查。原Unity粒子、全部时间线和缺失模型仍待完整复刻。
- [ ] **delivery-loading · 优化加载体积、失败恢复与性能**（Release已验证/体积与长期兼容待补，音画与发布）
  已切Release托管程序集并记录实际约48MB运行时文件（含预压缩副本）；保留反射，未声称AOT或裁剪。内容并行与网络重试可用，持续内存/帧率、下载体积及跨浏览器仍待优化。
- [ ] **verify-final · 正常成长完成最终战、华山、结局和下一周目**（最终战复查失败/完整通关仍后置，最终验收）
  正常26级队伍复查真实最终战仍失败，失败记录保留；新伙伴路线也保留真实胜败。华山、完整结局、下一周目正常通关仍缺，不能把隔离流程或导入量算通关。
- [ ] **verify-branches · 扩大九派中后期、隐藏时限和正邪路线验收**（待验收（后置），最终验收）
  1885/1887段剧情结构闭合不代表逐条可玩；资料与规则补齐后再执行连续路线检查并记录失败分支。

## 有旧C#同名引用、效果仍待接入的天赋（0项）


## 未找到旧C#同名引用、需继续查证的天赋（5项）

- **伤口撕裂**：无穷无尽地撕裂伤口，造成伤害会随着攻击次数不断累积增大。
  待办：继续查XML、Lua与其他版本的实际规则；未找到同名旧C#引用，暂不按描述猜写效果。
  来源：当前固定旧C#未找到同名字符串，继续查证XML/Lua及版本差异
- **御剑**：随着等级逐步提升，提高暴击的概率和暴击伤害。
  待办：继续查XML、Lua与其他版本的实际规则；未找到同名旧C#引用，暂不按描述猜写效果。
  来源：当前固定旧C#未找到同名字符串，继续查证XML/Lua及版本差异
- **情花奇毒**：攻击一定概率附加恐怖的情花奇毒。
  待办：继续查XML、Lua与其他版本的实际规则；未找到同名旧C#引用，暂不按描述猜写效果。
  来源：当前固定旧C#未找到同名字符串，继续查证XML/Lua及版本差异
- **摧筋破骨**：力大无穷的猛击直至筋骨深处，直接对气血上限造成打击。
  待办：继续查XML、Lua与其他版本的实际规则；未找到同名旧C#引用，暂不按描述猜写效果。
  来源：当前固定旧C#未找到同名字符串，继续查证XML/Lua及版本差异
- **软猬宝甲**：软猬甲护身，直接对周遭敌人造成伤害。
  待办：继续查XML、Lua与其他版本的实际规则；未找到同名旧C#引用，暂不按描述猜写效果。
  来源：当前固定旧C#未找到同名字符串，继续查证XML/Lua及版本差异

## 已有部分效果、尚未全部等价的天赋（71项）

- **不老长春**：永葆青春的神奇功法，一定概率将受到的伤害转为气血。
  待办：单精度恢复、待结算MP取消和伤害特技转换已检查；完整命中与目标遍历顺序仍待核对。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:778
- **五行阵**：腾挪移遁的高明阵法，当周围有队友受伤时，发动阵法分担其所受伤害。
  待办：按重定向后的目标找半径5内异角色支援，所有参与者与目标均等分取整，不把余数留给目标；完整旧死亡移除时点仍待核对。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:858
- **光明圣火阵**：明教顶级阵法，置于阵法之中，几乎不受任何负面效果影响。
  待办：原数值和条件已配置；原表现随机调用、友伤/特技、混合修正及正常获得后的组合路线仍待核对。
  来源：jyx-legacy-dll/JyGame/BattleField.cs:960
- **八卦阵**：腾挪移遁的高明阵法，当自己收到伤害时，将80%的伤害转移给范围内一名随机队友。
  待办：50%发动、80%与20%分别截断、首候选两份权重及无反应转移已接入；与全部原技能的组合及死亡时点仍待核对。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:871
- **刀封印**：攻击一定概率造成刀封印效果。
  待办：概率、Buff等级/时长与友军保护已接入；原命中、免疫、随机调用及连击/反应的完整顺序待核对。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:1730、jyx-legacy-dll/JyGame/AttackLogic.cs:1733、jyx-legacy-dll/JyGame/SkillBox.cs:191
- **刀法增益**：刀法威力增加5%。
  待办：最终属性倍率和逐次取整已接入；全部装备/武学加成与战斗Buff的前置层次、原随机顺序待核对。
  来源：jyx-legacy-dll/JyGame/AttributeFinalHelper.cs:28
- **刚柔并济**：略微提高武当派所有武学威力。
  待办：武功匹配、最终伤害倍率和逐次取整已接入；原命中时点、随机调用与AI估值待补齐。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:459
- **剑封印**：攻击一定概率造成剑封印效果。
  待办：概率、Buff等级/时长与友军保护已接入；原命中、免疫、随机调用及连击/反应的完整顺序待核对。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:1722、jyx-legacy-dll/JyGame/AttackLogic.cs:1725、jyx-legacy-dll/JyGame/SkillBox.cs:191
- **剑法增益**：剑法威力增加5%。
  待办：最终属性倍率和逐次取整已接入；全部装备/武学加成与战斗Buff的前置层次、原随机顺序待核对。
  来源：jyx-legacy-dll/JyGame/AttributeFinalHelper.cs:24
- **化功大法**：攻击可以有概率化去对方大量内力。
  待办：整数公式已有边界检查，完整命中和受击反应顺序仍待核对。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:996
- **北冥神功**：攻击带有吸取大量内力效果。
  待办：吸内整数公式已有检查，完整命中和受击反应顺序仍待核对。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:970、jyx-legacy-dll/JyGame/AttackLogic.cs:1860、jyx-legacy-dll/JyGame/AttackLogic.cs:1865
- **吴钩霜雪**：太玄神功施展范围+3。
  待办：源码只匹配太玄神功，但当前可选招式为太玄神功.太玄真气，根内功不在选择列表。原条件已保留，尚无可玩触发依据，不能擅自给派生招式加3范围。
  来源：jyx-legacy-dll/JyGame/SkillBox.cs:368
- **吸星大法**：令江湖中人闻之色变的吸星大法，攻击时吸收一定内力，并造成封穴效果，使对方无法恢复内力。
  待办：吸内与封印已接入，重复封印替换和完整反应顺序仍待核对。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:1008
- **嗜血狂魔**：随着等级逐步提升，提高吸血效果。
  待办：等级吸血、单精度与过量伤害计入已接入；逐装备浮点累加及完整反应顺序仍待核对。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:948
- **墨家传人**：战国墨家的世代传人，使用墨家古武术附加随机不良状态。
  待办：原数值和条件已配置；原表现随机调用、友伤/特技、混合修正及正常获得后的组合路线仍待核对。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:1093
- **大理世家**：大理世族的象征，相关武学威力提升。
  待办：武功匹配、最终伤害倍率和逐次取整已接入；原命中时点、随机调用与AI估值待补齐。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:519
- **天龙.盖世英雄**：乔峰专属天赋，出手惊风雷，提升乔峰相关的武学威力。
  待办：武功匹配、最终伤害倍率和逐次取整已接入；原命中时点、随机调用与AI估值待补齐。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:479
- **奇门增益**：奇门威力增加5%。
  待办：最终属性倍率和逐次取整已接入；全部装备/武学加成与战斗Buff的前置层次、原随机顺序待核对。
  来源：jyx-legacy-dll/JyGame/AttributeFinalHelper.cs:32
- **奇门封印**：攻击一定概率造成奇门封印效果。
  待办：概率、Buff等级/时长与友军保护已接入；原命中、免疫、随机调用及连击/反应的完整顺序待核对。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:1746、jyx-legacy-dll/JyGame/AttackLogic.cs:1749、jyx-legacy-dll/JyGame/SkillBox.cs:191
- **寒冰真气**：攻击有一定概率附加重度麻痹效果。
  待办：概率、Buff等级/时长与友军保护已接入；原命中、免疫、随机调用及连击/反应的完整顺序待核对。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:1762
- **射雕英雄**：郭靖专属天赋，提升郭靖相关武学威力。
  待办：武功匹配、最终伤害倍率和逐次取整已接入；原命中时点、随机调用与AI估值待补齐。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:499
- **屌丝**：带上这个草帽就成为屌丝了，据说能增加屌丝逆袭的概率。
  待办：野球拳触发奥义的倍率增加0.1已接入；完整装备/武学概率词条顺序及正常取得后的组合路线仍待核对。
  来源：jyx-legacy-dll/JyGame/AoyiLogic.cs:19
- **峨眉宗师**：郭襄专属天赋，大幅度提高与峨眉派及郭襄相关武学威力。
  待办：武功匹配、最终伤害倍率和逐次取整已接入；原命中时点、随机调用与AI估值待补齐。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:449
- **左右互搏**：周伯通原汁原味的左右互搏之术，每回合攻击较高几率造成两次伤害。
  待办：天赋连击已接入；原Buff写作左右互博，现数据写作左右互搏，不能未经证据合并。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:1221
- **幽居**：随着等级逐步提升，提高多重攻击的概率。
  待办：追加攻击已接入，负伤害、特技命中与原Buff结算时点仍有差异。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:1211
- **御风**：随着等级逐步提升，降低受到暴击的概率。
  待办：已按原等级整数除以30降低暴击率，其余暴击覆盖与随机顺序仍待核对。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:1849
- **我是疯子**：逆运自身内功，所有造成的不良状态随机增加0-2的不良状态程度和持续时间。
  待办：原数值和条件已配置；原表现随机调用、友伤/特技、混合修正及正常获得后的组合路线仍待核对。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:1171
- **拳掌增益**：拳掌威力增加5%。
  待办：最终属性倍率和逐次取整已接入；全部装备/武学加成与战斗Buff的前置层次、原随机顺序待核对。
  来源：jyx-legacy-dll/JyGame/AttributeFinalHelper.cs:20
- **拳掌封印**：攻击一定概率造成拳掌封印效果。
  待办：概率、Buff等级/时长与友军保护已接入；原命中、免疫、随机调用及连击/反应的完整顺序待核对。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:1738、jyx-legacy-dll/JyGame/AttackLogic.cs:1741、jyx-legacy-dll/JyGame/SkillBox.cs:191
- **攀云乘龙**：一定概率造成基于身法值的真实伤害，身法值越高，伤害越高。
  待办：原数值和条件已配置；原表现随机调用、友伤/特技、混合修正及正常获得后的组合路线仍待核对。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:2162
- **斗转星移**：武学奇才慕容龙城所领悟的借力打力的神奇招式，一定概率反弹一定伤害。
  待办：原数值和条件已配置；原表现随机调用、友伤/特技、混合修正及正常获得后的组合路线仍待核对。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:727、jyx-legacy-dll/JyGame/AttackLogic.cs:730
- **无形剑气**：使用六脉神剑攻击时，附加基于敌我当前内力值差的真实伤害。
  待办：原数值和条件已配置；原表现随机调用、友伤/特技、混合修正及正常获得后的组合路线仍待核对。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:567
- **易筋伐髓**：达摩菩提专属天赋，增加少林派武学威力。
  待办：武功匹配、最终伤害倍率和逐次取整已接入；原命中时点、随机调用与AI估值待补齐。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:469
- **木婉清的眷恋**：木婉清出场的情况下，提升段誉所有武学的威力。
  待办：原数值和条件已配置；原表现随机调用、友伤/特技、混合修正及正常获得后的组合路线仍待核对。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:530
- **武学奇才**：天生的武学奇才，经验值成长翻倍，来自技能、装备的兵器熟练度及角色属性加成翻倍。
  待办：装备/武学十维属性翻倍、使用武功与秘籍的经验路径及其组合待完整核对。
  来源：jyx-legacy-dll/JyGame/InternalSkillInstance.cs:317、jyx-legacy-dll/JyGame/Role.cs:661、jyx-legacy-dll/JyGame/SkillInstance.cs:275
- **死生茫茫**：一定几率吸收气血上限转化为自己的气血。
  待办：原数值和条件已配置；原表现随机调用、友伤/特技、混合修正及正常获得后的组合路线仍待核对。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:802
- **段王爷的电眼**：风流潇洒中年大叔镇南王段正淳的无敌电眼，对女性及太监极有杀伤力。
  待办：原数值和条件已配置；原表现随机调用、友伤/特技、混合修正及正常获得后的组合路线仍待核对。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:550、jyx-legacy-dll/JyGame/AttackLogic.cs:644
- **沾衣十八跌**：高深玄妙的内家技巧，受到攻击时一定概率让攻击者晕眩。
  待办：原数值和条件已配置；原表现随机调用、友伤/特技、混合修正及正常获得后的组合路线仍待核对。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:626、jyx-legacy-dll/JyGame/RollRoleUI.cs:598、jyx-legacy-dll/JyGame/RollRoleUI.cs:632
- **浪子剑客**：令狐冲专属天赋，御剑技巧评估提高20%。
  待办：最终属性倍率和逐次取整已接入；全部装备/武学加成与战斗Buff的前置层次、原随机顺序待核对。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:1412、jyx-legacy-dll/JyGame/AttributeFinalHelper.cs:12
- **狗杂种**：石破天专属天赋，装备内功为罗汉伏魔神功或太玄神功时大幅度提高暴击概率及防御力。
  待办：原数值和条件已配置；原表现随机调用、友伤/特技、混合修正及正常获得后的组合路线仍待核对。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:1914、jyx-legacy-dll/JyGame/AttackLogic.cs:1919
- **玄门罡气**：装备内功为九阴真经时，攻击造成减少对手集气效果。
  待办：原数值和条件已配置；原表现随机调用、友伤/特技、混合修正及正常获得后的组合路线仍待核对。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:1043
- **玲珑璇玑**：黄蓉专属天赋，增强黄蓉相关武学。
  待办：武功匹配、最终伤害倍率和逐次取整已接入；原命中时点、随机调用与AI估值待补齐。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:509
- **百变千幻**：每回合有一定概率自动易容，可以藏于暗处伏击对手。
  待办：原数值和条件已配置；原表现随机调用、友伤/特技、混合修正及正常获得后的组合路线仍待核对。
  来源：jyx-legacy-dll/JyGame/BattleField.cs:930
- **真武七截阵**：武当派镇派绝技，威力可敌六十四位当世高手！(50%几率为队友挡刀，一定几率增强攻击杀伤力)
  待办：逐支援者增伤截断、≤50%挡伤与单精度30%接伤已接入；旧单位移除/表现随机调用及与其他反应的全顺序仍待核对。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:398、jyx-legacy-dll/JyGame/AttackLogic.cs:402、jyx-legacy-dll/JyGame/AttackLogic.cs:409、jyx-legacy-dll/JyGame/AttackLogic.cs:836、jyx-legacy-dll/JyGame/AttackLogic.cs:840、jyx-legacy-dll/JyGame/AttackLogic.cs:843
- **破甲**：攻击有一定概率忽视对方一定数额护甲。
  待办：原数值和条件已配置；原表现随机调用、友伤/特技、混合修正及正常获得后的组合路线仍待核对。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:1808
- **碎裂的怒吼**：惊天怒吼，施放奥义时一定概率造成周围敌人晕眩。
  待办：原数值和条件已配置；原表现随机调用、友伤/特技、混合修正及正常获得后的组合路线仍待核对。
  来源：jyx-legacy-dll/JyGame/BattleField.cs:1422、jyx-legacy-dll/JyGame/RollRoleUI.cs:597
- **神拳无敌**：对拳法的掌握达到入微的境界，提升拳法类伤害，并提升铁拳无双发动概率。
  待办：最终属性倍率和逐次取整已接入；全部装备/武学加成与战斗Buff的前置层次、原随机顺序待核对。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:1416、jyx-legacy-dll/JyGame/AttackLogic.cs:1672、jyx-legacy-dll/JyGame/AttributeFinalHelper.cs:16
- **精打细算**：心思缜密，回避致命伤害。提升暴击概率，一定概率将受到的伤害强制降为200点。
  待办：防守伤害上限已接入，攻击方随机倍率尚未补齐。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:1649、jyx-legacy-dll/JyGame/AttackLogic.cs:2114
- **精明**：心思缜密，回避致命伤害。提升暴击概率，一定概率将受到的伤害强制降为500点，多余伤害转化为内力伤害。
  待办：防守伤害上限已接入，攻击方随机倍率尚未补齐。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:1656、jyx-legacy-dll/JyGame/AttackLogic.cs:2122
- **素心神剑**：小龙女由于机缘巧合所领悟的左右互搏之术，每回合攻击一定几率造成两次伤害。
  待办：追加攻击已接入，负伤害、特技命中与原Buff结算时点仍有差异。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:1216
- **臭蛤蟆**：只有被称为臭蛤蟆的人才对蛤蟆功精要具有绝对的掌握。
  待办：原数值和条件已配置；原表现随机调用、友伤/特技、混合修正及正常获得后的组合路线仍待核对。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:1602、jyx-legacy-dll/JyGame/AttackLogic.cs:1607
- **至空至明**：被攻击时有一定概率冷却所有技能。
  待办：15%概率清空冷却已接入，原命中、受击反应与表现随机顺序仍待核对。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:561
- **血海魔功**：使用血刀大法增加20%吸血能力。
  待办：血刀单精度吸血、过量伤害计入和重伤减半已接入；逐装备浮点累加及完整反应顺序仍待核对。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:937
- **血魔刀法**：使用血刀大法增加15%吸血能力。
  待办：血刀单精度吸血、过量伤害计入和重伤减半已接入；逐装备浮点累加及完整反应顺序仍待核对。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:942
- **诸般封印**：精通奇经八脉，攻击一定概率造成诸般封印效果。
  待办：概率、Buff等级/时长与友军保护已接入；原命中、免疫、随机调用及连击/反应的完整顺序待核对。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:1714、jyx-legacy-dll/JyGame/AttackLogic.cs:1717、jyx-legacy-dll/JyGame/SkillBox.cs:191
- **赵敏的眷念**：蒙元郡主赵敏精通百家武学，提醒她的夫君敌之所长。（张无忌闪避+10%）
  待办：原数值和条件已配置；原表现随机调用、友伤/特技、混合修正及正常获得后的组合路线仍待核对。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:601
- **越女剑**：越女剑法奥义发动时，全场所有敌人集气减少。
  待办：原数值和条件已配置；原表现随机调用、友伤/特技、混合修正及正常获得后的组合路线仍待核对。
  来源：jyx-legacy-dll/JyGame/BattleField.cs:1446
- **追魂**：不将敌人打倒决不罢休，无道德可言。攻击造成伤害加深效果。
  待办：原数值和条件已配置；原表现随机调用、友伤/特技、混合修正及正常获得后的组合路线仍待核对。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:1685
- **金刚**：随着等级逐步提升，提高防御效果。
  待办：单独防御×1.2再加10×等级已配置，与其他防御修正的完整顺序仍待核对。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:1505
- **金刚伏魔圈**：少林三大神僧的组成的强力阵法。组阵时不能移动，但互相给予强大的攻击加成。
  待办：距离10、禁止移动、三人增伤及不足三人破阵已接入；原死亡移除时点、装备授予与完整组合仍待核对。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:414、jyx-legacy-dll/JyGame/AttackLogic.cs:419、jyx-legacy-dll/JyGame/AttackLogic.cs:429、jyx-legacy-dll/JyGame/AttackLogic.cs:440、jyx-legacy-dll/JyGame/AttackLogic.cs:443、jyx-legacy-dll/JyGame/BattleSprite.cs:228、jyx-legacy-dll/JyGame/SkillBox.cs:372
- **铁剑掌门**：对铁剑门武学有深刻的了解，提升相应武学威力。
  待办：武功匹配、最终伤害倍率和逐次取整已接入；原命中时点、随机调用与AI估值待补齐。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:489
- **铁拳无双**：拳头硬才有话语权！使用拳掌系武功攻击一定概率造成晕眩效果。
  待办：概率、Buff等级/时长与友军保护已接入；原命中、免疫、随机调用及连击/反应的完整顺序待核对。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:1676
- **长平公主的眷恋**：长平公主阿九魂牵梦绕的眷恋，提升袁承志所有武学的威力。
  待办：原数值和条件已配置；原表现随机调用、友伤/特技、混合修正及正常获得后的组合路线仍待核对。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:540
- **阉人**：已经去“势”，内力消耗增大，使用葵花宝典、辟邪剑法必定暴击。
  待办：单天赋必暴击已接入，后续天赋对暴击率的覆盖顺序仍待核对。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:550、jyx-legacy-dll/JyGame/AttackLogic.cs:644、jyx-legacy-dll/JyGame/AttackLogic.cs:1633
- **阴阳**：随着等级逐步提升，攻击有一定概率附加麻痹效果。
  待办：概率、Buff等级/时长与友军保护已接入；原命中、免疫、随机调用及连击/反应的完整顺序待核对。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:1754
- **飞向天际**：神秘的绝学，攻击时一定概率吹飞对手。
  待办：原数值和条件已配置；原表现随机调用、友伤/特技、混合修正及正常获得后的组合路线仍待核对。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:31、jyx-legacy-dll/JyGame/RollRoleUI.cs:587
- **鬼魅**：像鬼魅一样身形飘忽不定，集气速度突破极限。且不受任何状态影响。
  待办：目前已接入行动速度，仍需核对原版全部状态免疫。
  来源：jyx-legacy-dll/JyGame/BattleSprite.cs:449
- **魔神降临**：每回合有一定概率变身为恐怖的魔神。
  待办：行动准备12%附加3回合状态，状态必暴击且暴击倍率加0.25已接入；原特技覆盖和全部暴击优先级仍待核对。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:1123、jyx-legacy-dll/JyGame/AttackLogic.cs:2093、jyx-legacy-dll/JyGame/BattleField.cs:914、jyx-legacy-dll/JyGame/BattleField.cs:921
- **鲲跃北溟**：攻击有50%概率吸取对手内力。
  待办：整数公式已有边界检查，完整命中和受击反应顺序仍待核对。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:983
- **鹿鼎.一等鹿鼎公**：功勋盖世的韦小宝，被攻击时一定几率胡言乱语念晕敌人。
  待办：原数值和条件已配置；原表现随机调用、友伤/特技、混合修正及正常获得后的组合路线仍待核对。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:607
- **黑天死炎**：攻击一定几率自动触发“一刀两断”效果。
  待办：原数值和条件已配置；原表现随机调用、友伤/特技、混合修正及正常获得后的组合路线仍待核对。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:2145

## 仅作为其他效果联动条件的天赋（5项）

- **万年长春**：提升不老长春功回血概率。
  待办：目前只作为其他效果的条件使用，原组合及完整行为仍需核对。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:774
- **吴侬软语**：在唱出吴侬软语时，可以使所有敌人陶醉而晕眩。
  待办：目前只作为其他效果的条件使用，原组合及完整行为仍需核对。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:214、jyx-legacy-dll/JyGame/AttackLogic.cs:226
- **慕容世家**：斗转星移反弹几率大幅提升。
  待办：目前只作为其他效果的条件使用，原组合及完整行为仍需核对。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:723
- **我就是神**：每场战斗的第一次【无尽斗志】必定判定成功。
  待办：目前只作为其他效果的条件使用，原组合及完整行为仍需核对。
  来源：jyx-legacy-dll/JyGame/BattleField.cs:1600
- **草头百姓**：证明你是无门无派的草头小百姓，据说有着神秘的意义。（触发野球拳奥义，提高异世人触发血线比例）
  待办：目前只作为其他效果的条件使用，原组合及完整行为仍需核对。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:1447、jyx-legacy-dll/JyGame/AttackLogic.cs:1462

## 仅资料的Buff（4项）

- **坚守**：以减少攻击输出为代价，减少所受伤害。
  待办：继续查XML、Lua与其他版本的实际规则；未找到同名旧C#引用，暂不按描述猜写效果。
  来源：当前固定旧C#未找到同名字符串，继续查证XML/Lua及版本差异
- **左右互搏**：一定概率出两次攻击
  待办：已有资料和旧C#同名引用，实际效果尚未接入现代内核。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:1221
- **沾衣十八跌**：气劲充满全身，攻击命中的敌人有一定概率被气劲反伤晕眩。
  待办：已有资料和旧C#同名引用，实际效果尚未接入现代内核。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:626、jyx-legacy-dll/JyGame/RollRoleUI.cs:598、jyx-legacy-dll/JyGame/RollRoleUI.cs:632
- **狂战**：以受到更多伤害为代价，提升攻击力。
  待办：继续查XML、Lua与其他版本的实际规则；未找到同名旧C#引用，暂不按描述猜写效果。
  来源：当前固定旧C#未找到同名字符串，继续查证XML/Lua及版本差异

## 部分实现的Buff（5项）

- **易容**：易容改面，藏于暗处。伺机发动致命伤害。
  待办：普通HP/MP保护已接入，8个伤害特技按原早退分支绕过该普通保护；伏击与全部原顺序仍有差异。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:271、jyx-legacy-dll/JyGame/AttackLogic.cs:273、jyx-legacy-dll/JyGame/AttackLogic.cs:893、jyx-legacy-dll/JyGame/AttackLogic.cs:901、jyx-legacy-dll/JyGame/AttackLogic.cs:2138、jyx-legacy-dll/JyGame/BattleField.cs:936
- **溜须拍马**：溜须拍马，跪地求饶，不受伤害。
  待办：普通来袭HP/MP保护与攻击后取消已有配置；原伤害特技不套普通公式保护，完整命中/反应时点仍待核对。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:23、jyx-legacy-dll/JyGame/AttackLogic.cs:27、jyx-legacy-dll/JyGame/AttackLogic.cs:1335、jyx-legacy-dll/JyGame/AttackLogic.cs:2131
- **神速攻击**：一定概率出三次攻击
  待办：追加攻击已有配置，负伤害与原Buff结算时点待核对。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:370、jyx-legacy-dll/JyGame/AttackLogic.cs:372、jyx-legacy-dll/JyGame/AttackLogic.cs:1233
- **醉酒**：20%概率因为醉酒不能行动，80%概率怒气全满，同时攻击有一定几率出两次攻击
  待办：行动和连击已有配置，负伤害与原Buff结算后的追加攻击时点待核对。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:1228、jyx-legacy-dll/JyGame/BattleField.cs:881、jyx-legacy-dll/JyGame/BattleField.cs:887、jyx-legacy-dll/JyGame/BattleField.cs:1001
- **魔神降临**：犹如魔神附体，所有攻击必定暴击，暴击伤害提高25%。
  待办：行动准备12%附加3回合状态，状态必暴击且暴击倍率加0.25已接入；原特技覆盖和全部暴击优先级仍待核对。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:1123、jyx-legacy-dll/JyGame/AttackLogic.cs:2093、jyx-legacy-dll/JyGame/BattleField.cs:914、jyx-legacy-dll/JyGame/BattleField.cs:921

## 仍有明确差异的特技（11项）

- **一刀两断**：威力无匹的攻击，一定几率减对方一半气血。
  待办：伤害特技已接命中、反弹、阵法和反应，按原分支配置最终修正；自伤、多目标与负伤害的完整先后仍待核对。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:1317、jyx-legacy-dll/JyGame/AttackLogic.cs:2099
- **诗酒飘零**：进入醉酒模式，攻击变得不可理喻。
  待办：施加醉酒已有配置，醉酒连击与原Buff时点尚未完整等价。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:1348
- **同归剑法**：全真教绝技，对自己同时造成1000点真实伤害，对敌人造成更大伤害。
  待办：伤害特技已接命中、反弹、阵法和反应，按原分支配置最终修正；自伤、多目标与负伤害的完整先后仍待核对。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:68
- **天地同寿**：以死亡和减少10点生命上限为代价，予以与自身残余气血相关的极大伤害。
  待办：命中、反弹、分伤与反应已接；单次自伤、永久扣生命上限可用，多目标依次自伤与死亡时点仍待核对。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:59
- **襄儿的心愿**：襄儿的心愿，就是随时可以召唤大哥哥保护自己！对敌人造成随机真实伤害。攻击上限随襄儿等级提升。
  待办：伤害特技已接命中、反弹、阵法和反应，按原分支配置最终修正；自伤、多目标与负伤害的完整先后仍待核对。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:1361
- **火枪**：韦小宝掏出他的火枪向敌人射击，造成真实伤害（无视护甲）及重伤敌人。伤害取决于敌我“福缘”的差距。
  待办：伤害特技已接命中、反弹、阵法和反应，按原分支配置最终修正；自伤、多目标与负伤害的完整先后仍待核对。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:1367
- **易容术**：阿朱的易容绝技，可藏身于敌阵之中。暗中突袭，威力巨大。
  待办：普通来袭HP/MP保护、伏击与消耗已有配置；按原源码区别伤害特技早退分支，完整未命中/多目标次序仍待核对。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:267
- **过肩摔**：将对手摔到身后并定身、麻痹，造成基于敌我定力之差的真实伤害。
  待办：伤害特技已接命中、反弹、阵法和反应，按原分支配置最终修正；自伤、多目标与负伤害的完整先后仍待核对。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:291
- **神龙摆尾**：一脚将对手踢开并定身、麻痹，造成基于移动距离的真实伤害。
  待办：伤害特技已接命中、反弹、阵法和反应，按原分支配置最终修正；自伤、多目标与负伤害的完整先后仍待核对。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:304
- **武穆兵法**：武穆兵法排兵布阵，增强所有队友能力。
  待办：全队强化和追加攻击已有配置，负伤害及神速攻击的原时点仍待核对。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:328、jyx-legacy-dll/JyGame/AttackLogic.cs:1384
- **腐尸毒**：立即清算敌人的中毒，造成真实伤害。
  待办：伤害特技已接命中、反弹、阵法和反应，按原分支配置最终修正；自伤、多目标与负伤害的完整先后仍待核对。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:85
