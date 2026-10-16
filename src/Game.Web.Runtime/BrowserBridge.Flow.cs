using System.Text.Json;
using Game.Application;
using Game.Core.Model;
using Game.Core.Story;

namespace Game.Web.Runtime;

public static partial class BrowserBridge
{
    private sealed record EndingState(string Kind, int CompletedRound, int? TargetRound);

    private static void ValidateEnding(EndingState ending, GameSession session)
    {
        if (PackText("id") != "jyx" || ending.CompletedRound != session.State.Adventure.Round ||
            ending.Kind is not ("restart" or "next" or "complete" or "gameover" or "title") ||
            ending.TargetRound != (ending.Kind == "restart" ? ending.CompletedRound : ending.Kind == "next" ? checked(ending.CompletedRound + 1) : (int?)null))
            throw new InvalidOperationException("存档的结局或周目衔接无效。");
    }

    private static void BeginRoundCreation()
    {
        var session = RequireSession();
        var ending = _host.Ending ?? throw new InvalidOperationException("当前没有周目衔接。");
        ValidateEnding(ending, session);
        if (ending.TargetRound is not { } round || _creation is not null) throw new InvalidOperationException("请按当前周目流程创建人物。");
        _creation = new(Hero.Name, session.State.Adventure.Difficulty) { Round = round, OriginState = session.State,
            TrialCount = session.State.SpecialBattle.TrialCompletedCharacterIds.Count };
    }

    private static void ConfirmRoundCreation(CreationDraft draft, CreationResult preview)
    {
        var session = RequireSession();
        var ending = _host.Ending ?? throw new InvalidOperationException("周目衔接已变化。");
        ValidateEnding(ending, session);
        if (!ReferenceEquals(session.State, draft.OriginState) || ending.TargetRound != draft.Round)
            throw new InvalidOperationException("人物预览已失效，请重新开始本次人物生成。");
        // The application owns the state reset, chest clone, profile and round.
        // The browser only supplies the confirmed original creation candidate.
        if (ending.Kind == "next") session.SessionFlowService.StartNextRound();
        else if (ending.Kind == "restart") session.SessionFlowService.RestartCurrentRound();
        else throw new InvalidOperationException("当前结局不能重新生成人物。");
        var state = session.State;
        state.Adventure.SetDifficulty(draft.Difficulty);
        var party = new Party(); party.AddMember(preview.Hero); state.SetParty(party);
        state.Currency.ChangeSilver(preview.Silver - state.Currency.Silver);
        foreach (var (id, quantity) in preview.Items) session.InventoryService.AddItem(id, quantity);
        ResetStory(replaceHost: false); // keep the host bound to this session's services
        _host.ClearEnding();
        _creation = null; _battle = null; _shopId = null;
        _cultivationItemId = null; CompanionCultivations.Clear(); FormationReserves.Clear();
        _managedCharacterId = Party.HeroCharacterId; WonBattles.Clear(); BattleEvents.Clear(); _hasSaved = false;
        _backgroundId = null; _musicId = null;
        BindPartyEvents();
        session.MapService.EnterMap(PackText("initialMapId"));
        Log($"第 {state.Adventure.Round} 周目开始；仓库和玩家档案已继承。");
        if (PackText("initialStoryId").Length > 0) StartStory(PackText("initialStoryId"));
    }

    private sealed partial class BrowserStoryHost
    {
        [StoryCommand("legacy_nick")]
        public void UnlockOriginalAchievement(string id)
        {
            if (!(_pack["achievements"]?.AsArray().Any(a => a?["id"]?.GetValue<string>() == id) ?? false))
                throw new InvalidOperationException("此称号不属于当前原版内容。");
            RequireSession().ProfileService.UnlockAchievement(id);
        }

        public EndingState? Ending { get; private set; }
        private TaskCompletionSource? _endingResult;

        [StoryCommand("legacy_flow")]
        public ValueTask EndFlow(string kind, CancellationToken cancellationToken)
        {
            if (kind == "gameover") return GameOverAsync(cancellationToken);
            if (kind is not ("restart" or "next" or "complete" or "title")) throw new InvalidOperationException("结局类型无效。");
            if (Ending is not null) throw new InvalidOperationException("请先完成当前结局选择。");
            var session = RequireSession(); var round = session.State.Adventure.Round;
            var ending = new EndingState(kind, round, kind == "next" ? checked(round + 1) : kind == "restart" ? round : null);
            if (kind != "title") session.ProfileService.RecordCompletion(round);
            return WaitAtEnding(ending, cancellationToken);
        }

        private ValueTask WaitAtEnding(EndingState ending, CancellationToken cancellationToken)
        {
            Ending = ending;
            var pending = new TaskCompletionSource(); _endingResult = pending;
            cancellationToken.Register(() => pending.TrySetCanceled(cancellationToken));
            return new(pending.Task);
        }

        public void RestoreEnding(EndingState ending)
        {
            Ending = ending;
            GameOver = ending.Kind == "gameover";
        }

        public void ClearEnding() { Ending = null; GameOver = false; _endingResult = null; }

        [StoryCommand("legacy_maxlevel")]
        public void LegacyMaxLevel(string skillId, int levels, string sourceKey)
        {
            var session = RequireSession(); var round = session.State.Adventure.Round;
            // Before multi-round support, the browser's unscoped keys could
            // only have been earned in round one. Preserve those old claims.
            if (round == 1 && session.Profile.ConsumedSkillMaxLevelKeys.Contains(sourceKey)) return;
            session.ProfileService.TryAddSkillMaxLevelBonusOnce(skillId, levels, $"{sourceKey}.round.{round}");
        }
    }
}
