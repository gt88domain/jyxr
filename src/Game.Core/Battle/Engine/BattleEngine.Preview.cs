using Game.Core.Affix;
using Game.Core.Model.Skills;

namespace Game.Core.Battle;

public sealed partial class BattleEngine
{
    public BattleRestRecovery EstimateRestRecovery(BattleState state, BattleUnit unit)
    {
        var baseRecovery=BattleRestCalculator.EstimateAverage(unit);
        return new(Math.Min(Math.Max(0,unit.MaxHp-unit.Hp),Resolve(BattleRecoveryKind.Hp,baseRecovery.Hp)),
            Math.Min(Math.Max(0,unit.MaxMp-unit.Mp),Resolve(BattleRecoveryKind.Mp,baseRecovery.Mp)));
        int Resolve(BattleRecoveryKind kind,int amount) => Math.Max(0,TriggerHooks(state,HookTiming.BeforeRecoveryResolved,unit,c=>
        {
            c.Source=unit;c.Target=unit;c.RecoveryKind=kind;c.RecoveryReason=BattleRecoveryReason.Rest;c.RecoveryAmount=amount;
        },BattleHookExecutionMode.Preview,recordEvents:false,hookFilter:BattleHookPreviewPolicy.IsSafe).RecoveryAmount??amount);
    }

    // Read-only numeric preview. Random or stateful hooks are deliberately not
    // executed, and this path never consumes the gameplay random stream.
    public BattleDamageEstimate EstimateSkillDamage(BattleState state, BattleUnit source, BattleUnit target, SkillInstance skill)
    {
        var calculation = _damageCalculator.CreateSkillDamageContext(new BattleDamageContext(source, target, skill, state.RuleSettings));
        void Formula(BattleHookContext c) { c.Source = source; c.Target = target; c.Skill = skill; c.DamageCalculation = calculation; }
        Preview(HookTiming.BeforeDamageCalculation, source, Formula);
        if (source.Id != target.Id) Preview(HookTiming.BeforeDamageCalculation, target, Formula);
        var amount = (int)(_damageCalculator.EstimateSkillDamage(calculation).Amount * BattleDamageRules.GetSkillDamageMultiplier(source, target));
        return EstimateResolvedSkillDamage(state, source, target, skill, amount);

        BattleHookContext Preview(HookTiming timing, BattleUnit unit, Action<BattleHookContext> configure) =>
            TriggerHooks(state, timing, unit, configure, BattleHookExecutionMode.Preview, recordEvents: false, hookFilter: BattleHookPreviewPolicy.IsSafe);
    }

    internal BattleDamageEstimate EstimateResolvedSkillDamage(BattleState state, BattleUnit source, BattleUnit target, SkillInstance skill, int amount, bool applyFinalModifiers = true)
    {
        if (applyFinalModifiers) amount = Numeric(HookTiming.AfterDamageCalculation, source, amount);
        amount = Numeric(HookTiming.BeforeDamageApplied, target, amount);
        amount = (int)(Math.Max(0, amount) * (1 - Math.Clamp(target.GetStat(Game.Core.Model.StatType.Evasion), 0, 1)));
        return new(target, amount, source.Team != target.Team, amount >= target.Hp);

        int Numeric(HookTiming timing, BattleUnit unit, int value) => TriggerHooks(state, timing, unit, c =>
        {
            c.Source = source; c.Target = target; c.Skill = skill; c.DamageAmount = value;
        }, BattleHookExecutionMode.Preview, recordEvents: false, hookFilter: BattleHookPreviewPolicy.IsSafe).DamageAmount ?? value;
    }
}
