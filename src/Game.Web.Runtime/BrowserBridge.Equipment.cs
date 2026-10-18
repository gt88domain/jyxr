using System.Runtime.InteropServices.JavaScript;
using System.Text.Json;
using Game.Core.Model;

namespace Game.Web.Runtime;

public sealed record EquipmentPreviewRequest(string CharacterId, long EntryNumber);

internal sealed partial class BrowserRuntimeSession
{
    public string InspectEquipment(string requestJson)
    {
        try
        {
            RequireManagement();
            var request = JsonSerializer.Deserialize<EquipmentPreviewRequest>(requestJson, Json)
                ?? throw new InvalidOperationException("装备对比请求为空。");
            var session = RequireSession();
            var comparison = session.EquipmentComparisonService.Compare(request.CharacterId, request.EntryNumber);
            var item = session.ContentRepository.GetEquipment(comparison.ItemId);
            var replaced = comparison.ReplacedItemId is { } id ? session.ContentRepository.GetEquipment(id) : null;
            object Talent(string id) => new { id, name = session.ContentRepository.GetTalent(id).Name };
            return JsonSerializer.Serialize(new { ok = true, preview = new {
                characterId = request.CharacterId, entryNumber = request.EntryNumber,
                characterName = session.State.Party.GetMember(request.CharacterId).Name,
                itemId = item.Id, itemName = item.Name, slot = comparison.Slot.ToString(),
                replacedItemName = replaced?.Name, comparison.CanEquip, comparison.Reason,
                attributes = comparison.Attributes.Select(a => new { id = StatCatalog.GetCode(a.Stat), label = StatCatalog.GetDisplayNameCn(a.Stat), a.Before, a.After }),
                addedTalents = comparison.AddedTalentIds.Select(Talent), removedTalents = comparison.RemovedTalentIds.Select(Talent),
            }}, Json);
        }
        catch (Exception error) { return JsonSerializer.Serialize(new { ok = false, error = error.Message }, Json); }
    }
}
