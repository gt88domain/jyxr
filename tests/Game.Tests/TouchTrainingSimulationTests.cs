using Game.Presentation.MiniGame;

namespace Game.Tests;

public sealed class TouchTrainingSimulationTests
{
    private static TouchTrainingSimulation Create() => new([new(-300, 300, -350, 350)], new Random(17));

    [Theory]
    [InlineData(0.5, false, null, 0)]
    [InlineData(1.0, true, "bad", 0)]
    [InlineData(1.15, true, "good", 1)]
    [InlineData(1.5, true, "perfect", 3)]
    [InlineData(1.85, true, "good", 1)]
    [InlineData(2.2, true, "bad", 0)]
    public void Hit_UsesOriginalTimingAndScore(double age, bool accepted, string? rating, int score)
    {
        var game=Create();var target=game.Targets[0];
        game.Start();game.Advance(-target.Age!.Value+age);
        Assert.Equal(accepted,game.Hit(target.Id,target.Generation));
        Assert.Equal(rating,target.Rating);Assert.Equal(score,game.Score);
        if(accepted)Assert.False(game.Hit(target.Id,target.Generation));
    }

    [Fact]
    public void Waiting_ExpiresAllFiveRoundsAsFailure()
    {
        var game=Create();game.Advance(60);
        Assert.False(game.Started);Assert.Equal(0,game.ElapsedSeconds);
        game.Start();game.Advance(60);
        Assert.True(game.Finished);Assert.Equal(6,game.Round);Assert.Equal(0,game.Score);Assert.False(game.Won);
        Assert.All(game.Targets,t=>Assert.Equal("miss",t.Rating));
    }

    [Fact]
    public void PerfectHits_RequireFiveRoundsAndIgnoreStaleGenerations()
    {
        var game=Create();game.Start();var hits=0;
        while(!game.Finished)
        {
            var target=game.Targets.First(t=>t.Rating is null);
            game.Advance(Math.Max(0,1.5-target.Age!.Value));
            var generation=target.Generation;
            Assert.True(game.Hit(target.Id,generation));hits++;
            if(hits==35){Assert.Equal(105,game.Score);Assert.False(game.Finished);Assert.False(game.Won);}
            if(game.Round>generation)Assert.False(game.Hit(target.Id,generation));
        }
        Assert.Equal(40,hits);Assert.Equal(120,game.Score);Assert.True(game.Won);
    }

    [Fact]
    public void QuitWithEnoughPointsStillRequiresAllRounds()
    {
        var game=Create();game.Start();
        for(var i=0;i<35;i++)
        {
            var target=game.Targets.First(t=>t.Rating is null);
            game.Advance(Math.Max(0,1.5-target.Age!.Value));game.Hit(target.Id,target.Generation);
        }
        game.Finish();Assert.Equal(105,game.Score);Assert.False(game.Won);
    }

    [Theory]
    [InlineData(false,99,false)]
    [InlineData(true,100,true)]
    public void Success_UsesOriginalHundredPointThreshold(bool finalGood,int expected,bool won)
    {
        var game=Create();game.Start();
        for(var i=0;i<34;i++)
        {
            var target=game.Targets.First(t=>t.Rating is null);
            var age=i<33?1.5:finalGood?1.15:2.2;
            game.Advance(Math.Max(0,age-target.Age!.Value));game.Hit(target.Id,target.Generation);
        }
        game.Advance(60);Assert.Equal(expected,game.Score);Assert.Equal(won,game.Won);
    }

    [Fact]
    public void PointPlacement_UsesOriginalZonesAndEightyUnitSeparation()
    {
        var game=Create();
        Assert.All(game.Targets,t=>{Assert.InRange(t.X+44-400,-300,300);Assert.InRange(450-(t.Y+44),-350,350);});
        foreach(var a in game.Targets)foreach(var b in game.Targets.Where(b=>b.Id!=a.Id))
            Assert.True(Math.Abs(a.X-b.X)>=80||Math.Abs(a.Y-b.Y)>=80);
        Assert.False(game.Hit("1",1));game.Start();Assert.False(game.Hit("unknown",1));
        Assert.Throws<ArgumentOutOfRangeException>(()=>game.Advance(double.NaN));
        Assert.Throws<ArgumentException>(()=>new TouchTrainingSimulation([]));
        Assert.Throws<InvalidOperationException>(()=>new TouchTrainingSimulation([new(0,1,0,1)]));
    }
}
