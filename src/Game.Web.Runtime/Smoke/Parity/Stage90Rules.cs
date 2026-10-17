using Game.Content.Loading;
using Game.Core.Abstractions;
using Game.Core.Affix;
using Game.Core.Battle;
using Game.Core.Definitions;
using Game.Core.Model;
using Game.Core.Model.Character;
using Game.Core.Model.Skills;

internal static class Stage90Rules
{
    private sealed class Rolls(double value) : IRandomService
    {
        public double NextDouble() => value;
        public int Next(int minimum, int maximum) => minimum;
    }
    private sealed class NoRolls : IRandomService
    {
        public double NextDouble() => throw new InvalidOperationException("AI consumed gameplay RNG");
        public int Next(int minimum, int maximum) => throw new InvalidOperationException("AI consumed gameplay RNG");
    }

    public static void Run(InMemoryContentRepository content)
    {
        var checks = 0;
        void Check(bool value, string label) { if (!value) throw new InvalidOperationException("Stage90: " + label); checks++; }
        BattleUnit Unit(string id, int team, int x, int hp = 100000, params string[] talents)
        {
            var c = CharacterMapper.CreateInitial(id, content.GetCharacter("主角") with { Id = id, Name = id }, new EquipmentInstanceFactory());
            c.ExternalSkills.Clear(); c.InternalSkills.Clear(); c.SpecialSkills.Clear(); c.EquippedItems.Clear(); c.UnlockedTalents.Clear();
            c.UnlockedTalents.AddRange(talents.Select(content.GetTalent));
            c.BaseStats[StatType.MaxHp] = 100000; c.BaseStats[StatType.MaxMp] = 20000;
            c.BaseStats[StatType.Fuyuan] = 0; c.BaseStats[StatType.Dingli] = 0; c.BaseStats[StatType.Evasion] = 0;
            c.RebuildSnapshot(); return new(id, c, team, new(x, 0), hp: hp, rage: 6);
        }
        SpecialSkillInstance Special(BattleUnit unit, string id)
        {
            var skill = new SpecialSkillInstance(content.GetSpecialSkill(id), unit.Character, true);
            unit.Character.SpecialSkills.Add(skill); unit.Character.RebuildSnapshot(); return skill;
        }
        BattleTurnPlan Decide(BattleState state, BattleUnit source) => new BasicEnemyBattleAgent(
            new BattleTurnCandidateGenerator(new BattleEngine(random: new NoRolls())), new BattleAiPolicyResolver(_ => 10)).Decide(state, source.Id);
        BattleCommandResult<BattleActionResult> Hit(BattleUnit source, BattleUnit target, int amount)
        {
            source.Character.UnlockedTalents.Add(new TalentDefinition { Id = "fixed", Name = "fixed", Affixes = [new HookAffix
            { Timing = HookTiming.BeforeDamageCalculation, Priority = -10000, Effects = [new ModifyDamageContextBattleHookEffectDefinition(BattleDamageContextField.FinalDamage, ModifierOp.Override, amount)] }] });
            var skill = new ExternalSkillInstance(content.GetExternalSkill("野球拳") with { Buffs = [], Affixes = [] }, source.Character, true) { Level = 10 };
            source.Character.ExternalSkills.Add(skill); source.Character.RebuildSnapshot();
            var state = new BattleState(new BattleGrid(5, 2), [source, target]);
            var engine = new BattleEngine(random: new Rolls(0), buffResolver: content.GetBuff);
            source.SetActionGauge(100); Check(engine.BeginAction(state, source.Id).Success, "begin source-backed damage cast");
            var result = engine.CastSkill(state, source.Id, skill, target.Position);
            Check(result.Success, "source-backed damage cast succeeds"); return result;
        }
        {
            var healer = Unit("healer", 1, 0); Special(healer, "华佗再世");
            var ally = Unit("wounded", 1, 1, 1000); var enemy = Unit("enemy", 2, 4);
            var state = new BattleState(new BattleGrid(5, 2), [healer, ally, enemy]);
            var plan = Decide(state, healer);
            Check(plan.MainAction.SkillId == "华佗再世" && plan.MainAction.TargetPosition == ally.Position, "healer selects wounded ally over enemy and full-health self without RNG");
            Check(ally.Hp == 1000 && healer.Mp == 20000 && healer.Character.SpecialSkills.Single().CurrentCooldown == 0, "AI leaves HP, MP and cooldown untouched");
            ally.RestoreHp(100000);
            Check(Decide(state, healer).MainAction.Kind == BattleMainActionKind.Rest, "full-health team does not waste healing skill");
        }
        {
            var source = Unit("support", 1, 0); Special(source, "笑傲江湖曲");
            var ally = Unit("ally", 1, 1); var enemy = Unit("enemy", 2, 4);
            var state = new BattleState(new BattleGrid(5, 2), [source, ally, enemy]);
            Check(Decide(state, source).MainAction.SkillId == "笑傲江湖曲", "global friendly buff contributes once per affected ally");
            foreach (var u in new[] { source, ally }) u.TryApplyBuff(new(content.GetBuff("攻击强化"), 5, 3, source.Id, 0));
            Check(Decide(state, source).MainAction.Kind == BattleMainActionKind.Rest, "existing full-strength buff is not repeatedly refreshed");
        }
        {
            var source = Unit("sacrifice", 1, 0, 500); Special(source, "同归剑法");
            var enemy = Unit("enemy", 2, 1);
            Check(Decide(new(new BattleGrid(4, 2), [source, enemy]), source).MainAction.Kind == BattleMainActionKind.Rest, "last ally avoids lethal self-cost when enemy will survive");
        }
        {
            var source = Unit("control", 1, 0); Special(source, "沉鱼落雁");
            var enemy = Unit("enemy", 2, 1); var state = new BattleState(new BattleGrid(4, 2), [source, enemy]);
            Check(Decide(state, source).MainAction.SkillId == "沉鱼落雁", "non-damage rage control is a useful offensive action");
            enemy.SetRage(0);
            Check(Decide(state, source).MainAction.Kind == BattleMainActionKind.Rest, "control with no removable resource is not spammed");
        }
        foreach (var protection in new[] { "none", "斗转星移", "不老长春", "易容", "溜须拍马" })
        {
            var source = Unit("attacker", 1, 0); var target = Unit("defender", 2, 1, 90000, "精明");
            if (protection is "斗转星移" or "不老长春") target.Character.UnlockedTalents.Add(content.GetTalent(protection));
            else if (protection != "none") target.TryApplyBuff(new(content.GetBuff(protection), 2, 3, target.Id, 0));
            target.Character.RebuildSnapshot(); Hit(source, target, 1001);
            Check(target.Mp == (protection == "none" ? 19499 : 20000), "MP overflow follows immunity/conversion/reflection: " + protection);
            Check(source.Mp == 20000 - source.Character.ExternalSkills.Single().MpCost - (protection == "斗转星移" ? 125 : 0), "reflection applies float-quarter MP only once after cast cost: " + protection);
        }
        foreach (var survival in new[] { "百足之虫", "真气护体", "无尽斗志" })
        {
            var source = Unit("attacker", 1, 0, 10, survival); var target = Unit("reflector", 2, 1, 100000, "斗转星移");
            var result = Hit(source, target, 1001);
            Check(source.IsAlive, "reflected lethal HP can use original defeat prevention: " + survival);
            Check(!result.Messages.OfType<BattleFact>().Any(f => f.Kind == BattleFactKind.UnitDefeated && f.UnitId == source.Id), "revived source emits no confirmed defeat");
            if (survival == "真气护体") Check(source.Mp == 20000 - source.Character.ExternalSkills.Single().MpCost, "reflected cancelled AttackResult preserves original zero qi-shield cost");
        }
        BattleCommandResult<BattleActionResult> CastSpecial(BattleUnit source, BattleUnit target, string id, params BattleUnit[] allies)
        {
            var skill=Special(source,id);
            var state=new BattleState(new BattleGrid(12,2),[source,target,..allies]);
            var engine=new BattleEngine(random:new Rolls(0),buffResolver:content.GetBuff,
                formationRules:new("真武七截阵","五行阵","八卦阵","金刚伏魔圈"));
            source.SetActionGauge(100);Check(engine.BeginAction(state,source.Id).Success,"begin damage special");
            var result=engine.CastSkill(state,source.Id,skill,target.Position);
            Check(result.Success,"original damage special succeeds: "+id);
            var cast=result.Messages.OfType<BattleFact>().Single(f=>f.Kind==BattleFactKind.SkillCast).SkillCast!;
            Check(cast.TargetPosition==target.Position||id is "过肩摔" or "神龙摆尾","cast presentation retains the selected target before displacement");
            Check(cast.ImpactedPositions!.SequenceEqual(result.Value!.ImpactedPositions),"presentation and rule impact areas are identical");
            return result;
        }
        foreach(var name in new[]{"一刀两断","襄儿的心愿","火枪","同归剑法","天地同寿","腐尸毒","过肩摔","神龙摆尾"})
        {
            var source=Unit("special-source",1,1);var target=Unit("evader",2,2,100000,"赵敏的眷念");
            if(name=="腐尸毒")target.TryApplyBuff(new(content.GetBuff("中毒"),2,3,source.Id,0));
            CastSpecial(source,target,name);
            Check(target.Hp==100000,"all eight damaging specials pass source-backed evasion: "+name);
            Check(!target.HasBuff("缓速")&&!target.HasBuff("伤害加深"),"missed damage special does not pre-apply its hit buffs");
        }
        {
            var source=Unit("gunner",1,1);source.Character.BaseStats[StatType.Fuyuan]=200;source.Character.RebuildSnapshot();
            var target=Unit("defender",2,2,100000,"精打细算","宝甲");
            target.TryApplyBuff(new(content.GetBuff("易容"),2,3,target.Id,0));
            CastSpecial(source,target,"火枪");
            Check(target.Hp==98800,"special early-return branch bypasses normal formula cap, armour and disguise, as pinned source does");
        }
        {
            var source=Unit("gunner",1,1);var target=Unit("reflector",2,2,100000,"斗转星移");
            CastSpecial(source,target,"火枪");
            Check(target.Hp==100000&&source.Hp==99950,"special damage reflects through the shared incoming pipeline");
            Check(!target.HasBuff("伤害加深")&&!target.HasBuff("缓速"),"reflected firearm hit does not leak skill debuffs");
        }
        {
            var source=Unit("gunner",1,1);var target=Unit("target",2,2);var support=Unit("supporter",2,3,100000,"五行阵");
            CastSpecial(source,target,"火枪",support);
            Check(target.Hp==99900&&support.Hp==99900,"special damage uses actual formation distribution");
        }
        {
            var source=Unit("gunner",1,1);var target=Unit("survivor",2,2,10,"百足之虫");
            CastSpecial(source,target,"火枪");Check(target.Hp==1,"special lethal damage permits defeat prevention");
        }
        {
            var source=Unit("swordsman",1,1,100000,"射雕英雄");var target=Unit("target",2,2);
            var skill=new ExternalSkillInstance(content.GetExternalSkill("降龙十八掌"),source.Character,true){Level=10};
            var engine=new BattleEngine(random:new NoRolls());var state=new BattleState(new BattleGrid(6,2),[source,target]);
            var boosted=engine.EstimateSkillDamage(state,source,target,skill).Damage;
            source.Character.UnlockedTalents.Clear();source.Character.RebuildSnapshot();
            var plain=engine.EstimateSkillDamage(state,source,target,skill).Damage;
            Check(boosted==(int)(plain*1.35),"AI uses the midpoint of final school modifiers without drawing RNG");
            Check(source.Hp==100000&&target.Hp==100000,"numeric previews preserve combat resources");
            target.TryApplyBuff(new(content.GetBuff("易容"),2,3,target.Id,0));
            Check(engine.EstimateSkillDamage(state,source,target,skill).Damage==0,"AI numeric preview recognizes ordinary damage immunity");
        }
        {
            var healer=Unit("novice",1,0,20);Special(healer,"华佗再世");
            healer.Character.BaseStats[StatType.MaxHp]=200;healer.Character.RebuildSnapshot();
            var enemy=Unit("enemy",2,4);var state=new BattleState(new BattleGrid(5,2),[healer,enemy]);
            Check(Decide(state,healer).MainAction.SkillId=="华佗再世","low-level healer values actual recovery instead of a fixed 1500-point rest bonus");
            healer.TryApplyBuff(new(content.GetBuff("封穴"),1,3,healer.Id,0));healer.DamageMp(1000);
            Check(new BattleEngine(random:new NoRolls()).EstimateRestRecovery(state,healer).Mp==0,"read-only rest evaluation respects MP recovery suppression");
        }
        Console.WriteLine($"PASS {checks} stage90 AI, pending MP and reflection survival checks");
    }
}
