using System.Text.Json;
using Game.Application;
using Game.Core.Model;
using Game.Core.Story;

namespace Game.Web.Runtime;

internal sealed partial class BrowserRuntimeSession
{
    private object? CombatantsSnapshot()
    {
        if (_host.Selection is not { } request) return null;
        var battle = _content!.GetBattle(request.BattleId);
        var required = battle.RequiredCharacterIds.Where(RequireSession().State.Party.ContainsMember).ToHashSet(StringComparer.Ordinal);
        return new
        {
            battleId = battle.Id, title = request.Title ?? battle.Name,
            capacity = battle.Participants.Count(p => p.Team == 1 && p.PartyIndex is not null && p.CharacterId is null),
            candidates = RequireSession().State.Party.Members.Select(c => new { id = c.Id, name = c.Name, level = c.Level, portrait = CharacterMedia(c, "portraits"), required = required.Contains(c.Id), forbidden = request.ForbiddenCharacterIds.Contains(c.Id) && !required.Contains(c.Id) }).ToArray()
        };
    }

    private sealed partial class BrowserStoryHost : ISpecialBattleRuntimeHost, IApplicationRuntimeHost
    {
        public CombatantSelectionRequest? Selection { get; private set; }
        private TaskCompletionSource<IReadOnlyList<string>>? _selectionResult;
        private TaskCompletionSource<bool>? _specialBattleResult;
        public string? RenameDefault { get; private set; }
        private TaskCompletionSource<string>? _renameResult;
        public bool GameOver { get; private set; }
        public bool ChestOpen { get; private set; }
        private TaskCompletionSource? _chestResult;
        public bool InteractionPending => Selection is not null || RenameDefault is not null || GameOver || ChestOpen || Training is not null || Ending is not null;

        [StoryCommand("chest", "xiangzi")]
        public ValueTask OpenChest(CancellationToken cancellationToken)
        {
            ChestOpen = true;
            var pending = new TaskCompletionSource();
            _chestResult = pending;
            cancellationToken.Register(() => pending.TrySetCanceled(cancellationToken));
            return new(pending.Task);
        }

        public void CloseChest()
        {
            var pending = _chestResult ?? throw new InvalidOperationException("当前没有打开储物箱。");
            ChestOpen = false;
            _chestResult = null;
            pending.SetResult();
        }

        public ValueTask<IReadOnlyList<string>> SelectCombatantsAsync(CombatantSelectionRequest request, CancellationToken cancellationToken)
        {
            Selection = request;
            var pending = new TaskCompletionSource<IReadOnlyList<string>>();
            _selectionResult = pending;
            cancellationToken.Register(() => pending.TrySetCanceled(cancellationToken));
            return new(pending.Task);
        }

        public void SelectCombatants(JsonElement args)
        {
            var request = Selection ?? throw new InvalidOperationException("当前不在参战选择中。");
            var ids = args.GetProperty("characterIds").Deserialize<string[]>() ?? [];
            var battle = _owner._content!.GetBattle(request.BattleId);
            var party = _owner.RequireSession().State.Party;
            var required = battle.RequiredCharacterIds.Where(party.ContainsMember).ToHashSet(StringComparer.Ordinal);
            var slots = battle.Participants.Count(p => p.Team == 1 && p.PartyIndex is not null && p.CharacterId is null);
            if (ids.Length < 1 || ids.Length > slots || ids.Distinct(StringComparer.Ordinal).Count() != ids.Length || ids.Any(id => !party.ContainsMember(id) || request.ForbiddenCharacterIds.Contains(id) && !required.Contains(id)) || required.Any(id => !ids.Contains(id)))
                throw new InvalidOperationException("参战名单无效，请遵守人数、必选与本轮禁选限制。");
            var ordered = party.Members.Where(c => ids.Contains(c.Id)).Select(c => c.Id).ToArray();
            var pending = _selectionResult!;
            Selection = null;
            _selectionResult = null;
            pending.SetResult(ordered);
        }

        public ValueTask<bool> RunBattleAsync(SpecialBattleRequest request, CancellationToken cancellationToken)
        {
            var pending = new TaskCompletionSource<bool>();
            _specialBattleResult = pending;
            cancellationToken.Register(() => pending.TrySetCanceled(cancellationToken));
            _owner.StartBattle(request);
            return new(pending.Task);
        }

        public bool CompleteSpecialBattle()
        {
            if (_specialBattleResult is not { } pending) return false;
            _specialBattleResult = null;
            pending.SetResult(_owner._lastBattleWinner == 1);
            return true;
        }

        public async ValueTask<InventoryEntry?> SelectRefinementEquipmentAsync(IReadOnlyList<InventoryEntry> entries, CancellationToken cancellationToken)
        {
            var options = entries.Select((e, i) => new ChoiceOptionView(i, e.Definition.Name)).Append(new(entries.Count, "取消洗练")).ToArray();
            var selected = await ChooseOptionAsync(new("洗练", "选择要洗练的装备", options), cancellationToken);
            cancellationToken.ThrowIfCancellationRequested();
            return selected == entries.Count ? null : entries[selected];
        }

        [StoryCommand("legacy_rename_heroine")]
        public async ValueTask RenameHeroine(string defaultName, CancellationToken cancellationToken)
        {
            var pending = new TaskCompletionSource<string>();
            RenameDefault = defaultName;
            _renameResult = pending;
            using var registration = cancellationToken.Register(() => pending.TrySetCanceled(cancellationToken));
            var name = await pending.Task;
            cancellationToken.ThrowIfCancellationRequested();
            _owner.RequireSession().PartyService.RenameOrCreateReserve(Party.HeroineCharacterId, name);
        }

        public void CompleteRename(string name)
        {
            name = name.Trim();
            if (RenameDefault is null || _renameResult is null || name.Length is < 1 or > 12) throw new InvalidOperationException("姓名请填写 1 至 12 个字符。");
            var pending = _renameResult;
            RenameDefault = null;
            _renameResult = null;
            pending.SetResult(name);
        }

        public ValueTask GameOverAsync(CancellationToken cancellationToken)
        {
            if (Ending is not null) throw new InvalidOperationException("当前结局已经结束。");
            _owner.RequireSession().ProfileService.AddDeaths();
            GameOver = true;
            return WaitAtEnding(new("gameover", _owner.RequireSession().State.Adventure.Round, null), cancellationToken);
        }
    }
}
