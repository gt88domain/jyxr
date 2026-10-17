using Game.Content.Loading;
using Game.Core.Abstractions;
using Game.Core.Affix;
using Game.Core.Battle;
using Game.Core.Definitions;
using Game.Core.Definitions.Skills;
using Game.Core.Model;
using Game.Core.Model.Character;
using Game.Core.Model.Skills;

internal static class MasteryRules
{
    private sealed class Fixed(double value) : IRandomService
    {
        public double NextDouble() => value;
        public int Next(int minimum, int maximum) => minimum;
    }

    public static void Run(InMemoryContentRepository content)
    {
        var checks = 0;
        void Check(bool valid, string message)
        {
            if (!valid) throw new InvalidOperationException("Mastery rule: " + message);
            checks++;
        }
        CharacterInstance Character(string id, string[] talents, int level = 1)
        {
            var c = CharacterMapper.CreateInitial(id, content.GetCharacter("主角"), new EquipmentInstanceFactory());
            c.UnlockedTalents.Clear(); c.UnlockedTalents.AddRange(talents.Select(content.GetTalent));
            c.ExternalSkills.Clear(); c.InternalSkills.Clear(); c.EquippedItems.Clear();
            c.BaseStats[StatType.MaxHp] = 200000; c.BaseStats[StatType.MaxMp] = 20000;
            c.BaseStats[StatType.Fuyuan] = 0; c.BaseStats[StatType.Evasion] = 0; c.BaseStats[StatType.AntiDebuff] = 0;
            c.SetLevel(level); c.RebuildSnapshot(); return c;
        }
        int Blind(int value, int level, bool mind) => mind || level == 0 || value <= 0 ? value : Math.Max(1, value - (int)(level * 1.5));
        var rangeNames = new[] { "寸长寸强", "吴钩霜雪", "金刚伏魔圈" };
        for (var mask = 0; mask < 8; mask++)
        foreach (var (cast, impact) in new[] { (0, 0), (1, 1), (3, 2), (7, 5) })
        foreach (var blind in new[] { 0, 1, 3, 8 })
        foreach (var mind in new[] { false, true })
        foreach (var name in new[] { "野球拳", "太玄神功", "日月神鞭", "强化·太玄神功" })
        {
            var names = rangeNames.Where((_, i) => (mask & (1 << i)) != 0).ToList();
            if (mind) names.Add("心眼通明");
            var hero = Character("range", names.ToArray());
            var skill = new ExternalSkillInstance(content.GetExternalSkill("野球拳") with { Name = name,
                Targeting = new SkillTargetingDefinition(CastSize: cast, ImpactSize: impact) }, hero, true);
            var unit = new BattleUnit("range", hero, 1, new GridPosition(0, 0));
            if (blind > 0) unit.TryApplyBuff(new BattleBuffInstance(content.GetBuff("致盲"), blind, 3, unit.Id, 0));
            var expectedCast = (mask & 4) != 0 && name == "日月神鞭" ? 10 : Blind(cast + ((mask & 2) != 0 && name == "太玄神功" ? 3 : 0), blind, mind);
            var expectedImpact = Blind(impact, blind, mind) + ((mask & 1) != 0 ? 1 : 0);
            Check(BattleSkillTargeting.ResolveEffectiveCastSize(unit, skill) == expectedCast, "detached exact-name cast size and blindness order");
            Check(BattleSkillTargeting.ResolveEffectiveImpactSize(unit, skill) == expectedImpact, "detached impact bonus after blindness, including base zero");
            _ = new BattleState(new BattleGrid(3, 2), [unit]);
            Check(BattleSkillTargeting.ResolveEffectiveCastSize(unit, skill) == expectedCast && BattleSkillTargeting.ResolveEffectiveImpactSize(unit, skill) == expectedImpact, "bound targeting matches detached values");
        }
        foreach (var talented in new[] { false, true })
        foreach (var level in new[] { 1, 9, 10, 11, 20, 30 })
        foreach (var yang in new[] { 1, 9, 10, 99, 101 })
        {
            var hero = Character("yang", talented ? ["至刚至阳"] : []);
            var inner = new InternalSkillInstance(content.GetInternalSkill("基本内功") with { Yang = yang, Yin = 33 }, hero) { Level = level };
            Check(inner.Yang == (talented ? (int)(yang * level / 10 * 1.3) : yang * level / 10), "Yang integer division precedes talent scaling");
            Check(inner.Yin == 33 * level / 10, "Yang talent does not increase Yin");
        }
        float ExpectedRate(string name, string[] talents, int level, float gear)
        {
            float rate = 0;
            if (name is "血刀大法" or "血刀大法.吸")
            {
                rate = name == "血刀大法" ? .1f : .2f;
                if (talents.Contains("血海魔功")) rate += .2f;
                if (talents.Contains("血魔刀法")) rate += .15f;
            }
            if (talents.Contains("嗜血狂魔")) rate += .05f + (float)((double)(.05f * level) / 30.0);
            return rate + gear;
        }
        void Drain(string[] talents, string name, int level, int incoming, bool wound, bool overkill, float gear = 0, bool capped = false)
        {
            var hero = Character("drainer", talents, level); var victim = Character("victim", []);
            var bloodDefinition = content.GetExternalSkill("血刀大法");
            // Isolate this formula from unrelated level-gated aptitude/xi buffs.
            var blood = new ExternalSkillInstance(bloodDefinition with { Buffs = [], Affixes = bloodDefinition.Affixes.Where(a => a.Effect is HookAffix).ToArray() }, hero, true) { Level = 10 };
            hero.ExternalSkills.Add(blood);
            var wild = new ExternalSkillInstance(content.GetExternalSkill("野球拳") with { Name = name, Buffs = [] }, hero, true);
            hero.ExternalSkills.Add(wild);
            SkillInstance selected = name == "血刀大法" ? blood : name == "血刀大法.吸"
                ? new FormSkillInstance(bloodDefinition.FormSkills.Single() with { Buffs = [] }, blood) : wild;
            hero.UnlockedTalents.Add(new TalentDefinition { Id = "isolated-incoming", Name = "isolated-incoming", Affixes = [
                new HookAffix { Timing = HookTiming.AfterDamageCalculation, Effects = [new ModifyDamageBattleHookEffectDefinition(ModifierOp.Override, incoming)] },
                new StatModifierAffix(StatType.Lifesteal, ModifierValue.Add(gear))] });
            hero.RebuildSnapshot();
            var source = new BattleUnit("drainer", hero, 1, new GridPosition(0, 0), hp: capped ? (int)Math.Round(hero.GetStat(StatType.MaxHp)) - 1 : 100, rage: 6);
            var target = new BattleUnit("victim", victim, 2, new GridPosition(1, 0), hp: overkill ? 1 : 200000);
            if (wound) source.TryApplyBuff(new BattleBuffInstance(content.GetBuff("重伤"), 1, 4, source.Id, 0));
            var state = new BattleState(new BattleGrid(3, 2), [source, target]);
            var hp = source.Hp; var maximum = source.MaxHp;
            var engine = new BattleEngine(random: new Fixed(.5), damageCalculator: new BattleDamageCalculator(new Fixed(.5)), buffResolver: content.GetBuff);
            source.SetActionGauge(100); Check(engine.BeginAction(state, source.Id).Success, "begin drain action");
            var result = engine.CastSkill(state, source.Id, selected, target.Position);
            Check(result.Success, "real selected blood/form/nonblood cast");
            var expected = (int)((float)incoming * ExpectedRate(name, talents, level, gear));
            if (wound) expected /= 2;
            expected = Math.Min(expected, maximum - hp);
            Check(source.Hp - hp == expected, $"drain {name}/{string.Join(',', talents)}/L{level}/incoming{incoming}/wound{wound}/overkill{overkill}: got {source.Hp-hp}, expected {expected}");
            Check(result.Messages.OfType<BattleFact>().Where(f => f.Kind == BattleFactKind.Lifesteal).Sum(f => f.Lifesteal!.Amount) == expected, "one drain path, actual healing facts and cap");
        }
        var bloodNames = new[] { "血海魔功", "血魔刀法", "嗜血狂魔" };
        for (var mask = 0; mask < 8; mask++)
        foreach (var name in new[] { "血刀大法", "血刀大法.吸", "野球拳" })
        foreach (var level in new[] { 1, 10, 30 })
        foreach (var amount in new[] { 9, 19, 199, 1001 })
        foreach (var wound in new[] { false, true })
        foreach (var overkill in new[] { false, true })
            Drain(bloodNames.Where((_, i) => (mask & (1 << i)) != 0).ToArray(), name, level, amount, wound, overkill);
        foreach (var name in new[] { "血刀大法", "血刀大法.吸", "野球拳" })
        foreach (var amount in new[] { 19, 99, 999, 4095 })
        {
            Drain(bloodNames, name, 29, amount, false, true, .07f);
            Drain(bloodNames.Reverse().ToArray(), name, 29, amount, true, true, .07f);
            Drain(bloodNames, name, 29, amount, false, false, .07f, true);
        }
        foreach (var names in new[] { new[] { "金刚" }, ["御风"], ["金刚", "御风"], ["御风", "金刚"] })
        foreach (var level in new[] { 1, 29, 30, 59, 60 })
        foreach (var roll in new[] { 0d, .299999, .3, .599999 })
        {
            var attacker = Character("attack", []); attacker.BaseStats[StatType.Fuyuan] = 600; attacker.RebuildSnapshot();
            var defender = Character("defence", names, level);
            var skill = new ExternalSkillInstance(content.GetExternalSkill("野球拳"), attacker, true); attacker.ExternalSkills.Add(skill);
            var source = new BattleUnit("attack", attacker, 1, new GridPosition(0, 0));
            var target = new BattleUnit("defence", defender, 2, new GridPosition(1, 0));
            var state = new BattleState(new BattleGrid(3, 2), [source, target]);
            var calculator = new BattleDamageCalculator(new Fixed(roll));
            var expectedContext = calculator.CreateSkillDamageContext(new BattleDamageContext(source, target, skill));
            if (names.Contains("金刚")) expectedContext.Defence = expectedContext.Defence * 1.2 + 10 * level;
            if (names.Contains("御风")) expectedContext.CriticalChance -= .3 * (level / 30);
            var expected = calculator.CalculateSkillDamage(expectedContext);
            var engine = new BattleEngine(random: new Fixed(.5), damageCalculator: new BattleDamageCalculator(new Fixed(roll)), buffResolver: content.GetBuff);
            source.SetActionGauge(100); Check(engine.BeginAction(state, source.Id).Success, "begin defence/critical action");
            var result = engine.CastSkill(state, source.Id, skill, target.Position);
            Check(result.Success, "defence/critical real cast");
            var damage = result.Messages.OfType<BattleFact>().Single(f => f.Kind == BattleFactKind.Damaged && f.UnitId == target.Id).Damage!;
            Check(damage.Amount == expected.Amount && damage.IsCritical == expected.IsCritical, "金刚 raw defence transform and 御风 original integer level/30 steps");
        }
        foreach (var talented in new[] { false, true })
        foreach (var roll in new[] { .149999, .15, .5 })
        {
            var attacker = Character("attacker", []); var defender = Character("cooldowns", talented ? ["至空至明"] : []);
            var skill = new ExternalSkillInstance(content.GetExternalSkill("野球拳"), attacker, true); attacker.ExternalSkills.Add(skill);
            var outer = new ExternalSkillInstance(content.GetExternalSkill("血刀大法"), defender, true) { Level = 10, CurrentCooldown = 3 };
            var inner = new InternalSkillInstance(content.GetInternalSkill("基本内功") with { FormSkills = outer.Definition.FormSkills }, defender) { Level = 10, CurrentCooldown = 3 };
            defender.ExternalSkills.Add(outer); defender.InternalSkills.Add(inner);
            var cooldownSkills = new SkillInstance[] { outer, inner }.Concat(outer.GetFormSkills()).Concat(inner.GetFormSkills()).Concat(defender.SpecialSkills).ToArray();
            foreach (var cd in cooldownSkills) cd.CurrentCooldown = 3;
            var source = new BattleUnit("attacker", attacker, 1, new GridPosition(0, 0)); var target = new BattleUnit("cooldowns", defender, 2, new GridPosition(1, 0));
            var state = new BattleState(new BattleGrid(3, 2), [source, target]);
            var engine = new BattleEngine(random: new Fixed(roll), damageCalculator: new BattleDamageCalculator(new Fixed(.5)), buffResolver: content.GetBuff);
            source.SetActionGauge(100); Check(engine.BeginAction(state, source.Id).Success, "begin cooldown action");
            Check(engine.CastSkill(state, source.Id, skill, target.Position).Success, "cooldown real cast");
            Check(cooldownSkills.All(cd => cd.CurrentCooldown == (talented && roll < .15 ? 0 : 3)), "至空至明 strict 15% resets external/internal/forms/special cooldowns");
        }
        Console.WriteLine($"PASS {checks} mastery checks: staged range/blindness, exact names, Yang rounding, blood/form casts, float sums, overkill/wound/caps, defence/critical levels and cooldown reset; isolated fixtures, no campaign");
    }
}
