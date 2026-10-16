namespace Game.Presentation.MiniGame;

// Host-independent input/animation state. Application.MiniGameService owns
// inventory rewards, unique reward claims, practice points and stat growth.
public sealed class TrainingTarget
{
    public required string Id { get; init; }
    public required string PortraitId { get; init; }
    public int Points { get; init; }
    public string? ItemId { get; internal set; }
    public double X { get; internal set; }
    public double Y { get; internal set; }
    public bool Visible { get; internal set; }
    public int Generation { get; internal set; }
    internal double VelocityX, VelocityY, ShowAt, HideAt;
}

public abstract class TrainingSimulation
{
    public const double Width = 1920, Height = 1080, TargetSize = 200;
    public double ElapsedSeconds { get; protected set; }
    public bool Started { get; private set; }
    public bool Finished { get; protected set; }
    public abstract string Id { get; }
    public abstract IReadOnlyList<TrainingTarget> Targets { get; }
    public void Start()
    {
        if (Started || Finished) throw new InvalidOperationException("Training has already started.");
        Started = true;
    }
    public void Finish() => Finished = true;
    public void Advance(double seconds)
    {
        if (!double.IsFinite(seconds) || seconds < 0) throw new ArgumentOutOfRangeException(nameof(seconds));
        if (!Started || Finished) return;
        // Fixed substeps preserve collisions when rendering slows down.
        while (seconds > 0 && !Finished)
        {
            var step = Math.Min(seconds, 1d / 120);
            ElapsedSeconds += step;
            Step(step);
            seconds -= step;
        }
    }
    protected abstract void Step(double seconds);
}

public sealed class LightnessTrainingSimulation : TrainingSimulation
{
    private readonly TrainingTarget[] _targets;
    private double _nextSpeedUp = 0.2;
    public override string Id => "qinggong";
    public override IReadOnlyList<TrainingTarget> Targets => _targets;
    public double HeroX { get; private set; } = (Width - TargetSize) / 2;
    public double HeroY { get; private set; } = (Height - TargetSize) / 2;
    public int SurvivedSeconds => (int)Math.Floor(ElapsedSeconds);

    public LightnessTrainingSimulation(Random? random = null)
    {
        random ??= Random.Shared;
        string[] names = ["东", "南", "西", "北"];
        (double X, double Y)[] centers = [(0.125, 0.25), (0.745, 0.765), (0.815, 0.25), (0.165, 0.765)];
        _targets = names.Select((name, i) =>
        {
            var vx = 300 * (0.2 + random.NextDouble() * 0.6);
            var vy = Math.Sqrt(300 * 300 - vx * vx);
            return new TrainingTarget { Id = name, PortraitId = "头像." + name, Visible = true,
                X = Width * centers[i].X - TargetSize / 2, Y = Height * centers[i].Y - TargetSize / 2,
                VelocityX = random.Next(2) == 0 ? -vx : vx, VelocityY = random.Next(2) == 0 ? -vy : vy };
        }).ToArray();
    }

    public void Move(double centerX, double centerY)
    {
        if (!double.IsFinite(centerX) || !double.IsFinite(centerY)) throw new ArgumentOutOfRangeException(nameof(centerX));
        if (!Started || Finished) return;
        HeroX = Math.Clamp(centerX - TargetSize / 2, 0, Width - TargetSize);
        HeroY = Math.Clamp(centerY - TargetSize / 2, 0, Height - TargetSize);
        CheckCollision();
    }

    protected override void Step(double seconds)
    {
        if (ElapsedSeconds + 1e-9 >= _nextSpeedUp)
        {
            _nextSpeedUp += 0.2;
            foreach (var t in _targets) { t.VelocityX *= 1.01; t.VelocityY *= 1.01; }
        }
        foreach (var t in _targets)
        {
            t.X += t.VelocityX * seconds; t.Y += t.VelocityY * seconds;
            if (t.X < 0) { t.X = 0; t.VelocityX = Math.Abs(t.VelocityX); }
            if (t.X > Width - TargetSize) { t.X = Width - TargetSize; t.VelocityX = -Math.Abs(t.VelocityX); }
            if (t.Y < 0) { t.Y = 0; t.VelocityY = Math.Abs(t.VelocityY); }
            if (t.Y > Height - TargetSize) { t.Y = Height - TargetSize; t.VelocityY = -Math.Abs(t.VelocityY); }
        }
        CheckCollision();
    }

    private void CheckCollision()
    {
        if (_targets.Any(t => t.X < HeroX + TargetSize && t.X + TargetSize > HeroX && t.Y < HeroY + TargetSize && t.Y + TargetSize > HeroY)) Finished = true;
    }
}

public sealed class StrengthTrainingSimulation : TrainingSimulation
{
    private readonly Random _random;
    private readonly string[] _items;
    private readonly TrainingTarget[] _targets;
    private readonly Dictionary<string, int> _itemCounts = new(StringComparer.Ordinal);
    public override string Id => "dianxue";
    public override IReadOnlyList<TrainingTarget> Targets => _targets;
    public int Score { get; private set; }
    public IReadOnlyDictionary<string, int> ItemCounts => _itemCounts;
    public int RemainingSeconds => Math.Max(0, (int)Math.Ceiling(30 - ElapsedSeconds));

    public StrengthTrainingSimulation(IReadOnlyList<string> itemIds, Random? random = null)
    {
        _random = random ?? Random.Shared;
        _items = itemIds.Distinct(StringComparer.Ordinal).ToArray();
        string[] names = ["东", "西", "南", "北", "物品"];
        int[] points = [-2, 4, 2, 3, 0];
        _targets = names.Select((name, i) => new TrainingTarget { Id = name, PortraitId = i < 4 ? "头像." + name : "", Points = points[i] }).ToArray();
        foreach (var t in _targets) HideAndSchedule(t, true);
    }

    public bool Hit(string id, int generation)
    {
        if (!Started || Finished) return false;
        var t = _targets.FirstOrDefault(t => t.Id == id);
        if (t is null || !t.Visible || t.Generation != generation) return false;
        if (t.ItemId is { } item) _itemCounts[item] = _itemCounts.GetValueOrDefault(item) + 1;
        else Score = checked(Score + t.Points);
        HideAndSchedule(t);
        return true;
    }

    protected override void Step(double seconds)
    {
        if (ElapsedSeconds + 1e-9 >= 30)
        {
            ElapsedSeconds = 30; Finished = true;
            foreach (var t in _targets) t.Visible = false;
            return;
        }
        foreach (var t in _targets)
        {
            if (t.Visible) { if (ElapsedSeconds >= t.HideAt) HideAndSchedule(t); continue; }
            if (ElapsedSeconds < t.ShowAt) continue;
            if (t.Id == "物品")
            {
                if (_items.Length == 0) { HideAndSchedule(t); continue; }
                t.ItemId = _items[_random.Next(_items.Length)];
            }
            t.X = _random.NextDouble() * (Width - TargetSize);
            t.Y = 72 + _random.NextDouble() * (Height - TargetSize - 72);
            t.Generation++; t.Visible = true; t.HideAt = ElapsedSeconds + 0.7;
        }
    }

    private void HideAndSchedule(TrainingTarget t, bool initial = false)
    {
        t.Visible = false; t.ItemId = null;
        var isItem = t.Id == "物品";
        var min = isItem ? 4 : 0.7;
        var max = isItem ? 10 : initial ? 3 : 5;
        t.ShowAt = ElapsedSeconds + min + _random.NextDouble() * (max - min);
    }
}
