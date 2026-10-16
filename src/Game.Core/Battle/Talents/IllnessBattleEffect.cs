using Game.Core.Affix;

namespace Game.Core.Battle.Talents;

public sealed record IllnessBattleEffectParameters(
    string? ProtectorCharacterId = null,
    string? SkipReason = null,
    [property: Positive] int MinimumProtectorHp = 1,
    [property: Probability] double Chance = 1d);

public sealed class IllnessBattleEffectHandler : CustomBattleEffectHandler<IllnessBattleEffectParameters, IActionStartEffectContext>
{
    public override IReadOnlySet<HookTiming> SupportedTimings { get; } =
        new HashSet<HookTiming> { HookTiming.BeforeActionStart };

    public override void Execute(
        IActionStartEffectContext context,
        IllnessBattleEffectParameters parameters)
    {
        if (context.IsActionSkipRequested || !Probability.RollChance(context.Random, parameters.Chance)) return;
        var protectorIsPresent = context.State.GetLivingUnits().Any(unit =>
            unit.Team == context.Unit.Team &&
            unit.Hp >= parameters.MinimumProtectorHp &&
            string.Equals(
                unit.Character.Definition.Id,
                parameters.ProtectorCharacterId,
                StringComparison.Ordinal));
        if (!protectorIsPresent)
        {
            context.SkipCurrentAction(parameters.SkipReason);
        }
    }
}
