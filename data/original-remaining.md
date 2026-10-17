# 原版剩余工作清单

<!-- Generated from src/restoration-tasks.json and the current rule audit by npm run content. -->

具体待办与当前规则配置审计；条目不是等权工作量，不能由名称数量换算完成百分比。未找到旧C#同名引用不代表原版未使用。

整体仍约70%（主观工程估算），完整路线验收后置。

- [ ] **rules-talents · 补齐尚未接入效果的天赋**（待实现，战斗规则）
  逐项核对伤害、阵法、吸血、控制和特殊角色联动；下方列出实时名称。未找到旧C#同名引用的项目单列，继续查XML、Lua及版本差异，不推测效果。
- [ ] **rules-combinations · 完成已有天赋的全部组合与结算顺序**（部分实现，战斗规则）
  八类门派伤害、六项武学属性、控制效果、连击、暴击覆盖、濒死和复活等仍需核对顺序、免疫及随机调用。配置存在不等于原版行为全部等价。
- [ ] **rules-buffs · 补齐特殊Buff行为**（待实现，战斗规则）
  易容伏击、沾衣十八跌、溜须拍马、魔神降临、左右互搏拼写差异等；坚守与狂战的实际来源仍待确认。
- [ ] **rules-legends · 逐条核对137条奥义**（部分实现，武学与成长）
  现有定义已载入，仍需对照原触发条件、概率、武功/内功/装备要求、数值、范围及派生招式。
- [ ] **rules-special · 完善27个特技的共有战斗管线**（部分实现，武学与成长）
  11项仍有明确差异；直接伤害与普通命中/反应、自伤代价、多目标天地同寿、易容和追加攻击时点不能只以能施法作为完成依据。
- [ ] **rules-growth · 核对内功、秘籍与装备的全部加成顺序**（部分实现，武学与成长）
  专属内功、吸血反制、等级/主运加成、武学奇才的属性翻倍、秘籍及使用经验需要完整组合对照。
- [ ] **ai-evaluation · 让自动战斗正确评价复杂效果**（部分实现，战斗规则）
  全场治疗、控制、濒死保护、自伤、门派最终伤害倍率等仍需进入目标和行动评价；手动与自动继续使用同一套规则。
- [ ] **world-supplement · 接入上传版鹿鼎记补充剧情**（资料已收录/未接线，剧情与伙伴）
  78段已归档：39段与基线同名，39个补充ID；需先处理双儿人物缺件、入口和版本冲突，不能直接覆盖当前同名剧情。
- [ ] **world-companions · 完善伙伴的所有招募和离队分支**（部分实现/待验收，剧情与伙伴）
  图鉴65个剧情形态及43个周目开局候选不等于普通剧情已全部验收；正邪、时间、转形态、随行转参战、离队重入等需逐链核对。10名只是过去连续流程已验证数。
- [ ] **world-missing · 寻找双儿及两类木人的真实定义**（缺原定义，剧情与伙伴）
  双儿、经验木头人、练功木头人在四份参考及上传包中均未找到正式定义；人物数值、武学、奖励不能自行编造。
- [ ] **world-invalid · 核对黑龙潭周伯通的非法事件类型**（原资料异常，剧情与伙伴）
  原地图把条件名not_has_time_key放进动作类型；没有可靠对应版本前保留隔离记录，不猜改为剧情动作。
- [ ] **items-quests · 核对剧情道具、特殊装备和掉率**（部分实现/待验收，道具与装备）
  物品、装备、药品、秘籍及商店已可用；特殊物品边界、全部词条联动、残章、掉率和各周目奖励仍需逐项校准。
- [ ] **save-noregrets · 补无悔模式实时存档**（待实现，系统与存档）
  需要完整持久化战斗与交互边界，保证战败和退出不能回退；目前常规浏览器存读档可用，不等于无悔模式完成。
- [ ] **save-longrun · 验证档案、继承和特殊玩法多轮运行**（部分实现/待验收，系统与存档）
  竞技场、天关、试炼、珍珑、洗练、小游戏已有入口；仍需长期存档、跨周目继承、多轮发奖不重复及旧档迁移回归。
- [ ] **visual-audio · 补原版音乐和战斗音效**（待实现，音画与发布）
  不能以已导入地图/头像替代音频完成；还需资源映射、浏览器播放解锁、音量控制及场景切换。
- [ ] **visual-skills · 补完整招式特效和动作时序**（部分实现，音画与发布）
  角色基本动作与柔光已有；完整武功特效、受击/死亡/连击时序、缺失模型与触屏战场表现仍需补齐。
- [ ] **delivery-loading · 优化加载体积、失败恢复与性能**（部分实现，音画与发布）
  当前使用.NET Debug WebAssembly包；需改善首次加载、异常网络恢复、内存和帧率，以及长期浏览器兼容。
- [ ] **verify-final · 正常成长完成最终战、华山、结局和下一周目**（待验收（后置），最终验收）
  现有正常26级队伍完成四场救援但最终战败；高属性或隔离流程只证明接口，不能算通关。按先补资料的要求暂不新增通关测试。
- [ ] **verify-branches · 扩大九派中后期、隐藏时限和正邪路线验收**（待验收（后置），最终验收）
  1885/1887段剧情结构闭合不代表逐条可玩；资料与规则补齐后再执行连续路线检查并记录失败分支。

## 有旧C#同名引用、效果仍待接入的天赋（29项）

- **五行阵**：腾挪移遁的高明阵法，当周围有队友受伤时，发动阵法分担其所受伤害。
  待办：已有资料和旧C#同名引用，实际效果尚未接入现代内核。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:858
- **光明圣火阵**：明教顶级阵法，置于阵法之中，几乎不受任何负面效果影响。
  待办：已有资料和旧C#同名引用，实际效果尚未接入现代内核。
  来源：jyx-legacy-dll/JyGame/BattleField.cs:960
- **八卦阵**：腾挪移遁的高明阵法，当自己收到伤害时，将80%的伤害转移给范围内一名随机队友。
  待办：已有资料和旧C#同名引用，实际效果尚未接入现代内核。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:871
- **墨家传人**：战国墨家的世代传人，使用墨家古武术附加随机不良状态。
  待办：已有资料和旧C#同名引用，实际效果尚未接入现代内核。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:1093
- **屌丝**：带上这个草帽就成为屌丝了，据说能增加屌丝逆袭的概率。
  待办：已有资料和旧C#同名引用，实际效果尚未接入现代内核。
  来源：jyx-legacy-dll/JyGame/AoyiLogic.cs:19
- **慕容世家**：斗转星移反弹几率大幅提升。
  待办：已有资料和旧C#同名引用，实际效果尚未接入现代内核。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:723
- **我是疯子**：逆运自身内功，所有造成的不良状态随机增加0-2的不良状态程度和持续时间。
  待办：已有资料和旧C#同名引用，实际效果尚未接入现代内核。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:1171
- **攀云乘龙**：一定概率造成基于身法值的真实伤害，身法值越高，伤害越高。
  待办：已有资料和旧C#同名引用，实际效果尚未接入现代内核。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:2162
- **斗转星移**：武学奇才慕容龙城所领悟的借力打力的神奇招式，一定概率反弹一定伤害。
  待办：已有资料和旧C#同名引用，实际效果尚未接入现代内核。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:727、jyx-legacy-dll/JyGame/AttackLogic.cs:730
- **无形剑气**：使用六脉神剑攻击时，附加基于敌我当前内力值差的真实伤害。
  待办：已有资料和旧C#同名引用，实际效果尚未接入现代内核。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:567
- **木婉清的眷恋**：木婉清出场的情况下，提升段誉所有武学的威力。
  待办：已有资料和旧C#同名引用，实际效果尚未接入现代内核。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:530
- **死生茫茫**：一定几率吸收气血上限转化为自己的气血。
  待办：已有资料和旧C#同名引用，实际效果尚未接入现代内核。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:802
- **段王爷的电眼**：风流潇洒中年大叔镇南王段正淳的无敌电眼，对女性及太监极有杀伤力。
  待办：已有资料和旧C#同名引用，实际效果尚未接入现代内核。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:550、jyx-legacy-dll/JyGame/AttackLogic.cs:644
- **沾衣十八跌**：高深玄妙的内家技巧，受到攻击时一定概率让攻击者晕眩。
  待办：已有资料和旧C#同名引用，实际效果尚未接入现代内核。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:626、jyx-legacy-dll/JyGame/RollRoleUI.cs:598、jyx-legacy-dll/JyGame/RollRoleUI.cs:632
- **狗杂种**：石破天专属天赋，装备内功为罗汉伏魔神功或太玄神功时大幅度提高暴击概率及防御力。
  待办：已有资料和旧C#同名引用，实际效果尚未接入现代内核。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:1914、jyx-legacy-dll/JyGame/AttackLogic.cs:1919
- **玄门罡气**：装备内功为九阴真经时，攻击造成减少对手集气效果。
  待办：已有资料和旧C#同名引用，实际效果尚未接入现代内核。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:1043
- **百变千幻**：每回合有一定概率自动易容，可以藏于暗处伏击对手。
  待办：已有资料和旧C#同名引用，实际效果尚未接入现代内核。
  来源：jyx-legacy-dll/JyGame/BattleField.cs:930
- **真武七截阵**：武当派镇派绝技，威力可敌六十四位当世高手！(50%几率为队友挡刀，一定几率增强攻击杀伤力)
  待办：已有资料和旧C#同名引用，实际效果尚未接入现代内核。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:398、jyx-legacy-dll/JyGame/AttackLogic.cs:402、jyx-legacy-dll/JyGame/AttackLogic.cs:409、jyx-legacy-dll/JyGame/AttackLogic.cs:836、jyx-legacy-dll/JyGame/AttackLogic.cs:840、jyx-legacy-dll/JyGame/AttackLogic.cs:843
- **破甲**：攻击有一定概率忽视对方一定数额护甲。
  待办：已有资料和旧C#同名引用，实际效果尚未接入现代内核。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:1808
- **碎裂的怒吼**：惊天怒吼，施放奥义时一定概率造成周围敌人晕眩。
  待办：已有资料和旧C#同名引用，实际效果尚未接入现代内核。
  来源：jyx-legacy-dll/JyGame/BattleField.cs:1422、jyx-legacy-dll/JyGame/RollRoleUI.cs:597
- **臭蛤蟆**：只有被称为臭蛤蟆的人才对蛤蟆功精要具有绝对的掌握。
  待办：已有资料和旧C#同名引用，实际效果尚未接入现代内核。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:1602、jyx-legacy-dll/JyGame/AttackLogic.cs:1607
- **赵敏的眷念**：蒙元郡主赵敏精通百家武学，提醒她的夫君敌之所长。（张无忌闪避+10%）
  待办：已有资料和旧C#同名引用，实际效果尚未接入现代内核。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:601
- **越女剑**：越女剑法奥义发动时，全场所有敌人集气减少。
  待办：已有资料和旧C#同名引用，实际效果尚未接入现代内核。
  来源：jyx-legacy-dll/JyGame/BattleField.cs:1446
- **追魂**：不将敌人打倒决不罢休，无道德可言。攻击造成伤害加深效果。
  待办：已有资料和旧C#同名引用，实际效果尚未接入现代内核。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:1685
- **长平公主的眷恋**：长平公主阿九魂牵梦绕的眷恋，提升袁承志所有武学的威力。
  待办：已有资料和旧C#同名引用，实际效果尚未接入现代内核。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:540
- **飞向天际**：神秘的绝学，攻击时一定概率吹飞对手。
  待办：已有资料和旧C#同名引用，实际效果尚未接入现代内核。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:31、jyx-legacy-dll/JyGame/RollRoleUI.cs:587
- **魔神降临**：每回合有一定概率变身为恐怖的魔神。
  待办：已有资料和旧C#同名引用，实际效果尚未接入现代内核。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:1123、jyx-legacy-dll/JyGame/AttackLogic.cs:2093、jyx-legacy-dll/JyGame/BattleField.cs:914、jyx-legacy-dll/JyGame/BattleField.cs:921
- **鹿鼎.一等鹿鼎公**：功勋盖世的韦小宝，被攻击时一定几率胡言乱语念晕敌人。
  待办：已有资料和旧C#同名引用，实际效果尚未接入现代内核。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:607
- **黑天死炎**：攻击一定几率自动触发“一刀两断”效果。
  待办：已有资料和旧C#同名引用，实际效果尚未接入现代内核。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:2145

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

## 已有部分效果、尚未全部等价的天赋（42项）

- **不老长春**：永葆青春的神奇功法，一定概率将受到的伤害转为气血。
  待办：选定概率与恢复已检查，原单精度舍入及取消恢复的先后仍待核对。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:778
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
- **吸星大法**：令江湖中人闻之色变的吸星大法，攻击时吸收一定内力，并造成封穴效果，使对方无法恢复内力。
  待办：吸内与封印已接入，重复封印替换和完整反应顺序仍待核对。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:1008
- **嗜血狂魔**：随着等级逐步提升，提高吸血效果。
  待办：等级吸血、单精度与过量伤害计入已接入；逐装备浮点累加及完整反应顺序仍待核对。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:948
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
- **拳掌增益**：拳掌威力增加5%。
  待办：最终属性倍率和逐次取整已接入；全部装备/武学加成与战斗Buff的前置层次、原随机顺序待核对。
  来源：jyx-legacy-dll/JyGame/AttributeFinalHelper.cs:20
- **拳掌封印**：攻击一定概率造成拳掌封印效果。
  待办：概率、Buff等级/时长与友军保护已接入；原命中、免疫、随机调用及连击/反应的完整顺序待核对。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:1738、jyx-legacy-dll/JyGame/AttackLogic.cs:1741、jyx-legacy-dll/JyGame/SkillBox.cs:191
- **易筋伐髓**：达摩菩提专属天赋，增加少林派武学威力。
  待办：武功匹配、最终伤害倍率和逐次取整已接入；原命中时点、随机调用与AI估值待补齐。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:469
- **武学奇才**：天生的武学奇才，经验值成长翻倍，来自技能、装备的兵器熟练度及角色属性加成翻倍。
  待办：装备/武学十维属性翻倍、使用武功与秘籍的经验路径及其组合待完整核对。
  来源：jyx-legacy-dll/JyGame/InternalSkillInstance.cs:317、jyx-legacy-dll/JyGame/Role.cs:661、jyx-legacy-dll/JyGame/SkillInstance.cs:275
- **浪子剑客**：令狐冲专属天赋，御剑技巧评估提高20%。
  待办：最终属性倍率和逐次取整已接入；全部装备/武学加成与战斗Buff的前置层次、原随机顺序待核对。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:1412、jyx-legacy-dll/JyGame/AttributeFinalHelper.cs:12
- **玲珑璇玑**：黄蓉专属天赋，增强黄蓉相关武学。
  待办：武功匹配、最终伤害倍率和逐次取整已接入；原命中时点、随机调用与AI估值待补齐。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:509
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
- **金刚**：随着等级逐步提升，提高防御效果。
  待办：单独防御×1.2再加10×等级已配置，与其他防御修正的完整顺序仍待核对。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:1505
- **金刚伏魔圈**：少林三大神僧的组成的强力阵法。组阵时不能移动，但互相给予强大的攻击加成。
  待办：日月神鞭距离10且不受致盲影响已接入；阵法叠伤、破阵移除及移动规则仍待补齐。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:414、jyx-legacy-dll/JyGame/AttackLogic.cs:419、jyx-legacy-dll/JyGame/AttackLogic.cs:429、jyx-legacy-dll/JyGame/AttackLogic.cs:440、jyx-legacy-dll/JyGame/AttackLogic.cs:443、jyx-legacy-dll/JyGame/BattleSprite.cs:228、jyx-legacy-dll/JyGame/SkillBox.cs:372
- **铁剑掌门**：对铁剑门武学有深刻的了解，提升相应武学威力。
  待办：武功匹配、最终伤害倍率和逐次取整已接入；原命中时点、随机调用与AI估值待补齐。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:489
- **铁拳无双**：拳头硬才有话语权！使用拳掌系武功攻击一定概率造成晕眩效果。
  待办：概率、Buff等级/时长与友军保护已接入；原命中、免疫、随机调用及连击/反应的完整顺序待核对。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:1676
- **阉人**：已经去“势”，内力消耗增大，使用葵花宝典、辟邪剑法必定暴击。
  待办：单天赋必暴击已接入，后续天赋对暴击率的覆盖顺序仍待核对。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:550、jyx-legacy-dll/JyGame/AttackLogic.cs:644、jyx-legacy-dll/JyGame/AttackLogic.cs:1633
- **阴阳**：随着等级逐步提升，攻击有一定概率附加麻痹效果。
  待办：概率、Buff等级/时长与友军保护已接入；原命中、免疫、随机调用及连击/反应的完整顺序待核对。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:1754
- **鬼魅**：像鬼魅一样身形飘忽不定，集气速度突破极限。且不受任何状态影响。
  待办：目前已接入行动速度，仍需核对原版全部状态免疫。
  来源：jyx-legacy-dll/JyGame/BattleSprite.cs:449
- **鲲跃北溟**：攻击有50%概率吸取对手内力。
  待办：整数公式已有边界检查，完整命中和受击反应顺序仍待核对。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:983

## 仅作为其他效果联动条件的天赋（4项）

- **万年长春**：提升不老长春功回血概率。
  待办：目前只作为其他效果的条件使用，原组合及完整行为仍需核对。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:774
- **吴侬软语**：在唱出吴侬软语时，可以使所有敌人陶醉而晕眩。
  待办：目前只作为其他效果的条件使用，原组合及完整行为仍需核对。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:214、jyx-legacy-dll/JyGame/AttackLogic.cs:226
- **我就是神**：每场战斗的第一次【无尽斗志】必定判定成功。
  待办：目前只作为其他效果的条件使用，原组合及完整行为仍需核对。
  来源：jyx-legacy-dll/JyGame/BattleField.cs:1600
- **草头百姓**：证明你是无门无派的草头小百姓，据说有着神秘的意义。（触发野球拳奥义，提高异世人触发血线比例）
  待办：目前只作为其他效果的条件使用，原组合及完整行为仍需核对。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:1447、jyx-legacy-dll/JyGame/AttackLogic.cs:1462

## 仅资料的Buff（7项）

- **坚守**：以减少攻击输出为代价，减少所受伤害。
  待办：继续查XML、Lua与其他版本的实际规则；未找到同名旧C#引用，暂不按描述猜写效果。
  来源：当前固定旧C#未找到同名字符串，继续查证XML/Lua及版本差异
- **左右互搏**：一定概率出两次攻击
  待办：已有资料和旧C#同名引用，实际效果尚未接入现代内核。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:1221
- **易容**：易容改面，藏于暗处。伺机发动致命伤害。
  待办：已有资料和旧C#同名引用，实际效果尚未接入现代内核。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:271、jyx-legacy-dll/JyGame/AttackLogic.cs:273、jyx-legacy-dll/JyGame/AttackLogic.cs:893、jyx-legacy-dll/JyGame/AttackLogic.cs:901、jyx-legacy-dll/JyGame/AttackLogic.cs:2138、jyx-legacy-dll/JyGame/BattleField.cs:936
- **沾衣十八跌**：气劲充满全身，攻击命中的敌人有一定概率被气劲反伤晕眩。
  待办：已有资料和旧C#同名引用，实际效果尚未接入现代内核。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:626、jyx-legacy-dll/JyGame/RollRoleUI.cs:598、jyx-legacy-dll/JyGame/RollRoleUI.cs:632
- **溜须拍马**：溜须拍马，跪地求饶，不受伤害。
  待办：已有资料和旧C#同名引用，实际效果尚未接入现代内核。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:23、jyx-legacy-dll/JyGame/AttackLogic.cs:27、jyx-legacy-dll/JyGame/AttackLogic.cs:1335、jyx-legacy-dll/JyGame/AttackLogic.cs:2131
- **狂战**：以受到更多伤害为代价，提升攻击力。
  待办：继续查XML、Lua与其他版本的实际规则；未找到同名旧C#引用，暂不按描述猜写效果。
  来源：当前固定旧C#未找到同名字符串，继续查证XML/Lua及版本差异
- **魔神降临**：犹如魔神附体，所有攻击必定暴击，暴击伤害提高25%。
  待办：已有资料和旧C#同名引用，实际效果尚未接入现代内核。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:1123、jyx-legacy-dll/JyGame/AttackLogic.cs:2093、jyx-legacy-dll/JyGame/BattleField.cs:914、jyx-legacy-dll/JyGame/BattleField.cs:921

## 部分实现的Buff（2项）

- **神速攻击**：一定概率出三次攻击
  待办：追加攻击已有配置，负伤害与原Buff结算时点待核对。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:370、jyx-legacy-dll/JyGame/AttackLogic.cs:372、jyx-legacy-dll/JyGame/AttackLogic.cs:1233
- **醉酒**：20%概率因为醉酒不能行动，80%概率怒气全满，同时攻击有一定几率出两次攻击
  待办：行动和连击已有配置，负伤害与原Buff结算后的追加攻击时点待核对。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:1228、jyx-legacy-dll/JyGame/BattleField.cs:881、jyx-legacy-dll/JyGame/BattleField.cs:887、jyx-legacy-dll/JyGame/BattleField.cs:1001

## 仍有明确差异的特技（11项）

- **一刀两断**：威力无匹的攻击，一定几率减对方一半气血。
  待办：特技可施放，直接伤害与原普通命中、受击和后续反应管线仍有差异。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:1317、jyx-legacy-dll/JyGame/AttackLogic.cs:2099
- **诗酒飘零**：进入醉酒模式，攻击变得不可理喻。
  待办：施加醉酒已有配置，醉酒连击与原Buff时点尚未完整等价。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:1348
- **同归剑法**：全真教绝技，对自己同时造成1000点真实伤害，对敌人造成更大伤害。
  待办：特技可施放，直接伤害与原普通命中、受击和后续反应管线仍有差异。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:68
- **天地同寿**：以死亡和减少10点生命上限为代价，予以与自身残余气血相关的极大伤害。
  待办：单次自伤、永久扣生命上限已接入，多目标依次执行与完整命中/反应管线仍待核对。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:59
- **襄儿的心愿**：襄儿的心愿，就是随时可以召唤大哥哥保护自己！对敌人造成随机真实伤害。攻击上限随襄儿等级提升。
  待办：特技可施放，直接伤害与原普通命中、受击和后续反应管线仍有差异。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:1361
- **火枪**：韦小宝掏出他的火枪向敌人射击，造成真实伤害（无视护甲）及重伤敌人。伤害取决于敌我“福缘”的差距。
  待办：特技可施放，直接伤害与原普通命中、受击和后续反应管线仍有差异。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:1367
- **易容术**：阿朱的易容绝技，可藏身于敌阵之中。暗中突袭，威力巨大。
  待办：目前可施加易容Buff，伏击、免疫及消耗行为尚未实现。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:267
- **过肩摔**：将对手摔到身后并定身、麻痹，造成基于敌我定力之差的真实伤害。
  待办：特技可施放，直接伤害与原普通命中、受击和后续反应管线仍有差异。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:291
- **神龙摆尾**：一脚将对手踢开并定身、麻痹，造成基于移动距离的真实伤害。
  待办：特技可施放，直接伤害与原普通命中、受击和后续反应管线仍有差异。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:304
- **武穆兵法**：武穆兵法排兵布阵，增强所有队友能力。
  待办：全队强化和追加攻击已有配置，负伤害及神速攻击的原时点仍待核对。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:328、jyx-legacy-dll/JyGame/AttackLogic.cs:1384
- **腐尸毒**：立即清算敌人的中毒，造成真实伤害。
  待办：特技可施放，直接伤害与原普通命中、受击和后续反应管线仍有差异。
  来源：jyx-legacy-dll/JyGame/AttackLogic.cs:85
