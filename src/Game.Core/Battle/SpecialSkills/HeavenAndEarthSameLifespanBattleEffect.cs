namespace Game.Core.Battle.SpecialSkills;

public sealed record HeavenAndEarthSameLifespanBattleEffectParameters(
    [property: NonNegative] int PermanentMaxHpCost = 0);

public sealed class HeavenAndEarthSameLifespanBattleEffectHandler
    : CustomAbilityBattleEffectHandler<HeavenAndEarthSameLifespanBattleEffectParameters>
{
    public override void Execute(
        IBattleAbilityEffectContext context,
        HeavenAndEarthSameLifespanBattleEffectParameters parameters)
    {
        var sourceHp = context.Source.Hp;
        foreach (var target in context.Targets)
        {
            var damage = (int)(sourceHp * (0.5d + context.Random.NextDouble() * 0.5d));
            context.ApplyDirectDamage(target, damage, context.Skill.Id);
        }

        context.PayHpCost(sourceHp, parameters.PermanentMaxHpCost);
    }

    public override int? EstimateDamage(
        BattleAbilityDamageEstimateContext context,
        HeavenAndEarthSameLifespanBattleEffectParameters parameters) =>
        (int)(context.Source.Hp * 0.75d);
}
