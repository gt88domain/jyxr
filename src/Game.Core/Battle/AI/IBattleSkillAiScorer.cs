using Game.Core.Model.Skills;

namespace Game.Core.Battle;

public interface IBattleSkillAiScorer
{
    bool IsPositionIndependent => false;

    bool CanScore(SkillInstance skill);

    BattleSkillAiEvaluation Score(BattleSkillAiContext context);
}
