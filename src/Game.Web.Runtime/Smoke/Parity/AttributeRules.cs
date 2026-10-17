using Game.Content.Loading;
using Game.Core.Affix;
using Game.Core.Battle;
using Game.Core.Model;
using Game.Core.Model.Character;

internal static class AttributeRules
{
    public static void Run(InMemoryContentRepository content)
    {
        var checks = 0;
        void Check(bool valid, string message)
        {
            if (!valid) throw new InvalidOperationException("Attribute rule: " + message);
            checks++;
        }
        var rules = new (string Name, StatType Stat, double Factor)[] {
            ("浪子剑客", StatType.Jianfa, 1.2), ("神拳无敌", StatType.Quanzhang, 1.1),
            ("拳掌增益", StatType.Quanzhang, 1.05), ("剑法增益", StatType.Jianfa, 1.05),
            ("刀法增益", StatType.Daofa, 1.05), ("奇门增益", StatType.Qimen, 1.05)};
        var stats = new[] { StatType.Jianfa, StatType.Quanzhang, StatType.Daofa, StatType.Qimen };
        void Fixture(string[] talents, int value, int addition)
        {
            var hero = CharacterMapper.CreateInitial("attributes", content.GetCharacter("主角"), new EquipmentInstanceFactory());
            hero.ExternalSkills.Clear(); hero.InternalSkills.Clear(); hero.EquippedItems.Clear();
            hero.UnlockedTalents.Clear(); hero.UnlockedTalents.AddRange(talents.Select(content.GetTalent));
            foreach (var stat in stats) hero.BaseStats[stat] = value;
            if (addition != 0)
                hero.UnlockedTalents.Add(new Game.Core.Definitions.TalentDefinition { Id = "isolated-addition", Name = "isolated-addition",
                    Affixes = stats.Select(s => (AffixDefinition)new StatModifierAffix(s, ModifierValue.Add(addition))).ToArray() });
            hero.RebuildSnapshot();
            var unit = new BattleUnit("attributes", hero, 1, new GridPosition(0, 0));
            var expectedStats = new Dictionary<StatType, int>();
            foreach (var stat in stats)
            {
                var expected = value + addition;
                foreach (var rule in rules)
                    if (rule.Stat == stat && talents.Contains(rule.Name)) expected = (int)(expected * rule.Factor);
                expectedStats[stat] = expected;
                Check(hero.GetStat(stat) == expected, $"panel/{stat}/{value}+{addition}/{string.Join(',', talents)}");
                Check(unit.GetStat(stat) == expected, "detached battle projection");
            }
            var state = new BattleState(new BattleGrid(3, 2), [unit]);
            foreach (var stat in stats)
                Check(unit.GetStat(stat) == expectedStats[stat], "bound battle projection");
        }
        foreach (var value in new[] { 0, 1, 4, 9, 19, 20, 99, 100, 199, 499 })
        foreach (var addition in new[] { 0, 1, 7 })
        {
            Fixture([], value, addition);
            foreach (var rule in rules) Fixture([rule.Name], value, addition);
            Fixture(rules.Select(r => r.Name).ToArray(), value, addition);
            Fixture(rules.Reverse().Select(r => r.Name).ToArray(), value, addition);
        }
        Console.WriteLine($"PASS {checks} final-attribute checks: six talents, four aptitude stats, truncation boundaries, additions, acquisition order, panel/detached/bound battle values; isolated fixtures, no campaign");
    }
}
