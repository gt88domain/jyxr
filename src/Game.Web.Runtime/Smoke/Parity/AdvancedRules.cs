using Game.Content.Loading;
using Game.Core.Abstractions;
using Game.Core.Affix;
using Game.Core.Battle;
using Game.Core.Definitions.Skills;
using Game.Core.Model;
using Game.Core.Model.Character;
using Game.Core.Model.Skills;
using Game.Web.Runtime;

internal static class AdvancedRules
{
    public static void Run(InMemoryContentRepository content)
    {
        var count = 0;
        void Check(bool value, string label)
        {
            if (!value) throw new InvalidOperationException("Advanced source rule failed: " + label);
            count++;Console.WriteLine("PASS advanced " + label);
        }
        CharacterInstance Character(string id, string? special = null)
        {
            var c = CharacterMapper.CreateInitial(id, content.GetCharacter("主角"), new EquipmentInstanceFactory());
            c.UnlockedTalents.Clear();c.SpecialSkills.Clear();c.BaseStats[StatType.MaxHp] = 20000;c.BaseStats[StatType.MaxMp] = 20000;
            c.BaseStats[StatType.Gengu] = 40;c.BaseStats[StatType.Fuyuan] = id == "caster" ? 20 : 10;
            if (special is not null) c.SpecialSkills.Add(new SpecialSkillInstance(content.GetSpecialSkill(special), c, true));
            c.RebuildSnapshot();return c;
        }
        foreach (var definition in content.SpecialSkills.Values)
        {
            var name = definition.Id;var owner = Character("caster", name);
            var caster = new BattleUnit("caster", owner, 1, new GridPosition(5, 1), hp: 10000, rage: 6);
            var ally = new BattleUnit("ally", Character("ally"), 1, new GridPosition(4, 1), hp: 100);
            var enemy = new BattleUnit("enemy", Character("enemy"), 2, new GridPosition(6, 1), hp: 10000, rage: 5);
            var farEnemy = new BattleUnit("far", Character("far"), 2, new GridPosition(9, 3));
            var state = new BattleState(new BattleGrid(11, 4), [caster, ally, enemy, farEnemy]);
            if (name is "清心普善咒" or "阿碧的歌声" or "解毒" or "吴侬软语")
            {
                foreach (var unit in new[] { caster, ally, enemy })
                {
                    unit.TryApplyBuff(new BattleBuffInstance(content.GetBuff("中毒"), 1, 4, caster.Id, 0));
                    unit.TryApplyBuff(new BattleBuffInstance(content.GetBuff("攻击强化"), 1, 4, caster.Id, 0));
                }
            }
            enemy.SetActionGauge(40);
            var engine = new BattleEngine(random: new Fixed(.5), buffResolver: content.GetBuff,
                skillUseExperienceResolver: BrowserLegacyRules.ResolveSkillUseExperience);
            caster.SetActionGauge(100);engine.BeginAction(state, caster.Id);
            var skill = owner.SpecialSkills.Single();
            var position = name is "华佗再世" or "解毒" ? ally.Position : definition.Intent == SpecialSkillIntent.Support ? caster.Position : enemy.Position;
            var result = engine.CastSkill(state, caster.Id, skill, position);
            Check(result.Success, "real configured cast " + name);
            switch (name)
            {
                case "华佗再世": Check(ally.Hp == 4700, "华佗 two-term source healing formula");break;
                case "一刀两断": Check(enemy.Hp == 10000, "一刀两断 strict 50% failed-roll boundary");break;
                case "沉鱼落雁": Check(enemy.Rage == 0, "沉鱼落雁 empties target rage");break;
                case "同归剑法": Check(enemy.Hp == 7000 && caster.Hp == 9000, "同归 source/target HP costs");break;
                case "天地同寿": Check(enemy.Hp == 2500 && caster.Hp == 0 && owner.GetBaseStat(StatType.MaxHp) == 19990, "天地 HP snapshot, self defeat and permanent ten max-HP cost");break;
                case "笑傲江湖曲": Check(caster.TryGetBuff("攻击强化")?.Level == 5 && ally.TryGetBuff("攻击强化")?.Level == 5 && !enemy.HasBuff("攻击强化"), "笑傲曲 affects all allies only");break;
                case "火枪": Check(enemy.Hp == 9675, "火枪 source base-fortune damage");break;
                case "清心普善咒": case "阿碧的歌声":
                    Check(!caster.HasBuff("中毒") && !ally.HasBuff("中毒") && enemy.HasBuff("中毒") && ally.HasBuff("攻击强化"), name + " purges all allied debuffs while keeping positive/enemy state");break;
                case "吴侬软语": Check(!enemy.HasBuff("攻击强化") && enemy.HasBuff("中毒") && !enemy.HasBuff("晕眩"), "soft song removes enemy buffs but unlearned talent grants no stun");break;
                case "武穆兵法": Check(new[] { "攻击强化", "防御强化", "神速攻击" }.All(b => ally.TryGetBuff(b)?.Level == 5), "武穆 source team buffs; aggregate strikes checked separately");break;
                case "解毒": Check(!ally.HasBuff("中毒") && enemy.HasBuff("中毒"), "detox keeps enemy poison in the same area");break;
                case "六合劲": Check(enemy.Rage == 0 && enemy.ActionGauge == 0, "六合 clears both rage and action gauge");break;
                case "飞星术": Check(state.Units.All(u => u.TryGetBuff("中毒") is { Level: >= 1 and <= 10, RemainingTurns: >= 3 and <= 6 }), "飞星 poisons all factions including caster");break;
                case "易容术": Check(caster.TryGetBuff("易容")?.RemainingTurns == 3, "易容 state is applied; ambush behavior still deferred");break;
            }
        }
        foreach (var talented in new[] { false, true })
        {
            var c = Character("book");c.BaseStats[StatType.Wuxing] = 30;
            if (talented) c.UnlockedTalents.Add(content.GetTalent("武学奇才"));c.RebuildSnapshot();
            Check(BrowserLegacyRules.ResolveSkillAwardExperience(c.ExternalSkills.Single(), 100) == (talented ? 202 : 101), "external book EXP talent=" + talented);
            Check(BrowserLegacyRules.ResolveSkillAwardExperience(c.InternalSkills.Single(), 100) == (talented ? 303 : 202), "internal book EXP talent=" + talented);
            Check(!c.Traits.Contains(Game.Core.Affix.TraitId.DoubleExperienceGain), "original 武学奇才 does not double character EXP");
        }

        foreach (var (talents, expectedLevel, expectedTurns) in new[] {
            (new[] { "毒圣" }, 25, 7), (new[] { "毒系精通" }, 23, 5), (new[] { "毒圣", "毒系精通" }, 28, 9)
        })
        {
            var c = Character("caster", "闪电貂");c.UnlockedTalents.AddRange(talents.Select(content.GetTalent));c.RebuildSnapshot();
            var source = new BattleUnit("caster", c, 1, new GridPosition(5, 1), rage: 6);
            var target = new BattleUnit("target", Character("target"), 2, new GridPosition(6, 1));
            var state = new BattleState(new BattleGrid(11, 4), [source, target]);
            var engine = new BattleEngine(random: new Fixed(.5), buffResolver: content.GetBuff);source.SetActionGauge(100);engine.BeginAction(state, source.Id);
            var result = engine.CastSkill(state, source.Id, c.SpecialSkills.Single(), target.Position);
            Check(result.Success && target.TryGetBuff("中毒") is { } b && b.Level == expectedLevel && b.RemainingTurns == expectedTurns,
                string.Join('+', talents) + " real poison level/duration");
        }
        foreach (var hp in new[] { 1, 2 })
        {
            var c = Character("caster");c.UnlockedTalents.Add(content.GetTalent("令狐冲的怪病"));c.RebuildSnapshot();
            var source = new BattleUnit("caster", c, 1, new GridPosition(5, 1));
            var doctor = new BattleUnit("doctor", CharacterMapper.CreateInitial("doctor", content.GetCharacter("平一指"), new EquipmentInstanceFactory()), 1, new GridPosition(4, 1), hp: hp);
            var state = new BattleState(new BattleGrid(11, 4), [source, doctor]);var engine = new BattleEngine(random: new Fixed(.2));source.SetActionGauge(100);
            Check((engine.BeginAction(state, source.Id).Value is not null) == (hp >= 2), "illness exact Ping Yizhi HP >1 gate at " + hp);
        }
        {
            var c = Character("caster");c.UnlockedTalents.Add(content.GetTalent("嗜酒如命"));c.RebuildSnapshot();
            var source = new BattleUnit("caster", c, 1, new GridPosition(5, 1), rage: 1);
            var state = new BattleState(new BattleGrid(11, 4), [source]);var engine = new BattleEngine(random: new Sequence(.1, .5), buffResolver: content.GetBuff);source.SetActionGauge(100);
            Check(engine.BeginAction(state, source.Id).Value is not null && source.Rage == 6 && source.TryGetBuff("醉酒") is { Level: 2, RemainingTurns: 3 }, "drinking talent applies drunkenness and its rage in the same action");
        }
        {
            var c = Character("caster");c.UnlockedTalents.Add(content.GetTalent("令狐冲的怪病"));c.RebuildSnapshot();
            var source = new BattleUnit("caster", c, 1, new GridPosition(5, 1));source.TryApplyBuff(new BattleBuffInstance(content.GetBuff("醉酒"), 2, 3, source.Id, 0));
            var state = new BattleState(new BattleGrid(11, 4), [source]);var engine = new BattleEngine(random: new Fixed(.1));source.SetActionGauge(100);var result = engine.BeginAction(state, source.Id);
            Check(result.Value is null && result.Messages.OfType<BattleFact>().Single(f=>f.Kind==BattleFactKind.ActionSkipped).Detail == "醉酒", "drunken skip remains terminal before illness");
        }

        // Expectations transcribe original AttackLogic factors. The base
        // calculator and real cast share fixtures, not the effect configuration.
        foreach (var (talent, skillId, attackFactor, criticalAdd) in new[] {
            ("神雕大侠", "玄铁剑法", 1.3, .25), ("神雕大侠", "野球拳", 1d, 0d),
            ("雪山飞狐", "胡家刀法", 1d, .5), ("雪山飞狐", "野球拳", 1d, 0d),
            ("太极高手", "太极拳", 1d, .25), ("太极高手", "野球拳", 1d, 0d),
            ("太极宗师", "太极剑", 1.2, .15), ("太极宗师", "野球拳", 1d, 0d),
            ("混元一气", "混元掌", 1d, .25), ("混元一气", "野球拳", 1d, 0d),
            ("金蛇郎君", "金蛇剑法", 1d, .5), ("金蛇郎君", "野球拳", 1d, 0d),
            ("金蛇狂舞", "金蛇剑法", 1.4, 0d), ("金蛇狂舞", "野球拳", 1d, 0d),
            ("铁骨墨萼", "连城剑法", 1.4, .2), ("铁骨墨萼", "野球拳", 1d, 0d),
            ("拳系装备", "野球拳", 1d, 0d), ("拳系装备", "太极剑", .9, 0d),
            ("剑系装备", "太极剑", 1d, 0d), ("剑系装备", "野球拳", .9, 0d),
            ("刀系装备", "胡家刀法", 1d, 0d), ("刀系装备", "野球拳", .9, 0d),
            ("奇门装备", "袖箭", 1d, 0d), ("奇门装备", "野球拳", .9, 0d),
            ("阴谋家", "野球拳", 1.25, 0d), ("怒不可遏", "野球拳", 1.4, 0d)
        })
        {
            var a = Character("caster");a.UnlockedTalents.Add(content.GetTalent(talent));
            a.BaseStats[StatType.MaxHp] = 200000;a.ExternalSkills.Clear();a.ExternalSkills.Add(new ExternalSkillInstance(content.GetExternalSkill(skillId), a, true));a.RebuildSnapshot();
            var b = Character("target");b.BaseStats[StatType.MaxHp] = 200000;b.RebuildSnapshot();
            var source = new BattleUnit("caster", a, 1, new GridPosition(5, 1), rage: 4);
            var target = new BattleUnit("target", b, 2, new GridPosition(6, 1), hp: 100000);
            var state = new BattleState(new BattleGrid(11, 4), [source, target]);var skill = a.ExternalSkills.Single();
            var calculator = new BattleDamageCalculator(new Fixed(.5));
            var expected = calculator.CreateSkillDamageContext(new BattleDamageContext(source, target, skill));
            expected.AttackLow *= attackFactor;expected.AttackHigh *= attackFactor;expected.CriticalChance += criticalAdd;
            var damage = calculator.CalculateSkillDamage(expected);
            var engine = new BattleEngine(damageCalculator: new BattleDamageCalculator(new Fixed(.5)), random: new Fixed(.5), buffResolver: content.GetBuff);
            source.SetActionGauge(100);engine.BeginAction(state, source.Id);var result = engine.CastSkill(state, source.Id, skill, skill.CastSize == 0 ? source.Position : target.Position);
            if (!result.Success) throw new InvalidOperationException("Talent cast failed: " + talent + "/" + skillId + " " + result.Failure?.Reason + " castSize=" + skill.CastSize);
            var actual = result.Messages.OfType<BattleFact>().Single(f => f.Kind == BattleFactKind.Damaged && f.UnitId == target.Id).Damage!;
            Check(actual.Amount == damage.Amount && actual.IsCritical == damage.IsCritical, talent + "/" + skillId + " actual source damage/critical");
        }
        Console.WriteLine($"PASS {count} advanced configuration/execution checks; isolated fixtures, not full-game parity or natural acquisition.");
    }

    private sealed class Fixed(double value) : IRandomService
    {
        public double NextDouble() => value;
        public int Next(int minimum, int maximum) => minimum + (int)((maximum - minimum) * value);
    }

    private sealed class Sequence(params double[] values) : IRandomService
    {
        private int index;
        public double NextDouble() => index < values.Length ? values[index++] : .5;
        public int Next(int minimum, int maximum) => minimum + (int)((maximum - minimum) * NextDouble());
    }
}
