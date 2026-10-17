using Game.Core.Affix;

namespace Game.Core.Battle.Talents;

public sealed record ActionGaugeRuleParameters(
    [property: NonNegative] int Minimum,
    [property: NonNegative] int Maximum,
    bool CapAllEnemies = false);

internal sealed class ActionGaugeRuleBattleEffectHandler : CustomBattleEffectHandler<ActionGaugeRuleParameters, IBattleEffectContext>
{
    public override IReadOnlySet<HookTiming> SupportedTimings { get; } = new HashSet<HookTiming> { HookTiming.OnHitConfirmed, HookTiming.AfterSkillCast };
    public override void Validate(ActionGaugeRuleParameters p)
    {
        if (p.Maximum < p.Minimum) throw new InvalidOperationException("Invalid action gauge range.");
    }
    public override void Execute(IBattleEffectContext c, ActionGaugeRuleParameters p)
    {
        if (p.CapAllEnemies)
        {
            foreach (var unit in c.State.GetLivingUnits().Where(u => u.Team != c.Unit.Team))
            {
                var before = unit.ActionGauge;
                unit.SetActionGauge(Math.Min(before, p.Maximum));
                c.State.AddMessage(new BattleFact(BattleFactKind.ActionGaugeChanged, unit.Id, c.Timing,
                    detail: (unit.ActionGauge - before).ToString(System.Globalization.CultureInfo.InvariantCulture)));
            }
        }
        else if (c.Target is not null)
            BattleResourceResolver.AddActionGauge(c.State, c.Target, -c.Random.Next(p.Minimum, p.Maximum + 1), c.Timing);
    }
}
