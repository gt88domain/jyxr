using System.Diagnostics;
using System.Runtime.InteropServices.JavaScript;
using System.Text.Json;
using Game.Application;
using Game.Presentation.MiniGame;

namespace Game.Web.Runtime;

public static partial class BrowserBridge
{
    // Frames return only the small training state, without serializing the
    // entire inventory/map/content package at animation frequency.
    [JSExport]
    public static string MiniGameInput(string inputJson)
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

    private static object? MiniGameSnapshot() => _host.Training is not { } training ? null : new
    {
        id = training.Id, title = training.Id == "qinggong" ? "轻功修炼" : "葵花点穴手",
        heroPortrait = CharacterMedia(Hero, "portraits"),
        portraits = new[] { "东", "南", "西", "北" }.ToDictionary(n => n, n => ResourceMedia("头像." + n)),
        itemIcons = _host.TrainingItems.ToDictionary(id => id, ItemMedia)
    };

    private sealed partial class BrowserStoryHost : IMiniGameRuntimeHost
    {
        public TrainingSimulation? Training { get; private set; }
        public IReadOnlyList<string> TrainingItems { get; private set; } = [];
        private TaskCompletionSource? _trainingResult;
        private readonly Stopwatch _trainingClock = new();
        private double _lastTrainingTime;
        private bool _trainingPaused;

        private async ValueTask RunTraining(TrainingSimulation simulation, CancellationToken cancellationToken)
        {
            Training = simulation;
            _lastTrainingTime = 0; _trainingClock.Reset(); _trainingPaused = false;
            var pending = new TaskCompletionSource(); _trainingResult = pending;
            using var registration = cancellationToken.Register(() => pending.TrySetCanceled(cancellationToken));
            await pending.Task;
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
            return new { id = t.Id, width = TrainingSimulation.Width, height = TrainingSimulation.Height,
                targetSize = TrainingSimulation.TargetSize, elapsed = t.ElapsedSeconds, started = t.Started,
                finished = t.Finished, paused = _trainingPaused,
                score = t is StrengthTrainingSimulation strength ? strength.Score : 0,
                remaining = t is StrengthTrainingSimulation s ? s.RemainingSeconds : 0,
                hero = t is LightnessTrainingSimulation lightness ? new { x = lightness.HeroX, y = lightness.HeroY } : null,
                targets = t.Targets.Select(target => new { id = target.Id, x = target.X, y = target.Y, visible = target.Visible,
                    points = target.Points, itemId = target.ItemId, generation = target.Generation }).ToArray() };
        }

        public void UpdateTraining(JsonElement args)
        {
            var t = Training ?? throw new InvalidOperationException("当前没有进行小游戏。");
            var action = Read(args, "action", "frame");
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
                    if (!_trainingPaused) strength.Hit(Read(args, "id"), args.GetProperty("generation").GetInt32());
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
