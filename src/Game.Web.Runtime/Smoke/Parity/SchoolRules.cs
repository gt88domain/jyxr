using Game.Content.Loading;
using Game.Core.Abstractions;
using Game.Core.Battle;
using Game.Core.Model;
using Game.Core.Model.Character;
using Game.Core.Model.Skills;

internal static class SchoolRules
{
    private sealed class Fixed(double value) : IRandomService
    {
        public double NextDouble() => value;
        public int Next(int minInclusive, int maxExclusive) => minInclusive;
    }

    public static void Run(InMemoryContentRepository content)
    {
        var checks = 0;
        void Check(bool valid, string message)
        {
            if (!valid) throw new InvalidOperationException("School rule: " + message);
            checks++;
        }
        var families = new (string Talent, string Skill, double Low, double High)[] {
            ("峨眉宗师", "飘雪穿云掌", 1.5, 3), ("刚柔并济", "太极拳", 1.1, 1.2),
            ("易筋伐髓", "罗汉拳", 1.2, 2), ("天龙.盖世英雄", "降龙十八掌", 1.2, 1.8),
            ("铁剑掌门", "铁剑剑法", 1.4, 1.4), ("射雕英雄", "降龙十八掌", 1.2, 1.5),
            ("玲珑璇玑", "打狗棒法", 1.2, 1.5), ("大理世家", "六脉神剑", 1.2, 1.5)};
        CharacterInstance Character(string id, string[] talents, string skillName)
        {
            var c = CharacterMapper.CreateInitial(id, content.GetCharacter("主角"), new EquipmentInstanceFactory());
            c.UnlockedTalents.Clear(); c.UnlockedTalents.AddRange(talents.Select(content.GetTalent));
            c.BaseStats[StatType.MaxHp] = 200000; c.BaseStats[StatType.MaxMp] = 20000;
            c.ExternalSkills.Clear();
            c.ExternalSkills.Add(new ExternalSkillInstance(content.GetExternalSkill("野球拳") with { Name = skillName }, c, true) { Level = 10 });
            c.RebuildSnapshot(); return c;
        }
        (int Raw, int Actual) Cast(string[] sourceTalents, string[] targetTalents, string name, double roll)
        {
            var source = new BattleUnit("source", Character("source", sourceTalents, name), 1, new GridPosition(0, 0));
            var target = new BattleUnit("target", Character("target", targetTalents, "野球拳"), 2, new GridPosition(1, 0));
            var state = new BattleState(new BattleGrid(3, 2), [source, target]);
            var skill = source.Character.ExternalSkills.Single();
            var calculator = new BattleDamageCalculator(new Fixed(.5));
            var raw = calculator.CalculateSkillDamage(new BattleDamageContext(source, target, skill)).Amount;
            var engine = new BattleEngine(random: new Fixed(roll), damageCalculator: new BattleDamageCalculator(new Fixed(.5)), buffResolver: content.GetBuff);
            source.SetActionGauge(100); Check(engine.BeginAction(state, source.Id).Success, "begin action");
            var result = engine.CastSkill(state, source.Id, skill, target.Position);
            Check(result.Success, "cast succeeds");
            return (raw, result.Messages.OfType<BattleFact>().Single(f => f.Kind == BattleFactKind.Damaged && f.UnitId == target.Id).Damage!.Amount);
        }
        foreach (var family in families)
        foreach (var roll in new[] { 0d, .25, .5, .999999 })
        {
            var factor = family.Low + (family.High - family.Low) * roll;
            foreach (var name in new[] { family.Skill, "强化·" + family.Skill, "野球拳" })
            {
                var actual = Cast([family.Talent], [], name, roll);
                var expected = name.Contains(family.Skill, StringComparison.Ordinal) ? (int)(actual.Raw * factor) : actual.Raw;
                Check(actual.Actual == expected, $"{family.Talent}/{name}/{roll}: {actual.Actual} != {expected}");
            }
            var defensive = Cast([], [family.Talent], family.Skill, roll);
            Check(defensive.Actual == defensive.Raw, "target talent must not strengthen the attacker");
        }
        string[][] orders = [["天龙.盖世英雄", "射雕英雄", "玲珑璇玑"], ["玲珑璇玑", "射雕英雄", "天龙.盖世英雄"],
            ["射雕英雄", "天龙.盖世英雄", "玲珑璇玑"], ["天龙.盖世英雄", "玲珑璇玑", "射雕英雄"]];
        foreach (var order in orders)
        foreach (var roll in new[] { .1, .5, .999999 })
        {
            var actual = Cast(order, [], "打狗棒法", roll);
            var expected = (int)(actual.Raw * (1.2 + .6 * roll));
            expected = (int)(expected * (1.2 + .3 * roll));
            expected = (int)(expected * (1.2 + .3 * roll));
            Check(actual.Actual == expected, "combination order and each intermediate integer truncation");
        }
        Console.WriteLine($"PASS {checks} school-rule checks: eight families, exact and containing names, nonmatches, target-only talents, range boundaries and ordered combinations; isolated casts, no campaign");
    }
}
