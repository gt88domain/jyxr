using Game.Presentation.MiniGame;

namespace Game.Tests;

public sealed class TrainingSimulationTests
{
    [Fact]
    public void Lightness_WaitsForStartAndRejectsInvalidInput()
    {
        var game = new LightnessTrainingSimulation(new Random(1));
        game.Advance(30);
        game.Move(0, 0);
        Assert.Equal(0, game.ElapsedSeconds);
        Assert.False(game.Finished);
        Assert.Throws<ArgumentOutOfRangeException>(() => game.Advance(double.NaN));
        Assert.Throws<ArgumentOutOfRangeException>(() => game.Move(double.PositiveInfinity, 0));
        game.Start();
        Assert.Throws<InvalidOperationException>(game.Start);
    }

    [Fact]
    public void Lightness_ClampsHeroAndEndsOnActualCollision()
    {
        var game = new LightnessTrainingSimulation(new Random(4));
        game.Start(); game.Move(-100, -100);
        Assert.Equal(0, game.HeroX); Assert.Equal(0, game.HeroY);
        var obstacle = game.Targets[0];
        game.Move(obstacle.X + 100, obstacle.Y + 100);
        Assert.True(game.Finished);
        var x = game.HeroX;
        game.Advance(50); game.Move(500, 500);
        Assert.Equal(0, game.ElapsedSeconds); Assert.Equal(x, game.HeroX);
    }

    [Fact]
    public void Lightness_LargeFrameCannotSkipObstaclesOrAwardTimeAfterCollision()
    {
        var game = new LightnessTrainingSimulation(new Random(42));
        game.Start(); game.Advance(120);
        Assert.True(game.Finished);
        Assert.InRange(game.ElapsedSeconds, 0.01, 119.99);
        var seconds = game.SurvivedSeconds;
        game.Advance(120);
        Assert.Equal(seconds, game.SurvivedSeconds);
        Assert.All(game.Targets, t => { Assert.InRange(t.X, 0, 1720); Assert.InRange(t.Y, 0, 880); });
    }

    [Fact]
    public void Strength_OnlyVisibleCurrentTargetCanBeScoredOnce()
    {
        var game = new StrengthTrainingSimulation([], new Random(9));
        Assert.False(game.Hit("西", 0)); game.Start();
        AdvanceUntil(game, () => game.Targets.First(t => t.Id == "西").Visible);
        var target = game.Targets.First(t => t.Id == "西"); var generation = target.Generation;
        Assert.False(game.Hit(target.Id, generation - 1));
        Assert.True(game.Hit(target.Id, generation)); Assert.Equal(4, game.Score);
        Assert.False(game.Hit(target.Id, generation)); Assert.Equal(4, game.Score);
        Assert.False(game.Hit("forged-target", generation));
    }

    [Fact]
    public void Strength_BadTargetDeductsPointsAndExpiredTargetCannotBeHit()
    {
        var game = new StrengthTrainingSimulation([], new Random(9)); game.Start();
        AdvanceUntil(game, () => game.Targets.First(t => t.Id == "东").Visible);
        var target = game.Targets.First(t => t.Id == "东");
        Assert.True(game.Hit(target.Id, target.Generation)); Assert.Equal(-2, game.Score);
        AdvanceUntil(game, () => game.Targets.First(t => t.Id == "南").Visible);
        target = game.Targets.First(t => t.Id == "南"); var generation = target.Generation;
        game.Advance(0.71);
        Assert.False(game.Hit(target.Id, generation)); Assert.Equal(-2, game.Score);
    }

    [Fact]
    public void Strength_ItemClickUsesOnlySpawnedCandidateAndNeverDuplicates()
    {
        var game = new StrengthTrainingSimulation(["大还丹"], new Random(4)); game.Start();
        AdvanceUntil(game, () => game.Targets.First(t => t.Id == "物品").Visible);
        var target = game.Targets.First(t => t.Id == "物品"); var generation = target.Generation;
        Assert.Equal("大还丹", target.ItemId);
        Assert.True(game.Hit(target.Id, generation));
        Assert.False(game.Hit(target.Id, generation));
        Assert.Equal(1, game.ItemCounts["大还丹"]); Assert.Equal(0, game.Score);
        Assert.Single(game.ItemCounts);
    }

    [Fact]
    public void Strength_ThirtySecondLimitAndEarlyExitFreezeEarnedResults()
    {
        var game = new StrengthTrainingSimulation([], new Random(2)); game.Start();
        game.Advance(29); Assert.False(game.Finished); Assert.Equal(1, game.RemainingSeconds);
        game.Advance(10); Assert.True(game.Finished); Assert.Equal(30, game.ElapsedSeconds);
        Assert.All(game.Targets, target => Assert.False(target.Visible));
        Assert.False(game.Hit("西", 1)); Assert.Equal(0, game.Score);
        var early = new StrengthTrainingSimulation([], new Random(2)); early.Start(); early.Advance(1); early.Finish(); early.Advance(60);
        Assert.Equal(1, early.ElapsedSeconds, 6);
    }

    private static void AdvanceUntil(StrengthTrainingSimulation game, Func<bool> predicate)
    {
        for (var i = 0; i < 2900 && !predicate(); i++) game.Advance(0.01);
        Assert.True(predicate(), "Expected target did not spawn before training ended.");
    }
}
