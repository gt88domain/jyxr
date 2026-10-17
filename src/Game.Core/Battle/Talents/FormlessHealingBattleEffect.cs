using Game.Core.Affix;

namespace Game.Core.Battle.Talents;

public sealed record FormlessHealingBattleEffectParameters(
    [property: NonNegative] int BaseValue,
    [property: NonNegative] int ValuePerLevel,
    bool MaximumInclusive = false);

internal sealed class FormlessHealingBattleEffectHandler
    : CustomBattleEffectHandler<FormlessHealingBattleEffectParameters, IActionPreparationEffectContext>
{
    public override IReadOnlySet<HookTiming> SupportedTimings { get; } =
        new HashSet<HookTiming> { HookTiming.BeforeActionReadiness, HookTiming.BeforeActionStart };

    public override void Execute(
        IActionPreparationEffectContext context,
        FormlessHealingBattleEffectParameters parameters)
    {
        var upperExclusive = checked(
            parameters.BaseValue + parameters.ValuePerLevel * context.Unit.Character.Level +
            (parameters.MaximumInclusive ? 1 : 0));
        var recovery = upperExclusive == 0
            ? 0
            : (int)(context.Random.NextDouble() * upperExclusive);
        var actual = context.ApplyHpRecovery(context.Unit, recovery, "无相");
        context.RequestFloatText(
            context.Unit,
            $"恢复生命{actual}",
            BattleFloatTextStyle.Recovery);
    }
}
