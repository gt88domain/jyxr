using Game.Core.Abstractions;
using Game.Core.Affix;
using Game.Core.Definitions.Skills;
using Game.Core.Model;
using Game.Core.Model.Character;
using Game.Core.Model.Skills;
using Game.Core;

namespace Game.Core.Battle;

public sealed record LegendSkillResolutionRules(
    bool RollBeforeConditions = false,
    bool UseBaseWuxing = false,
    bool UseSinglePrecisionProbability = false,
    bool MatchBonusByName = false,
    bool DrawAtZeroProbability = false,
    bool SupportSpecialSkillConditions = true);

public sealed class LegendSkillResolver(LegendSkillResolutionRules? rules = null)
{
    private readonly LegendSkillResolutionRules _rules = rules ?? new();
    public SkillInstance Resolve(
        IReadOnlyList<LegendSkillDefinition> definitions,
        SkillInstance baseSkill,
        IRandomService random)
    {
        ArgumentNullException.ThrowIfNull(definitions);
        ArgumentNullException.ThrowIfNull(baseSkill);
        ArgumentNullException.ThrowIfNull(random);

        foreach (var definition in definitions)
        {
            if (!MatchesStart(definition, baseSkill))
            {
                continue;
            }
            if (!_rules.RollBeforeConditions && !ConditionsSatisfied(definition, baseSkill.Owner))
                continue;

            var triggerChance = ResolveTriggerChance(definition, baseSkill);
            var triggered = _rules.DrawAtZeroProbability && triggerChance == 0d
                ? random.NextDouble() < triggerChance
                : Probability.RollChance(random, triggerChance);
            if (!triggered || _rules.RollBeforeConditions && !ConditionsSatisfied(definition, baseSkill.Owner))
            {
                continue;
            }

            return new LegendSkillInstance(definition, baseSkill);
        }

        return baseSkill;
    }

    private static bool MatchesStart(LegendSkillDefinition definition, SkillInstance baseSkill)
    {
        if (!string.Equals(definition.StartSkill, baseSkill.Id, StringComparison.Ordinal))
        {
            return false;
        }

        if (baseSkill.Level < definition.RequiredLevel)
        {
            return false;
        }

        return true;
    }

    private bool ConditionsSatisfied(LegendSkillDefinition definition, CharacterInstance owner) =>
        definition.Conditions.All(condition => IsConditionSatisfied(owner, condition));

    private double ResolveTriggerChance(LegendSkillDefinition definition, SkillInstance baseSkill)
    {
        var owner = baseSkill.Owner;
        var wuxing = _rules.UseBaseWuxing ? owner.GetBaseStat(StatType.Wuxing) : owner.GetStat(StatType.Wuxing);
        var baseMultiplier = 1d + wuxing / 150d * 0.2d;
        var chanceMultiplier = _rules.MatchBonusByName ? baseMultiplier : owner.GetLegendChanceValue(definition.Id, baseMultiplier);
        if (owner.Traits.Contains(TraitId.BroadLearning))
        {
            chanceMultiplier += 0.5d;
        }
        foreach (var bonus in owner.Projection.Affixes.SourceSkillLegendBonuses)
            if (string.Equals(bonus.SkillName, baseSkill.Name, StringComparison.Ordinal))
                chanceMultiplier += bonus.Bonus;
        // Original content names may identify multiple ordered variants.
        // Default packs retain their existing stable-ID modifier behavior.
        if (_rules.MatchBonusByName)
        {
            chanceMultiplier = owner.GetLegendChanceValue(definition.Name, chanceMultiplier);
            // Existing browser saves/random equipment use stable variant IDs.
            // Accept those too, without applying a same-name key twice.
            if (!string.Equals(definition.Name, definition.Id, StringComparison.Ordinal))
                chanceMultiplier = owner.GetLegendChanceValue(definition.Id, chanceMultiplier);
        }
        var probability = _rules.UseSinglePrecisionProbability ? (double)(float)definition.Probability : definition.Probability;
        return probability * chanceMultiplier;
    }

    private bool IsConditionSatisfied(CharacterInstance owner, LegendSkillConditionDefinition condition) =>
        condition switch
        {
            RequiredExternalSkillLevelLegendConditionDefinition externalSkill =>
                owner.GetExternalSkills().Any(skill =>
                    string.Equals(skill.Id, externalSkill.TargetId, StringComparison.Ordinal) &&
                    skill.Level >= externalSkill.Level),
            RequiredInternalSkillLevelLegendConditionDefinition internalSkill =>
                owner.GetInternalSkills().Any(skill =>
                    string.Equals(skill.Id, internalSkill.TargetId, StringComparison.Ordinal) &&
                    skill.Level >= internalSkill.Level),
            RequiredSpecialSkillLegendConditionDefinition specialSkill =>
                _rules.SupportSpecialSkillConditions && owner.GetSpecialSkills().Any(skill =>
                    string.Equals(skill.Id, specialSkill.TargetId, StringComparison.Ordinal)),
            RequiredTalentLegendConditionDefinition talent =>
                owner.HasEffectiveTalent(talent.TargetId),
            _ => throw new NotSupportedException($"Unsupported legend skill condition '{condition.GetType().Name}'.")
        };
}
