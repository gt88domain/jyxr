using System.Text.Json.Nodes;
using Game.Application;
using Game.Core;
using Game.Core.Story;
using Game.Expressions;

namespace Game.Web.Runtime;

public static partial class BrowserBridge
{
    private static readonly Queue<string> ExpiredStories = new();
    private static MapEnterResult? _mapView;
    private static Game.Core.Model.GameState? _mapViewState;

    private static MapEnterResult CurrentMapView()
    {
        var session = RequireSession();
        if (_mapView is null || !ReferenceEquals(_mapViewState, session.State) || _mapView.Map.Id != session.State.Location.CurrentMapId)
        {
            _mapView = session.MapService.GetCurrentMap();
            _mapViewState = session.State;
        }
        return _mapView;
    }

    private static bool TaskActive(JsonObject task) => _session is not null &&
        _session.State.Story.TryGetVariable("newbie_" + task["id"]!.GetValue<string>(), out var flag) && flag.AsBoolean("legacy task flag");

    private static JsonObject? ActiveTutorial() => (_pack["legacyTasks"]?.AsArray() ?? [])
        .OfType<JsonObject>().FirstOrDefault(TaskActive);

    private static object? TutorialView() => ActiveTutorial() is { } task ? new
    {
        id = task["id"]!.GetValue<string>(), description = task["description"]?.GetValue<string>() ?? "",
        locations = task["locations"]?.DeepClone()
    } : null;

    private static object[] SectView() => !_host.SelectingSect ? [] : _content!.Sects.Values.Select(s => (object)new
    {
        id = s.Id, name = s.Name, description = s.Description, focus = s.PrimaryFocus,
        masters = s.MasterNames, skills = s.SignatureSkillNames, traits = s.TraitTags,
        available = _content.TryGetStorySegment(s.StoryId, out _)
    }).ToArray();

    private static void PumpLegacyWorld()
    {
        if (PackText("id") != "jyx" || _session is null || !CanManage || _storyTask is { IsCompleted: false }) return;
        foreach (var expired in _session.StoryTimeKeyExpirationService.CheckExpired()) ExpiredStories.Enqueue(expired.TargetStoryId);
        if (ExpiredStories.TryDequeue(out var story))
        {
            StartStory(story);
            return;
        }
        if (ActiveTutorial() is { } task)
        {
            var evaluator = new ExpressionEvaluator();
            var expression = new ExpressionParser().ParseExpression(task["when"]!.GetValue<string>());
            if (evaluator.EvaluateBoolean(expression, new GameExpressionEnvironment(_session).Create(), "legacy newbie task"))
            {
                // The old engine clears its single task before its finish story.
                _session.State.Story.RemoveVariable("newbie_" + task["id"]!.GetValue<string>());
                StartStory(task["storyId"]!.GetValue<string>());
                return;
            }
        }
        _session.WorldTriggerService.RequestCheck();
        _storyTask = _session.WorldTriggerService.ExecutePendingAsync(_storyCancellation.Token);
    }

    private sealed partial class BrowserStoryHost
    {
        private TaskCompletionSource<string>? _sectChoice;
        public bool SelectingSect => _sectChoice is not null;

        [StoryCommand("select_sect", "select_menpai")]
        public async ValueTask<StoryCommandResult> SelectSect(CancellationToken cancellationToken)
        {
            if (SelectingSect) throw new InvalidOperationException("正在选择门派。");
            var pending = new TaskCompletionSource<string>();
            _sectChoice = pending;
            using var registration = cancellationToken.Register(() => pending.TrySetCanceled(cancellationToken));
            var target = await pending.Task;
            return StoryCommandResult.Jump(target);
        }

        public void ChooseSect(string sectId)
        {
            var pending = _sectChoice ?? throw new InvalidOperationException("当前不在拜师流程。");
            var sect = _content!.GetSect(sectId);
            if (!_content.TryGetStorySegment(sect.StoryId, out _)) throw new InvalidOperationException("此门派入口尚未迁移。");
            _sectChoice = null;
            pending.SetResult(sect.StoryId);
        }

        [StoryCommand("legacy_newbie")]
        public void SetLegacyNewbie(string taskId)
        {
            var tasks = (_pack["legacyTasks"]?.AsArray() ?? []).OfType<JsonObject>().ToArray();
            if (!tasks.Any(t => t["id"]?.GetValue<string>() == taskId)) throw new InvalidOperationException("教学任务未迁移。");
            foreach (var task in tasks) RequireSession().State.Story.RemoveVariable("newbie_" + task["id"]!.GetValue<string>());
            RequireSession().State.Story.SetVariable("newbie_" + taskId, ExpressionValue.FromBoolean(true));
        }

        [StoryCommand("battle")]
        public async ValueTask Battle(string battleId, CancellationToken cancellationToken)
        {
            await ResolveBattleAsync(new BattleContext(battleId, [BattleOutcome.Win, BattleOutcome.Lose]), cancellationToken);
        }

        [StoryCommand("set_model")]
        public void SetModel(string characterId, string modelId) => RequireSession().CharacterService.SetCharacterModel(characterId, modelId);

        [StoryCommand("set_portrait")]
        public void SetPortrait(string characterId, string portraitId) => RequireSession().CharacterService.SetCharacterPortrait(characterId, portraitId);

        [StoryCommand("legacy_presentation")]
        public void LegacyPresentation(string kind, string value) => Log($"演出提示：{kind} {value}");
    }
}
