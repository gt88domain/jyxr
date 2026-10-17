using Game.Core.Abstractions;
using Game.Core.Model.Skills;

namespace Game.Core.Battle;

public sealed record BattleFormationRules(
    string InterceptTalentId,
    string SharedDamageTalentId,
    string TransferTalentId,
    string GroupAttackTalentId,
    int SupportRadius = 5)
{
    public void Validate()
    {
        foreach (var id in new[] { InterceptTalentId, SharedDamageTalentId, TransferTalentId, GroupAttackTalentId })
            ArgumentException.ThrowIfNullOrWhiteSpace(id);
        ArgumentOutOfRangeException.ThrowIfNegative(SupportRadius);
    }
}

// Formation is one ordered damage operation. A redirected hit must use the
// replacement target for subsequent sharing, rather than independent owner hooks.
internal sealed class BattleFormationResolver(BattleEngine engine, BattleFormationRules rules, IRandomService random)
{
    public int ModifyAttack(BattleState state, BattleUnit source, int amount)
    {
        if (source.Character.HasEffectiveTalent(rules.InterceptTalentId))
            foreach (var ally in Others(state, source).Where(u => u.Character.HasEffectiveTalent(rules.InterceptTalentId)))
            {
                var factor = 1 + random.NextDouble() / 10;
                if (amount > 0) amount = (int)(amount * factor);
            }
        if (source.Character.HasEffectiveTalent(rules.GroupAttackTalentId))
        {
            var members = state.GetLivingUnits().Where(u => u.Team == source.Team && u.Character.HasEffectiveTalent(rules.GroupAttackTalentId)).ToArray();
            if (members.Length >= 3) amount = (int)(amount * 1.5);
            else foreach (var member in members)
            {
                member.Character.RemoveTalent(rules.GroupAttackTalentId);
                state.AddMessage(new BattleCue(BattleCueKind.FloatTextRequested, member.Id,
                    floatText: new BattleFloatTextCue(rules.GroupAttackTalentId + "解除", BattleFloatTextStyle.Special)));
            }
        }
        return amount;
    }

    public void ApplyDefence(BattleState state, BattleDamageApplicationContext hit)
    {
        if (hit.Target.Character.HasEffectiveTalent(rules.InterceptTalentId))
            foreach (var ally in Others(state, hit.Target).Where(u => u.Character.HasEffectiveTalent(rules.InterceptTalentId)))
                if (random.NextDouble() <= .5)
                {
                    hit.ProposedAmount = (int)(hit.ProposedAmount * .3f);
                    hit.Target = ally;
                    break;
                }
        if (hit.ProposedAmount > 0)
        {
            var supporters = Others(state, hit.Target)
                .Where(u => u.Character.HasEffectiveTalent(rules.SharedDamageTalentId) && InRange(u, hit.Target))
                .Where(_ => random.NextDouble() < .5).ToArray();
            hit.ProposedAmount /= supporters.Length + 1;
            foreach (var ally in supporters)
                engine.ApplySharedDamage(state, hit.Source, ally, hit.ProposedAmount, hit.Skill, rules.SharedDamageTalentId);
        }
        if (hit.ProposedAmount > 0 && hit.Target.Character.HasEffectiveTalent(rules.TransferTalentId) && random.NextDouble() < .5)
        {
            var candidates = Others(state, hit.Target).Where(u => InRange(u, hit.Target)).ToArray();
            if (candidates.Length > 0)
            {
                // Original inclusive GetRandomInt(0,count) % count: first has two tickets.
                var selected = candidates[random.Next(0, candidates.Length + 1) % candidates.Length];
                var shared = (int)(hit.ProposedAmount * .8);
                hit.ProposedAmount = (int)(hit.ProposedAmount * .2);
                engine.ApplySharedDamage(state, hit.Source, selected, shared, hit.Skill, rules.TransferTalentId);
            }
        }
    }

    private bool InRange(BattleUnit a, BattleUnit b) => a.Position.ManhattanDistanceTo(b.Position) <= rules.SupportRadius;
    private static IEnumerable<BattleUnit> Others(BattleState state, BattleUnit target) => state.GetLivingUnits().Where(u =>
        u.Team == target.Team && !string.Equals(u.Character.Definition.Id, target.Character.Definition.Id, StringComparison.Ordinal));
}
