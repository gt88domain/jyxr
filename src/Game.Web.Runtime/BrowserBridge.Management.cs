using System.Text.Json;
using Game.Application;
using Game.Core.Model;
using Game.Core.Model.Character;

namespace Game.Web.Runtime;

public static partial class BrowserBridge
{
    private static string _managedCharacterId = Party.HeroCharacterId;
    private static readonly Dictionary<string, string> CompanionCultivations = new(StringComparer.Ordinal);
    private static readonly HashSet<string> FormationReserves = new(StringComparer.Ordinal);
    private static IDisposable? _partySubscription;
    private static void BindPartyEvents()
    {
        _partySubscription?.Dispose();
        var session = RequireSession();
        _partySubscription = session.Events.Subscribe<PartyChangedEvent>(change =>
        {
            if (!ReferenceEquals(_session, session)) return;
            if (change.ReleasedAll)
            {
                FormationReserves.Clear();
                CompanionCultivations.Clear();
            }
            else if (change.DepartedCharacterId is { } id)
            {
                FormationReserves.Remove(id);
                if (session.State.Party.TryGetCharacter(id, out var c)) SetCultivationId(c, null);
            }
        });
    }
    private static CharacterInstance Managed => RequireSession().State.Party.TryGetCharacter(_managedCharacterId, out var c) ? c : Hero;
    private static string? CultivationId(CharacterInstance c) => c.Id == Party.HeroCharacterId ? _cultivationItemId : CompanionCultivations.GetValueOrDefault(c.Id);
    private static void SetCultivationId(CharacterInstance c, string? id)
    {
        if (c.Id == Party.HeroCharacterId) _cultivationItemId = id;
        else if (id is null) CompanionCultivations.Remove(c.Id);
        else CompanionCultivations[c.Id] = id;
    }

    private static int AssignedManuals(string itemId, string? exceptCharacterId = null) => RequireSession().State.Party.GetAllCharacters().Count(c => c.Id != exceptCharacterId && CultivationId(c) == itemId);
    private static bool ManualAvailable(InventoryEntry entry, CharacterInstance c) => (entry is StackInventoryEntry stack ? stack.Quantity : 1) > AssignedManuals(entry.Definition.Id, c.Id);

    private static void SelectManagedCharacter(string id)
    {
        if (!RequireSession().State.Party.ContainsCharacter(id)) throw new InvalidOperationException("此人物不在当前队伍名册中。");
        _managedCharacterId = id;
    }

    private static void RequireCharacterManagement()
    {
        RequireManagement();
        if (!RequireSession().State.Party.ContainsMember(Managed.Id)) throw new InvalidOperationException("请先在队伍编排中将此人物设为参战队员。");
    }

    private static void AllocateCharacterStat(JsonElement args)
    {
        RequireCharacterManagement();
        var stat = StatCatalog.Parse(Read(args, "stat"));
        if (!StatCatalog.TenDimensionStats.Contains(stat)) throw new InvalidOperationException("自由属性点只可分配到十项基础属性。");
        var points = args.TryGetProperty("points", out var amount) ? amount.GetInt32() : 1;
        if (points < 1 || points > Managed.UnspentStatPoints) throw new InvalidOperationException("可分配属性点不足。");
        RequireSession().CharacterService.AllocateStat(Managed.Id, stat, points);
    }

    private static void MovePartyCharacter(JsonElement args)
    {
        RequireManagement();
        var id = Read(args, "characterId");
        var party = RequireSession().State.Party;
        if (id == Party.HeroCharacterId) throw new InvalidOperationException("主角必须保持在队伍首位。");
        if (!party.TryGetCharacter(id, out _)) throw new InvalidOperationException("只能调整已招募的队友。");
        switch (Read(args, "placement"))
        {
            case "member":
                if (party.ContainsMember(id)) return;
                if (!party.ContainsReserve(id) || !FormationReserves.Contains(id)) throw new InvalidOperationException("此人物由剧情安排随行或离队，暂不可召回参战。");
                RequireSession().PartyService.Join(id);
                FormationReserves.Remove(id);
                break;
            case "reserve":
                if (!party.ContainsMember(id)) throw new InvalidOperationException("只能将当前参战队员转入后备。");
                // Player formation management keeps the same character and gear;
                // the story's permanent Leave action has different semantics.
                RequireSession().PartyService.MoveMemberToReserves(id);
                FormationReserves.Add(id);
                break;
            default: throw new InvalidOperationException("队伍位置无效。");
        }
    }

    private static void MoveChestItem(JsonElement args, bool deposit)
    {
        if (!_host.ChestOpen) RequireManagement();
        var session = RequireSession();
        if (!_host.ChestOpen && session.State.Location.CurrentMapId != PackText("chestMapId")) throw new InvalidOperationException("请先前往储物箱所在地点。");
        var entryNumber = args.GetProperty("entryNumber").GetInt64();
        var quantity = args.TryGetProperty("quantity", out var amount) ? amount.GetInt32() : 1;
        if (quantity < 1) throw new InvalidOperationException("物品数量必须大于零。");
        var entries = deposit ? session.State.Inventory.Entries : session.State.Chest.Inventory.Entries;
        var entry = entries.FirstOrDefault(e => e.EntryNumber == entryNumber) ?? throw new InvalidOperationException("物品已不在原来的位置。");
        if (deposit && (entry is StackInventoryEntry stack ? stack.Quantity : 1) - quantity < AssignedManuals(entry.Definition.Id)) throw new InvalidOperationException("这部秘籍正在修炼，请先暂停相应人物的修炼。");
        var result = deposit ? session.ChestService.Deposit(entry, quantity) : session.ChestService.Withdraw(entry, quantity);
        if (!result.Success) throw new InvalidOperationException(result.Message);
        ClearUnavailableCultivations();
        Log(result.Message);
    }

    private static void ClearUnavailableCultivations()
    {
        var available = RequireSession().State.Inventory.Entries.GroupBy(e => e.Definition.Id).ToDictionary(g => g.Key, g => g.Sum(e => e is StackInventoryEntry stack ? stack.Quantity : 1));
        foreach (var c in RequireSession().State.Party.GetAllCharacters().OrderBy(c => c.Id != Party.HeroCharacterId))
            if (CultivationId(c) is { } id)
            {
                if (available.GetValueOrDefault(id) > 0) available[id]--;
                else SetCultivationId(c, null);
            }
        FormationReserves.RemoveWhere(id => !RequireSession().State.Party.ContainsReserve(id));
    }

    private static object? ChestSnapshot()
    {
        if (_session is null) return null;
        var session = _session;
        var view = session.ChestService.Open();
        object Describe(InventoryEntry e) => new { entryNumber = e.EntryNumber, id = e.Definition.Id, name = e.Definition.Name, icon = ItemMedia(e.Definition.Id), quantity = e is StackInventoryEntry stack ? stack.Quantity : 1, canDeposit = session.ChestService.CanStore(e.Definition) };
        return new { capacity = view.Capacity, stored = view.StoredItemCount, entries = view.Entries.Select(Describe).ToArray(), inventory = session.State.Inventory.Entries.Select(Describe).ToArray(), canManage = CanManage || _host.ChestOpen };
    }

    private static object CharacterSheet(CharacterInstance c)
    {
        var u = _battle?.Units.FirstOrDefault(u => u.Character.Id == c.Id && u.Team == 1);
        var canManage = CanManage && RequireSession().State.Party.ContainsMember(c.Id);
        return new
        {
            id = c.Id, definitionId = c.Definition.Id, name = c.Name, level = c.Level, unspentStatPoints = c.UnspentStatPoints,
            sprite = CharacterMedia(c, "characters"), portrait = CharacterMedia(c, "portraits"),
            hp = u?.Hp ?? c.CurrentHp ?? (int)c.GetStat(StatType.MaxHp), maxHp = (int)c.GetStat(StatType.MaxHp),
            mp = u?.Mp ?? c.CurrentMp ?? (int)c.GetStat(StatType.MaxMp), maxMp = (int)c.GetStat(StatType.MaxMp),
            experience = c.Experience, nextLevelExperience = NextCharacterLevelExperience(c),
            attributes = Enum.GetValues<StatType>().Select(s => new { id = StatCatalog.GetCode(s), label = StatCatalog.GetDisplayNameCn(s), value = c.GetStat(s), baseValue = c.GetBaseStat(s), canAllocate = canManage && c.UnspentStatPoints > 0 && StatCatalog.TenDimensionStats.Contains(s) }).ToArray(),
            talents = c.EffectiveTalents.Select(t => new { id = t.Id, name = t.Name, description = t.Description }).ToArray(),
            skills = Skills(c).Select(s => SkillView(s)).ToArray(), internalSkills = c.InternalSkills.Select(LearnedSkillView).ToArray(), externalSkills = c.ExternalSkills.Select(LearnedSkillView).ToArray(),
            equipment = EquipmentView(c), cultivation = CultivationView(c), equippedInternalSkillId = c.EquippedInternalSkillId, canManage
        };
    }
}
