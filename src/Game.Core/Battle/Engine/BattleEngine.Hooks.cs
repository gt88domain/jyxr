using Game.Core.Affix;
using Game.Core.Model;
using Game.Core.Model.Skills;

namespace Game.Core.Battle;

public sealed partial class BattleEngine
{
    internal int PayAbilityHpCost(BattleState state, BattleUnit source, SkillInstance skill, int amount, int permanentMaxHpCost)
    {
        ArgumentOutOfRangeException.ThrowIfNegative(amount);
        ArgumentOutOfRangeException.ThrowIfNegative(permanentMaxHpCost);
        var wasAlive = source.IsAlive;
        var actual = source.TakeDamage(amount);
        var maximumLoss = Math.Min(permanentMaxHpCost, Math.Max(0, source.Character.GetBaseStat(StatType.MaxHp) - 1));
        if (maximumLoss > 0)
        {
            source.Character.AddBaseStat(StatType.MaxHp, -maximumLoss);
            source.Character.RebuildSnapshot();
            source.InvalidateLocalBattleProjection();
            source.ClampResourcesToLimits();
        }
        AddMessage(state, new BattleFact(BattleFactKind.Damaged, source.Id, detail: skill.Id,
            damage: new BattleDamageEvent(actual, SourceUnitId: source.Id)));
        // A skill cost is paid even with immunity or a resurrection talent.
        // Only the resulting defeat notification uses death hooks.
        if (wasAlive && !source.IsAlive)
        {
            AddMessage(state, new BattleFact(BattleFactKind.UnitDefeated, source.Id, HookTiming.OnDefeated, skill.Id));
            TriggerHooks(state, HookTiming.OnDefeated, source, context =>
            {
                context.Source = source; context.Target = source; context.Skill = skill;
                context.IncomingDamageAmount = amount; context.DamageAmount = actual;
            });
            state.ScopedEffects.NotifyUnitDefeated(state, source);
        }
        return actual;
    }

    internal int ApplyDirectHpRecovery(
        BattleState state,
        BattleUnit source,
        BattleUnit target,
        int amount,
        BattleRecoveryReason reason = BattleRecoveryReason.Effect)
    {
        var actual = _recoveryResolver.Apply(state, source, target, BattleRecoveryKind.Hp, amount, reason).ActualAmount;
        AddMessage(state, new BattleFact(BattleFactKind.Healed, target.Id, detail: actual.ToString()));
        return actual;
    }

    internal int ApplyDirectDamage(
        BattleState state,
        BattleUnit source,
        BattleUnit target,
        int amount,
        HookTiming? timing = null,
        string? detail = null) =>
        _damageResolver.Apply(
            state,
            source,
            target,
            amount,
            runBeforeDamageApplied: false,
            eventTiming: timing,
            detail: detail).ActualAmount;

    internal bool ApplyBuffByEffect(
        BattleState state,
        BattleUnit source,
        BattleUnit target,
        string buffId,
        int level,
        int duration,
        HookTiming? timing = null)
    {
        ArgumentNullException.ThrowIfNull(state);
        ArgumentNullException.ThrowIfNull(source);
        ArgumentNullException.ThrowIfNull(target);
        ArgumentException.ThrowIfNullOrWhiteSpace(buffId);
        ArgumentOutOfRangeException.ThrowIfNegative(level);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(duration);

        return _battleBuffResolver.Apply(
            state,
            source,
            target,
            _battleBuffResolver.Resolve(buffId),
            level,
            duration,
            timing);
    }

    internal BattleHookContext TriggerHooks(
        BattleState state,
        HookTiming timing,
        BattleUnit unit,
        Action<BattleHookContext>? configure = null,
        BattleHookExecutionMode executionMode = BattleHookExecutionMode.Execute,
        bool recordEvents = true,
        Func<HookAffix, bool>? hookFilter = null)
        => _hookRunner.Run(state, timing, unit, configure, executionMode, recordEvents, hookFilter);

    private int ResolveSkillMpCostPreview(BattleState state, BattleUnit unit, SkillInstance skill) =>
        ResolveSkillMpCost(state, unit, skill, BattleHookExecutionMode.Preview);

    private int ResolveSkillMpCostExecute(BattleState state, BattleUnit unit, SkillInstance skill) =>
        ResolveSkillMpCost(state, unit, skill, BattleHookExecutionMode.Execute);

    private int ResolveSkillMpCost(
        BattleState state,
        BattleUnit unit,
        SkillInstance skill,
        BattleHookExecutionMode executionMode)
    {
        var context = TriggerHooks(
            state,
            HookTiming.BeforeSkillCost,
            unit,
            hookContext =>
            {
                hookContext.Skill = skill;
                hookContext.MpCost = skill.MpCost;
            },
            executionMode,
            recordEvents: false);
        return Math.Max(0, context.MpCost ?? skill.MpCost);
    }

}
