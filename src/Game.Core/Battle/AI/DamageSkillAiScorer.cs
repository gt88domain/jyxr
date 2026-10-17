using Game.Core.Model.Skills;

namespace Game.Core.Battle;

public sealed class DamageSkillAiScorer : IBattleSkillAiScorer
{
    public bool IsPositionIndependent => true;
    private readonly BattleDamageEstimator _damageEstimator;
    private readonly BattleEngine? _engine;

    public DamageSkillAiScorer(BattleDamageEstimator? damageEstimator = null, BattleEngine? engine = null)
    {
        _damageEstimator = damageEstimator ?? new BattleDamageEstimator();
        _engine = engine;
    }

    public bool CanScore(SkillInstance skill)
    {
        ArgumentNullException.ThrowIfNull(skill);
        return skill is not SpecialSkillInstance && skill.Power > 0d;
    }

    public BattleSkillAiEvaluation Score(BattleSkillAiContext context)
    {
        ArgumentNullException.ThrowIfNull(context);

        var enemyDamage = 0;
        var allyDamage = 0;
        var enemyKills = 0;
        var allyKills = 0;
        var enemyHitCount = 0;

        foreach (var target in context.Targets)
        {
            var estimate = _engine?.EstimateSkillDamage(context.State, context.Source, target, context.Skill)
                ?? _damageEstimator.Estimate(context.Source, target, context.Skill);
            if (estimate.IsEnemy)
            {
                enemyDamage += estimate.Damage;
                if (estimate.Damage > 0)
                {
                    enemyHitCount++;
                }

                if (estimate.IsKill)
                {
                    enemyKills++;
                }
            }
            else
            {
                allyDamage += estimate.Damage;
                if (estimate.IsKill)
                {
                    allyKills++;
                }
            }
        }

        return new BattleSkillAiEvaluation(
            enemyDamage,
            allyDamage,
            enemyKills,
            allyKills,
            enemyHitCount);
    }
}
