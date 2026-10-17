using Game.Core.Affix;
using Game.Core.Model;

namespace Game.Core.Battle.Talents;

public sealed record InternalEnergyAttackBattleEffectParameters(
    double Power,
    double RandomMinimum = 1d,
    double RandomMaximum = 1d,
    bool Transfer = true,
    bool IntegerArithmetic = false,
    bool MultiplyPowerBeforeDivision = false,
    string? AppliedBuffId = null);

internal sealed class InternalEnergyAttackBattleEffectHandler
    : CustomBattleEffectHandler<InternalEnergyAttackBattleEffectParameters, IBattleEffectContext>
{
    private const double ResistanceMinimum = 0.25d;
    private const double ResistanceMaximum = 2d;

    public override IReadOnlySet<HookTiming> SupportedTimings { get; } =
        new HashSet<HookTiming> { HookTiming.OnHitConfirmed };

    public override void Validate(InternalEnergyAttackBattleEffectParameters parameters)
    {
        if (parameters.Power < 0d ||
            parameters.RandomMinimum < 0d ||
            parameters.RandomMaximum < parameters.RandomMinimum)
        {
            throw new InvalidOperationException("Internal energy attack parameters contain an invalid range.");
        }
        if (parameters.IntegerArithmetic && parameters.Power != Math.Truncate(parameters.Power))
            throw new InvalidOperationException("Integer internal energy arithmetic requires an integer power.");
    }

    public override void Execute(
        IBattleEffectContext context,
        InternalEnergyAttackBattleEffectParameters parameters)
    {
        if (context is not BattleHookContext hookContext ||
            context.Source is null ||
            context.Target is null || context.Source.Id == context.Target.Id || context.Target.Mp <= 0)
        {
            return;
        }

        var internalSkillLevel = context.Source.Character.InternalSkills
            .SingleOrDefault(static skill => skill.IsEquipped)?.Level ?? 0;
        var resistance = Math.Clamp(
            2d - context.Target.GetStat(StatType.Dingli) / 100d,
            ResistanceMinimum,
            ResistanceMaximum);
        var randomFactor = parameters.IntegerArithmetic && parameters.RandomMinimum == parameters.RandomMaximum
            ? parameters.RandomMinimum
            : parameters.RandomMinimum + context.Random.NextDouble() * (parameters.RandomMaximum - parameters.RandomMinimum);
        var power = context.Source.GetStat(StatType.Gengu) * internalSkillLevel / 10d * parameters.Power * resistance;
        if (parameters.IntegerArithmetic)
        {
            var gengu = context.Source.Character.GetBaseStat(StatType.Gengu);
            var dingli = context.Target.Character.GetBaseStat(StatType.Dingli);
            power = parameters.MultiplyPowerBeforeDivision
                ? checked(gengu * (int)parameters.Power * internalSkillLevel) / 10
                : checked(gengu * internalSkillLevel) / 10 * (int)parameters.Power;
            power *= 2 - dingli / 100;
        }
        var requested = Math.Max(0, (int)(power * randomFactor));
        var actual = hookContext.DamageMp(context.Target, requested);
        if (parameters.AppliedBuffId is { } buffId)
            ((IHitConfirmedEffectContext)hookContext).ApplyBuff(context.Target, buffId, 0, 3);
        if (!parameters.Transfer || actual == 0)
        {
            return;
        }

        var restored = hookContext.Engine.RecoveryResolver
            .Apply(context.State, context.Source, context.Source, BattleRecoveryKind.Mp, actual)
            .ActualAmount;
        if (restored > 0)
        {
            context.State.AddMessage(new BattleFact(
                BattleFactKind.MpRecovered,
                context.Source.Id,
                context.Timing,
                detail: restored.ToString()));
        }
    }
}

public sealed record GrievingBreezeBattleEffectParameters;

internal sealed class GrievingBreezeBattleEffectHandler
    : CustomBattleEffectHandler<GrievingBreezeBattleEffectParameters, IActionPreparationEffectContext>
{
    private const int Radius = 3;
    private const double CurrentMpDamageRatio = 0.5d;

    public override IReadOnlySet<HookTiming> SupportedTimings { get; } =
        new HashSet<HookTiming> { HookTiming.BeforeActionReadiness, HookTiming.BeforeActionStart };

    public override void Execute(
        IActionPreparationEffectContext context,
        GrievingBreezeBattleEffectParameters parameters)
    {
        if (context is not BattleHookContext hookContext)
        {
            return;
        }

        foreach (var target in context.State.GetLivingUnits()
                     .Where(target => target.Team != context.Unit.Team)
                     .Where(target => target.Position.ManhattanDistanceTo(context.Unit.Position) <= Radius))
        {
            hookContext.DamageMp(target, (int)Math.Ceiling(target.Mp * CurrentMpDamageRatio));
        }
    }
}
