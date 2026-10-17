using System.Text.Json;
using Game.Content.Loading;
using Game.Core.Affix;
using Game.Core.Battle;
using Game.Core.Battle.Talents;
using Game.Core.Definitions;
using Game.Core.Serialization;

namespace Game.Tests;

public sealed class MasteryContentTests
{
    private static ContentPackage Package(AffixDefinition affix) => new()
    { Talents = [new TalentDefinition { Id = "test", Name = "test", Affixes = [affix] }] };

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void RejectsInvalidLevelStep(int step) => Assert.Throws<InvalidOperationException>(() =>
        new JsonContentLoader().LoadFromPackage(Package(new HookAffix { Timing = HookTiming.BeforeDamageCalculation,
            Effects = [new ModifyDamageContextBattleHookEffectDefinition(BattleDamageContextField.CriticalChance, ModifierOp.Add, UnitLevelStep: step)] })));

    [Fact]
    public void ValidatesTargetingNameAndStage()
    {
        Assert.Throws<InvalidOperationException>(() => new JsonContentLoader().LoadFromPackage(Package(
            new SkillTargetingModifierAffix(null, SkillTargetingField.CastSize, ModifierValue.Add(3), " "))));
        Assert.Throws<InvalidOperationException>(() => new JsonContentLoader().LoadFromPackage(Package(
            new SkillTargetingModifierAffix(null, SkillTargetingField.CastSize, ModifierValue.Add(3), Stage: (SkillTargetingStage)999))));
        AffixDefinition valid = new SkillTargetingModifierAffix(null, SkillTargetingField.CastSize, ModifierValue.Override(10), "日月神鞭", SkillTargetingStage.AfterBlind);
        Assert.Equal(valid, JsonSerializer.Deserialize<AffixDefinition>(JsonSerializer.Serialize(valid, GameJson.Default), GameJson.Default));
        Assert.Single(new JsonContentLoader().LoadFromPackage(Package(valid)).GetTalent("test").Affixes);
    }

    [Theory]
    [InlineData(-.1f, 30)]
    [InlineData(.1f, 0)]
    public void RejectsInvalidLifestealRates(float rate, int divisor) => Assert.Throws<InvalidOperationException>(() =>
        new JsonContentLoader().LoadFromPackage(Package(new HookAffix { Timing = HookTiming.OnDamageDealt,
            Effects = [new CustomBattleEffectDefinition("single_precision_lifesteal", JsonSerializer.SerializeToElement(
                new SinglePrecisionLifestealBattleEffectParameters([new("血刀大法", rate)], [], new("嗜血狂魔", .05f, .05f, divisor)), GameJson.Default))] })));
}
