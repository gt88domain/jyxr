using Game.Core.Definitions;
using Game.Core.Model;
using Game.Core.Model.Character;

namespace Game.Application;

public sealed record EquipmentStatComparison(StatType Stat, double Before, double After);
public sealed record EquipmentComparison(
    string CharacterId, long EntryNumber, string ItemId, EquipmentSlotType Slot,
    string? ReplacedItemId, bool CanEquip, string Reason,
    IReadOnlyList<EquipmentStatComparison> Attributes,
    IReadOnlyList<string> AddedTalentIds, IReadOnlyList<string> RemovedTalentIds);

/// <summary>Read-only loadout comparison shared by all hosts and content packs.</summary>
public sealed class EquipmentComparisonService(GameSession session)
{
    public EquipmentComparison Compare(string characterId, long entryNumber)
    {
        var state = session.State;
        var character = state.Party.GetMember(characterId);
        var entry = state.Inventory.Entries.FirstOrDefault(e => e.EntryNumber == entryNumber)
            ?? throw new InvalidOperationException("此装备已不在背包中。");
        if (entry.Definition is not EquipmentDefinition definition)
            throw new InvalidOperationException("请选择一件装备进行对比。");

        var analysis = session.ItemUseService.AnalyzeTarget(entry, character);
        var candidate = CharacterMapper.FromRecord(CharacterMapper.ToRecord(character), session.ContentRepository, session.Config);
        var replaced = candidate.GetEquipment(definition.SlotType);
        if (replaced is not null) candidate.RemoveEquipment(definition.SlotType);
        // A private copy predicts the actual stack identity without advancing the
        // live counter. Source IDs participate in ordered stat multipliers.
        var equipment = entry is EquipmentInstanceInventoryEntry instance
            ? new EquipmentInstance(instance.Equipment.Id, definition, instance.Equipment.ExtraAffixes)
            : EquipmentInstanceFactory.Restore(state.EquipmentInstanceFactory.NextNumber).Create(definition);
        candidate.AddEquipmentInstance(equipment);
        candidate.RebuildSnapshot();

        var beforeTalents = character.EffectiveTalents.Select(t => t.Id).ToHashSet(StringComparer.Ordinal);
        var afterTalents = candidate.EffectiveTalents.Select(t => t.Id).ToHashSet(StringComparer.Ordinal);
        return new(characterId, entryNumber, definition.Id, definition.SlotType, replaced?.Definition.Id,
            analysis.CanUse, analysis.Reason,
            Enum.GetValues<StatType>().Select(stat => new EquipmentStatComparison(stat, character.GetStat(stat), candidate.GetStat(stat))).ToArray(),
            afterTalents.Except(beforeTalents).Order(StringComparer.Ordinal).ToArray(),
            beforeTalents.Except(afterTalents).Order(StringComparer.Ordinal).ToArray());
    }
}
