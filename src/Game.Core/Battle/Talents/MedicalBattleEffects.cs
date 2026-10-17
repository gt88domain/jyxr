using Game.Core.Affix;
using Game.Core.Model;

namespace Game.Core.Battle.Talents;

public sealed record MedicalImmortalBattleEffectParameters(bool UseBaseGengu = false);

internal sealed class MedicalImmortalBattleEffectHandler
    : CustomBattleEffectHandler<MedicalImmortalBattleEffectParameters, IActionPreparationEffectContext>
{
    public override IReadOnlySet<HookTiming> SupportedTimings { get; } =
        new HashSet<HookTiming> { HookTiming.BeforeActionReadiness, HookTiming.BeforeActionStart };

    public override void Execute(
        IActionPreparationEffectContext context,
        MedicalImmortalBattleEffectParameters parameters)
    {
        foreach (var target in context.State.GetLivingUnits()
                     .Where(target => target.Team == context.Unit.Team)
                     .Where(target => target.Position.ManhattanDistanceTo(context.Unit.Position) <= 4))
        {
            var amount = RollBaseRecovery(context, parameters.UseBaseGengu);
            var actual = context.ApplyHpRecovery(target, amount);
            if (actual > 0)
                context.RequestFloatText(target, $"【医仙】 +{actual}HP", BattleFloatTextStyle.Recovery);
        }
    }

    internal static int RollBaseRecovery(IActionPreparationEffectContext context, bool useBaseGengu) =>
        (int)((useBaseGengu ? context.Unit.Character.GetBaseStat(StatType.Gengu) : context.Unit.GetStat(StatType.Gengu)) *
            (1d + context.Random.NextDouble() * 3d));
}

public sealed record HealTheWoundedBattleEffectParameters(bool IncludeSelf = false, bool UseBaseGengu = false);

internal sealed class HealTheWoundedBattleEffectHandler
    : CustomBattleEffectHandler<HealTheWoundedBattleEffectParameters, IActionPreparationEffectContext>
{
    public override IReadOnlySet<HookTiming> SupportedTimings { get; } =
        new HashSet<HookTiming> { HookTiming.BeforeActionReadiness, HookTiming.BeforeActionStart };

    public override void Execute(
        IActionPreparationEffectContext context,
        HealTheWoundedBattleEffectParameters parameters)
    {
        var candidates = context.State.GetLivingUnits()
            .Where(target => target.Team == context.Unit.Team)
            .Where(target => parameters.IncludeSelf || !string.Equals(target.Id, context.Unit.Id, StringComparison.Ordinal))
            .Where(target => target.Position.ManhattanDistanceTo(context.Unit.Position) <= 4)
            .ToList();
        if (candidates.Count == 0)
        {
            return;
        }

        var target = candidates[context.Random.Next(0, candidates.Count)];
        var amount = 2 * MedicalImmortalBattleEffectHandler.RollBaseRecovery(context, parameters.UseBaseGengu);
        var actual = context.ApplyHpRecovery(target, amount);
        if (actual > 0)
            context.RequestFloatText(target, $"【救死扶伤】 +{actual}HP", BattleFloatTextStyle.Recovery);
    }
}
