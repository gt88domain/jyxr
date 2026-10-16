using Game.Application;
using Game.Core.Definitions;
using Game.Core.Model;
using Game.Core.Model.Character;

namespace Game.Tests;

public sealed class CharacterExperienceCurveTests
{
    [Theory]
    [InlineData(1, 20)]
    [InlineData(2, 62)]
    [InlineData(9, 1184)]
    [InlineData(21, 9859)]
    [InlineData(24, 14639)]
    [InlineData(29, 26848)]
    public void LegacyCumulative_UsesSourceThresholdAndStrictGreaterThan(int level, int threshold)
    {
        Assert.Equal(threshold, CharacterLevelProgression.GetLevelUpExperience(level));
        Assert.Equal(level, CharacterLevelProgression.ResolveLevel(threshold, curve: CharacterExperienceCurve.LegacyCumulative));
        Assert.Equal(level + 1, CharacterLevelProgression.ResolveLevel(threshold + 1, curve: CharacterExperienceCurve.LegacyCumulative));
    }

    [Fact]
    public void LegacySession_LevelUpAndExperienceUseSameCurveAndGrowth()
    {
        var definition = TestContentFactory.CreateCharacterDefinition("hero", level: 22);
        var grow = TestContentFactory.CreateGrowTemplate(CharacterExperienceProgression.DefaultGrowTemplateId,
            new Dictionary<StatType, int> { [StatType.Bili] = 3, [StatType.MaxHp] = 100 });
        var config = new GameConfig { CharacterExperienceCurve = CharacterExperienceCurve.LegacyCumulative };
        var hero = CharacterMapper.CreateInitial("hero", definition, new EquipmentInstanceFactory(), config);
        Assert.Equal(9859, hero.Experience);
        var state = new GameState(); state.Party.AddMember(hero);
        var session = new GameSession(state, TestContentFactory.CreateRepository(characters: [definition], growTemplates: [grow]), config: config);
        var bili = hero.GetBaseStat(StatType.Bili);
        session.CharacterService.GainExperience("hero", 1425);
        Assert.Equal(22, hero.Level); // 11284 equals the source threshold.
        session.CharacterService.GainExperience("hero", 1);
        Assert.Equal(23, hero.Level);
        Assert.Equal(bili + 3, hero.GetBaseStat(StatType.Bili));
        session.CharacterService.LevelUp("hero", 2);
        Assert.Equal(25, hero.Level);
        Assert.Equal(14639, hero.Experience);
        Assert.Equal(bili + 9, hero.GetBaseStat(StatType.Bili));
        Assert.Equal(6, hero.UnspentStatPoints);
    }

    [Fact]
    public void Curves_KeepModernDefaultAndDisplayCorrectLegacyInterval()
    {
        Assert.Equal(22, CharacterLevelProgression.ResolveLevel(62337));
        Assert.Equal(30, CharacterLevelProgression.ResolveLevel(62337, curve: CharacterExperienceCurve.LegacyCumulative));
        Assert.Equal((1425, 1426), CharacterLevelProgression.GetDisplayProgress(22, 11284, curve: CharacterExperienceCurve.LegacyCumulative));
        Assert.Equal(62337, CharacterLevelProgression.GetTotalExperienceRequiredForLevel(22));
    }

    [Fact]
    public void LegacyCumulative_LargeAwardResetsOverflowAndAdvancesOnceThenHonorsCap()
    {
        var definition = TestContentFactory.CreateCharacterDefinition("hero");
        var hero = TestContentFactory.CreateCharacterInstance("hero", definition);
        var grow = TestContentFactory.CreateGrowTemplate("default", new Dictionary<StatType, int> { [StatType.Bili] = 2 });
        var bili = hero.GetBaseStat(StatType.Bili);
        var change = CharacterExperienceProgression.TryAddExperience(hero, 14640, 2, grow, curve: CharacterExperienceCurve.LegacyCumulative);
        Assert.Equal(2, change.NewLevel);
        Assert.Equal(20, hero.Experience);
        Assert.Equal(bili + 2, hero.GetBaseStat(StatType.Bili));
        Assert.Equal(2, hero.UnspentStatPoints);
        CharacterExperienceProgression.TryAddExperience(hero, 99999, 2, grow, curve: CharacterExperienceCurve.LegacyCumulative);
        Assert.Equal(2, hero.Level);
        Assert.Equal(0, hero.Experience);
        Assert.Equal(2, hero.UnspentStatPoints);
    }
}
