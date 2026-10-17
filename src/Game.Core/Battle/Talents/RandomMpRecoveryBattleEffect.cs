using Game.Core.Affix;

namespace Game.Core.Battle.Talents;

public sealed record RandomMpRecoveryBattleEffectParameters(
    [property: NonNegative] int Minimum,
    [property: NonNegative] int Maximum);

internal sealed class RandomMpRecoveryBattleEffectHandler
    : CustomBattleEffectHandler<RandomMpRecoveryBattleEffectParameters, IActionPreparationEffectContext>
{
    public override IReadOnlySet<HookTiming> SupportedTimings { get; } =
        new HashSet<HookTiming> { HookTiming.BeforeActionReadiness, HookTiming.BeforeActionStart };

    public override void Validate(RandomMpRecoveryBattleEffectParameters parameters)
    {
        if (parameters.Maximum < parameters.Minimum || parameters.Maximum == int.MaxValue)
            throw new InvalidOperationException("MP recovery requires a valid inclusive integer range.");
    }

    public override void Execute(IActionPreparationEffectContext context, RandomMpRecoveryBattleEffectParameters parameters)
    {
        var amount = context.Random.Next(parameters.Minimum, parameters.Maximum + 1);
        context.ApplyMpRecovery(context.Unit, amount);
    }
}
