using Game.Core.Affix;

namespace Game.Core.Battle.Talents;

public sealed record IncomingDamageImmunityParameters;

internal sealed class IncomingDamageImmunityBattleEffectHandler : CustomBattleEffectHandler<IncomingDamageImmunityParameters, IDamageApplicationRuntimeContext>
{
    public override bool SupportsPreview => true;
    public override IReadOnlySet<HookTiming> SupportedTimings { get; } = new HashSet<HookTiming> { HookTiming.BeforeDamageApplied };
    public override void Execute(IDamageApplicationRuntimeContext context, IncomingDamageImmunityParameters parameters) =>
        context.CancelDamage(suppressHitEffects: false);
}
