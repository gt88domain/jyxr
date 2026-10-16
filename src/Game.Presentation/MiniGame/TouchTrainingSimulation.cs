namespace Game.Presentation.MiniGame;

public sealed record TouchZone(int MinX, int MaxX, int MinY, int MaxY);

/// <summary>Original story acupoint timing game. No inventory or quest mutation.</summary>
public sealed class TouchTrainingSimulation : TrainingSimulation
{
    public const int Rounds = 5, PointsPerRound = 8, SuccessScore = 100;
    public const double CanvasWidth = 800, CanvasHeight = 900, PointSize = 88;
    private const double Lifetime = 3, AimAge = 1.5;
    private const double PerfectWindow = 0.2f, GoodWindow = 0.4f, EarlyWindow = 0.6f;
    private readonly Random _random;
    private readonly TouchZone[] _zones;
    private TrainingTarget[] _targets = [];
    public override string Id => "touch";
    public override IReadOnlyList<TrainingTarget> Targets => _targets;
    public int Round { get; private set; } = 1;
    public int Score { get; private set; }
    public bool Won => Finished && Round > Rounds && Score >= SuccessScore;

    public TouchTrainingSimulation(IEnumerable<TouchZone> zones, Random? random = null)
    {
        _zones = zones.ToArray();
        if (_zones.Length == 0 || _zones.Any(z => z.MinX >= z.MaxX || z.MinY >= z.MaxY ||
            z.MinX < -400 || z.MaxX > 400 || z.MinY < -450 || z.MaxY > 450))
            throw new ArgumentException("Acupoint zones must be nonempty rectangles within the logical canvas.", nameof(zones));
        _random = random ?? Random.Shared;
        ScheduleRound();
    }

    private void ScheduleRound()
    {
        var targets = new List<TrainingTarget>();
        var showAt = ElapsedSeconds;
        for (var i = 0; i < PointsPerRound; i++)
        {
            var position = PlacePoint(targets);
            showAt += 0.3 + _random.NextDouble() * 0.2;
            targets.Add(new TrainingTarget { Id = (i + 1).ToString(), PortraitId = "", Points = 3,
                X = position.X, Y = position.Y, Generation = Round, Visible = true,
                ShowAt = showAt, HideAt = showAt + Lifetime, Age = ElapsedSeconds - showAt });
        }
        _targets = targets.ToArray();
    }

    private (double X, double Y) PlacePoint(IReadOnlyList<TrainingTarget> placed)
    {
        // The original retries while both coordinate distances are below 80.
        // Bound malformed/custom content instead of freezing the browser.
        for (var attempt = 0; attempt < 10_000; attempt++)
        {
            var zone = _zones[_random.Next(_zones.Length)];
            var x = CanvasWidth / 2 + _random.Next(zone.MinX, zone.MaxX + 1) - PointSize / 2;
            var y = CanvasHeight / 2 - _random.Next(zone.MinY, zone.MaxY + 1) - PointSize / 2;
            if (placed.All(p => Math.Abs(p.X - x) >= 80 || Math.Abs(p.Y - y) >= 80)) return (x, y);
        }
        throw new InvalidOperationException("The acupoint zones cannot accommodate eight separated points.");
    }

    public bool Hit(string id, int generation)
    {
        if (!Started || Finished) return false;
        var target = _targets.FirstOrDefault(t => t.Id == id && t.Generation == generation);
        if (target is null || target.Rating is not null || ElapsedSeconds < target.ShowAt) return false;
        var delta = AimAge - (ElapsedSeconds - target.ShowAt);
        if (delta > EarlyWindow) return false;
        var error = Math.Abs(delta);
        var points = error < PerfectWindow ? 3 : error < GoodWindow ? 1 : 0;
        target.Rating = points == 3 ? "perfect" : points == 1 ? "good" : "bad";
        Score += points;
        CompleteRoundIfReady();
        return true;
    }

    protected override void Step(double seconds)
    {
        foreach (var target in _targets)
        {
            target.Age = ElapsedSeconds - target.ShowAt;
            if (target.Rating is null && ElapsedSeconds + 1e-9 >= target.HideAt) target.Rating = "miss";
        }
        CompleteRoundIfReady();
    }

    private void CompleteRoundIfReady()
    {
        if (_targets.Any(t => t.Rating is null)) return;
        Round++;
        if (Round > Rounds)
        {
            Finished = true;
            foreach (var target in _targets) target.Visible = false;
        }
        else ScheduleRound();
    }
}
