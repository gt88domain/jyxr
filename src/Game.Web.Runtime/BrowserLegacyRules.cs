using Game.Core.Model;
using Game.Core.Model.Skills;

namespace Game.Web.Runtime;

/// <summary>Selected legacy rules explicitly enabled by the Jin Yong pack.</summary>
public static class BrowserLegacyRules
{
    // X-Heroes-of-Jin-Yong 4acd2c7, main.lua.lua:69. BattleField.cs:625
    // compares strictly greater, so tick 3000 remains playable.
    public const int MaxBattleTicks = 3000;

    /// <summary>
    /// Returns the final experience gain; the Core must not apply its default
    /// experience talent multiplier a second time. Other packs keep that policy.
    /// </summary>
    public static int ResolveSkillUseExperience(SkillInstance skill, int modernBaseExperience)
    {
        ArgumentNullException.ThrowIfNull(skill);
        var progressionSkill = SkillExperienceProgression.NormalizeProgressionSkill(skill)
            ?? throw new ArgumentException("Skill has no experience progression.", nameof(skill));
        var owner = progressionSkill.Owner;
        var wuxing = checked((int)Math.Floor(owner.GetStat(StatType.Wuxing)));
        // BattleField.cs1491/1496 passes 15+wuxing/2. External
        // SkillInstance.cs274 adds wuxing/30, then doubles only for 武学奇才.
        var increment = checked(15 + wuxing / 2 + wuxing / 30);
        var talented = owner.HasEffectiveTalent("武学奇才");
        // InternalSkillInstance.cs316–325 additionally adds the same increment
        // after that talent branch: two increments normally, three if talented.
        var multiplier = progressionSkill is InternalSkillInstance
            ? talented ? 3 : 2
            : talented ? 2 : 1;
        return checked(increment * multiplier);
    }
}
