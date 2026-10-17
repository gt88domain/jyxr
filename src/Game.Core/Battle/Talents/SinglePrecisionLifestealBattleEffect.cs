using Game.Core.Affix;
using Game.Core.Model;

namespace Game.Core.Battle.Talents;

public sealed record SkillLifestealRate(string Name, float Rate);
public sealed record TalentLifestealRate(string TalentId, float Rate, bool RequiresNamedSkill = true);
public sealed record LevelLifestealRate(string TalentId, float BaseRate, float RatePerLevel, int Divisor);
public sealed record SinglePrecisionLifestealBattleEffectParameters(
    IReadOnlyList<SkillLifestealRate> SkillRates,
    IReadOnlyList<TalentLifestealRate> TalentRates,
    LevelLifestealRate LevelRate);

internal sealed class SinglePrecisionLifestealBattleEffectHandler
    : CustomBattleEffectHandler<SinglePrecisionLifestealBattleEffectParameters, IDamageDealtEffectContext>
{
    public override IReadOnlySet<HookTiming> SupportedTimings { get; } = new HashSet<HookTiming> { HookTiming.OnDamageDealt };

    public override void Validate(SinglePrecisionLifestealBattleEffectParameters p)
    {
        if (p.SkillRates is null || p.TalentRates is null || p.LevelRate is null ||
            p.SkillRates.Any(r => r is null || string.IsNullOrWhiteSpace(r.Name) || !float.IsFinite(r.Rate) || r.Rate < 0) ||
            p.SkillRates.Select(r => r.Name).Distinct(StringComparer.Ordinal).Count() != p.SkillRates.Count ||
            p.TalentRates.Any(r => r is null || string.IsNullOrWhiteSpace(r.TalentId) || !float.IsFinite(r.Rate) || r.Rate < 0) ||
            string.IsNullOrWhiteSpace(p.LevelRate.TalentId) || p.LevelRate.Divisor <= 0 ||
            !float.IsFinite(p.LevelRate.BaseRate) || p.LevelRate.BaseRate < 0 ||
            !float.IsFinite(p.LevelRate.RatePerLevel) || p.LevelRate.RatePerLevel < 0)
            throw new InvalidOperationException("Single-precision lifesteal requires named, finite nonnegative rates and a positive level divisor.");
    }

    public override void Execute(IDamageDealtEffectContext context, SinglePrecisionLifestealBattleEffectParameters p)
    {
        if (context.Source is null || context.Source != context.Unit || context.Skill is null || !context.Unit.IsAlive) return;
        // This invocation owns the entire drain for this hit, preventing the
        // default actual-damage/double-precision path from healing a second time.
        context.LifestealRate = 0;
        var skill = p.SkillRates.FirstOrDefault(r => string.Equals(r.Name, context.Skill.Name, StringComparison.Ordinal));
        var rate = skill?.Rate ?? 0f;
        foreach (var bonus in p.TalentRates)
            if ((skill is not null || !bonus.RequiresNamedSkill) && context.Unit.Character.HasEffectiveTalent(bonus.TalentId))
                rate += bonus.Rate;
        if (context.Unit.Character.HasEffectiveTalent(p.LevelRate.TalentId))
        {
            var scaled = (float)((double)(p.LevelRate.RatePerLevel * context.Unit.Character.Level) / p.LevelRate.Divisor);
            rate += p.LevelRate.BaseRate + scaled;
        }
        rate += (float)context.Unit.GetStat(StatType.Lifesteal);
        var amount = (int)((float)context.IncomingDamageAmount * rate);
        if (amount > 0) context.ApplyLifestealRecovery(amount);
    }
}
