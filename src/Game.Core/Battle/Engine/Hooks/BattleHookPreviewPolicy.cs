using Game.Core.Affix;

namespace Game.Core.Battle;

internal static class BattleHookPreviewPolicy
{
    internal static bool IsSafe(HookAffix hook) => hook.Speech is null && hook.FloatText is null &&
        !hook.Conditions.Any(c => c is ChanceBattleHookConditionDefinition or UnitLevelChanceBattleHookConditionDefinition or BuffLevelChanceBattleHookConditionDefinition or StatDifferenceChanceBattleHookConditionDefinition) &&
        hook.Effects.All(e => e is ModifyDamageBattleHookEffectDefinition or ModifyDamageContextBattleHookEffectDefinition or ModifyMpCostBattleHookEffectDefinition or ModifyRecoveryBattleHookEffectDefinition or CustomBattleEffectDefinition { SupportsPreview: true });

    public static void EnsureSafe(BattleHookContext context, HookAffix hook)
    {
        if (!context.IsPreview)
        {
            return;
        }

        if (hook.Speech is not null)
        {
            throw Unsupported(context, "speech");
        }

        if (hook.FloatText is not null)
        {
            throw Unsupported(context, "float text");
        }

        if (hook.Conditions.Any(static condition => condition is
                ChanceBattleHookConditionDefinition or UnitLevelChanceBattleHookConditionDefinition or BuffLevelChanceBattleHookConditionDefinition or StatDifferenceChanceBattleHookConditionDefinition))
        {
            throw Unsupported(context, "random chance conditions");
        }

        foreach (var effect in hook.Effects)
        {
            switch (effect)
            {
                case ModifyDamageBattleHookEffectDefinition:
                case ModifyDamageContextBattleHookEffectDefinition:
                case ModifyMpCostBattleHookEffectDefinition:
                case ModifyRecoveryBattleHookEffectDefinition:
                case CustomBattleEffectDefinition { SupportsPreview: true }:
                    break;
                case CustomBattleEffectDefinition:
                    throw Unsupported(context, $"side-effect effect '{effect.GetType().Name}'");
                case StrengthenContextBuffBattleHookEffectDefinition:
                case ApplyBuffBattleEffectDefinition:
                case RemoveBuffBattleEffectDefinition:
                case RemoveNegativeBuffsBattleEffectDefinition:
                case RemovePositiveBuffsBattleEffectDefinition:
                case RemoveContextBuffBattleEffectDefinition:
                case AddRageBattleEffectDefinition:
                case SetRageBattleEffectDefinition:
                case AddActionGaugeBattleEffectDefinition:
                case SetActionGaugeBattleEffectDefinition:
                case AddHpBattleEffectDefinition:
                case AddMpBattleEffectDefinition:
                case CancelHitBattleHookEffectDefinition:
                case SetHitSuccessBattleHookEffectDefinition:
                case ExtraStrikeBattleHookEffectDefinition:
                    throw Unsupported(context, $"side-effect effect '{effect.GetType().Name}'");
                default:
                    throw new NotSupportedException($"Unsupported preview battle hook effect '{effect.GetType().Name}'.");
            }
        }
    }

    private static InvalidOperationException Unsupported(BattleHookContext context, string feature) =>
        new($"Preview battle hook execution does not support {feature} on timing '{context.Timing}'.");
}
