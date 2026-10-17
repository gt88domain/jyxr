using Game.Content.Loading;
using Game.Core.Affix;
using Game.Core.Definitions;

namespace Game.Tests;

public sealed class RandomDamageModifierTests
{
    private static ContentPackage Package(HookTiming timing, double? minimum, double? maximum, double fixedValue = 0) => new()
    {
        Talents = [new TalentDefinition
        {
            Id = "range", Name = "range", Affixes = [new HookAffix
            {
                Timing = timing,
                Effects = [new ModifyDamageBattleHookEffectDefinition(ModifierOp.More, Delta: fixedValue, DeltaMin: minimum, DeltaMax: maximum)]
            }]
        }]
    };

    [Theory]
    [InlineData(HookTiming.AfterDamageCalculation)]
    [InlineData(HookTiming.BeforeDamageApplied)]
    public void AcceptsFiniteRangeAtDamageResultTimings(HookTiming timing)
    {
        var content = new JsonContentLoader().LoadFromPackage(Package(timing, 1.2, 1.8));
        Assert.Single(content.GetTalent("range").Affixes);
    }

    [Theory]
    [InlineData(1.2, null, 0)]
    [InlineData(null, 1.8, 0)]
    [InlineData(2d, 1d, 0)]
    [InlineData(1.2, 1.8, 1)]
    [InlineData(double.NaN, 1.8, 0)]
    [InlineData(1.2, double.PositiveInfinity, 0)]
    public void RejectsInvalidOrAmbiguousRanges(double? minimum, double? maximum, double fixedValue)
    {
        Assert.Throws<InvalidOperationException>(() => new JsonContentLoader().LoadFromPackage(
            Package(HookTiming.AfterDamageCalculation, minimum, maximum, fixedValue)));
    }
}
