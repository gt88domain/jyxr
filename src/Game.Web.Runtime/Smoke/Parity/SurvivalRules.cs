using Game.Content.Loading;
using Game.Core.Abstractions;
using Game.Core.Battle;
using Game.Core.Model;
using Game.Core.Model.Character;
using Game.Core.Model.Skills;

internal static class SurvivalRules
{
    public static void Run(InMemoryContentRepository content)
    {
        var count = 0;
        void Check(bool value, string label)
        {
            if (!value) throw new InvalidOperationException("Survival source rule failed: " + label);
            count++; Console.WriteLine("PASS survival " + label);
        }
        CharacterInstance Character(string id, params string[] talents)
        {
            var c = CharacterMapper.CreateInitial(id, content.GetCharacter("主角"), new EquipmentInstanceFactory());
            c.UnlockedTalents.Clear(); c.UnlockedTalents.AddRange(talents.Select(content.GetTalent));
            c.BaseStats[StatType.MaxHp] = 20000; c.BaseStats[StatType.MaxMp] = 20000;
            c.BaseStats[StatType.Gengu] = 40; c.BaseStats[StatType.Dingli] = 20;
            c.RebuildSnapshot(); return c;
        }
        BattleUnit Unit(string id, int team, int x, int y, int hp = 100, int mp = 500, params string[] talents) =>
            new(id, Character(id, talents), team, new GridPosition(x, y), hp: hp, mp: mp);
        BattleEngine Engine(double roll) => new(new BattleDamageCalculator(new Fixed(roll)), random: new Fixed(roll), buffResolver: content.GetBuff);
        void Buff(BattleUnit unit, string id) => unit.TryApplyBuff(new BattleBuffInstance(content.GetBuff(id), 1, 4, unit.Id, 0));
        BattleState State(params BattleUnit[] units) => new(new BattleGrid(11, 6), units);

        foreach (var stunned in new[] { false, true })
        foreach (var wounded in new[] { false, true })
        {
            var medic = Unit("medic", 1, 2, 2, talents: ["医仙"]);
            var near = Unit("near", 1, 6, 2); var far = Unit("far", 1, 7, 2); var enemy = Unit("enemy", 2, 2, 3);
            if (stunned) Buff(medic, "晕眩"); if (wounded) Buff(near, "重伤");
            var state = State(medic, near, far, enemy); medic.SetActionGauge(100);
            var result = Engine(.5).BeginAction(state, medic.Id);
            Check(result.Success && medic.Hp == 200 && near.Hp == 200 && far.Hp == 100 && enemy.Hp == 100,
                $"医仙 source base-gengu, inclusive radius four and wound recovery; stun={stunned}, wound={wounded}");
            Check((result.Value is null) == stunned, "recovery precedes original stun action skip");
        }
        {
            var medic = Unit("medic", 1, 2, 2, talents: ["救死扶伤"]); var enemy = Unit("enemy", 2, 8, 2);
            medic.SetActionGauge(100); Engine(.5).BeginAction(State(medic, enemy), medic.Id);
            Check(medic.Hp == 300, "救死扶伤 original code includes self despite its tooltip");
        }
        foreach (var (name, limit, buff, level, radius, enemies) in new[] {
            ("普照", .4, "恢复", 2, 2, false), ("琴胆剑心", .4, "攻击强化", 3, 2, false),
            ("哀歌", 1d, "攻击弱化", 2, 3, true), ("倚天屠龙", .2, "圣战", 2, 0, false) })
        foreach (var roll in new[] { limit - .001, limit })
        {
            var owner = Unit("owner", 1, 2, 2, talents: [name]); var ally = Unit("ally", 1, 4, 2);
            var enemy = Unit("enemy", 2, 5, 2); var far = Unit("far", 2, 8, 2);
            var state = State(owner, ally, enemy, far); owner.SetActionGauge(100); Engine(roll).BeginAction(state, owner.Id);
            var active = limit == 1 || roll < limit;
            Check((enemies ? enemy : owner).HasBuff(buff) == active && !far.HasBuff(buff), name + " source probability and side/radius at " + roll);
            if (active && !enemies && radius > 0) Check(ally.TryGetBuff(buff)?.Level == level && !enemy.HasBuff(buff), name + " exact allied buff level");
        }
        foreach (var roll in new[] { .299, .3 })
        {
            var owner = Unit("owner", 1, 2, 2, talents: ["无相"]); var enemy = Unit("enemy", 2, 8, 2);
            owner.SetActionGauge(100); Engine(roll).BeginAction(State(owner, enemy), owner.Id);
            Check(owner.Hp == (roll < .3 ? 100 + (int)(roll * 81) : 100), "无相 30% and inclusive level*30+50 range at " + roll);
        }
        foreach (var sealedMp in new[] { false, true })
        {
            var owner = Unit("owner", 1, 2, 2, talents: ["百穴归一", "右臂有伤"]); var enemy = Unit("enemy", 2, 8, 2);
            if (sealedMp) Buff(owner, "封穴"); owner.SetActionGauge(100); Engine(.5).BeginAction(State(owner, enemy), owner.Id);
            Check(owner.Rage == 2 && owner.Mp == 625, "百穴归一 MP gain bypasses rest-only seal and adds right-arm rage; sealed=" + sealedMp);
        }
        foreach (var roll in new[] { .299, .3 })
        {
            var owner = Unit("owner", 1, 2, 2, talents: ["悲酥清风"]); var enemy = Unit("enemy", 2, 5, 2, mp: 501);
            var far = Unit("far", 2, 6, 2, mp: 501); owner.SetActionGauge(100); Engine(roll).BeginAction(State(owner, enemy, far), owner.Id);
            Check(enemy.Mp == (roll < .3 ? 250 : 501) && far.Mp == 501 && owner.Mp == 500, "悲酥清风 odd-MP rounding and radius three at " + roll);
        }
        foreach (var talent in new[] { "北冥神功", "鲲跃北溟", "化功大法", "吸星大法" })
        foreach (var dingli in new[] { 99, 100, 199 })
        foreach (var roll in new[] { .25, .5 })
        {
            var caster = Character("caster", talent); caster.BaseStats[StatType.Gengu] = 41;
            caster.InternalSkills.Single().Level = 7; caster.RebuildSnapshot();
            var source = new BattleUnit("caster", caster, 1, new GridPosition(2, 2), mp: 500);
            var targetChar = Character("target"); targetChar.BaseStats[StatType.Dingli] = dingli; targetChar.RebuildSnapshot();
            var target = new BattleUnit("target", targetChar, 2, new GridPosition(3, 2));
            var state = State(source, target); var engine = Engine(roll); source.SetActionGauge(100); engine.BeginAction(state, source.Id);
            var skill = caster.ExternalSkills.Single(); var result = engine.CastSkill(state, source.Id, skill, target.Position);
            var active = talent is "北冥神功" or "吸星大法" || roll < .5;
            var factor = 2 - dingli / 100;
            var requested = talent switch {
                "北冥神功" => (int)(41 * 2 * 7 / 10 * factor * (1 + roll * .5)),
                "鲲跃北溟" => 41 * 7 / 10 * factor,
                "化功大法" => 41 * 7 / 10 * 3 * factor,
                _ => (int)(41 * 2 * 7 / 10 * factor * (1 + roll)) };
            var actual = active ? requested : 0;
            Check(result.Success && target.Mp == target.MaxMp - actual, $"{talent} source integer operation order, dingli={dingli}, roll={roll}");
            Check(source.Mp == 500 - skill.MpCost + (talent == "化功大法" ? 0 : actual), talent + " drain versus transfer and real skill MP cost");
            Check(target.HasBuff("封穴") == (talent == "吸星大法"), talent + " only Xixing applies the real three-turn seal");
        }
        foreach (var (talents, roll, expected) in new[] {
            (new[]{"百足之虫","真气护体","无尽斗志","我就是神"}, .199, "百足之虫"),
            (new[]{"百足之虫","真气护体","无尽斗志","我就是神"}, .2, "真气护体"),
            (new[]{"百足之虫","真气护体","无尽斗志","我就是神"}, .5, "无尽斗志"),
            (new[]{"百足之虫"}, .2, ""), (new[]{"真气护体"}, .5, ""),
            (new[]{"无尽斗志"}, .099, "无尽斗志"), (new[]{"无尽斗志"}, .1, "") })
        {
            var source = Unit("source", 1, 2, 2, hp: 20000);
            var target = Unit("target", 2, 3, 2, hp: 1, mp: 20000, talents: talents); var backup = Unit("backup", 2, 9, 2);
            var state = State(source, target, backup); var engine = Engine(roll); source.SetActionGauge(100); engine.BeginAction(state, source.Id);
            var result = engine.CastSkill(state, source.Id, source.Character.ExternalSkills.Single(), target.Position);
            var prevention = result.Messages.OfType<BattleFact>().Where(f => f.Kind == BattleFactKind.DefeatPrevented).ToArray();
            Check(result.Success && (expected.Length == 0 ? prevention.Length == 0 && !target.IsAlive : prevention.Single().Detail == expected && target.IsAlive),
                "source death prevention priority and strict probability: " + string.Join('+', talents) + " roll=" + roll);
            if (expected == "百足之虫") Check(target.Hp == 1 && target.Mp == 20000 && target.GetAbilityUsageCount("无尽斗志") == 0, "earlier prevention does not spend MP or consume guaranteed revival");
            if (expected == "真气护体") Check(target.Hp == 1 && target.Mp < 19998, "qi shield pays twice incoming damage rather than capped one HP");
            if (expected == "无尽斗志") Check(target.Hp == target.MaxHp && target.Mp == target.MaxMp && target.Rage == 6, "revival restores HP/MP and six rage");
        }
        foreach (var name in new[] { "天地同寿", "同归剑法" })
        foreach (var maxHp in new[] { 5, 20000 })
        {
            var owner = Character("owner", "百足之虫", "真气护体", "无尽斗志", "我就是神", "不老长春", "万年长春");
            owner.BaseStats[StatType.MaxHp] = maxHp;
            owner.SpecialSkills.Clear();owner.SpecialSkills.Add(new SpecialSkillInstance(content.GetSpecialSkill(name), owner, true));owner.RebuildSnapshot();
            var source = new BattleUnit("owner", owner, 1, new GridPosition(2, 2), hp: Math.Min(500, maxHp), rage: 6);
            var target = Unit("enemy", 2, 3, 2, hp: 20000);var ally = Unit("ally", 1, 8, 2);
            var state = State(source, target, ally);var engine = Engine(0);source.SetActionGauge(100);engine.BeginAction(state, source.Id);
            var result = engine.CastSkill(state, source.Id, owner.SpecialSkills.Single(), target.Position);
            Check(result.Success && source.Hp == 0 && source.GetAbilityUsageCount("无尽斗志") == 0,
                name + " self cost bypasses incoming-hit protection and revival, starting maxHP=" + maxHp);
            Check(!result.Messages.OfType<BattleFact>().Any(f => f.Kind == BattleFactKind.DefeatPrevented && f.UnitId == source.Id),
                name + " cost never triggers an incoming-damage defeat-prevention event");
            Check(result.Messages.OfType<BattleFact>().Count(f => f.Kind == BattleFactKind.UnitDefeated && f.UnitId == source.Id) == 1,
                name + " emits exactly one actual defeat notification");
            var expected = name == "天地同寿" ? Math.Max(1, maxHp - 10) : maxHp;
            Check(owner.GetBaseStat(StatType.MaxHp) == expected && source.MaxHp >= 1, name + " permanent resource cost has a positive lower bound");
            var restored = CharacterMapper.FromRecord(CharacterMapper.ToRecord(owner), content);
            Check(restored.GetBaseStat(StatType.MaxHp) == expected, name + " actual character-record round trip preserves permanent max-HP cost");
        }
        foreach (var name in new[] { "清心", "清风" })
        foreach (var roll in new[] { 0d, .5 })
        {
            var owner = Unit("owner", 1, 2, 2, talents: [name]); var enemy = Unit("enemy", 2, 8, 2);
            Buff(owner, "缓速");Buff(owner, "攻击强化");
            Engine(roll).AdvanceUntilNextAction(State(owner, enemy), maxTicks: 50);
            Check(owner.HasBuff("缓速") == (roll >= (name == "清心" ? .5 : .015)) && owner.HasBuff("攻击强化"),
                name + " removes each negative buff only after its round, keeps positive buffs, roll=" + roll);
        }
        foreach(var wound in new[]{false,true})
        foreach(var seal in new[]{false,true})
        foreach(var item in new[]{"rest","大还丹","九转熊蛇丸"})
        {
            var owner=Unit("owner",1,2,2);var enemy=Unit("enemy",2,8,2);var state=State(owner,enemy);var engine=Engine(.5);
            owner.SetActionGauge(100);engine.BeginAction(state,owner.Id);
            var rest=BattleRestCalculator.Roll(owner,new Fixed(.5));
            if(wound)Buff(owner,"重伤");if(seal)Buff(owner,"封穴");
            var result=item=="rest"?engine.Rest(state,owner.Id):engine.UseItem(state,owner.Id,content.GetItem(item),owner.Id);
            var requestedHp=item=="rest"?rest.Hp:item=="大还丹"?3000:0;
            var requestedMp=item=="rest"?rest.Mp:item=="九转熊蛇丸"?7000:0;
            var hp=wound?requestedHp/2:requestedHp;
            var mp=item=="rest"&&seal?0:wound?requestedMp/2:requestedMp;
            Check(result.Success&&owner.Hp==100+hp&&owner.Mp==500+mp,
                $"{item} source recovery reason: wound={wound}, seal={seal}; seal does not block medicine");
        }
        (int hp, int mp) Strike(string[] talents, double roll, int hp = 20000, bool wounded = false)
        {
            var owner=Character("source");owner.BaseStats[StatType.Bili]=200;owner.BaseStats[StatType.Quanzhang]=200;owner.BaseStats[StatType.Attack]=4000;
            owner.ExternalSkills.Clear();owner.ExternalSkills.Add(new ExternalSkillInstance(content.GetExternalSkill("降龙十八掌"),owner,true){Level=10});owner.RebuildSnapshot();
            var source=new BattleUnit("source",owner,1,new GridPosition(2,2));
            var target=Unit("target",2,3,2,hp:hp,mp:20000,talents:talents);
            if(wounded)Buff(target,"重伤");
            var state=State(source,target);var engine=Engine(roll);source.SetActionGauge(100);engine.BeginAction(state,source.Id);
            var result=engine.CastSkill(state,source.Id,owner.ExternalSkills.Single(),target.Position);
            if(!result.Success)throw new InvalidOperationException("Defense fixture cast did not succeed.");
            return (target.Hp,target.Mp);
        }
        foreach(var roll in new[]{.199,.2,.249,.25,.499,.5})
        {
            var baseline=20000-Strike([],roll).hp;
            Check(baseline>500,"defense fixture produces an uncapped hit greater than 500, actual="+baseline);
            Check(20000-Strike(["乾坤大挪移"],roll).hp==(roll<.5?(int)(baseline*.5):baseline),"乾坤 50% strict boundary at "+roll);
            Check(20000-Strike(["乾坤大挪移奥义","乾坤大挪移"],roll).hp==(int)(baseline*.5),"乾坤奥义 excludes the lesser duplicate reduction at "+roll);
            foreach(var names in new[]{new[]{"精打细算"},new[]{"精明"},new[]{"精打细算","精明"}})
            {
                var careful=names.Contains("精打细算")&&roll<.2;
                var smart=!careful&&names.Contains("精明")&&roll<.25;
                var result=Strike(names,roll);
                Check(20000-result.hp==(careful?200:smart?500:baseline)&&20000-result.mp==(smart?baseline-500:0),
                    "source careful/smart priority and MP overflow "+string.Join('+',names)+" roll="+roll);
            }
        }
        foreach(var names in new[]{new[]{"不老长春"},new[]{"不老长春","万年长春"}})
        foreach(var roll in new[]{.099,.1,.199,.2})
        foreach(var wound in new[]{false,true})
        {
            var baseline=20000-Strike([],roll).hp;
            var actual=Strike(names,roll,hp:10000,wounded:wound);
            var healed=roll<(names.Length==1?.1:.2);
            var recovered=(int)(baseline*.35);if(wound)recovered/=2;
            Check(actual.hp==(healed?10000+recovered:10000-baseline),"不老/万年 activation and wound conversion boundary at "+roll+", wound="+wound);
        }
        Console.WriteLine($"PASS {count} selected survival and recovery source checks; not whole-game parity.");
    }

    private sealed class Fixed(double value) : IRandomService
    {
        public double NextDouble() => value;
        public int Next(int minimum, int maximum) => minimum + (int)(Math.Clamp(value, 0, .999999) * (maximum - minimum));
    }
}
