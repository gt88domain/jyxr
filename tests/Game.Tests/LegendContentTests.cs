using System.Text.Json;
using Game.Content.Loading;
using Game.Core.Affix;
using Game.Core.Definitions;
using Game.Core.Serialization;

namespace Game.Tests;

public sealed class LegendContentTests
{
    private static ContentPackage Package(AffixDefinition affix) => new()
    { Talents = [new TalentDefinition { Id = "test", Name = "test", Affixes = [affix] }] };

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    public void RejectsUnnamedSourceSkillBonus(string name) => Assert.Throws<InvalidOperationException>(() =>
        new JsonContentLoader().LoadFromPackage(Package(new SourceSkillLegendChanceBonusAffix(name, .1))));

    [Fact]
    public void RejectsNonFiniteBonus() => Assert.Throws<InvalidOperationException>(() =>
        new JsonContentLoader().LoadFromPackage(Package(new SourceSkillLegendChanceBonusAffix("strike", double.NaN))));

    [Fact]
    public void SourceSkillBonusSurvivesJsonAndProjection()
    {
        AffixDefinition affix = new SourceSkillLegendChanceBonusAffix("strike", .1);
        var restored = JsonSerializer.Deserialize<AffixDefinition>(JsonSerializer.Serialize(affix, GameJson.Default), GameJson.Default)!;
        var content = new JsonContentLoader().LoadFromPackage(Package(restored));
        var resolved = AffixResolver.Resolve([], [content.GetTalent("test")]);
        var projected = Assert.Single(AffixProjectionBuilder.BuildCharacter(resolved).Affixes.SourceSkillLegendBonuses);
        Assert.Equal("strike", projected.SkillName);
        Assert.Equal(.1, projected.Bonus);
    }
}
