using Game.Core.Model;

namespace Game.Core.Battle.SpecialSkills;

public sealed record HuatuoRebornHealingBattleEffectParameters;

public sealed class HuatuoRebornHealingBattleEffectHandler
    : CustomAbilityBattleEffectHandler<HuatuoRebornHealingBattleEffectParameters>
{
    public override void Execute(
        IBattleAbilityEffectContext context,
        HuatuoRebornHealingBattleEffectParameters parameters)
    {
        var healerStatTotal = context.Source.GetStat(StatType.Gengu) + context.Source.GetStat(StatType.Fuyuan);
        foreach (var target in context.Targets)
        {
            var statHealing = healerStatTotal * Lerp(5d, 15d, context.Random.NextDouble());
            var maximumHpHealing = target.MaxHp * Lerp(0.1d, 0.3d, context.Random.NextDouble());
            context.ApplyHpRecovery(target, (int)statHealing + (int)maximumHpHealing);
        }
    }

    private static double Lerp(double minimum, double maximum, double amount) =>
        minimum + (maximum - minimum) * amount;

    public override int EstimateHealing(BattleAbilityDamageEstimateContext context, HuatuoRebornHealingBattleEffectParameters parameters) =>
        (int)((context.Source.GetStat(StatType.Gengu) + context.Source.GetStat(StatType.Fuyuan)) * 10d) + (int)(context.Target.MaxHp * .2d);
}
