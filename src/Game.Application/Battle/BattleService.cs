using Game.Core.Battle;

namespace Game.Application;

public sealed class BattleService
{
    private readonly GameSession _session;
    private readonly BattleStateFactory _stateFactory;
    private readonly BattleSettlementService _settlementService;
    private readonly BattleCarryoverService _carryoverService;

    public BattleService(GameSession session)
    {
        ArgumentNullException.ThrowIfNull(session);
        _session = session;
        var zhenlongqijuFactory = new ZhenlongqijuBattleFactory(session);
        var characterFactory = new ProceduralBattleCharacterFactory(session);
        _stateFactory = new BattleStateFactory(session, characterFactory, zhenlongqijuFactory);
        _settlementService = new BattleSettlementService(session, zhenlongqijuFactory);
        _carryoverService = new BattleCarryoverService(session);
    }

    public BattleState BuildBattleState(SpecialBattleRequest request) =>
        _stateFactory.BuildBattleState(request);

    /// <summary>
    /// Fills an ordinary battle's deployment slots in party order, reserving
    /// places for required members before considering optional companions.
    /// </summary>
    public IReadOnlyList<string> SelectDefaultCombatants(string battleId)
    {
        var battle = _session.ContentRepository.GetBattle(battleId);
        var playerTeam = _session.Config.BattlePlayerTeam;
        var slots = battle.Participants.Count(p =>
            p.Team == playerTeam && p.PartyIndex is not null && p.CharacterId is null);
        // Scripted battles can supply the entire cast (including a temporary
        // hero form) while carrying old required-party metadata.
        if (slots == 0) return [];
        var fixedIds = battle.Participants
            .Where(p => p.Team == playerTeam && !string.IsNullOrWhiteSpace(p.CharacterId))
            .Select(p => p.CharacterId!).ToHashSet(StringComparer.Ordinal);
        var members = _session.State.Party.Members
            .Where(c => !fixedIds.Contains(c.Id)).Select(c => c.Id).ToArray();
        // Match explicit deployment: only members actually in the active party
        // are mandatory. A story requirement must not create a missing recruit.
        var selected = battle.RequiredCharacterIds.Where(id => members.Contains(id))
            .ToHashSet(StringComparer.Ordinal);
        if (selected.Count > slots)
            throw new InvalidOperationException($"Battle '{battleId}' has more required party members than deployment slots.");
        foreach (var id in members)
        {
            if (selected.Count >= slots) break;
            selected.Add(id);
        }
        // Keep formation order; reserving a place must not reorder the saved party.
        return members.Where(selected.Contains).ToArray();
    }

    public OrdinaryBattleVictorySettlement PreviewVictorySettlement(
        BattleState state,
        SpecialBattleRequest request) =>
        _settlementService.PreviewVictorySettlement(state, request);

    public void ApplyOrdinaryVictorySettlement(
        BattleState state,
        OrdinaryBattleVictorySettlement settlement) =>
        _settlementService.ApplyVictorySettlement(state, settlement);

    public void ApplyPlayerBattleCarryover(BattleState state) =>
        _carryoverService.ApplyPlayerBattleCarryover(state);

    public void RecordDefeatedEnemies(BattleState state)
    {
        ArgumentNullException.ThrowIfNull(state);

        var defeatedEnemyCount = state.Units.Count(unit =>
            unit.Team != _session.Config.BattlePlayerTeam &&
            !unit.IsAlive);
        if (defeatedEnemyCount > 0)
        {
            _session.ProfileService.AddKills(defeatedEnemyCount);
        }
    }

    public void RestorePartyBattleResources() =>
        _carryoverService.RestorePartyBattleResources();
}
