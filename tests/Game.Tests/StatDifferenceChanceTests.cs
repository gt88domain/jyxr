using System.Text.Json;
using Game.Content.Loading;
using Game.Core.Affix;
using Game.Core.Battle;
using Game.Core.Definitions;
using Game.Core.Model;
using Game.Core.Serialization;

namespace Game.Tests;

public sealed class StatDifferenceChanceTests
{
    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void RejectsNonPositiveDivisor(int divisor) =>
        Assert.Throws<InvalidOperationException>(() => new JsonContentLoader().LoadFromPackage(Package(
            new StatDifferenceChanceBattleHookConditionDefinition(StatType.Fuyuan, StatType.Dingli, divisor))));

    [Fact]
    public void RejectsUndefinedStat() => Assert.Throws<InvalidOperationException>(() =>
        new JsonContentLoader().LoadFromPackage(Package(new StatDifferenceChanceBattleHookConditionDefinition((StatType)9999, StatType.Dingli))));

    [Fact]
    public void RoundTripsProbabilitySemantics()
    {
        BattleHookConditionDefinition condition = new StatDifferenceChanceBattleHookConditionDefinition(StatType.Fuyuan, StatType.Dingli, 100, true, true);
        Assert.Equal(condition, JsonSerializer.Deserialize<BattleHookConditionDefinition>(JsonSerializer.Serialize(condition, GameJson.Default), GameJson.Default));
        Assert.Single(new JsonContentLoader().LoadFromPackage(Package(condition)).GetTalent("stat-chance").Affixes);
    }

    private static ContentPackage Package(BattleHookConditionDefinition condition) => new()
    {
        Talents = [new TalentDefinition { Id = "stat-chance", Name = "stat-chance", Affixes = [new HookAffix
        {
            Timing = HookTiming.OnHitConfirmed, Conditions = [condition],
            Effects = [new AddRageBattleEffectDefinition(new SelfBattleUnitSelectorDefinition(), 1)]
        }] }]
    };
}
