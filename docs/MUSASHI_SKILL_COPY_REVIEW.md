# 武藏高级战技：实际页面与英文说明缺口

基线 `df46acdaafa848020e052c7a545c8a66e0334211`，同一工作区、唯一源码 writer、`feat/storybound-italian-battle`。本批核查现有非战斗页面，没有改产品代码、显示词典、文案或核心，也没有合并／部署。

**六个高级招式的英文名称实际可见，但当前非战斗页面没有查看它们说明的控件。** 中文说明存在于只读宿主数据中，尚不能按本批要求实际打开验证。依照“高级技能实际不可查看则报告缺口”的限定，不新增界面、不把状态字段冒充可见说明，也不进入战斗或培养角色来凑验收。

## 实际操作与保存

使用正常招募完成档 `musashi-route-recheck-recruitment-complete-save.json`，SHA `35352bb0356fc0d6ba95b9e4d3c5478e7dbb1f7e54dc238669199d01f31e0b0d`。源档及3份前批成果先逐字节备份到 `test-results/backups/pre-musashi-skill-copy-df46acd/`，结束后核SHA全部不变。

在独立浏览器通过正式文件导入原件、正常刷新Load，再走现有 Party → 武藏Study → 培养页 → 展开两张Technique details → Character。第二个独立只读视口检查仅将人物页的招式列表滚入可视区；没有旅行、战斗、等待、剧情、切换技能开关、装备、主专精、教材或属性点操作。

| 现有页面 | 实际结果 |
| --- | --- |
| 武藏培养页／Combat techniques | 只有 Ninefold Sword 与 Crane-wing Swordplay 两张基础战技卡；两张Technique details正常展开，现有说明为英文 |
| 武藏Character／Learned techniques | 显示基础、6个高级招式及2个特殊技能名称与等级；6个高级名称均为英文 |
| 高级招式行 | 无button、details、title或独立技能说明控件；中文description没有被这个列表渲染 |
| 只读 `managedCharacter.skills` | 6个高级招式均已返回，名称英文、description仍中文。这不是角色未解锁；问题是当前非战斗页面不展示这些说明 |

培养页使用 `hero.externalSkills` 生成基础战技卡；人物页使用完整 `hero.skills`，模板仅渲染名称和等级。既有 `chapter-equipment-copy.json` 已映射这些高级名称，尚未提供这6条原description字符串的英文映射；显示投影保留内部ID和效果定义。这两件事分开记录：词典缺说明，以及现有页面缺说明入口。

## 原效果依据，尚未改成玩家文案

原包 SHA `c348d1bc161dbe3a9f9a321232526da75b8d3c7638db7fb2b089d30981e9bcd3` 不变。下表只读核原 `formSkills`，不是本批实战结果，也不是新增技能或改平衡。

| 原ID → 既有英文名 | 冻结数据中的原效果／参数 |
| --- | --- |
| `独孤九剑.破剑式` → Ninefold Sword — Swordbreaker | 母技能4级解锁；剑封印，duration4、chance100；怒气4、冷却6 |
| `独孤九剑.破刀式` → Ninefold Sword — Cleaverbreaker | 母技能4级解锁；刀封印，duration4、chance100；怒气4、冷却6 |
| `独孤九剑.破掌式` → Ninefold Sword — Fistbreaker | 母技能4级解锁；拳掌封印，duration4、chance100；怒气4、冷却6 |
| `独孤九剑.破兵式` → Ninefold Sword — Spellbreaker | 母技能4级解锁；奇门封印，duration4、chance100；怒气4、冷却6 |
| `华山剑法.苍松迎客` → Crane-wing Swordplay — Welcoming Pine | 母技能1级解锁；Star范围size3、powerExtra1.5，无附加buff；怒气4、冷却3 |
| `易筋经.易筋神功` → Ironbody Mastery — Ironbody Awakening | 母专精5级解锁；Square范围size3；内伤III持续3、以及防御强化level10持续1；怒气2、冷却6 |

四类封印在 `BattleEngine.Availability.cs` 按原武器类型阻止对应普通／高级武技，特殊技能另有排除规则。因此不能把 Swordbreaker 描述成无条件禁止敌人所有攻击，或把 Spellbreaker 写成新增魔法免疫。chance100是原声明，不保证无视宿主其他状态／结算规则。

Ironbody Awakening原数据有负面与增益效果，不能未核目标适用规则便写成“自己获得无敌”或“全队护盾”。本批未验证施放、命中、目标归属、抵抗、具体伤害或实际消耗，不以名称猜测效果。母剑术6级对应的4个高级招式已在真实人物列表；母剑术10级才解锁的 Final Principle未出现在此档，不为本批培养到10级。

现有英文名称与四系映射保持：Swordsmanship、Heavy Weapons、Gauntlets、Spells；内功仍为Passive masteries。原编号、几何、解锁、伤害、数值、消耗、成长和状态参数全部不动。

## 窄屏、页面证据及未验

使用云端无头Chromium、390×844、鼠标，非真机／触摸。培养页、展开基础说明及人物页无横向溢出；另将 Swordbreaker 与 Ironbody Awakening 行滚入真实视口，358px可用宽度内无横向溢出，截图中6个高级名称均可读。没有用夹具伪造高级说明出现，也没有修改换行样式。

人物页仍能看到3个中文天赋名，属于实际可见的另一个缺口；本批只记事实，不扩改天赋、头像、地图、世界目标或剧情。高级说明的英文、长段落换行和效果说明实际显示仍 **NOT_RUN**；不能因名称可读便称高级技能全英文验收通过。

首次检查5项、视口补证2项限定检查通过，浏览器／HTTP／请求异常均0。页面选择、基础说明展开、导出及普通Load后，完整 `game`、`wonBattles`、`profile` 均与源档一致：仍11人、150银币、道德54、原培养装备／库存及死亡3／击杀131，无新增故事标记或世界阶段。序列化字段一致不扩称战斗HP／MP可精确续存。

工作区 `src/Game.Web/test-results/` 的证据：

| 文件 | SHA-256 |
| --- | --- |
| `musashi-skill-visibility.json`，56846 bytes | `db6a6dc57c465bad881b1e28468b183b3a53d6cce3b1879e93d8aae1e5a72a1d` |
| `musashi-skill-names-viewport.json`，1619 bytes | `6315d6647893c58d4e8cb8f033583493b99aac9a54914b461161a504449f46d3` |
| `musashi-skill-visibility-complete-save.json`，71396 bytes | `edb9ff708f07e94ad83fcd22dfbdb91f74664c3886eef606d8e950e04c657e95` |

培养页／展开说明／人物页、实际Swordbreaker与Awakening视口截图均保留。没有产品变更，不重复构建或套用旧内容测试作为新增成果；原山战中断和其它国家未验项保持原状态。

下一待定的最小呈现范围：在既有人物页为已返回的高级招式增加只读说明入口，再用现有英文投影补这6条描述，按原效果验证。该方案不需改规则或解锁，但**本批未实现**，不能把不存在的入口当成已交付。
