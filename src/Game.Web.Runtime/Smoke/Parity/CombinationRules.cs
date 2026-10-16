using Game.Content.Loading;
using Game.Core.Abstractions;
using Game.Core.Battle;
using Game.Core.Model;
using Game.Core.Model.Character;
using Game.Core.Model.Skills;

// Isolated source-formula comparisons, not natural acquisition or full parity.
internal static class CombinationRules
{
    public static void Run(InMemoryContentRepository content)
    {
        var checks = 0;
        void Check(bool valid, string message)
        {
            if (!valid) throw new InvalidOperationException("Combination rule failed: " + message);
            checks++;Console.WriteLine("PASS combination " + message);
        }
        CharacterInstance Character(string id, string[] talents, CharacterGender gender = CharacterGender.Male)
        {
            var c = CharacterMapper.CreateInitial(id, content.GetCharacter("主角") with { Level = 30, Gender = gender }, new EquipmentInstanceFactory());
            c.UnlockedTalents.Clear();c.UnlockedTalents.AddRange(talents.Select(content.GetTalent));
            c.BaseStats[StatType.MaxHp] = 200000;c.BaseStats[StatType.MaxMp] = 20000;
            c.RebuildSnapshot();return c;
        }
        var names = new[] { "幽居", "素心神剑", "左右互搏" };
        string[][] orders = [[], ["醉酒"], ["神速攻击"], ["醉酒", "神速攻击"], ["神速攻击", "醉酒"]];
        for (var mask = 0; mask < 8; mask++)
        foreach (var order in orders)
        foreach (var roll in new[] { .1, .4, .8 })
        {
            var owner = Character("source", names.Where((_, i) => (mask & (1 << i)) != 0).ToArray());
            var source = new BattleUnit("source", owner, 1, new GridPosition(1, 1));
            var target = new BattleUnit("target", Character("target", []), 2, new GridPosition(2, 1));
            var state = new BattleState(new BattleGrid(4, 3), [source, target]);
            var engine = new BattleEngine(random: new Fixed(roll), damageCalculator: new BattleDamageCalculator(new Fixed(.5)), buffResolver: content.GetBuff);
            source.SetActionGauge(100);engine.BeginAction(state, source.Id);
            // Apply after readiness to isolate post-hit combinations from the
            // separately tested drunken action-skip probability.
            foreach (var id in order) source.TryApplyBuff(new BattleBuffInstance(content.GetBuff(id), 5, 3, source.Id, 0));
            var result = engine.CastSkill(state, source.Id, owner.ExternalSkills.Single(), target.Position);
            if (!result.Success) throw new InvalidOperationException(result.Failure!.Reason.ToString());
            var amounts = result.Messages.OfType<BattleFact>().Where(f => f.Kind == BattleFactKind.Damaged && f.UnitId == target.Id).Select(f => f.Damage!.Amount).ToArray();
            var chance = (mask & 1) != 0 ? (double)(.005f * 30) : 0d;
            if ((mask & 2) != 0) chance += roll * .2;
            if ((mask & 4) != 0) chance += roll * .6;
            var maximum = mask == 0 ? 0 : 1;
            foreach (var id in order)
            {
                chance += roll * (double)(5 * .1f);
                maximum = id == "神速攻击" ? 2 : 1;
                if (id == "神速攻击") break;
            }
            var expected = new List<int> { amounts[0] };
            if (roll < Math.Clamp(chance, 0, 1))
                for (var i = 0; i < maximum; i++) expected.Add((int)(amounts[0] * (.6 - .3 * i)));
            Check(amounts.SequenceEqual(expected), $"aggregate extra strikes mask={mask}, buffs={string.Join('/', order)}, roll={roll}: [{string.Join(',', amounts)}]");
        }
        foreach (var count in new[] { 1, 2, 10, 12 })
        foreach (var kind in new[] { "大小姐", "自我主义", "both" })
        foreach (var otherProviders in new[] { 0, 1, 2 })
        {
            var ownTalents = kind == "both" ? new[] { "大小姐", "自我主义" } : new[] { kind };
            var source = new BattleUnit("source", Character("source", ownTalents), 1, new GridPosition(1, 1));
            var target = new BattleUnit("target", Character("target", ["自我主义"]), 2, new GridPosition(2, 1));
            var allies = Enumerable.Range(0, count - 1).Select(i => new BattleUnit("ally" + i,
                Character("ally" + i, i < otherProviders ? ["大小姐", "自我主义"] : []), 1, new GridPosition(i + 3, 0))).ToArray();
            // A defeated provider never contributes a live aura or head count.
            var dead = new BattleUnit("dead", Character("dead", ["大小姐", "自我主义"]), 1, new GridPosition(0, 0), hp: 0);
            var state = new BattleState(new BattleGrid(16, 3), [source, target, .. allies, dead]);
            var engine = new BattleEngine(random: new Fixed(.5), damageCalculator: new BattleDamageCalculator(new Fixed(.5)));
            engine.StartBattle(state);source.SetActionGauge(100);engine.BeginAction(state, source.Id);
            var skill = source.Character.ExternalSkills.Single();
            var calculator = new BattleDamageCalculator(new Fixed(.5));
            var expected = calculator.CreateSkillDamageContext(new BattleDamageContext(source, target, skill));
            var bonus = (double)(1f + (kind == "大小姐" ? .1f : .18f) * Math.Min(count, 10));
            var providers = Math.Min(otherProviders, count - 1);
            expected.AttackLow *= bonus * Math.Pow(.9, providers);expected.AttackHigh *= bonus * Math.Pow(.9, providers);
            var damage = calculator.CalculateSkillDamage(expected);
            var result = engine.CastSkill(state, source.Id, skill, target.Position);
            var actual = result.Messages.OfType<BattleFact>().Single(f => f.Kind == BattleFactKind.Damaged && f.UnitId == target.Id).Damage!;
            Check(result.Success && actual.Amount == damage.Amount, $"team aura kind={kind}, living={count}, otherProviders={providers}, damage={actual.Amount}");
            Check(state.ScopedEffects.Instances.Count == providers + 2, "one aura per living provider, even with both talents; enemy aura is separate");
        }
        foreach (var partnerGender in new[] { CharacterGender.Male, CharacterGender.Female })
        foreach (var partnerTeam in new[] { 1, 2 })
        foreach (var alive in new[] { false, true })
        {
            var source = new BattleUnit("source", Character("source", ["夫妻同心"]), 1, new GridPosition(1, 1));
            var target = new BattleUnit("target", Character("target", []), 2, new GridPosition(2, 1));
            var partner = new BattleUnit("partner", Character("partner", ["夫妻同心"], partnerGender), partnerTeam, new GridPosition(0, 0), hp: alive ? 200000 : 0);
            var state = new BattleState(new BattleGrid(4, 3), [source, target, partner]);
            var calculator = new BattleDamageCalculator(new Fixed(.5));
            var skill = source.Character.ExternalSkills.Single();
            var expected = calculator.CreateSkillDamageContext(new BattleDamageContext(source, target, skill));
            if (partnerGender == CharacterGender.Female && partnerTeam == 1 && alive) { expected.AttackLow *= 1.6;expected.AttackHigh *= 1.6; }
            var damage = calculator.CalculateSkillDamage(expected);
            var engine = new BattleEngine(random: new Fixed(.5), damageCalculator: new BattleDamageCalculator(new Fixed(.5)));
            source.SetActionGauge(100);engine.BeginAction(state, source.Id);var result = engine.CastSkill(state, source.Id, skill, target.Position);
            var actual = result.Messages.OfType<BattleFact>().Single(f => f.Kind == BattleFactKind.Damaged && f.UnitId == target.Id).Damage!;
            Check(result.Success && actual.Amount == damage.Amount, $"couple partner gender={partnerGender}, team={partnerTeam}, alive={alive}");
        }
        foreach (var test in new[] {
            new FormulaCase("奋战 inclusive 30%", ["奋战"], HpRatio: .3, Attack: 1.5, CriticalFactor: 1.5),
            new FormulaCase("奋战 above 30%", ["奋战"], HpRatio: .30001),
            new FormulaCase("异世人 excludes 奋战 even above its own 20%", ["奋战", "异世人"], HpRatio: .25),
            new FormulaCase("异世人 excludes 奋战 below 20%", ["奋战", "异世人"], HpRatio: .2, Attack: 2, CriticalFactor: 2),
            new FormulaCase("孤独求败 proc", ["孤独求败"], Roll: .1, Defence: .3, CriticalAdd: .25),
            new FormulaCase("孤独求败 strict boundary", ["孤独求败"], Roll: .3),
            new FormulaCase("金钟罩 proc", [], ["金钟罩"], Roll: .1, Defence: 2),
            new FormulaCase("金钟罩 strict boundary", [], ["金钟罩"], Roll: .25),
            new FormulaCase("芷若的眷念 attack", ["芷若的眷念"], Attack: 1.1),
            new FormulaCase("臭叫花 matching art", ["臭叫花"], SkillId: "打狗棒法", Attack: 1.2, CriticalAdd: .2),
            new FormulaCase("臭叫花 other art", ["臭叫花"]),
            new FormulaCase("阉人 matching art", ["阉人"], SkillId: "辟邪剑法", GuaranteedCritical: true),
            new FormulaCase("阉人 other art", ["阉人"]),
            new FormulaCase("俗家弟子 level factor", ["俗家弟子"], Roll: .1, Defence: .65),
            new FormulaCase("俗家弟子 strict boundary", ["俗家弟子"], Roll: .3),
            new FormulaCase("阴毒 poisoned target", ["阴毒"], Poison: true, Attack: 1.2),
            new FormulaCase("阴毒 unpoisoned target", ["阴毒"]),
        })
        {
            var owner = Character("source", test.SourceTalents);
            owner.ExternalSkills.Clear();owner.ExternalSkills.Add(new ExternalSkillInstance(content.GetExternalSkill(test.SkillId), owner, true));owner.RebuildSnapshot();
            var source = new BattleUnit("source", owner, 1, new GridPosition(1, 1), hp: (int)(owner.GetStat(StatType.MaxHp) * test.HpRatio));
            var target = new BattleUnit("target", Character("target", test.TargetTalents ?? []), 2, new GridPosition(2, 1));
            var state = new BattleState(new BattleGrid(5, 3), [source, target]);
            var calculator = new BattleDamageCalculator(new Fixed(.15));
            var skill = owner.ExternalSkills.Single();
            var expected = calculator.CreateSkillDamageContext(new BattleDamageContext(source, target, skill));
            expected.AttackLow *= test.Attack;expected.AttackHigh *= test.Attack;expected.Defence *= test.Defence;
            expected.CriticalChance = test.GuaranteedCritical ? 1 : expected.CriticalChance * test.CriticalFactor + test.CriticalAdd;
            var damage = calculator.CalculateSkillDamage(expected);
            var engine = new BattleEngine(random: new Fixed(test.Roll), damageCalculator: new BattleDamageCalculator(new Fixed(.15)), buffResolver: content.GetBuff);
            source.SetActionGauge(100);engine.BeginAction(state, source.Id);
            if (test.Poison) target.TryApplyBuff(new BattleBuffInstance(content.GetBuff("中毒"), 1, 3, source.Id, 0));
            var result = engine.CastSkill(state, source.Id, skill, skill.CastSize == 0 ? source.Position : target.Position);
            var actual = result.Messages.OfType<BattleFact>().Single(f => f.Kind == BattleFactKind.Damaged && f.UnitId == target.Id).Damage!;
            Check(result.Success && actual.Amount == damage.Amount && actual.IsCritical == damage.IsCritical, test.Label);
        }
        Console.WriteLine($"PASS {checks} source combination checks; selected positive-damage paths, not full game parity.");
    }
    private sealed record FormulaCase(string Label, string[] SourceTalents, string[]? TargetTalents = null,
        string SkillId = "野球拳", double HpRatio = 1, double Roll = .5, double Attack = 1,
        double Defence = 1, double CriticalFactor = 1, double CriticalAdd = 0, bool GuaranteedCritical = false, bool Poison = false);
    private sealed class Fixed(double value) : IRandomService
    {
        public double NextDouble() => value;
        public int Next(int min, int max) => min + (int)((max - min) * value);
    }
}
