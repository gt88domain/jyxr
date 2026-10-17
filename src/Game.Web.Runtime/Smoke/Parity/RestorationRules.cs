using Game.Content.Loading;
using Game.Core.Abstractions;
using Game.Core.Affix;
using Game.Core.Battle;
using Game.Core.Definitions;
using Game.Core.Model;
using Game.Core.Model.Character;
using Game.Core.Model.Skills;

internal static class RestorationRules
{
    private sealed class Rolls(double value, bool upper = false) : IRandomService
    {
        public double NextDouble() => value;
        public int Next(int min, int max) => upper ? max - 1 : min;
    }
    public static void Run(InMemoryContentRepository content)
    {
        var checks = 0;
        void Check(bool value, string text) { if (!value) throw new InvalidOperationException("Restoration: " + text); checks++; }
        var formation = new BattleFormationRules("真武七截阵", "五行阵", "八卦阵", "金刚伏魔圈");
        BattleUnit Unit(string id, int team, int x, string[] talents, int hp = 100000)
        {
            var c = CharacterMapper.CreateInitial(id, content.GetCharacter("主角") with { Id = id, Name = id }, new EquipmentInstanceFactory());
            c.ExternalSkills.Clear(); c.InternalSkills.Clear(); c.EquippedItems.Clear(); c.UnlockedTalents.Clear();
            c.UnlockedTalents.AddRange(talents.Select(content.GetTalent));
            c.BaseStats[StatType.MaxHp] = 100000; c.BaseStats[StatType.MaxMp] = 20000;
            c.BaseStats[StatType.Fuyuan] = 0; c.BaseStats[StatType.Dingli] = 0; c.BaseStats[StatType.AntiDebuff] = 0; c.BaseStats[StatType.Evasion] = 0;
            c.RebuildSnapshot(); return new BattleUnit(id, c, team, new GridPosition(x, 0), hp: hp, rage: 6);
        }
        BattleCommandResult<BattleActionResult> Cast(BattleUnit source, BattleUnit target, BattleUnit[] supporters, int damage, double roll = .25, bool upper = false, bool formations = true, string skillName = "野球拳")
        {
            source.Character.UnlockedTalents.Add(new TalentDefinition { Id = "isolated-damage", Name = "isolated-damage", Affixes = [
                new HookAffix { Timing = HookTiming.BeforeDamageCalculation, Priority = -10000, Effects = [new ModifyDamageContextBattleHookEffectDefinition(BattleDamageContextField.FinalDamage, ModifierOp.Override, damage)] }] });
            var skill = new ExternalSkillInstance(content.GetExternalSkill("野球拳") with { Name = skillName, Buffs = [], Affixes = [] }, source.Character, true) { Level = 10 };
            source.Character.ExternalSkills.Add(skill); source.Character.RebuildSnapshot();
            var state = new BattleState(new BattleGrid(12, 2), [source, target, ..supporters]);
            var engine = new BattleEngine(random: new Rolls(roll, upper), damageCalculator: new BattleDamageCalculator(new Rolls(.5)), buffResolver: content.GetBuff, formationRules: formations ? formation : null);
            source.SetActionGauge(100); Check(engine.BeginAction(state, source.Id).Success, "begin isolated action");
            var result = engine.CastSkill(state, source.Id, skill, target.Position);
            Check(result.Success, "actual source-content skill cast"); return result;
        }
        foreach (var amount in new[] { 1, 2, 3, 5, 11, 1001, 10003 })
        foreach (var count in new[] { 1, 2, 3 })
        {
            var source = Unit("attacker", 1, 0, []); var target = Unit("victim", 2, 1, []);
            var providers = Enumerable.Range(0, count).Select(i => Unit("share" + i, 2, i + 2, ["五行阵"])).ToArray();
            Cast(source, target, providers, amount);
            Check(100000 - target.Hp == amount / (count + 1), "equal target share discards remainder");
            Check(providers.All(u => 100000 - u.Hp == amount / (count + 1)), "all providers receive the same unreactive integer share");
        }
        foreach (var roll in new[] { .499999, .5, .500001 })
        {
            var source = Unit("attacker", 1, 0, []); var target = Unit("victim", 2, 1, ["真武七截阵"]);
            var ally = Unit("interceptor", 2, 2, ["真武七截阵"]);
            Cast(source, target, [ally], 1001, roll);
            Check(target.Hp == (roll <= .5 ? 100000 : 98999), "intercept uses inclusive boundary");
            Check(ally.Hp == (roll <= .5 ? 99700 : 100000), "intercept applies source float 30% to proposed damage");
        }
        foreach (var upper in new[] { false, true })
        foreach (var amount in new[] { 1, 3, 5, 1001 })
        {
            var source = Unit("attacker", 1, 0, []); var target = Unit("victim", 2, 1, ["八卦阵"]);
            var first = Unit("first", 2, 2, []); var second = Unit("second", 2, 3, []);
            Cast(source, target, [first, second], amount, upper: upper);
            Check(100000 - target.Hp == (int)(amount * .2), "retained transfer damage independently truncates fixed .2");
            Check(100000 - first.Hp == (int)(amount * .8) && second.Hp == 100000, "both end tickets choose first provider under inclusive-modulo selection");
        }
        {
            var source = Unit("attacker", 1, 0, []); var target = Unit("original", 2, 1, ["真武七截阵", "五行阵"]);
            var interceptor = Unit("interceptor", 2, 2, ["真武七截阵", "八卦阵"]); var share = Unit("share", 2, 3, ["五行阵"]);
            Cast(source, target, [interceptor, share], 1001);
            Check(target.Hp == 99820 && share.Hp == 99900 && interceptor.Hp == 99980, "redirect then five-element share then bagua uses the replacement target throughout");
        }
        foreach (var count in new[] { 1, 2, 3, 4 })
        {
            var source = Unit("attacker", 1, 0, ["金刚伏魔圈"]); var target = Unit("victim", 2, 1, []);
            var members = Enumerable.Range(1, count - 1).Select(i => Unit("member" + i, 1, i + 1, ["金刚伏魔圈"])).ToArray();
            Check(source.MovePower == 0, "formation locks movement before attacking");
            Cast(source, target, members, 1001);
            Check(100000 - target.Hp == (count >= 3 ? 1501 : 1001), "three members required for group attack bonus");
            Check(source.Character.HasEffectiveTalent("金刚伏魔圈") == (count >= 3), "broken formation removes learned talent and movement lock");
        }
        foreach (var count in new[] { 1, 2, 3 })
        {
            var source = Unit("attacker", 1, 0, ["真武七截阵"]); var target = Unit("victim", 2, 1, []);
            var members = Enumerable.Range(0, count).Select(i => Unit("support" + i, 1, i + 2, ["真武七截阵"])).ToArray();
            Cast(source, target, members, 1001, .5);
            var expected = 1001; for (var i = 0; i < count; i++) expected = (int)(expected * 1.05);
            Check(100000 - target.Hp == expected, "each attack support truncates separately");
        }
        foreach (var talent in new[] { "沾衣十八跌", "鹿鼎.一等鹿鼎公", "赵敏的眷念" })
        {
            var source = Unit("attacker", 1, 0, ["铁拳无双"]); var target = Unit("victim", 2, 1, [talent]);
            Cast(source, target, [], 1001, 0);
            Check(target.Hp == 100000 && !target.HasBuff("晕眩"), "evasion suppresses outgoing on-hit control");
            if (talent != "赵敏的眷念") Check(source.TryGetBuff("晕眩")?.RemainingTurns == (talent == "沾衣十八跌" ? 2 : 3), "counter stun preserves original duration");
        }
        {
            var source = Unit("attacker", 1, 0, []); var target = Unit("victim", 2, 1, ["斗转星移", "慕容世家"]);
            Cast(source, target, [], 1001, .15);
            Check(target.Hp == 100000 && source.Hp == 99750, "family enhancement activates float quarter-damage reflection without nested reactions");
        }
        foreach (var wound in new[] { false, true })
        {
            var source = Unit("attacker", 1, 0, ["死生茫茫"], 1000); var target = Unit("victim", 2, 1, []);
            if (wound) source.TryApplyBuff(new BattleBuffInstance(content.GetBuff("重伤"), 1, 4, source.Id, 0));
            Cast(source, target, [], 1001, 0);
            Check(target.MaxHp == 99950, "maximum HP loss is five percent damage capped at ten percent maximum");
            Check(source.Hp == (wound ? 1250 : 1500), "pre-distribution lifesteal and wound recovery share one resolver");
        }
        foreach (var name in new[] { "易容", "溜须拍马" })
        {
            var source = Unit("attacker", 1, 0, []); var target = Unit("victim", 2, 1, []);
            target.TryApplyBuff(new BattleBuffInstance(content.GetBuff(name), 2, 3, target.Id, 0));
            Cast(source, target, [], 1001);
            Check(target.Hp == 100000, "protective status suppresses ordinary incoming HP damage");
        }
        foreach (var initial in new[] { 0, 10, 99, 150 })
        {
            var source = Unit("attacker", 1, 0, ["玄门罡气"]); var target = Unit("victim", 2, 1, []);
            var inner = new InternalSkillInstance(content.GetInternalSkill("九阴神功"), source.Character) { Level = 10 };
            source.Character.InternalSkills.Add(inner); source.Character.EquipInternalSkill(inner.Id); source.Character.RebuildSnapshot(); target.SetActionGauge(initial);
            Cast(source, target, [], 1001, 0);
            Check(target.ActionGauge == Math.Max(0, initial - 10), "equipped internal energy removes inclusive 10..40 action gauge without going negative");
        }
        foreach (var lowSource in new[] { false, true })
        {
            var source = Unit("attacker", 1, 0, ["无形剑气"]); var target = Unit("victim", 2, 1, []);
            if (lowSource) source.DamageMp(19000); else target.DamageMp(19000);
            Cast(source, target, [], 1001, 0, skillName: "六脉神剑");
            var expected = 1001 + (int)(Math.Min(Math.Abs(source.Mp - target.Mp), 10000) * .1);
            Check(100000 - target.Hp == expected, "absolute MP difference works in both directions and caps at ten thousand");
        }
        foreach (var roll in new[] { .24999, .25 })
        {
            var source = Unit("attacker", 1, 0, ["黑天死炎"]); var target = Unit("victim", 2, 1, []);
            Cast(source, target, [], 1001, roll);
            Check(100000 - target.Hp == (roll < .25 ? 25000 : 1001), "black flame supplies a minimum of current HP quarter, not an added quarter");
        }
        foreach (var upper in new[] { false, true })
        {
            var source = Unit("attacker", 1, 0, ["攀云乘龙"]); var target = Unit("victim", 2, 1, []);
            source.Character.BaseStats[StatType.Shenfa] = 120;
            Cast(source, target, [], 1001, .25, upper);
            Check(100000 - target.Hp == (upper ? 1241 : 1121), "cloud dragon adds inclusive shenfa..two-shenfa damage");
        }
        {
            var source = Unit("attacker", 1, 0, ["木婉清的眷恋"]); source.Character.Name = "段誉";
            var target = Unit("victim", 2, 1, []); var partner = Unit("partner", 1, 2, []); partner.Character.Name = "木婉清";
            Cast(source, target, [partner], 1001, .25);
            Check(target.Hp == 98649, "named companion uses source name and on-field partner requirement with final damage truncation");
        }
        {
            var source = Unit("attacker", 1, 0, ["金刚伏魔圈"]); var target = Unit("victim", 2, 1, []);
            var living = Unit("living", 1, 2, ["金刚伏魔圈"]); var defeated = Unit("defeated", 1, 3, ["金刚伏魔圈"]); defeated.TakeDamage(100000);
            Cast(source, target, [living, defeated], 1001);
            Check(!source.Character.HasEffectiveTalent("金刚伏魔圈"), "confirmed defeated members do not keep a broken formation active");
        }
        Console.WriteLine($"PASS {checks} selected restoration checks: ordered formation distribution, group break/movement, evasion/reflection, source damage formulas, maximum HP drain, protective statuses and action gauge; no campaign.");
    }
}
