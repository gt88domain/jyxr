using Game.Core.Definitions;

namespace Game.Core.Model.Character;

public sealed record CharacterExperienceChange(
    CharacterInstance Character,
    int AddedExperience,
    int OldLevel,
    int NewLevel)
{
    public bool LeveledUp => NewLevel > OldLevel;
}

public static class CharacterExperienceProgression
{
    public const string DefaultGrowTemplateId = "default";
    public const int DefaultLevelUpGrantedStatPoints = 2;

    public static CharacterExperienceChange TryAddExperience(
        CharacterInstance character,
        int experience,
        int maxLevel,
        Func<GrowTemplateDefinition> growTemplateResolver,
        int levelUpGrantedStatPoints = DefaultLevelUpGrantedStatPoints,
        CharacterExperienceCurve curve = CharacterExperienceCurve.PerLevel)
    {
        ArgumentNullException.ThrowIfNull(character);
        ArgumentNullException.ThrowIfNull(growTemplateResolver);
        ArgumentOutOfRangeException.ThrowIfNegative(experience);
        ArgumentOutOfRangeException.ThrowIfLessThan(maxLevel, 1);
        ArgumentOutOfRangeException.ThrowIfNegative(levelUpGrantedStatPoints);

        var addedExperience = ExperienceGainPolicy.Resolve(character, experience);
        var oldLevel = character.Level;
        character.GrantExperience(addedExperience);

        var resolvedLevel = Math.Max(
            oldLevel,
            CharacterLevelProgression.ResolveLevel(character.Experience, maxLevel, curve));
        if (curve == CharacterExperienceCurve.LegacyCumulative)
        {
            // Legacy Role.level's setter resets EXP to PrevLevelupExp. Thus a
            // single AddExp can advance only once, discarding excess EXP.
            resolvedLevel = oldLevel < maxLevel && character.Experience > CharacterLevelProgression.GetLevelUpExperience(oldLevel)
                ? oldLevel + 1 : oldLevel;
            if (oldLevel >= maxLevel) character.SetExperience(0);
            else if (resolvedLevel > oldLevel) character.SetExperience(CharacterLevelProgression.GetLevelUpExperience(oldLevel));
        }
        if (resolvedLevel > oldLevel)
        {
            ApplyLevelUps(character, oldLevel, resolvedLevel, growTemplateResolver(), levelUpGrantedStatPoints);
            character.RebuildSnapshot();
        }

        return new CharacterExperienceChange(character, addedExperience, oldLevel, character.Level);
    }

    public static CharacterExperienceChange TryAddExperience(
        CharacterInstance character,
        int experience,
        int maxLevel,
        GrowTemplateDefinition growTemplate,
        int levelUpGrantedStatPoints = DefaultLevelUpGrantedStatPoints,
        CharacterExperienceCurve curve = CharacterExperienceCurve.PerLevel)
    {
        ArgumentNullException.ThrowIfNull(growTemplate);
        return TryAddExperience(
            character,
            experience,
            maxLevel,
            () => growTemplate,
            levelUpGrantedStatPoints,
            curve);
    }

    private static void ApplyLevelUps(
        CharacterInstance character,
        int oldLevel,
        int newLevel,
        GrowTemplateDefinition growTemplate,
        int levelUpGrantedStatPoints)
    {
        for (var currentLevel = oldLevel + 1; currentLevel <= newLevel; currentLevel += 1)
        {
            character.SetLevel(currentLevel);
            ApplyStatGrowth(character, growTemplate);
            character.GrantStatPoints(levelUpGrantedStatPoints);
        }
    }

    private static void ApplyStatGrowth(CharacterInstance character, GrowTemplateDefinition growTemplate)
    {
        foreach (var (statType, delta) in growTemplate.StatGrowth)
        {
            if (delta == 0 || statType == StatType.Wuxue)
            {
                continue;
            }

            character.AddBaseStat(statType, delta);
        }
    }
}
