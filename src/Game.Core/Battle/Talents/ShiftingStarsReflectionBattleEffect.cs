using Game.Core.Affix;

namespace Game.Core.Battle.Talents;

public sealed record ShiftingStarsReflectionBattleEffectParameters(
    [property: NotWhiteSpace] string FamilyTalentId,
    [property: Probability] double Chance,
    [property: Probability] double FamilyChance,
    [property: Probability] double DamageFactor,
    string FloatText,
    string Speech,
    bool Unreactive = false,
    bool SinglePrecision = false);

internal sealed class ShiftingStarsReflectionBattleEffectHandler
    : CustomBattleEffectHandler<ShiftingStarsReflectionBattleEffectParameters, IDamageApplicationRuntimeContext>
{
    public override IReadOnlySet<HookTiming> SupportedTimings { get; } =
        new HashSet<HookTiming> { HookTiming.BeforeDamageApplied };

    public override void Execute(
        IDamageApplicationRuntimeContext context,
        ShiftingStarsReflectionBattleEffectParameters parameters)
    {
        var source = context.Source;
        if (source is null || context.DamageAmount <= 0 ||
            !context.State.AreEnemies(context.Unit, source))
        {
            return;
        }

        var chance = context.Unit.Character.HasEffectiveTalent(parameters.FamilyTalentId)
            ? parameters.FamilyChance
            : parameters.Chance;
        if (!Probability.RollChance(context.Random, chance))
        {
            return;
        }

        var reflectedDamage = parameters.SinglePrecision ? (int)((float)context.DamageAmount * (float)parameters.DamageFactor) : (int)(context.DamageAmount * parameters.DamageFactor);
        if (parameters.Unreactive)
        {
            var mp = parameters.SinglePrecision ? (int)((float)context.PendingMpDamage * (float)parameters.DamageFactor) : (int)(context.PendingMpDamage * parameters.DamageFactor);
            context.ApplyReflectedDamage(source, reflectedDamage, mp);
        }
        else if (reflectedDamage > 0)
        {
            context.ApplyDirectDamage(source, reflectedDamage, "斗转星移");
        }

        context.RequestFloatText(context.Unit, parameters.FloatText, BattleFloatTextStyle.Special);
        context.RequestSpeech(context.Unit, parameters.Speech);
        context.CancelDamage(suppressHitEffects: true);
    }
}
