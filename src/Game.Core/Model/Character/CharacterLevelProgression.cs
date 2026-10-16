using Game.Core.Model;

namespace Game.Core.Model.Character;

public static class CharacterLevelProgression
{
    public static int DefaultMaxLevel => new GameConfig().MaxLevel;

    public static int GetLevelUpExperience(int level)
    {
        if (level <= 0)
        {
            return 0;
        }

        var required = 0;
        for (var currentLevel = 1; currentLevel <= level; currentLevel += 1)
        {
            required = checked((int)(currentLevel * 20 + 1.1 * required));
        }

        return required;
    }

    public static int GetTotalExperienceRequiredForLevel(int level, CharacterExperienceCurve curve = CharacterExperienceCurve.PerLevel)
    {
        ArgumentOutOfRangeException.ThrowIfLessThan(level, 1);

        if (curve == CharacterExperienceCurve.LegacyCumulative)
            return GetLevelUpExperience(level - 1);

        var totalRequired = 0;
        for (var currentLevel = 1; currentLevel < level; currentLevel += 1)
        {
            totalRequired = checked(totalRequired + GetLevelUpExperience(currentLevel));
        }

        return totalRequired;
    }

    public static int ResolveLevel(int totalExperience, int? maxLevel = null, CharacterExperienceCurve curve = CharacterExperienceCurve.PerLevel)
    {
        ArgumentOutOfRangeException.ThrowIfNegative(totalExperience);
        var effectiveMaxLevel = ResolveMaxLevel(maxLevel);

        var resolvedLevel = 1;
        var requiredTotalExperience = 0;
        for (var currentLevel = 1; currentLevel < effectiveMaxLevel; currentLevel += 1)
        {
            if (curve == CharacterExperienceCurve.LegacyCumulative)
            {
                // Original Role.AddExp retains cumulative EXP and uses strict >.
                if (totalExperience <= GetLevelUpExperience(currentLevel)) break;
                resolvedLevel = currentLevel + 1;
                continue;
            }
            requiredTotalExperience = checked(requiredTotalExperience + GetLevelUpExperience(currentLevel));
            if (totalExperience < requiredTotalExperience)
            {
                break;
            }

            resolvedLevel = currentLevel + 1;
        }

        return resolvedLevel;
    }

    public static (int CurrentExperience, int NextLevelExperience) GetDisplayProgress(
        int level,
        int totalExperience,
        int? maxLevel = null,
        CharacterExperienceCurve curve = CharacterExperienceCurve.PerLevel)
    {
        ArgumentOutOfRangeException.ThrowIfLessThan(level, 1);
        ArgumentOutOfRangeException.ThrowIfNegative(totalExperience);
        var effectiveMaxLevel = ResolveMaxLevel(maxLevel);

        var clampedLevel = Math.Min(level, effectiveMaxLevel);
        var currentLevelStartExperience = GetTotalExperienceRequiredForLevel(clampedLevel, curve);
        var nextLevelExperience = curve == CharacterExperienceCurve.LegacyCumulative
            ? GetLevelUpExperience(clampedLevel) - currentLevelStartExperience + 1
            : GetLevelUpExperience(clampedLevel);
        if (clampedLevel >= effectiveMaxLevel)
        {
            return (nextLevelExperience, nextLevelExperience);
        }

        var currentExperience = Math.Clamp(totalExperience - currentLevelStartExperience, 0, nextLevelExperience);
        return (currentExperience, nextLevelExperience);
    }

    private static int ResolveMaxLevel(int? maxLevel)
    {
        var effectiveMaxLevel = maxLevel ?? DefaultMaxLevel;
        ArgumentOutOfRangeException.ThrowIfLessThan(effectiveMaxLevel, 1);
        return effectiveMaxLevel;
    }
}
