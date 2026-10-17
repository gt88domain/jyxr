using Game.Content.Loading;
using Game.Core.Abstractions;
using Game.Core.Battle;
using Game.Core.Model;
using Game.Core.Model.Character;
using Game.Core.Model.Skills;

internal static class ControlRules
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
            if (!valid) throw new InvalidOperationException("Control rule: " + message);
            checks++;
        }
        CharacterInstance Character(string id, string[] talents, int level = 1)
        {
            var c = CharacterMapper.CreateInitial(id, content.GetCharacter("主角"), new EquipmentInstanceFactory());
            c.UnlockedTalents.Clear(); c.UnlockedTalents.AddRange(talents.Select(content.GetTalent));
            c.EquippedItems.Clear(); c.InternalSkills.Clear(); c.ExternalSkills.Clear();
            c.SetLevel(level); c.BaseStats[StatType.MaxHp] = 200000; c.BaseStats[StatType.MaxMp] = 20000;
            c.BaseStats[StatType.Evasion] = 0; c.BaseStats[StatType.Accuracy] = 0; c.BaseStats[StatType.AntiDebuff] = 0;
            c.RebuildSnapshot(); return c;
        }
        (BattleUnit Target, BattleEngine Engine, BattleState State) Cast(string[] talents, double roll,
            int fuyuan = 100, int dingli = 0, int level = 1, WeaponType weapon = WeaponType.Quanzhang,
            string protection = "", bool defensiveOnly = false)
        {
            var owner = Character("source", defensiveOnly ? [] : talents, level);
            if (protection == "safe-ally") owner.LearnTalent(content.GetTalent("灵心慧质"));
            var victim = Character("target", defensiveOnly ? talents : []);
            owner.BaseStats[StatType.Fuyuan] = fuyuan; victim.BaseStats[StatType.Dingli] = dingli;
            if (protection == "resistance") victim.BaseStats[StatType.AntiDebuff] = 1;
            if (protection == "evasion") victim.BaseStats[StatType.Evasion] = 1;
            owner.ExternalSkills.Add(new ExternalSkillInstance(content.GetExternalSkill("野球拳") with { Type = weapon, Buffs = [] }, owner, true));
            foreach (var type in new[] { WeaponType.Quanzhang, WeaponType.Jianfa, WeaponType.Daofa, WeaponType.Qimen })
                victim.ExternalSkills.Add(new ExternalSkillInstance(content.GetExternalSkill("野球拳") with { Id = "probe_" + type, Type = type, Buffs = [] }, victim, true));
            owner.RebuildSnapshot(); victim.RebuildSnapshot();
            var source = new BattleUnit("source", owner, 1, new GridPosition(0, 0));
            var target = new BattleUnit("target", victim, protection is "ally" or "safe-ally" ? 1 : 2, new GridPosition(1, 0));
            if (protection == "holywar") target.TryApplyBuff(new BattleBuffInstance(content.GetBuff("圣战"), 1, 5, target.Id, 0));
            var rules = new BattleRuleSettings { Difficulty = protection is "ally" or "safe-ally" ? GameDifficulty.Hard : GameDifficulty.Normal };
            var state = new BattleState(new BattleGrid(3, 2), [source, target], rules);
            var engine = new BattleEngine(random: new Fixed(roll), damageCalculator: new BattleDamageCalculator(new Fixed(.5)), buffResolver: content.GetBuff);
            source.SetActionGauge(100);
            Check(engine.BeginAction(state, source.Id).Success, "begin action");
            Check(engine.CastSkill(state, source.Id, owner.ExternalSkills.Single(), target.Position).Success, "cast");
            return (target, engine, state);
        }
        void Buff(BattleUnit target, string name, bool expected, int level = 0)
        {
            var instance = target.Buffs.SingleOrDefault(b => b.Definition.Id == name);
            Check((instance is not null) == expected, $"{name} application expected={expected}");
            if (instance is not null)
                Check(instance.Level == level && instance.RemainingTurns == 2 && instance.SourceUnitId == "source", "exact buff level, duration and source");
        }
        foreach (var enhanced in new[] { false, true })
        foreach (var weapon in new[] { WeaponType.Quanzhang, WeaponType.Jianfa })
        foreach (var roll in new[] { 0d, .249999, .25, .369999, .37, .999999 })
        {
            var names = enhanced ? new[] { "铁拳无双", "神拳无敌" } : ["铁拳无双"];
            var cast = Cast(names, roll, weapon: weapon);
            Buff(cast.Target, "晕眩", weapon == WeaponType.Quanzhang && roll < (enhanced ? .37 : .25));
        }
        var seals = new[] { "诸般封印", "剑封印", "刀封印", "拳掌封印", "奇门封印" };
        foreach (var seal in seals)
        foreach (var (fuyuan, dingli) in new[] { (99, 0), (100, 99), (199, 100), (200, 199), (299, 100), (30, 200), (100, 100) })
        foreach (var roll in new[] { 0d, .5, .999999 })
        {
            var chance = Math.Max(0, fuyuan / 100 - dingli / 100);
            var expected = seal == "诸般封印" ? roll <= chance : roll < chance;
            var cast = Cast([seal], roll, fuyuan, dingli);
            Buff(cast.Target, seal, expected);
            foreach (var skill in cast.Target.Character.ExternalSkills)
            {
                var affected = seal == "诸般封印" || (seal, skill.WeaponType) is
                    ("剑封印", WeaponType.Jianfa) or ("刀封印", WeaponType.Daofa) or
                    ("拳掌封印", WeaponType.Quanzhang) or ("奇门封印", WeaponType.Qimen);
                Check(cast.Engine.EvaluateSkillAvailability(cast.State, cast.Target.Id, skill).IsSealed == (expected && affected), "seal disables only the matching weapon skill");
            }
            Check(!cast.Engine.EvaluateSkillAvailability(cast.State, cast.Target.Id, cast.Target.Character.SpecialSkills.First()).IsSealed, "special skill is not sealed");
        }
        foreach (var (name, factor, buffLevel) in new[] { ("阴阳", .01, 0), ("寒冰真气", .5, 3) })
        foreach (var level in new[] { 1, 2, 10, 30 })
        foreach (var roll in new[] { 0d, .009999, .01, .299999, .3, .499999, .5, .999999 })
            Buff(Cast([name], roll, level: level).Target, "麻痹", roll < Math.Min(1, level * factor), buffLevel);
        foreach (var (name, buff, buffLevel) in new[] { ("铁拳无双", "晕眩", 0), ("阴阳", "麻痹", 0), ("寒冰真气", "麻痹", 3) }
            .Concat(seals.Select(s => (s, s, 0))))
        {
            foreach (var protection in new[] { "holywar", "resistance", "evasion", "safe-ally" })
                Buff(Cast([name], 0, protection: protection).Target, buff, false);
            Buff(Cast([name], 0, protection: "ally").Target, buff, true, buffLevel);
            Buff(Cast([name], 0, defensiveOnly: true).Target, buff, false);
        }
        // Acquisition order must not alter the five source-ordered seal rolls.
        foreach (var names in new[] { seals, seals.Reverse().ToArray() })
        {
            var cast = Cast(names, 0, 99, 0);
            Check(cast.Target.Buffs.Select(b => b.Definition.Id).SequenceEqual(new[] { "诸般封印" }), "zero probability: inclusive all-seal succeeds at roll zero, strict seals do not");
        }
        Console.WriteLine($"PASS {checks} control-rule checks: eight talents, 神拳无敌 .25→.37, integer quotient boundaries, inclusive zero roll, weapon seals, level paralysis, immunity/miss/ally/source gates; isolated casts, no campaign");
    }
}
