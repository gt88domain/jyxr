using Game.Core.Model;
using Game.Core.Model.Character;
using Game.Core.Persistence;

namespace Game.Web.Runtime;

internal static class BrowserExperienceMigration
{
    // Only the numerical curve changes. Retain the earned level, growth, points,
    // equipment and skills; map the fraction earned within that level once.
    public static CharacterRecord ToLegacyCumulative(CharacterRecord record)
    {
        ArgumentOutOfRangeException.ThrowIfNegative(record.Experience);
        var oldStart = CharacterLevelProgression.GetTotalExperienceRequiredForLevel(record.Level);
        var oldSpan = CharacterLevelProgression.GetLevelUpExperience(record.Level);
        var newStart = CharacterLevelProgression.GetTotalExperienceRequiredForLevel(record.Level, CharacterExperienceCurve.LegacyCumulative);
        var newSpan = CharacterLevelProgression.GetLevelUpExperience(record.Level) - newStart;
        var offset = Math.Clamp(record.Experience - oldStart, 0, oldSpan - 1);
        return record with { Experience = newStart + (int)((long)offset * newSpan / oldSpan) };
    }
}

internal sealed partial class BrowserRuntimeSession
{
    private int NextCharacterLevelExperience(CharacterInstance character) =>
        RequireSession().Config.CharacterExperienceCurve == CharacterExperienceCurve.LegacyCumulative
            ? CharacterLevelProgression.GetLevelUpExperience(character.Level) + 1
            : CharacterLevelProgression.GetTotalExperienceRequiredForLevel(character.Level + 1);
}
