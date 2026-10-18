using System.Diagnostics;
using System.Runtime.InteropServices.JavaScript;
using System.Text.Json;
using Game.Application;
using Game.Core.Story;
using Game.Expressions;
using Game.Presentation.MiniGame;

namespace Game.Web.Runtime;

internal sealed partial class BrowserRuntimeSession
{
    // Frames return only the small training state, without serializing the
    // entire inventory/map/content package at animation frequency.
    public string MiniGameInput(string inputJson)
    {
        try
        {
            using var input = JsonDocument.Parse(inputJson);
            var args = input.RootElement;
            _host.UpdateTraining(args);
            return JsonSerializer.Serialize(new { ok = true, frame = _host.TrainingFrame() }, Json);
        }
        catch (Exception e) { return JsonSerializer.Serialize(new { ok = false, error = e.Message }, Json); }
    }

    private object? MiniGameSnapshot() => _host.Training is not { } training ? null : new
    {
        id = training.Id, title = training.Id == "qinggong" ? "轻功修炼" : training.Id == "touch" ? "点穴救治 · " + _host.TrainingTouchKey : "葵花点穴手",
        background = _host.TrainingTouchKey is { } key ? ResourceMedia(_pack["touchGames"]?[key]?["background"]?.GetValue<string>()) : null,
        pointIcons = Enumerable.Range(1, 8).ToDictionary(n => n.ToString(), n => ResourceMedia("ui/touch/number" + n)),
        heroPortrait = CharacterMedia(Hero, "portraits"),
        portraits = new[] { "东", "南", "西", "北" }.ToDictionary(n => n, n => ResourceMedia("头像." + n)),
        itemIcons = _host.TrainingItems.ToDictionary(id => id, ItemMedia)
    };

    private sealed partial class BrowserStoryHost : IMiniGameRuntimeHost
    {
        public TrainingSimulation? Training { get; private set; }
        public IReadOnlyList<string> TrainingItems { get; private set; } = [];
        public string? TrainingTouchKey { get; private set; }
        private TaskCompletionSource? _trainingResult;
        private readonly Stopwatch _trainingClock = new();
        private double _lastTrainingTime;
        private bool _trainingPaused;

        [StoryCommand("legacy_touch")]
        public async ValueTask RunOriginalTouch(string key, CancellationToken cancellationToken)
        {
            var definition = _owner._pack["touchGames"]?[key] ?? throw new InvalidOperationException("原版点穴配置不存在。");
            var zones = definition["zones"]!.AsArray().Select(z => new TouchZone(z!["minX"]!.GetValue<int>(), z["maxX"]!.GetValue<int>(), z["minY"]!.GetValue<int>(), z["maxY"]!.GetValue<int>()));
            var simulation = new TouchTrainingSimulation(zones);
            TrainingTouchKey = key; TrainingItems = [];
            await RunTraining(simulation, cancellationToken);
            _owner.RequireSession().State.Story.SetVariable("browser_touch_won", ExpressionValue.FromBoolean(simulation.Won));
            TrainingTouchKey = null;
            _owner.Log($"点穴成绩 {simulation.Score} / 120，" + (simulation.Won ? "救治成功。" : "此次未能成功。"));
        }

        private async ValueTask RunTraining(TrainingSimulation simulation, CancellationToken cancellationToken)
        {
            Training = simulation;
            _lastTrainingTime = 0; _trainingClock.Reset(); _trainingPaused = false;
            var pending = new TaskCompletionSource(); _trainingResult = pending;
            using var registration = cancellationToken.Register(() => pending.TrySetCanceled(cancellationToken));
            await pending.Task;
            cancellationToken.ThrowIfCancellationRequested();
        }

        public async ValueTask<int> RunLightnessTrainingAsync(CancellationToken cancellationToken)
        {
            TrainingItems = [];
            var simulation = new LightnessTrainingSimulation();
            await RunTraining(simulation, cancellationToken);
            return simulation.SurvivedSeconds;
        }

        public async ValueTask<(int Score, IReadOnlyDictionary<string, int> ItemCounts)> RunStrengthTrainingAsync(IReadOnlyList<string> itemIds, CancellationToken cancellationToken)
        {
            TrainingItems = itemIds;
            var simulation = new StrengthTrainingSimulation(itemIds);
            await RunTraining(simulation, cancellationToken);
            return (simulation.Score, simulation.ItemCounts.ToDictionary());
        }

        public object TrainingFrame()
        {
            var t = Training ?? throw new InvalidOperationException("当前没有进行小游戏。");
            var touch = t as TouchTrainingSimulation;
            return new { id = t.Id, width = touch is null ? TrainingSimulation.Width : TouchTrainingSimulation.CanvasWidth, height = touch is null ? TrainingSimulation.Height : TouchTrainingSimulation.CanvasHeight,
                targetSize = touch is null ? TrainingSimulation.TargetSize : TouchTrainingSimulation.PointSize, elapsed = t.ElapsedSeconds, started = t.Started,
                finished = t.Finished, paused = _trainingPaused,
                score = touch?.Score ?? (t is StrengthTrainingSimulation strength ? strength.Score : 0),
                round = touch is null ? 0 : Math.Min(touch.Round, TouchTrainingSimulation.Rounds), totalRounds = touch is null ? 0 : TouchTrainingSimulation.Rounds,
                remaining = t is StrengthTrainingSimulation s ? s.RemainingSeconds : 0,
                hero = t is LightnessTrainingSimulation lightness ? new { x = lightness.HeroX, y = lightness.HeroY } : null,
                targets = t.Targets.Select(target => new { id = target.Id, x = target.X, y = target.Y, visible = target.Visible,
                    points = target.Points, itemId = target.ItemId, generation = target.Generation, age = target.Age, rating = target.Rating }).ToArray() };
        }

        public void UpdateTraining(JsonElement args)
        {
            var t = Training ?? throw new InvalidOperationException("当前没有进行小游戏。");
            var action = _owner.Read(args, "action", "frame");
            // Only elapsed host time is accepted. JavaScript cannot submit a
            // score, elapsed duration or reward inventory.
            var now = _trainingClock.Elapsed.TotalSeconds;
            if (!_trainingPaused) t.Advance(Math.Max(0, now - _lastTrainingTime));
            _lastTrainingTime = now;
            switch (action)
            {
                case "frame": break;
                case "start": t.Start(); _trainingClock.Restart(); _lastTrainingTime = 0; break;
                case "pause": _trainingPaused = true; _trainingClock.Stop(); break;
                case "resume": _trainingPaused = false; if (t.Started && !t.Finished) _trainingClock.Start(); break;
                case "move" when t is LightnessTrainingSimulation lightness:
                    if (!_trainingPaused) lightness.Move(args.GetProperty("x").GetDouble(), args.GetProperty("y").GetDouble());
                    break;
                case "hit" when t is StrengthTrainingSimulation strength:
                    if (!_trainingPaused) strength.Hit(_owner.Read(args, "id"), args.GetProperty("generation").GetInt32());
                    break;
                case "hit" when t is TouchTrainingSimulation touch:
                    if (!_trainingPaused) touch.Hit(_owner.Read(args, "id"), args.GetProperty("generation").GetInt32());
                    break;
                case "quit": t.Finish(); break;
                default: throw new InvalidOperationException("小游戏操作无效。");
            }
        }

        public void CompleteTraining()
        {
            if (Training is not { Finished: true } || _trainingResult is not { } pending)
                throw new InvalidOperationException("请先完成当前修炼。");
            _trainingClock.Stop(); Training = null; TrainingItems = []; _trainingResult = null;
            pending.SetResult();
        }
    }
}
