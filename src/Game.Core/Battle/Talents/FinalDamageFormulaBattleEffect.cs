using Game.Core.Affix;
using Game.Core.Model;

namespace Game.Core.Battle.Talents;

public enum FinalDamageFormula { AbsoluteMpDifference, CurrentHpMinimum, AttributeRandomAddition, NamedCompanionMultiplier }

public sealed record FinalDamageFormulaParameters(
    FinalDamageFormula Formula,
    double Minimum = 0,
    double Maximum = 0,
    int Cap = 10000,
    StatType Attribute = StatType.Shenfa,
    string? BeneficiaryName = null,
    string? CompanionName = null);

internal sealed class FinalDamageFormulaBattleEffectHandler : CustomBattleEffectHandler<FinalDamageFormulaParameters, IFinalDamageEffectContext>
{
    public override IReadOnlySet<HookTiming> SupportedTimings { get; } = new HashSet<HookTiming> { HookTiming.AfterDamageCalculation };
    public override void Validate(FinalDamageFormulaParameters p)
    {
        if (!Enum.IsDefined(p.Formula) || !double.IsFinite(p.Minimum) || !double.IsFinite(p.Maximum) || p.Minimum < 0 || p.Maximum < p.Minimum || p.Cap < 0)
            throw new InvalidOperationException("Invalid final damage formula range.");
    }

    public override void Execute(IFinalDamageEffectContext c, FinalDamageFormulaParameters p)
    {
        if (c.Source is null || c.Target is null) return;
        switch (p.Formula)
        {
            case FinalDamageFormula.AbsoluteMpDifference:
                c.DamageAmount += (int)(Math.Min(Math.Abs(c.Source.Mp - c.Target.Mp), p.Cap) * (p.Minimum + c.Random.NextDouble() * (p.Maximum - p.Minimum)));
                break;
            case FinalDamageFormula.CurrentHpMinimum:
                c.DamageAmount = Math.Max(c.DamageAmount, (int)(c.Target.Hp * (float)p.Minimum));
                break;
            case FinalDamageFormula.AttributeRandomAddition:
                var value = Math.Max(0, (int)c.Source.GetStat(p.Attribute));
                c.DamageAmount += c.Random.Next((int)(value * p.Minimum), (int)(value * p.Maximum) + 1);
                break;
            case FinalDamageFormula.NamedCompanionMultiplier:
                if (c.Source.Character.Name != p.BeneficiaryName || c.DamageAmount <= 0) return;
                if (p.CompanionName is not null && !c.State.GetLivingUnits().Any(u => u.Team == c.Source.Team && u.Character.Name == p.CompanionName)) return;
                c.DamageAmount = (int)(c.DamageAmount * (p.Minimum + c.Random.NextDouble() * (p.Maximum - p.Minimum)));
                break;
        }
    }
}
