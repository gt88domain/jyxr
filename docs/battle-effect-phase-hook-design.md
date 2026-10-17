# 战斗 Effect 与 Phase Hook 设计

本文描述当前已落地的轻量能力执行模型。它参考 GAS 的 Ability、Effect、Context、Cue 概念，
但不引入 ASC、AttributeSet 或 Tag 体系。

## 1. 执行边界

金庸内容通过可选`BattleFormationRules`启用有序分伤，其他内容默认不启用。真武/金刚最终增伤
先于AfterDamageCalculation内容修正；目标来袭Hook之后执行BeforeDamageDistribution，允许
生命上限吸取与恢复，再按真武重定向→五行等分→八卦转移统一处理目标。候选排除同角色定义，
只选仍存活单位；原BattleField会移除死亡sprite，现代状态保留死亡记录。共享伤害经统一入口
产出扣血与死亡事实，不重入普通受伤、怒气和吸血；原延迟死亡、濒死/复活及反弹MP仍是明确待办。

`IFinalDamageEffectContext`仅用于AfterDamageCalculation的数值公式；
`IDamageDistributionEffectContext`仅用于BeforeDamageDistribution的生命上限与吸血恢复能力。
易容等保护仍保留命中后的普通效果；要求SuppressHitEffects的取消会同时禁止OnHitConfirmed，
避免闪避或反击取消伤害后仍错误施加攻击方控制。

技能范围词条可用`skillName`匹配当前招式的精确名称，`stage`选择BeforeBlind或AfterBlind。
原有sourceSkillId词条仍默认在致盲前参与结算。当前施法与影响范围先算前段词条，再施加
致盲，最后算后段词条；角色、独立单位、战场及AI使用相同投影。用于区分寸长寸强的后加范围
与日月神鞭固定距离，不把派生招式误当成父武功的同名技能。

角色属性先通过普通ModifierBucket结算，再执行`final_stat_multiplier`词条。
该词条使用`stat`、`multiplier`和升序`order`，每一步乘法后向零取整，不合并倍率。
同order以来源ID、来源类型和词条序号稳定排序。角色面板、独立战斗单位与战场组合投影
都调用`AffixProjection.EvaluateStat`，跨角色／Buff／范围效果合并后只执行一次最终属性阶段。
这用于原武学属性天赋的有序整数计算，不代表原版全部装备、武学和Buff的前置加成已等价。

- `BattleSkillExecutor` 负责编排技能的有序步骤。
- 普通技能默认包含命中与伤害步骤；Special Skill 不进入默认伤害流程。
- Special Skill 只执行自身 Buff 和显式 Effect；混合能力通过有序 Effect 表达。
- 可选`SpecialSkillDefinition.UseAttackPipeline`使伤害型custom ability经共同命中、来袭伤害、阵法和反应；其技能Buff移至有效命中后应用。`ApplyFinalDamageModifiers`配置是否执行源最终修正，原顶层特技与GetAttackResult早退分支分别装配。其他包默认保持独立Effect语义。该配置不等于特技自伤、多目标和原死亡时点已完整复刻。
- 特技的HP代价通过 `IBattleAbilityEffectContext.PayHpCost` 支付，与来袭伤害分开；
  不触发受伤／濒死保护。实际死亡仍发出一次死亡通知，永久生命上限代价写入角色基础属性。
- 技能、Hook 和周期效果最终都经 `BattleEffectExecutor` 执行。
- 物品保持独立事务语义，只复用 Buff、恢复和资源 resolver。

所有带目标的 Effect 实现 `ITargetedBattleEffectDefinition`，由 `BattleTargetResolver` 解释
自身、来源、主目标、全体友军、全体敌军和附近友军等选择器。技能覆盖范围只决定初始目标，
具体 Effect 可以再次选择自己的作用对象。

## 2. Hook 职责

`BattleHookExecutor` 是 `BattleEngine` 公共构造参数所保留的单条 Hook 执行入口，职责拆为：

- `BattleHookRunner`：收集角色与 Buff Hook，保持稳定顺序并记录 Trace；
- `BattleHookEvaluator`：条件求值；
- `BattleHookPreviewPolicy`：拒绝随机、表现和有副作用的预览组合；
- `BattleEffectTimingPolicy`：校验 Effect 是否允许出现在当前 timing；
- `BattleEffectExecutor`：执行通过校验的 Effect。

Hook 按稳定来源顺序收集并执行。错误 timing 或不支持的 Effect 组合直接失败，不做静默兼容。

## 3. 能力型 Context

公共 Hook 信息只表达 timing、所属单位、来源、目标、技能、Buff、随机服务和 execution scope。
Effect handler 通过窄接口申请能力：

- `IHitResultEffectContext`：修改命中结果；
- `IDamageCalculationEffectContext`：修改普通伤害公式；
- `IDamageApplicationEffectContext`：修改落血目标和数值；
- `IDamageTakenEffectContext`：读取实际受伤并追加反应；
- `IRecoveryEffectContext`：修改恢复量；
- `ISkillCostEffectContext`：修改技能消耗；
- `IBuffApplicationEffectContext`：取消或强化 Buff 应用；
- `IActionStartEffectContext`：跳过行动开始。
- `IActionPreparationEffectContext`：行动准备阶段恢复HP／MP，可用于眩晕判定前或行动开始；
  内容明确选择其中一个时点，不自动执行两次。

专用 handler 只能接收声明的能力。例如真武增伤只能访问伤害计算，真武挡刀只能访问落血前
改写，怪病只能访问行动开始。内容装配和运行入口都会拒绝错误组合。

## 4. 状态变化入口

- `BattleDamageResolver`：普通伤害与实际扣血；
- `BattleRecoveryResolver`：恢复量修正和实际恢复，返回请求量、修正量和实际量；
- 恢复携带 `BattleRecoveryReason`，内容可分别约束休息、药品、吸血、伤害转恢复或普通效果，
  避免将仅限休息的封穴扩大到所有回内，或让重伤错误削减直接回合治疗。
- `BattleBuffResolver`：Buff 应用、抵抗、强化与移除；
- `BattleResourceResolver`：怒气、行动条等资源；
- `BattleGrowthResolver`：技能、内功和角色经验及升级事实。

`BattleUnit.TakeDamage()` 等仍是最终状态原语，但规则代码不应绕过 resolver 自行拼接 timing、
实际变化量和消息。

## 5. Effect 链与保护

`modify_damage_context.unitLevelStep`默认1；按整数等级/step计算DeltaPerUnitLevel，step必须大于0。
`single_precision_lifesteal`在OnDamageDealt以内容配置的武功、天赋和等级贡献累加float，使用
IncomingDamageAmount而非ActualDamageAmount；处理该次吸血后将默认LifestealRate清零。
恢复仍经ApplyLifestealRecovery及统一恢复resolver，携带Lifesteal原因并只产生实际恢复量事实。
该策略只在配置该Hook的内容生效；其他内容保持原吸血计算。完整旧词条逐次float累加及反应
先后仍待核对，不用本策略存在代替全部吸血等价。

`AfterDamageCalculation`在普通技能伤害公式与基础伤害倍率结算后，由攻击者执行，先于目标的
`BeforeDamageApplied`减伤／伤害上限。`modify_damage`支持此时点及可选的成对`deltaMin/deltaMax`，
每个修正分别按配置取整。用于旧版门派武学对已算出伤害的倍率，避免把乘法移到攻击力区间后改变减防结果。
随机区间不得同时指定固定`delta`；确定性预览采用区间中点，不消耗随机数。

原内容的精明溢出MP通过来袭Context排队，不立即扣目标资源；取消伤害同时清空待结算MP，反弹先按float比例处理HP/MP。反弹的死亡通知与伤害反应分开，原取消AttackResult所致的零真气护体代价有单独检查。该选择由内容参数启用，其他内容保留默认行为；阵法共享伤害的旧延迟死亡仍待核对。

AI仅预览不带表现/随机条件/副作用的数字Hook，倍率区间使用中点。恢复预览按Rest原因、重伤/封穴等修正并限制实际缺额；不把随机天赋的未模拟效果视为完整期望。位置无关的伤害评价可在单次候选生成中缓存，状态或行动变化后重建缓存。

`stat_difference_chance`条件分别读取sourceStat与targetStat，并各自除以正整数divisor；
可选择逐项截断quotient后相减，概率下限为0。inclusive采用`随机值 <= 概率`，总是取样；
严格比较采用`随机值 < 概率`，概率达到1时直接成功，概率为0仍取样。
该条件与其他随机条件一样禁止确定性Hook预览。控制内容使用OnHitConfirmed，经统一Buff
resolver应用等级和持续，不绕过圣战或抗性；源版命中与其他反应顺序仍需要后续比对。

`BattleExecutionScope` 覆盖技能步骤、Hook、周期效果和它们产生的后续 Effect，记录序号、父
Effect、深度与规则来源。最大深度为 64；超过限制直接失败，以阻止追击、反伤等形成无限链。

## 6. 表现边界

Effect 和 Hook 只产出战斗消息，不直接依赖 Godot：

- Fact 表示已经发生的规则事实；
- Cue 请求宿主播放飘字、语音等表现；
- Trace 提供 Hook 和 Effect 链诊断。

三类消息在同一命令批次中保持相对顺序，具体播放方式由宿主决定。
