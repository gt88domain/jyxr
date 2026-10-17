using Game.Core.Affix;

namespace Game.Core.Battle.Talents;

public sealed record MaximumHpDrainParameters(
    [property: Probability] double DamageFactor,
    [property: Probability] double MaximumLossFactor,
    [property: Probability] double RecoveryFactor);

internal sealed class MaximumHpDrainBattleEffectHandler : CustomBattleEffectHandler<MaximumHpDrainParameters, IDamageDistributionEffectContext>
{
    public override IReadOnlySet<HookTiming> SupportedTimings { get; } = new HashSet<HookTiming> { HookTiming.BeforeDamageDistribution };
    public override void Execute(IDamageDistributionEffectContext context, MaximumHpDrainParameters p)
    {
        if (context.Target is null || context.DamageAmount <= 0) return;
        var loss = Math.Min((int)(context.DamageAmount * p.DamageFactor), (int)(context.Target.MaxHp * p.MaximumLossFactor));
        context.ReduceMaximumHp(context.Target, loss);
        context.RecoverLifesteal((int)(context.DamageAmount * p.RecoveryFactor));
    }
}
