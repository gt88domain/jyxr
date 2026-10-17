using Game.Core.Definitions;
using Game.Core.Model.Skills;

namespace Game.Core.Battle;

public sealed class SpecialSkillAiScorer(BattleEngine? engine = null) : IBattleSkillAiScorer
{
    public bool CanScore(SkillInstance skill) => skill is SpecialSkillInstance;

    public BattleSkillAiEvaluation Score(BattleSkillAiContext context)
    {
        var skill = context.Skill as SpecialSkillInstance ?? throw new InvalidOperationException("Special skill required.");
        var enemyDamage = 0; var allyDamage = 0; var enemyKills = 0; var allyKills = 0; var enemyHits = new HashSet<string>();
        var damageByTarget = new Dictionary<BattleUnit, int>();
        var utility = 0d; var selfCost = 0;
        foreach (var buff in skill.Buffs)
        {
            if (buff.Buff.IsDebuff)
                foreach (var target in context.Targets)
                    utility += BuffValue(target, buff.Buff, buff.Level, buff.Duration) * BattleSkillBuffChanceResolver.Resolve(buff, context.Source, target);
            else if (context.Targets.Count > 0)
                utility += BuffValue(context.Source, buff.Buff, buff.Level, buff.Duration) *
                    (1 - context.Targets.Aggregate(1d, (miss, target) => miss * (1 - BattleSkillBuffChanceResolver.Resolve(buff, context.Source, target))));
        }

        foreach (var effect in skill.Definition.Effects ?? [])
        {
            var targets = effect is ITargetedBattleEffectDefinition targeted ? Targets(targeted.Target) : [];
            if (effect is CustomAbilityBattleEffectDefinition ability)
            {
                selfCost += Math.Max(0, ability.EstimateAbilityHpCost(EstimateContext(context.Source)));
                foreach (var target in targets)
                {
                    var estimate = EstimateContext(target);
                    var damage = Math.Max(0, ability.EstimateAbilityDamage(estimate) ?? 0);
                    if (skill.Definition.UseAttackPipeline && engine is not null)
                        damage = engine.EstimateResolvedSkillDamage(context.State, context.Source, target, skill, damage, skill.Definition.ApplyFinalDamageModifiers).Damage;
                    damageByTarget[target] = damageByTarget.GetValueOrDefault(target) + damage;
                    utility += HealingValue(target, ability.EstimateAbilityHealing(estimate));
                }
                continue;
            }
            foreach (var target in targets)
            {
                var enemy = context.State.AreEnemies(context.Source, target);
                var sign = enemy ? -1d : 1d;
                utility += effect switch
                {
                    ApplyBuffBattleEffectDefinition b => BuffValue(target, b.Buff, b.Level, b.Duration) * b.Chance / 100d,
                    AddHpBattleEffectDefinition hp => HealingValue(target, hp.Value),
                    AddMpBattleEffectDefinition mp => sign * Math.Min(Math.Max(0, mp.Value), target.MaxMp - target.Mp) * .5,
                    AddRageBattleEffectDefinition rage => sign * Math.Min(Math.Max(0, rage.Value), Math.Max(0, BattleUnit.MaxRage - target.Rage)) * 100,
                    SetRageBattleEffectDefinition rage => sign * (Math.Clamp(rage.Value, 0, BattleUnit.MaxRage) - target.Rage) * 100,
                    RemoveNegativeBuffsBattleEffectDefinition => sign * target.Buffs.Count(b => b.Definition.IsDebuff) * 350,
                    RemovePositiveBuffsBattleEffectDefinition => -sign * target.Buffs.Count(b => !b.Definition.IsDebuff) * 250,
                    RemoveBuffBattleEffectDefinition b => (b.Buff.IsDebuff ? sign : -sign) * (target.HasBuff(b.BuffId) ? 350 : 0),
                    AddActionGaugeBattleEffectDefinition gauge => sign * gauge.Value * 8,
                    SetActionGaugeBattleEffectDefinition gauge => sign * (gauge.Value - target.ActionGauge) * 8,
                    _ => 0
                };
            }
        }
        foreach (var (target, amount) in damageByTarget)
        {
            var damage = Math.Min(amount, Math.Max(0, target.Hp));
            if (context.State.AreEnemies(context.Source, target))
            {
                enemyDamage += damage;
                if (amount > 0) enemyHits.Add(target.Id);
                if (amount >= target.Hp && amount > 0) enemyKills++;
            }
            else
            {
                allyDamage += damage;
                if (amount >= target.Hp && amount > 0) allyKills++;
            }
        }
        allyDamage += Math.Min(selfCost, context.Source.Hp);
        if (selfCost >= context.Source.Hp && selfCost > 0)
        {
            allyKills++;
            if (context.State.GetLivingUnits().Count(u => u.Team == context.Source.Team) == 1) utility -= 20000;
        }
        utility -= skill.MpCost * .1 + skill.RageCost * 35;
        return new(enemyDamage, allyDamage, enemyKills, allyKills, enemyHits.Count, utility);

        BattleAbilityDamageEstimateContext EstimateContext(BattleUnit target) => new(context.State, context.Source, target, skill, context.MoveDestination);
        double HealingValue(BattleUnit target, int amount)
        {
            var actual = Math.Min(Math.Max(0, amount), Math.Max(0, target.MaxHp - target.Hp));
            return actual * (context.State.AreEnemies(context.Source, target) ? -1.5 : target.Hp < target.MaxHp * .3 ? 2.5 : 1.5);
        }
        double BuffValue(BattleUnit target, BuffDefinition buff, int level, int duration)
        {
            var existing = target.Buffs.FirstOrDefault(b => b.Definition.Id == buff.Id);
            if (existing is not null && existing.Level >= level && existing.RemainingTurns >= Math.Max(1, duration - 1)) return 0;
            var beneficial = !buff.IsDebuff != context.State.AreEnemies(context.Source, target);
            var value = 220d + Math.Max(0, level) * 45;
            if (existing is not null) value *= .25;
            return beneficial ? value : -value;
        }
        IReadOnlyList<BattleUnit> Targets(BattleUnitSelectorDefinition selector) => selector switch
        {
            NearbyAlliesBattleUnitSelectorDefinition near => context.State.GetLivingUnits().Where(u => u.Team == context.Source.Team && (near.IncludeSelf || u.Id != context.Source.Id) && (u.Id == context.Source.Id ? 0 : u.Position.ManhattanDistanceTo(context.MoveDestination)) <= near.Radius).ToArray(),
            NearbyEnemiesBattleUnitSelectorDefinition near => context.State.GetLivingUnits().Where(u => u.Team != context.Source.Team && u.Position.ManhattanDistanceTo(context.MoveDestination) <= near.Radius).ToArray(),
            _ => BattleUnitSelectorResolver.Resolve(context.State, context.Source, context.Source, context.Targets, selector)
        };
    }
}
