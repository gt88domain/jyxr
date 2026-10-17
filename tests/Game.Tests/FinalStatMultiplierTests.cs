using System.Text.Json;
using Game.Application.Formatters;
using Game.Content.Loading;
using Game.Core.Affix;
using Game.Core.Battle;
using Game.Core.Definitions;
using Game.Core.Model;
using Game.Core.Model.Character;
using Game.Core.Serialization;

namespace Game.Tests;

public sealed class FinalStatMultiplierTests
{
    [Fact]
    public void AppliesInDeclaredOrderAfterAdditionsAcrossCharacterAndBattleProjections()
    {
        // 4*1.2 truncates to 4, then *1.05 still yields 4. Combining factors
        // first would yield 5. The reversed acquisition order must not matter.
        var character = CharacterMapper.CreateInitial("hero", TestContentFactory.CreateCharacterDefinition("hero"), new EquipmentInstanceFactory());
        character.BaseStats[StatType.Jianfa] = 3;
        character.LearnTalent(new TalentDefinition { Id = "later", Name = "later", Affixes = [
            new FinalStatMultiplierAffix(StatType.Jianfa, 1.05, 10)] });
        character.LearnTalent(new TalentDefinition { Id = "earlier", Name = "earlier", Affixes = [
            new FinalStatMultiplierAffix(StatType.Jianfa, 1.2, 0),
            new StatModifierAffix(StatType.Jianfa, ModifierValue.Add(1))] });
        Assert.Equal(4d, character.GetStat(StatType.Jianfa));
        var unit = new BattleUnit("hero", character, 1, new GridPosition(0, 0));
        Assert.Equal(4d, unit.GetStat(StatType.Jianfa));
        var state = new BattleState(new BattleGrid(3, 2), [unit]);
        Assert.Equal(4d, new BattleEffectProjectionResolver(state).GetStat(unit, StatType.Jianfa));
    }

    [Theory]
    [InlineData(0d)]
    [InlineData(1.05)]
    public void AffixSurvivesJsonAndValidates(double multiplier)
    {
        AffixDefinition affix = new FinalStatMultiplierAffix(StatType.Quanzhang, multiplier, 3);
        var text = JsonSerializer.Serialize(affix, GameJson.Default);
        Assert.Equal(affix, JsonSerializer.Deserialize<AffixDefinition>(text, GameJson.Default));
        var content = new JsonContentLoader().LoadFromPackage(Package(multiplier));
        Assert.Single(content.GetTalent("scale").Affixes);
        Assert.Contains("逐次取整", AffixFormatter.FormatCn(affix, content));
    }

    [Theory]
    [InlineData(-0.1)]
    [InlineData(double.NaN)]
    [InlineData(double.PositiveInfinity)]
    public void RejectsInvalidFactors(double multiplier) =>
        Assert.Throws<InvalidOperationException>(() => new JsonContentLoader().LoadFromPackage(Package(multiplier)));

    private static ContentPackage Package(double multiplier) => new()
    {
        Talents = [new TalentDefinition { Id = "scale", Name = "scale", Affixes = [
            new FinalStatMultiplierAffix(StatType.Quanzhang, multiplier)] }]
    };
}
