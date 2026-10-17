using Game.Application;
using Game.Application.Formatters;
using Game.Core.Battle;
using Game.Core.Definitions;
using Game.Core.Model;
using Game.Core.Model.Character;
using Game.Core.Model.Skills;
using Game.Core.Affix;

namespace Game.Web.Runtime;

public static partial class BrowserBridge
{
    private static string? _cultivationItemId;
    private static readonly List<object> BattleEvents = [];
    private static long _eventSequence;

    private static CharacterInstance Hero => RequireSession().State.Party.GetMember(Party.HeroCharacterId);
    private static bool CanManage => _session is not null && _battle is null && _host.Dialogue is null && _host.Choice is null && !_host.SelectingSect && !_host.InteractionPending && _shopId is null;

    private static void RequireManagement()
    {
        RequireSession();
        if (_host.InteractionPending || _host.SelectingSect) throw new InvalidOperationException("请先完成当前剧情交互。");
        if (_battle is not null) throw new InvalidOperationException("战斗中不能换装、切换功法或调整修炼，请先完成战斗并返回地图。");
        if (_host.Dialogue is not null || _host.Choice is not null) throw new InvalidOperationException("请先结束当前对话。");
        if (_shopId is not null) throw new InvalidOperationException("请先离开商店。");
    }

    private static InventoryEntry Entry(long entryNumber) => RequireSession().State.Inventory.Entries.FirstOrDefault(e => e.EntryNumber == entryNumber)
        ?? throw new InvalidOperationException("此物品已不在背包中。");

    private static (string SkillId, bool Internal, int? Level)? BookSkill(ItemDefinition item) =>
        item.Type != ItemType.SkillBook ? null : item.UseEffects.Count == 1 ? item.UseEffects[0] switch
        {
            GrantInternalSkillItemUseEffectDefinition inner => (inner.SkillId, true, inner.Level),
            GrantExternalSkillItemUseEffectDefinition outer => (outer.SkillId, false, outer.Level),
            _ => null
        } : null;

    private static SkillInstance? CultivationSkill(CharacterInstance hero)
    {
        if (CultivationId(hero) is not { } id || !_content!.TryGetItem(id, out var item) || BookSkill(item) is not { } book) return null;
        return book.Internal ? hero.InternalSkills.FirstOrDefault(s => s.Id == book.SkillId) : hero.ExternalSkills.FirstOrDefault(s => s.Id == book.SkillId);
    }

    private static int BookMaxLevel(ItemDefinition item, SkillInstance skill)
    {
        var currentMax = RequireSession().SkillMaxLevelPolicy.GetMaxLevel(skill);
        var book = BookSkill(item)!.Value;
        return Math.Min(currentMax, book.Level ?? currentMax);
    }

    private static void SetCultivation(long entryNumber)
    {
        RequireCharacterManagement();
        var session = RequireSession();
        var entry = Entry(entryNumber);
        var book = BookSkill(entry.Definition) ?? throw new InvalidOperationException("请选择可以修炼内功或外功的秘籍。");
        var analysis = session.ItemUseService.AnalyzeTarget(entry, Managed);
        if (!analysis.CanUse) throw new InvalidOperationException(analysis.Reason);
        if (!ManualAvailable(entry, Managed)) throw new InvalidOperationException("秘籍正由其他队友修炼，需要另一本或先暂停对方修炼。");
        if (book.Internal) session.CharacterService.StudyInternalSkillFromBook(Managed, book.SkillId, 1);
        else session.CharacterService.StudyExternalSkillFromBook(Managed, book.SkillId, 1);
        SetCultivationId(Managed, entry.Definition.Id);
        Log($"已选择修炼秘籍「{entry.Definition.Name}」。秘籍保留在背包，战斗结算经验将用于此项修炼。");
    }

    private static void ApplyCultivationExperience(int experience)
    {
        foreach (var c in _battle!.Units.Where(u => u.Team == 1).Select(u => u.Character).DistinctBy(c => c.Id)) ApplyCultivationExperience(c, experience);
    }

    private static void ApplyCultivationExperience(CharacterInstance c, int experience)
    {
        if (CultivationId(c) is not { } id || CultivationSkill(c) is not { } skill) return;
        var item = _content!.GetItem(id);
        if (!RequireSession().State.Inventory.Entries.Any(e => e.Definition.Id == item.Id)) return;
        var maxLevel = BookMaxLevel(item, skill);
        if (skill.Level >= maxLevel) return;
        // Legacy Role.AddExp trains equipment slot 4 with the same role EXP.
        var change = SkillExperienceProgression.TryAddExperience(skill, experience, maxLevel,
            PackText("id") == "jyx" ? (_, amount) => BrowserLegacyRules.ResolveSkillAwardExperience(skill, amount) : null);
        if (change is not null) Log($"秘籍修炼「{skill.Name}」经验 +{change.AddedExperience}" + (change.LeveledUp ? $"，提升至 {change.NewLevel} 级。" : "。"));
    }

    private static object? CultivationView(CharacterInstance hero)
    {
        if (CultivationId(hero) is not { } id || CultivationSkill(hero) is not { } skill) return null;
        var entry = RequireSession().State.Inventory.Entries.FirstOrDefault(e => e.Definition.Id == id);
        if (entry is null) return null;
        return new { entryNumber = entry.EntryNumber, itemId = entry.Definition.Id, itemName = entry.Definition.Name, skillId = skill.Id, skillName = skill.Name, kind = skill.SkillKind.ToString(), level = skill.Level, exp = skill.Exp, nextExp = SkillExperienceProgression.GetLevelUpExp(skill), maxLevel = BookMaxLevel(entry.Definition, skill) };
    }

    private static object InventoryView(InventoryEntry entry)
    {
        var analysis = _session!.ItemUseService.AnalyzeTarget(entry, Managed);
        var book = BookSkill(entry.Definition);
        var equipment = entry.Definition as EquipmentDefinition;
        var targets = _battle?.Units.Where(u => u.Team == 1 && u.IsAlive).Select(u => new
        {
            id = u.Id, name = u.Character.Name, hp = u.Hp, maxHp = u.MaxHp,
            canUse = BattleItemUnavailableReason(entry.Definition, u) is null,
            reason = BattleItemUnavailableReason(entry.Definition, u) ?? ""
        }).ToArray();
        var itemBattleReason = _battle is not null ? targets?.Any(t => t.canUse) == true ? null : BattleSelfItemUnavailableReason(entry.Definition) : null;
        var battleConsumable = _battle is not null && itemBattleReason is null;
        var reason = _battle is not null ? itemBattleReason ?? "" : !CanManage ? "对话中暂不可调整。" : analysis.CanUse ? "" : analysis.Reason;
        if (book is not null && !ManualAvailable(entry, Managed)) reason = "秘籍正由其他队友修炼。";
        return new
        {
            id = entry.Definition.Id, entryNumber = entry.EntryNumber, name = entry.Definition.Name, icon = ItemMedia(entry.Definition.Id),
            count = entry is StackInventoryEntry stack ? stack.Quantity : 1, quantity = entry is StackInventoryEntry stack2 ? stack2.Quantity : 1,
            description = entry.Definition.Description, kind = equipment is not null ? "equipment" : book is not null ? "skillBook" : entry.Definition.Type == ItemType.Consumable ? "consumable" : "other",
            affixes = entry is EquipmentInstanceInventoryEntry instanceEntry ? AffixFormatter.FormatEquipmentLinesCn(instanceEntry.Equipment.ExtraAffixes, _content!) : [],
            battleTargets = targets,
            itemType = entry.Definition.Type.ToString(), slot = equipment?.SlotType.ToString(),
            canEquip = CanManage && _session.State.Party.ContainsMember(Managed.Id) && equipment is not null && analysis.CanUse,
            canCultivate = CanManage && _session.State.Party.ContainsMember(Managed.Id) && book is not null && analysis.CanUse && ManualAvailable(entry, Managed),
            canUse = battleConsumable || CanManage && _session.State.Party.ContainsMember(Managed.Id) && equipment is null && book is null && analysis.CanUse && !entry.Definition.UseEffects.Any(e => e is RunStoryItemUseEffectDefinition), reason
        };
    }

    private static string? SkillUnavailableReason(BattleSkillAvailability? availability) => availability?.Status switch
    {
        null or BattleSkillAvailabilityStatus.Available => null,
        BattleSkillAvailabilityStatus.Cooldown => $"招式冷却中，还需 {availability.RemainingCooldown} 回合。",
        BattleSkillAvailabilityStatus.NotEnoughMp => "内力不足。",
        BattleSkillAvailabilityStatus.NotEnoughRage => "怒气不足。",
        BattleSkillAvailabilityStatus.Disabled when availability.DisabledReason == BattleSkillDisabledReason.Seal => "招式被封印。",
        _ => "该招式当前无法使用。"
    };

    private static string? BattleSelfItemUnavailableReason(ItemDefinition item)
        => BattleItemUnavailableReason(item, Active);

    private static string? BattleItemUnavailableReason(ItemDefinition item, BattleUnit? target)
    {
        if (item.Type != ItemType.Consumable) return "战斗中只可使用战斗消耗品。";
        if (_battle is null || EvaluateBattleOutcome().Kind != BattleOutcomeKind.Ongoing) return "当前战斗已结束。";
        if (Active is not { Team: 1, IsAlive: true } actor) return "当前不是我方行动回合。";
        if (_battle.CurrentAction!.HasCommittedMainAction) return "本回合的主要行动已经完成。";
        if (target is null || !target.IsAlive || target.Team != actor.Team) return "请选择仍在场上的我方队员。";
        if (target.Id != actor.Id)
        {
            if (!actor.HasTrait(TraitId.CanUseItemOnAlly)) return "需要隔空取物天赋才能给队友使用物品。";
            if (actor.Position.ManhattanDistanceTo(target.Position) > 2) return "队友距离过远，请先移动到两格以内。";
        }
        // The engine currently has no public item-preview API. These are its
        // action, target and cooldown guards; UseItem remains authoritative.
        var cooldownEnabled = !_battle.RuleSettings.EnableDifficultyItemCooldownRules || _battle.RuleSettings.Difficulty != GameDifficulty.Normal;
        if (cooldownEnabled && target.ItemCooldown > 0 && !actor.HasTrait(TraitId.IgnoreItemCooldown)) return $"还需等待 {target.ItemCooldown} 回合才能再次使用物品。";
        if (item.UseEffects.Count == 0 || item.UseEffects.Any(effect => effect is not (AddHpItemUseEffectDefinition or AddMpItemUseEffectDefinition or AddHpPercentItemUseEffectDefinition or AddMpPercentItemUseEffectDefinition or AddRageItemUseEffectDefinition or AddBuffItemUseEffectDefinition or DetoxifyItemUseEffectDefinition))) return "此物品的战斗效果尚未接入。";
        return null;
    }

    private static object LearnedSkillView(SkillInstance skill)
    {
        var progressive = SkillExperienceProgression.NormalizeProgressionSkill(skill);
        return new
        {
            id = skill.Id, name = skill.Name, description = skill.Description, kind = skill.SkillKind.ToString(), level = skill.Level,
            exp = skill.Exp, nextExp = progressive is null ? 0 : SkillExperienceProgression.GetLevelUpExp(progressive),
            maxLevel = RequireSession().SkillMaxLevelPolicy.GetMaxLevel(skill),
            active = skill.IsActive, equipped = skill is InternalSkillInstance inner && inner.IsEquipped,
            mpCost = skill.MpCost, castSize = skill.CastSize, impactSize = skill.ImpactSize
        };
    }

    private static object[] EquipmentView(CharacterInstance hero) => Enum.GetValues<EquipmentSlotType>().Select(slot =>
    {
        var instance = hero.GetEquipment(slot);
        return (object)new { slot = slot.ToString(), slotName = slot switch { EquipmentSlotType.Weapon => "武器", EquipmentSlotType.Armor => "防具", _ => "饰品" }, item = instance is null ? null : new { id = instance.Definition.Id, name = instance.Definition.Name, icon = ItemMedia(instance.Definition.Id), instanceId = instance.Id, description = instance.Definition.Description, affixes = AffixFormatter.FormatEquipmentLinesCn(instance.ExtraAffixes, _content!) } };
    }).ToArray();

    private static object[] TargetView()
    {
        if (_battle is null || Active?.Team != 1 || _battle.CurrentAction!.HasCommittedMainAction || EvaluateBattleOutcome().Kind != BattleOutcomeKind.Ongoing) return [];
        return Skills(Active.Character).Where(s => _engine!.EvaluateSkillAvailability(_battle, Active.Id, s).IsAvailable)
            .SelectMany(s => BattleSkillTargeting.EnumerateCastTargets(Active.Position, BattleSkillTargeting.ResolveEffectiveCastSize(Active, s), s.CanCastAtSelf, _battle.Grid)
                .Select(p => (object)new { skillId = s.Id, x = p.X, y = p.Y, targetId = _battle.GetUnitAt(p)?.Id })).ToArray();
    }

    private static void CollectMessages(IReadOnlyList<BattleMessage> messages)
    {
        foreach (var message in messages)
        {
            if (message is not BattleFact && message is not BattleCue) continue;
            var fact = message as BattleFact;
            var cue = message as BattleCue;
            var text = cue?.FloatText?.Text ?? cue?.Speech?.Text;
            int? recovery = fact?.Kind is BattleFactKind.Healed or BattleFactKind.MpRecovered && int.TryParse(fact.Detail, out var restored) ? restored : null;
            var animationId = fact?.SkillCast?.ImpactAnimationId;
            BattleEvents.Add(new { sequence = ++_eventSequence, kind = fact?.Kind.ToString() ?? cue!.Kind.ToString(), unitId = message.UnitId, amount = fact?.Damage?.Amount ?? recovery, critical = fact?.Damage?.IsCritical ?? false, sourceUnitId = fact?.Damage?.SourceUnitId, skillId = fact?.SkillCast?.BaseSkillId, skillName = fact?.SkillCast?.ResolvedSkillName, audioId = fact?.SkillCast?.AudioId, animationId, isLegend = fact?.SkillCast?.IsLegend ?? false,
                visual = animationId is null ? null : _pack["combatEffects"]?["animations"]?[animationId]?.DeepClone() ?? _pack["combatEffects"]?["default"]?.DeepClone(),
                targetPosition = fact?.SkillCast?.TargetPosition, impactedPositions = fact?.SkillCast?.ImpactedPositions, text });
            if (fact?.Damage is { } damage)
                Log($"{_battle?.TryGetUnit(message.UnitId)?.Character.Name ?? message.UnitId}受到 {damage.Amount} 点伤害" + (damage.IsCritical ? "（暴击）。" : "。"));
        }
        if (BattleEvents.Count > 100) BattleEvents.RemoveRange(0, BattleEvents.Count - 100);
    }
}
