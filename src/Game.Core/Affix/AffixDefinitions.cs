using System.Text.Json.Serialization;
using Game.Core.Abstractions;
using Game.Core.Battle;
using Game.Core.Definitions;
using Game.Core.Model;
using Game.Core.Model.Skills;

namespace Game.Core.Affix;

public interface IAffixProvider
{
    ProviderKind ProviderKind { get; }

    IReadOnlyList<AffixDefinition> Affixes { get; }
}

[JsonPolymorphic(TypeDiscriminatorPropertyName = "type")]
[JsonDerivedType(typeof(StatModifierAffix), "stat_modifier")]
[JsonDerivedType(typeof(FinalStatMultiplierAffix), "final_stat_multiplier")]
[JsonDerivedType(typeof(GrantTalentAffix), "grant_talent")]
[JsonDerivedType(typeof(GrantModelAffix), "grant_model")]
[JsonDerivedType(typeof(SkillBonusModifierAffix), "skill_bonus_modifier")]
[JsonDerivedType(typeof(WeaponBonusModifierAffix), "weapon_bonus_modifier")]
[JsonDerivedType(typeof(LegendSkillChanceModifierAffix), "legend_skill_chance_modifier")]
[JsonDerivedType(typeof(SourceSkillLegendChanceBonusAffix), "source_skill_legend_chance_bonus")]
[JsonDerivedType(typeof(BuffLevelStatModifierAffix), "buff_level_stat_modifier")]
[JsonDerivedType(typeof(SkillTargetingModifierAffix), "skill_targeting_modifier")]
[JsonDerivedType(typeof(HookAffix), "hook")]
[JsonDerivedType(typeof(TraitAffix), "trait")]
public abstract record AffixDefinition
{
    [JsonIgnore]
    public ProviderKind SourceKind { get; internal init; } = ProviderKind.Other;

    [JsonIgnore]
    public string SourceId { get; internal init; } = "";

    [JsonIgnore]
    public int SourceAffixOrder { get; internal init; }

    public virtual void Resolve(IContentRepository contentRepository)
    {
    }
}

public sealed record SkillAffixDefinition(
    AffixDefinition Effect,
    int MinimumLevel = 1,
    bool RequiresEquippedInternalSkill = false);

public sealed record StatModifierAffix(StatType Stat, ModifierValue Value) : AffixDefinition;

// Applies after the ordinary modifier bucket, in ascending Order. Each step
// truncates independently, so these cannot be combined as ModifierOp.More.
public sealed record FinalStatMultiplierAffix(StatType Stat, double Multiplier, int Order = 0) : AffixDefinition;

public sealed record GrantTalentAffix(string TalentId) : AffixDefinition
{
    [JsonIgnore]
    public TalentDefinition Talent { get; private set; } = null!;

    public override void Resolve(IContentRepository contentRepository)
    {
        Talent = contentRepository.GetTalent(TalentId);
    }
}

public sealed record GrantModelAffix(string ModelId, int Priority, string Description = "") : AffixDefinition;

public sealed record SkillBonusModifierAffix(string SkillId, ModifierValue Value) : AffixDefinition;

public sealed record WeaponBonusModifierAffix(WeaponType WeaponType, ModifierValue Value) : AffixDefinition;

public sealed record LegendSkillChanceModifierAffix(string SkillId, ModifierValue Value) : AffixDefinition;

public sealed record SourceSkillLegendChanceBonusAffix(string SkillName, double Bonus) : AffixDefinition
{
    public override void Resolve(IContentRepository contentRepository)
    {
        if (string.IsNullOrWhiteSpace(SkillName) || !double.IsFinite(Bonus))
            throw new InvalidOperationException("Source skill legend bonus requires a name and finite bonus.");
    }
}

public sealed record BuffLevelStatModifierAffix(
    StatType Stat,
    double AddBase = 0d,
    double AddPerLevel = 0d,
    double MulPerLevel = 0d) : AffixDefinition;

public sealed record SkillTargetingModifierAffix(
    string? SourceSkillId,
    SkillTargetingField Field,
    ModifierValue Value,
    string? SkillName = null,
    SkillTargetingStage Stage = SkillTargetingStage.BeforeBlind) : AffixDefinition
{
    public override void Resolve(IContentRepository contentRepository)
    {
        if (!Enum.IsDefined(Stage) || SkillName is not null && string.IsNullOrWhiteSpace(SkillName))
            throw new InvalidOperationException("Skill targeting modifier requires a valid stage and nonempty optional skill name.");
        if (SourceSkillId is null)
        {
            return;
        }

        if (string.IsNullOrWhiteSpace(SourceSkillId) ||
            (!contentRepository.TryGetExternalSkill(SourceSkillId, out _) &&
            !contentRepository.TryGetInternalSkill(SourceSkillId, out _) &&
            !contentRepository.TryGetSpecialSkill(SourceSkillId, out _)))
        {
            throw new InvalidOperationException(
                $"Skill targeting modifier references missing source skill '{SourceSkillId}'.");
        }
    }
}

public sealed record HookAffix : AffixDefinition
{
    public required HookTiming Timing { get; init; }

    public int Priority { get; init; }

    public IReadOnlyList<BattleHookConditionDefinition> Conditions { get; init; } = [];

    public IReadOnlyList<BattleEffectDefinition> Effects { get; init; } = [];

    public BattleFloatTextDefinition? FloatText { get; init; }

    public BattleSpeechDefinition? Speech { get; init; }

    public override void Resolve(IContentRepository contentRepository)
    {
        foreach (var effect in Effects)
        {
            effect.Resolve(contentRepository);
        }
    }
}

public sealed record TraitAffix(TraitId TraitId) : AffixDefinition;

[JsonPolymorphic(TypeDiscriminatorPropertyName = "type")]
[JsonDerivedType(typeof(ChanceBattleHookConditionDefinition), "chance")]
[JsonDerivedType(typeof(UnitLevelChanceBattleHookConditionDefinition), "unit_level_chance")]
[JsonDerivedType(typeof(StatDifferenceChanceBattleHookConditionDefinition), "stat_difference_chance")]
[JsonDerivedType(typeof(BuffLevelChanceBattleHookConditionDefinition), "buff_level_chance")]
[JsonDerivedType(typeof(DamagePositiveBattleHookConditionDefinition), "damage_positive")]
[JsonDerivedType(typeof(ContextBuffIdBattleHookConditionDefinition), "context_buff_id")]
[JsonDerivedType(typeof(ContextBuffNegativeBattleHookConditionDefinition), "context_buff_negative")]
[JsonDerivedType(typeof(ContextUnitHpRatioBattleHookConditionDefinition), "context_unit_hp_ratio")]
[JsonDerivedType(typeof(ContextUnitEffectiveTalentBattleHookConditionDefinition), "context_unit_effective_talent")]
[JsonDerivedType(typeof(ContextUnitBuffBattleHookConditionDefinition), "context_unit_buff")]
[JsonDerivedType(typeof(ContextUnitEquippedInternalSkillBattleHookConditionDefinition), "context_unit_equipped_internal_skill")]
[JsonDerivedType(typeof(ContextUnitRelationBattleHookConditionDefinition), "context_unit_relation")]
[JsonDerivedType(typeof(ContextUnitRoleBattleHookConditionDefinition), "context_unit_role")]
[JsonDerivedType(typeof(ContextUnitGenderBattleHookConditionDefinition), "context_unit_gender")]
[JsonDerivedType(typeof(ContextHitStateBattleHookConditionDefinition), "context_hit_state")]
[JsonDerivedType(typeof(ContextSkillSourceIdBattleHookConditionDefinition), "context_skill_source_id")]
[JsonDerivedType(typeof(ContextSkillNameEqualsBattleHookConditionDefinition), "context_skill_name_equals")]
[JsonDerivedType(typeof(ContextSkillNameContainsBattleHookConditionDefinition), "context_skill_name_contains")]
[JsonDerivedType(typeof(ContextSkillKindBattleHookConditionDefinition), "context_skill_kind")]
[JsonDerivedType(typeof(ContextSkillWeaponTypeBattleHookConditionDefinition), "context_skill_weapon_type")]
[JsonDerivedType(typeof(ContextRecoveryKindBattleHookConditionDefinition), "context_recovery_kind")]
[JsonDerivedType(typeof(ContextRecoveryReasonBattleHookConditionDefinition), "context_recovery_reason")]
public abstract record BattleHookConditionDefinition;

public sealed record ChanceBattleHookConditionDefinition(double Value) : BattleHookConditionDefinition;

public sealed record UnitLevelChanceBattleHookConditionDefinition(
    double BaseValue,
    double ValuePerLevel,
    double MaxValue = 1d) : BattleHookConditionDefinition;

public sealed record StatDifferenceChanceBattleHookConditionDefinition(
    StatType SourceStat,
    StatType TargetStat,
    int Divisor = 100,
    bool TruncateQuotients = true,
    bool Inclusive = false) : BattleHookConditionDefinition;

public sealed record BuffLevelChanceBattleHookConditionDefinition(
    double BaseValue,
    double ValuePerLevel,
    double MaxValue = 1d) : BattleHookConditionDefinition;

public sealed record DamagePositiveBattleHookConditionDefinition : BattleHookConditionDefinition;

public sealed record ContextBuffIdBattleHookConditionDefinition(string BuffId) : BattleHookConditionDefinition;

public sealed record ContextBuffNegativeBattleHookConditionDefinition : BattleHookConditionDefinition;

public sealed record ContextUnitHpRatioBattleHookConditionDefinition(
    double? MinExclusive = null,
    double? MaxInclusive = null) : BattleHookConditionDefinition
{
    public double? MinInclusive { get; init; }

    public double? MaxExclusive { get; init; }
}

public sealed record ContextUnitEffectiveTalentBattleHookConditionDefinition(
    IReadOnlyList<string> TalentIds) : BattleHookConditionDefinition
{
    // Omitted means the hook owner, preserving existing content behavior.
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public BattleHookContextUnitRole? Role { get; init; }

    public bool Absent { get; init; }
}

public sealed record ContextUnitBuffBattleHookConditionDefinition(
    IReadOnlyList<string> BuffIds, bool Absent = false) : BattleHookConditionDefinition;

public sealed record ContextUnitEquippedInternalSkillBattleHookConditionDefinition(
    IReadOnlyList<string> InternalSkillIds) : BattleHookConditionDefinition;

public sealed record ContextUnitRelationBattleHookConditionDefinition(
    BattleHookContextUnitRole Role,
    BattleHookRelation Relation) : BattleHookConditionDefinition;

public sealed record ContextUnitRoleBattleHookConditionDefinition(BattleHookContextUnitRole Role) : BattleHookConditionDefinition;

public sealed record ContextUnitGenderBattleHookConditionDefinition(
    BattleHookContextUnitRole Role,
    IReadOnlyList<CharacterGender> Genders) : BattleHookConditionDefinition;

public sealed record ContextHitStateBattleHookConditionDefinition(
    BattleHitState State) : BattleHookConditionDefinition;

public sealed record ContextSkillSourceIdBattleHookConditionDefinition(
    IReadOnlyList<string> SourceSkillIds) : BattleHookConditionDefinition;

public sealed record ContextSkillNameEqualsBattleHookConditionDefinition(
    IReadOnlyList<string> Values) : BattleHookConditionDefinition;

public sealed record ContextSkillNameContainsBattleHookConditionDefinition(
    IReadOnlyList<string> Values, bool Absent = false) : BattleHookConditionDefinition;

public sealed record ContextSkillKindBattleHookConditionDefinition(
    IReadOnlyList<SkillKind> Kinds) : BattleHookConditionDefinition;

public sealed record ContextSkillWeaponTypeBattleHookConditionDefinition(
    IReadOnlyList<WeaponType> WeaponTypes) : BattleHookConditionDefinition;

public sealed record ContextRecoveryKindBattleHookConditionDefinition(
    BattleRecoveryKind Kind) : BattleHookConditionDefinition;

public sealed record ContextRecoveryReasonBattleHookConditionDefinition(
    IReadOnlyList<BattleRecoveryReason> Reasons) : BattleHookConditionDefinition;

public enum BattleHookRounding
{
    Truncate,
    Floor,
    Ceiling,
    Round
}

public sealed record ModifyDamageBattleHookEffectDefinition(
    ModifierOp Op,
    double Delta = 0d,
    double DeltaPerBuffLevel = 0d,
    BattleHookRounding Rounding = BattleHookRounding.Truncate,
    double? DeltaMin = null,
    double? DeltaMax = null) : BattleEffectDefinition;

public sealed record ModifyDamageContextBattleHookEffectDefinition(
    BattleDamageContextField Field,
    ModifierOp Op,
    double Delta = 0d,
    double DeltaPerUnitLevel = 0d,
    double DeltaPerBuffLevel = 0d,
    double? DeltaPowerBasePerBuffLevel = null,
    double? DeltaMin = null,
    double? DeltaMax = null,
    int UnitLevelStep = 1) : BattleEffectDefinition;

public sealed record ModifyMpCostBattleHookEffectDefinition(
    ModifierOp Op,
    double Delta = 0d,
    double DeltaPerBuffLevel = 0d,
    BattleHookRounding Rounding = BattleHookRounding.Ceiling) : BattleEffectDefinition;

public sealed record ModifyRecoveryBattleHookEffectDefinition(
    ModifierOp Op,
    double Delta = 0d,
    double DeltaPerBuffLevel = 0d,
    BattleHookRounding Rounding = BattleHookRounding.Truncate) : BattleEffectDefinition;

public sealed record SetHitSuccessBattleHookEffectDefinition : BattleEffectDefinition;

public sealed record StrengthenContextBuffBattleHookEffectDefinition(
    int LevelDelta = 0,
    int TurnDelta = 0) : BattleEffectDefinition;
