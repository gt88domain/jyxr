using System.Text.Json;
using System.Text.Json.Nodes;
using System.Xml.Linq;
using Game.Application;
using Game.Content.Loading;
using Game.Core.Abstractions;
using Game.Core.Affix;
using Game.Core.Battle;
using Game.Core.Model;
using Game.Core.Model.Character;
using Game.Core.Model.Skills;
using Game.Core.Serialization;
using Game.Web.Runtime;

// This executes only the modern core, with selected expectations transcribed
// from pinned legacy source and XML. It is not an old-engine differential run.
var repository = Path.GetFullPath(args.FirstOrDefault() ?? ".");
var packagePath = args.Skip(1).FirstOrDefault() ?? Path.Combine(repository, "src/Game.Web/public/data/content-package.json");
var root = JsonNode.Parse(File.ReadAllText(packagePath))!.AsObject();
var scripts = root["storyScripts"]?.DeepClone() as JsonObject;
root.Remove("storyScripts");
var json = new JsonSerializerOptions(GameJson.Default) { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
var package = root.Deserialize<ContentPackage>(json)!;
if (scripts is not null)
    foreach (var entry in scripts)
        package.StoryScripts[entry.Key] = Game.Core.Story.StoryScriptJson.Parse(entry.Value!.ToJsonString(), entry.Key);
var content = new JsonContentLoader().LoadFromPackage(package);
MasteryRules.Run(content);
if (args.Contains("--mastery-only")) return;
ControlRules.Run(content);
if (args.Contains("--controls-only")) return;
AttributeRules.Run(content);
if (args.Contains("--attributes-only")) return;
SchoolRules.Run(content);
if (args.Contains("--schools-only")) return;
AdvancedRules.Run(content);
CombinationRules.Run(content);
SurvivalRules.Run(content);
var config = new GameConfig { MaximizeNewPartyCharacterSkills = false };
var state = new GameState();
state.Adventure.SetDifficulty(GameDifficulty.Normal);
var session = new GameSession(state, content, config: config);
var hero = new InitialCharacterFactory(content, config).Create("主角", "主角", state.EquipmentInstanceFactory);
state.Party.AddMember(hero);
var battle = session.BattleService.BuildBattleState(new OrdinaryBattleRequest("南贤居_木头人_战斗", [hero.Id]));
var player = battle.Units.Single(u => u.Team == 1);
var dummy = battle.Units.Single(u => u.Team == 2);
var roles = XDocument.Load(Path.Combine(repository, "jyx-legacy-data/data-origin/roles.xml"));
var originalHero = roles.Root!.Elements("role").Single(e => (string?)e.Attribute("key") == "主角");
var originalDummy = roles.Root!.Elements("role").Single(e => (string?)e.Attribute("key") == "木头人");
var count = 0;
Check(battle.Grid.Width == 11 && battle.Grid.Height == 4 && player.Position == new GridPosition(2, 2) && dummy.Position == new GridPosition(8, 2), "legacy first encounter 11×4 grid and starting positions");
Check(player.MaxHp == (int)originalHero.Attribute("maxhp")! && player.MaxMp == (int)originalHero.Attribute("maxmp")!, "hero template 200 HP / 200 MP before opening-question bonuses");
Check(dummy.MaxHp == (int)originalDummy.Attribute("maxhp")! && dummy.MaxMp == (int)originalDummy.Attribute("maxmp")!, "dummy template 500 HP / 1 MP");
Check(player.Hp == player.MaxHp && player.Mp == player.MaxMp && dummy.Hp == dummy.MaxHp && dummy.Mp == dummy.MaxMp, "fresh encounter starts with actual character resources");
Check(hero.ExternalSkills.Single().Id == "野球拳" && hero.ExternalSkills.Single().Level == 1 && hero.GetInternalSkills().Single().Id == "基本内功" && hero.GetInternalSkills().Single().Level == 1 && hero.SpecialSkills.Single().Id == "打鸡血", "template skill IDs and initial levels");
Check(Math.Abs(player.ActionSpeed - 1d) < 1e-10 && Math.Abs(dummy.ActionSpeed - 1d) < 1e-10, "legacy base action speed clamp for fresh hero and dummy");
var calculator = new BattleDamageCalculator();
var normalRules = battle.RuleSettings;
var unscaledRules = normalRules with { EnableDifficultyDamageScaling = false };
var punch = hero.ExternalSkills.Single();
var normalAttack = calculator.CreateSkillDamageContext(new BattleDamageContext(player, dummy, punch, normalRules));
var unscaledAttack = calculator.CreateSkillDamageContext(new BattleDamageContext(player, dummy, punch, unscaledRules));
Check(Math.Abs(normalAttack.AttackLow - unscaledAttack.AttackLow * 2d) < 1e-10 && Math.Abs(normalAttack.AttackHigh - unscaledAttack.AttackHigh * 2d) < 1e-10, "normal difficulty doubles player attack bounds (legacy AttackLogic)");
var claw = dummy.Character.ExternalSkills.Single();
var normalEnemy = calculator.CreateSkillDamageContext(new BattleDamageContext(dummy, player, claw, normalRules));
var unscaledEnemy = calculator.CreateSkillDamageContext(new BattleDamageContext(dummy, player, claw, unscaledRules));
Check(Math.Abs(normalEnemy.AttackLow - unscaledEnemy.AttackLow * .5d) < 1e-10 && Math.Abs(normalEnemy.AttackHigh - unscaledEnemy.AttackHigh * .5d) < 1e-10, "normal difficulty halves enemy attack bounds");
// The two legacy implementations differ: external skills gain 31, internal
// skills gain 62 at wuxing 30, before talent adjustments. Record the mismatch;
// do not accidentally bless a modern behavior as a full parity assertion.
var modernCastExperience = SkillExperienceProgression.CalculateBattleUseExperience(hero);
Check(modernCastExperience == 62, "modern cast experience baseline is 62");
Console.WriteLine($"DEFAULT POLICY DIFFERENCE external skill use: legacy C# 31, modern {modernCastExperience}; the JyX profile resolver is tested below.");
Console.WriteLine($"CONTENT AUDIT dummy movement: modern {dummy.MovePower}, legacy template with 瘸子 1.");
Console.WriteLine($"CONTENT AUDIT talent affixes: 异世人={content.GetTalent("异世人").Affixes.Count}, 瘸子={content.GetTalent("瘸子").Affixes.Count}; metadata alone does not execute legacy effects.");
var reward = OrdinaryBattleVictorySettlementCalculator.Calculate(battle, 0d);
Check(reward.ExperiencePerMember == 5 && reward.Silver == 10, "first encounter settlement minima: 5 experience and 10 silver");
var engine = new BattleEngine(buffResolver: content.GetBuff);
Check(engine.StartBattle(battle).Success && engine.AdvanceUntilNextAction(battle).Success && battle.Tick == 100, "unmodified first action readiness at tick 100");
Console.WriteLine($"Modern first-action unit: {battle.CurrentAction!.ActingUnitId}; same-tick legacy queue parity remains unverified.");
Check(dummy.MovePower == 1, "source-backed 瘸子 content reduces dummy movement to one");

foreach (var talented in new[] { false, true })
{
    foreach (var legacy in new[] { false, true })
    {
        var fighter = FreshHero($"growth_{talented}_{legacy}");
        if (talented)
        {
            fighter.LearnTalent(content.GetTalent("武学奇才") with { Affixes = [new TraitAffix(TraitId.DoubleExperienceGain)] });
        }
        var attacker = new BattleUnit("attacker", fighter, 1, new GridPosition(0, 0));
        var victim = new BattleUnit("victim", FreshHero("victim"), 2, new GridPosition(1, 0));
        var fixture = new BattleState(new BattleGrid(3, 2), [attacker, victim]);
        var runner = Engine(legacy);
        attacker.SetActionGauge(100);
        Check(runner.BeginAction(fixture, attacker.Id).Success && runner.CastSkill(fixture, attacker.Id, fighter.ExternalSkills.Single(), victim.Position).Success, $"real cast for {(legacy ? "legacy" : "default")} growth profile / talent={talented}");
        var outer = fighter.ExternalSkills.Single();
        var inner = fighter.InternalSkills.Single();
        var outerTotal = Enumerable.Range(1, outer.Level - 1).Sum(outer.GetLevelUpExp) + outer.Exp;
        var innerTotal = Enumerable.Range(1, inner.Level - 1).Sum(inner.GetLevelUpExp) + inner.Exp;
        var expectedOuter = legacy ? talented ? 62 : 31 : talented ? 124 : 62;
        var expectedInner = legacy ? talented ? 93 : 62 : talented ? 124 : 62;
        Check(outerTotal == expectedOuter && innerTotal == expectedInner, $"final actual growth: outer={expectedOuter}, inner={expectedInner}; no duplicate talent multiplier");
    }
}

var fullAttack = Hit(200, 500, false, 0.5);
var lowAttack = Hit(40, 500, false, 0.5);
var aboveLowThreshold = Hit(41, 500, false, 0.5);
Check(lowAttack.Amount >= fullAttack.Amount * 2 && lowAttack.Amount <= fullAttack.Amount * 2 + 1 && aboveLowThreshold.Amount == fullAttack.Amount, "异世人 doubles real outgoing damage at inclusive 20% threshold only");
Check(!Hit(200, 500, false, .04).IsCritical && Hit(40, 500, false, .04).IsCritical, "异世人 doubles actual critical probability from .03 to .06");
var buffedAttack = Hit(200, 500, true, 0.5);
Check(Math.Abs(buffedAttack.Amount - fullAttack.Amount * 1.3) <= 1, "three-level 攻击强化 multiplies actual attack by 1.3");
CheckIncomingDefense(200, true);
CheckIncomingDefense(201, false);

var inspiringHero = FreshHero("inspire");
var inspiringUnit = new BattleUnit("inspire", inspiringHero, 1, new GridPosition(0, 0));
var inspireState = new BattleState(new BattleGrid(2, 2), [inspiringUnit]);
var inspireEngine = Engine(true);
inspiringUnit.SetActionGauge(100);
Check(inspireEngine.BeginAction(inspireState, inspiringUnit.Id).Success && inspireEngine.CastSkill(inspireState, inspiringUnit.Id, inspiringHero.SpecialSkills.Single(), inspiringUnit.Position).Success, "real 打鸡血 self cast");
Console.WriteLine($"打鸡血 observed rage={inspiringUnit.Rage}, mp={inspiringUnit.Mp}, buff={inspiringUnit.TryGetBuff("攻击强化")?.Level}/{inspiringUnit.TryGetBuff("攻击强化")?.RemainingTurns}");
Check(inspiringUnit.Rage == 2 && inspiringUnit.Mp == 100 && inspiringUnit.TryGetBuff("攻击强化") is { Level: 3, RemainingTurns: 5 }, "打鸡血 spends 100 MP, grants exactly two rage and original level-three five-round Buff");
CheckCommonTalent("神兵", false, c => {c.AttackLow*=1.05;c.AttackHigh*=1.05;});
CheckCommonTalent("右臂有伤", false, c => {c.AttackLow*=.95;c.AttackHigh*=.95;});
CheckCommonTalent("左手剑", false, c => {c.AttackLow*=1.05;c.AttackHigh*=1.05;c.CriticalChance-=.02;});
CheckCommonTalent("老江湖", false, c => {c.AttackLow*=1.2;c.AttackHigh*=.9;});
CheckCommonTalent("神经病", false, c => c.AttackHigh*=1.1);
CheckReceivedDamage(["神经病"], x => (int)(x*1.1));
CheckCommonTalent("鲁莽", false, c => {c.AttackLow*=1.06;c.AttackHigh*=1.06;});
CheckReceivedDamage(["鲁莽"], x => (int)(x*1.1));
CheckReceivedDamage(["宝甲"], x => (int)(x*.95));
CheckReceivedDamage(["鲁莽","宝甲","神经病"], x => (int)((int)((int)(x*.95)*1.1)*1.1));
CheckCommonTalent("苦命儿", true, c => c.Defence+=30);
CheckCommonTalent("暴躁", true, c => c.CriticalChance+=.1, randomValue:.08);
CheckCommonTalent("好色", false, c => {c.AttackLow*=1.2;c.AttackHigh*=1.2;}, targetGender:CharacterGender.Female);
CheckCommonTalent("好色", false, _ => {}, targetGender:CharacterGender.Male);
CheckCommonTalent("好色", true, c => c.Defence*=.8, sourceGender:CharacterGender.Female);
CheckCommonTalent("好色", true, _ => {}, sourceGender:CharacterGender.Male);
CheckCommonTalent("猎人", false, c => {c.AttackLow*=1.5;c.AttackHigh*=1.5;}, targetGender:CharacterGender.Animal);
CheckCommonTalent("猎人", false, _ => {}, targetGender:CharacterGender.Male);
CheckCommonBuff("攻击弱化", false, c => {c.AttackLow*=.7;c.AttackHigh*=.7;});
CheckCommonBuff("防御强化", true, c => c.Defence+=80);
foreach(var sample in new (bool SourceGrass,bool TargetGrass,int SourceHp,int TargetHp,double Random)[]{
    (true,false,500,1000,.5),(true,false,501,1000,.5),(true,false,200,1000,.5),
    (false,false,500,1000,.5),(true,false,1000,500,.5),(false,true,1000,500,.5),
    (true,true,500,500,.5),(true,false,500,1000,.04),(true,false,1000,501,.5),(true,true,1000,200,.5)})
    CheckOutsiderCombination(sample.SourceGrass,sample.TargetGrass,sample.SourceHp,sample.TargetHp,sample.Random);
Console.WriteLine($"PASS {count} selected modern-core / legacy-source checks. This does not establish full game parity.");

void CheckOutsiderCombination(bool sourceGrass,bool targetGrass,int sourceHp,int targetHp,double randomValue)
{
    var fighter=FreshHero("outsider_source");var defender=FreshHero("outsider_target");
    if(sourceGrass)fighter.LearnTalent(content.GetTalent("草头百姓"));
    if(targetGrass)defender.LearnTalent(content.GetTalent("草头百姓"));
    fighter.BaseStats[StatType.MaxHp]=1000;defender.BaseStats[StatType.MaxHp]=1000;
    fighter.RebuildSnapshot();defender.RebuildSnapshot();
    var attacker=new BattleUnit("attacker",fighter,1,new GridPosition(0,0),hp:sourceHp);
    var target=new BattleUnit("target",defender,2,new GridPosition(1,0),hp:targetHp);
    var expectedCalculator=new BattleDamageCalculator(new FixedRandom(randomValue));
    var expected=expectedCalculator.CreateSkillDamageContext(new BattleDamageContext(attacker,target,fighter.ExternalSkills.Single()));
    if(sourceHp<=(sourceGrass?500:200)){expected.AttackLow*=2;expected.AttackHigh*=2;expected.CriticalChance*=2;}
    // AttackLogic.cs1462 reads the source's 草头百姓, not the defender's.
    if(targetHp<=(sourceGrass?500:200))expected.Defence*=1.5;
    var expectedDamage=expectedCalculator.CalculateSkillDamage(expected);
    var state=new BattleState(new BattleGrid(3,2),[attacker,target]);var runner=Engine(true,randomValue);
    attacker.SetActionGauge(100);if(!runner.BeginAction(state,attacker.Id).Success)throw new InvalidOperationException("Outsider combo could not begin action.");
    var result=runner.CastSkill(state,attacker.Id,fighter.ExternalSkills.Single(),target.Position);
    if(!result.Success)throw new InvalidOperationException("Outsider combo cast failed.");
    var actual=result.Messages.OfType<BattleFact>().Single(f=>f.Kind==BattleFactKind.Damaged&&f.UnitId==target.Id).Damage!;
    Check(actual.Amount==expectedDamage.Amount&&actual.IsCritical==expectedDamage.IsCritical,
        $"草头百姓/异世人 actual source={sourceGrass}, target={targetGrass}, HP={sourceHp}/{targetHp}: damage {actual.Amount}, critical {actual.IsCritical}; legacy source-side defense gate");
}

void CheckCommonTalent(string name,bool targetSide,Action<BattleDamageCalculationContext> expectation,
    CharacterGender sourceGender=CharacterGender.Male,CharacterGender targetGender=CharacterGender.Male,double randomValue=.5)
    => CheckCommon(name,targetSide,expectation,sourceGender,targetGender,randomValue,false);
void CheckReceivedDamage(string[] talents,Func<int,int> transform)
{
    var a=FreshHero("receive_source");var b=FreshHero("receive_target");a.UnlockedTalents.Clear();b.UnlockedTalents.Clear();
    var caster=new BattleUnit("a",a,1,new GridPosition(0,0));var victim=new BattleUnit("b",b,2,new GridPosition(1,0));
    var expected=new BattleDamageCalculator(new FixedRandom(.5)).CalculateSkillDamage(new BattleDamageContext(caster,victim,a.ExternalSkills.Single())).Amount;
    foreach(var id in talents)b.LearnTalent(content.GetTalent(id));
    var state=new BattleState(new BattleGrid(3,2),[caster,victim]);var runner=Engine(true);caster.SetActionGauge(100);
    if(!runner.BeginAction(state,caster.Id).Success)throw new InvalidOperationException("Received damage fixture did not begin.");
    var result=runner.CastSkill(state,caster.Id,a.ExternalSkills.Single(),victim.Position);
    if(!result.Success)throw new InvalidOperationException("Received damage fixture cast failed.");
    var actual=result.Messages.OfType<BattleFact>().Single(f=>f.Kind==BattleFactKind.Damaged&&f.UnitId==victim.Id).Damage!.Amount;
    Check(actual==transform(expected),$"source-backed received {string.Join('+',talents)}: sequential integer truncation and order {actual}");
}
void CheckCommonBuff(string name,bool targetSide,Action<BattleDamageCalculationContext> expectation)
    => CheckCommon(name,targetSide,expectation,CharacterGender.Male,CharacterGender.Male,.5,true);
void CheckCommon(string name,bool targetSide,Action<BattleDamageCalculationContext> expectation,
    CharacterGender sourceGender,CharacterGender targetGender,double randomValue,bool buff)
{
    var a=FreshHero("common_source");var b=FreshHero("common_target");
    a.UnlockedTalents.Clear();b.UnlockedTalents.Clear();a.SetGender(sourceGender);b.SetGender(targetGender);
    a.BaseStats[StatType.MaxHp]=10000;b.BaseStats[StatType.MaxHp]=10000;a.RebuildSnapshot();b.RebuildSnapshot();
    var caster=new BattleUnit("a",a,1,new GridPosition(0,0));var victim=new BattleUnit("b",b,2,new GridPosition(1,0));
    var expectedCalculator=new BattleDamageCalculator(new FixedRandom(randomValue));
    var expected=expectedCalculator.CreateSkillDamageContext(new BattleDamageContext(caster,victim,a.ExternalSkills.Single()));
    expectation(expected);var damage=expectedCalculator.CalculateSkillDamage(expected);
    if(buff)(targetSide?victim:caster).TryApplyBuff(new BattleBuffInstance(content.GetBuff(name),3,5,caster.Id,0));
    else (targetSide?b:a).LearnTalent(content.GetTalent(name));
    var state=new BattleState(new BattleGrid(3,2),[caster,victim]);var runner=Engine(true,randomValue);caster.SetActionGauge(100);
    if(!runner.BeginAction(state,caster.Id).Success)throw new InvalidOperationException("Common-rules fixture could not begin.");
    var result=runner.CastSkill(state,caster.Id,a.ExternalSkills.Single(),victim.Position);
    if(!result.Success)throw new InvalidOperationException("Common-rules fixture cast failed.");
    var actual=result.Messages.OfType<BattleFact>().Single(f=>f.Kind==BattleFactKind.Damaged&&f.UnitId==victim.Id).Damage!;
    Check(actual.Amount==damage.Amount&&actual.IsCritical==damage.IsCritical,$"source-backed {name}: actual damage/critical {actual.Amount}/{actual.IsCritical}, source gender {sourceGender}, target gender {targetGender}");
}

CharacterInstance FreshHero(string id) => new InitialCharacterFactory(content, config).Create(id, "主角", new EquipmentInstanceFactory());

BattleEngine Engine(bool legacy, double randomValue = .5) => new(
    damageCalculator: new BattleDamageCalculator(new FixedRandom(randomValue)),
    random: new FixedRandom(randomValue),
    buffResolver: content.GetBuff,
    skillUseExperienceResolver: legacy ? BrowserLegacyRules.ResolveSkillUseExperience : null);

BattleDamageEvent Hit(int hp, int victimHp, bool buffed, double randomValue)
{
    var fighter = FreshHero("damage");
    var attacker = new BattleUnit("attacker", fighter, 1, new GridPosition(0, 0), hp: hp);
    var victim = new BattleUnit("victim", dummy.Character, 2, new GridPosition(1, 0), hp: victimHp);
    if (buffed) attacker.TryApplyBuff(new BattleBuffInstance(content.GetBuff("攻击强化"), 3, 5, attacker.Id, 0));
    var fixture = new BattleState(new BattleGrid(3, 2), [attacker, victim]);
    var runner = Engine(true, randomValue);
    attacker.SetActionGauge(100);
    if (!runner.BeginAction(fixture, attacker.Id).Success) throw new InvalidOperationException("Damage fixture could not begin action.");
    var result = runner.CastSkill(fixture, attacker.Id, fighter.ExternalSkills.Single(), victim.Position);
    if (!result.Success) throw new InvalidOperationException("Damage fixture cast failed.");
    return result.Messages.OfType<BattleFact>().Single(f => f.Kind == BattleFactKind.Damaged && f.UnitId == victim.Id).Damage!;
}

void CheckIncomingDefense(int targetHp, bool strengthened)
{
    var fighter = FreshHero("incoming");
    var defender = FreshHero("defender");
    defender.BaseStats[StatType.MaxHp] = 1000;
    defender.RebuildSnapshot();
    var attacker = new BattleUnit("attacker", fighter, 1, new GridPosition(0, 0));
    var victim = new BattleUnit("victim", defender, 2, new GridPosition(1, 0), hp: targetHp);
    var fixture = new BattleState(new BattleGrid(3, 2), [attacker, victim]);
    var expectedCalculator = new BattleDamageCalculator(new FixedRandom(.5));
    var expected = expectedCalculator.CreateSkillDamageContext(new BattleDamageContext(attacker, victim, fighter.ExternalSkills.Single()));
    if (strengthened) expected.Defence *= 1.5;
    var expectedDamage = expectedCalculator.CalculateSkillDamage(expected).Amount;
    var runner = Engine(true);
    attacker.SetActionGauge(100);
    if (!runner.BeginAction(fixture, attacker.Id).Success) throw new InvalidOperationException("Defense fixture could not begin action.");
    var result = runner.CastSkill(fixture, attacker.Id, fighter.ExternalSkills.Single(), victim.Position);
    if (!result.Success) throw new InvalidOperationException("Defense fixture cast failed.");
    var actual = result.Messages.OfType<BattleFact>().Single(f => f.Kind == BattleFactKind.Damaged && f.UnitId == victim.Id).Damage!.Amount;
    Check(actual == expectedDamage, $"异世人 incoming defense ×{(strengthened ? 1.5 : 1)} at {targetHp}/1000 HP");
}

void Check(bool condition, string description)
{
    if (!condition) throw new InvalidOperationException(description);
    count++;
    Console.WriteLine($"PASS {description}");
}

sealed class FixedRandom(double value) : IRandomService
{
    public double NextDouble() => value;
    public int Next(int minInclusive, int maxExclusive) => minInclusive;
}
