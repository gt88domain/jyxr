using Game.Core.Affix;

namespace Game.Core.Battle.Talents;

public sealed record BrightSacredFireFormationBattleEffectParameters(
    [property: Probability] double ChancePerAlly = 0.2d,
    string? FloatText = null,
    bool RollPerVisitedUnit = false);

public sealed class BrightSacredFireFormationBattleEffectHandler
    : CustomBattleEffectHandler<BrightSacredFireFormationBattleEffectParameters, IActionReadinessEffectContext>
{
    public override IReadOnlySet<HookTiming> SupportedTimings { get; } =
        new HashSet<HookTiming> { HookTiming.BeforeActionReadiness };

    public override void Execute(
        IActionReadinessEffectContext context,
        BrightSacredFireFormationBattleEffectParameters parameters)
    {
        if (parameters.RollPerVisitedUnit)
        {
            var accumulated = 0d;
            foreach (var unit in context.State.GetLivingUnits())
            {
                if (unit.Team == context.Unit.Team && unit.Id != context.Unit.Id) accumulated += parameters.ChancePerAlly;
                if (accumulated >= 1 || context.Random.NextDouble() < accumulated) context.RemoveNegativeBuffs();
            }
            return;
        }
        var allyCount = context.State.GetLivingUnits().Count(unit =>
            unit.Team == context.Unit.Team &&
            !string.Equals(unit.Id, context.Unit.Id, StringComparison.Ordinal));
        var chance = Math.Clamp(parameters.ChancePerAlly * allyCount, 0d, 1d);
        if (!Probability.RollChance(context.Random, chance))
        {
            return;
        }

        var removedCount = context.RemoveNegativeBuffs();
        if (removedCount > 0 && !string.IsNullOrWhiteSpace(parameters.FloatText))
        {
            context.RequestFloatText(
                context.Unit,
                parameters.FloatText,
                BattleFloatTextStyle.Beneficial);
        }
    }
}
