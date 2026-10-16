using Game.Core.Affix;

namespace Game.Core.Battle.Talents;

public sealed record TeamCountAttackBonusParameters(
    [property: NonNegative] double FactorPerUnit,
    [property: NonNegative] int MaximumUnits = 10,
    bool IncludeSelf = false,
    bool SinglePrecision = false,
    BattleDamageContextField Field = BattleDamageContextField.FinalDamage);

public sealed class TeamCountAttackBonusHandler
    : CustomBattleEffectHandler<TeamCountAttackBonusParameters, IDamageCalculationEffectContext>
{
    public override bool SupportsPreview => true;
    public override IReadOnlySet<HookTiming> SupportedTimings { get; } =
        new HashSet<HookTiming> { HookTiming.BeforeDamageCalculation };

    public override void Execute(IDamageCalculationEffectContext context, TeamCountAttackBonusParameters parameters)
    {
        if (!ReferenceEquals(context.Source, context.Unit) || context.Skill?.Power is not > 0) return;
        var count = Math.Min(
            parameters.MaximumUnits,
            context.State.GetLivingUnits().Count(unit => unit.Team == context.Unit.Team) - (parameters.IncludeSelf ? 0 : 1));
        var factor = parameters.SinglePrecision
            ? (double)(1f + (float)parameters.FactorPerUnit * count)
            : 1d + parameters.FactorPerUnit * count;
        context.DamageCalculation.AddModifier(
            parameters.Field,
            ModifierOp.More,
            factor);
    }
}
