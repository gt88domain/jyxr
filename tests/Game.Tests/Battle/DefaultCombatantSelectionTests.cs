using Game.Application;
using Game.Core.Definitions;
using Game.Core.Model;

namespace Game.Tests;

public sealed class DefaultCombatantSelectionTests
{
    [Fact]
    public void RequiredCompanionsAtBackOfPartyOccupyActualBattleSlots()
    {
        var session = Create(3, ["hero", "musketeer", "agent"]);
        var order = session.State.Party.Members.Select(c => c.Id).ToArray();
        var selected = session.BattleService.SelectDefaultCombatants("encounter");
        var battle = session.BattleService.BuildBattleState(new OrdinaryBattleRequest("encounter", selected));

        Assert.Equal(new[] { "hero", "musketeer", "agent" }, selected);
        Assert.Equal(selected, battle.Units.Where(u => u.Team == 1).Select(u => u.Character.Id));
        Assert.Equal(order, session.State.Party.Members.Select(c => c.Id));
    }

    [Fact]
    public void OptionalSpacesUsePartyOrderAfterReservingRequiredCompanions()
    {
        var session = Create(3, ["hero", "agent"]);
        Assert.Equal(new[] { "hero", "dulcinea", "agent" }, session.BattleService.SelectDefaultCombatants("encounter"));
    }

    [Fact]
    public void OrdinaryPracticeKeepsFirstTwoPartyMembers()
    {
        var session = Create(2, []);
        Assert.Equal(new[] { "hero", "dulcinea" }, session.BattleService.SelectDefaultCombatants("encounter"));
    }

    [Fact]
    public void MissingAndReserveRequiredCharactersAreNotCreatedOrDeployed()
    {
        var session = Create(2, ["hero", "missing", "reserve"]);
        var reserve = TestContentFactory.CreateCharacterDefinition("reserve");
        session.State.Party.AddReserve(TestContentFactory.CreateCharacterInstance("reserve", reserve));

        Assert.Equal(new[] { "hero", "dulcinea" }, session.BattleService.SelectDefaultCombatants("encounter"));
        Assert.True(session.State.Party.ContainsReserve("reserve"));
        Assert.False(session.State.Party.ContainsCharacter("missing"));
    }

    [Fact]
    public void FixedRequiredParticipantDoesNotConsumeAnOptionalSlotOrDuplicateItself()
    {
        var session = Create(1, ["hero"], fixedHero: true);
        var selected = session.BattleService.SelectDefaultCombatants("encounter");
        var battle = session.BattleService.BuildBattleState(new OrdinaryBattleRequest("encounter", selected));

        Assert.Equal(new[] { "dulcinea" }, selected);
        Assert.Equal(new[] { "hero", "dulcinea" }, battle.Units.Where(u => u.Team == 1).Select(u => u.Character.Id));
    }

    [Fact]
    public void FixedOnlyBattleDoesNotRequireADeploymentSlot()
    {
        // The original prologue deploys a fixed hero form, but still names the
        // ordinary hero in required-party metadata. That is not a party slot.
        var session = Create(0, ["agent"], fixedHero: true);
        Assert.Empty(session.BattleService.SelectDefaultCombatants("encounter"));
        var battle = session.BattleService.BuildBattleState(new OrdinaryBattleRequest("encounter", []));
        Assert.Equal("hero", Assert.Single(battle.Units.Where(u => u.Team == 1)).Character.Id);
    }

    [Fact]
    public void ImpossibleRequiredRosterFailsInsteadOfSilentlyOmittingCompanions()
    {
        var session = Create(1, ["hero", "agent"]);
        Assert.Throws<InvalidOperationException>(() => session.BattleService.SelectDefaultCombatants("encounter"));
    }

    private static GameSession Create(int slots, string[] required, bool fixedHero = false)
    {
        var definitions = new[] { "hero", "dulcinea", "eir", "musketeer", "agent", "enemy" }
            .Select(id => TestContentFactory.CreateCharacterDefinition(id)).ToArray();
        var participants = new List<BattleParticipantDefinition>();
        if (fixedHero)
            participants.Add(new() { Team = 1, CharacterId = "hero", Position = new(0, 0) });
        for (var i = 0; i < slots; i++)
            participants.Add(new() { Team = 1, PartyIndex = i, Position = new(i + 1, 1) });
        participants.Add(new() { Team = 2, CharacterId = "enemy", Position = new(9, 1) });
        var definition = new BattleDefinition
        {
            Id = "encounter", Name = "encounter", Background = "test", RequiredCharacterIds = required,
            Participants = participants,
        };
        var state = new GameState();
        foreach (var character in definitions.Where(d => d.Id != "enemy"))
            state.Party.AddMember(TestContentFactory.CreateCharacterInstance(character.Id, character));
        return new GameSession(state, TestContentFactory.CreateRepository(characters: definitions, battles: [definition]));
    }
}
