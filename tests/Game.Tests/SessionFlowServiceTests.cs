using Game.Application;
using Game.Core.Model;
using Game.Core.Story;
using Game.Core.Affix;
using Game.Core.Model.Character;

namespace Game.Tests;

public sealed class SessionFlowServiceTests
{
    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public void StartRound_PreservesEquipmentIdentitySequenceWithCarriedChest(bool nextRound)
    {
        var hero = TestContentFactory.CreateCharacterDefinition("hero");
        var sword = TestContentFactory.CreateEquipment("sword");
        var repository = TestContentFactory.CreateRepository(characters: [hero], equipment: [sword]);
        var state = new GameState();
        var affix = new StatModifierAffix(StatType.Bili, ModifierValue.Add(3));
        var carried = state.EquipmentInstanceFactory.Create(sword, [affix]);
        state.Chest.Inventory.AddEquipmentInstance(carried);
        var session = new GameSession(state, repository, config: new GameConfig { InitialPartyCharacterIds = ["hero"] });
        if (nextRound) session.SessionFlowService.StartNextRound(); else session.SessionFlowService.RestartCurrentRound();
        var restored = Assert.IsType<EquipmentInstanceInventoryEntry>(Assert.Single(session.State.Chest.Inventory.Entries));
        Assert.Equal(carried.Id, restored.Equipment.Id);
        var newlyCreated = session.State.EquipmentInstanceFactory.Create(sword, [affix]);
        Assert.NotEqual(carried.Id, newlyCreated.Id);
        session.State.Chest.Inventory.AddEquipmentInstance(newlyCreated);
        var save = session.SaveGameService.CreateSave();
        session.SaveGameService.LoadSave(save);
        Assert.Equal(2, session.State.Chest.Inventory.Entries.Count);
        Assert.Equal(2, session.State.Chest.Inventory.Entries.OfType<EquipmentInstanceInventoryEntry>().Select(e => e.Equipment.Id).Distinct().Count());
    }
    [Fact]
    public void StartNewGame_RecordsFirstRoundAsReached()
    {
        var heroDefinition = TestContentFactory.CreateCharacterDefinition("hero");
        var session = new GameSession(
            new GameState(),
            TestContentFactory.CreateRepository(characters: [heroDefinition]),
            config: new GameConfig { InitialPartyCharacterIds = ["hero"] });

        session.SessionFlowService.StartNewGame();

        Assert.Equal(1, session.Profile.HighestRound);
        Assert.Equal(0, session.Profile.CompletionCount);
    }

    [Fact]
    public void StartNextRound_ResetsNoRegret()
    {
        var heroDefinition = TestContentFactory.CreateCharacterDefinition("hero");
        var repository = TestContentFactory.CreateRepository(characters: [heroDefinition]);
        var state = new GameState();
        state.Adventure.SetNoRegret(true);
        var session = new GameSession(
            state,
            repository,
            config: new GameConfig
            {
                InitialPartyCharacterIds = ["hero"],
            });

        session.SessionFlowService.StartNextRound();

        Assert.False(session.State.Adventure.NoRegret);
    }

    [Fact]
    public void StartNextRound_ResetsSilverToFixedInitialAmount()
    {
        var heroDefinition = TestContentFactory.CreateCharacterDefinition("hero");
        var repository = TestContentFactory.CreateRepository(characters: [heroDefinition]);
        var state = new GameState();
        state.Adventure.SetRound(2);
        state.Currency.AddSilver(999);
        var session = new GameSession(
            state,
            repository,
            config: new GameConfig
            {
                InitialPartyCharacterIds = ["hero"],
            });

        session.SessionFlowService.StartNextRound();

        Assert.Equal(3, session.State.Adventure.Round);
        Assert.Equal(100, session.State.Currency.Silver);
        Assert.Equal(3, session.Profile.HighestRound);
        Assert.Equal(0, session.Profile.CompletionCount);
    }

    [Fact]
    public void StartNextRound_WritesLastTrialCountStoryVariable()
    {
        var heroDefinition = TestContentFactory.CreateCharacterDefinition("hero");
        var repository = TestContentFactory.CreateRepository(characters: [heroDefinition]);
        var state = new GameState();
        state.SpecialBattle.MarkTrialCompleted("hero");
        state.SpecialBattle.MarkTrialCompleted("ally");
        state.SpecialBattle.MarkTrialCompleted("guest");
        var session = new GameSession(
            state,
            repository,
            config: new GameConfig
            {
                InitialPartyCharacterIds = ["hero"],
            });

        session.SessionFlowService.StartNextRound();

        Assert.True(session.State.Story.TryGetVariable("last_trial_count", out var value));
        Assert.Equal(ExpressionValueKind.Number, value.Kind);
        Assert.Equal(3, value.AsInt32("last_trial_count"));
    }

    [Fact]
    public void StartNextRound_CarriesPlayTimeWhileStartNewGameResetsIt()
    {
        var heroDefinition = TestContentFactory.CreateCharacterDefinition("hero");
        var state = new GameState();
        state.SetPlayTimeSeconds(456);
        var profile = new GameProfile();
        profile.SetTotalPlayTimeSeconds(1234);
        var session = new GameSession(
            state,
            TestContentFactory.CreateRepository(characters: [heroDefinition]),
            initialProfile: profile,
            config: new GameConfig { InitialPartyCharacterIds = ["hero"] });

        session.SessionFlowService.StartNextRound();
        Assert.Equal(456, session.State.PlayTimeSeconds);

        session.SessionFlowService.StartNewGame();
        Assert.Equal(0, session.State.PlayTimeSeconds);
        Assert.Equal(1234, session.Profile.TotalPlayTimeSeconds);
    }

}
