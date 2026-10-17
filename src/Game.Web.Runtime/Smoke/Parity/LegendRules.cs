using System.Text.Json;
using System.Xml.Linq;
using Game.Content.Loading;
using Game.Core.Abstractions;
using Game.Core.Affix;
using Game.Core.Battle;
using Game.Core.Definitions;
using Game.Core.Definitions.Skills;
using Game.Core.Model;
using Game.Core.Model.Character;
using Game.Core.Model.Skills;

internal static class LegendRules
{
    private sealed class Rolls(params double[] values) : IRandomService
    {
        public int Draws { get; private set; }
        public double NextDouble() => values[Math.Min(Draws++, values.Length - 1)];
        public int Next(int min, int max) => throw new InvalidOperationException("Legend selection must not use integer RNG.");
    }

    public static void Run(InMemoryContentRepository content, string repository, JsonElement policy)
    {
        var rules = policy.Deserialize<LegendSkillResolutionRules>(new JsonSerializerOptions { PropertyNameCaseInsensitive = true })!;
        var resolver = new LegendSkillResolver(rules);
        var checks = 0;
        void Check(bool valid, string message)
        {
            if (!valid) throw new InvalidOperationException("Legend rule: " + message);
            checks++;
        }
        var xml = XDocument.Load(Path.Combine(repository, "jyx-legacy-data/data-origin/aoyis.xml"));
        var rows = xml.Root!.Elements("aoyi").ToArray();
        Check(rows.Length == content.LegendSkills.Count, "all original variants retained");
        CharacterInstance Hero(int wuxing, bool broad, bool poor, string legend, bool gear)
        {
            var hero = CharacterMapper.CreateInitial("legend", content.GetCharacter("主角"), new EquipmentInstanceFactory());
            hero.UnlockedTalents.Clear(); hero.ExternalSkills.Clear(); hero.InternalSkills.Clear(); hero.EquippedItems.Clear();
            hero.BaseStats[StatType.Wuxing] = wuxing;
            if (broad) hero.UnlockedTalents.Add(content.GetTalent("博览群书"));
            if (poor) hero.UnlockedTalents.Add(content.GetTalent("屌丝"));
            hero.UnlockedTalents.Add(new TalentDefinition { Id = "fixture", Name = "fixture", Affixes = [
                new StatModifierAffix(StatType.Wuxing, ModifierValue.Add(150)),
                new LegendSkillChanceModifierAffix(legend, ModifierValue.Add(gear ? (double).15f : 0))] });
            hero.RebuildSnapshot(); return hero;
        }
        for (var i = 0; i < rows.Length; i++)
        {
            var row = rows[i]; var definition = content.LegendSkills[i];
            Check(definition.Name == (string)row.Attribute("name")! && definition.StartSkill == (string)row.Attribute("start")!, "XML variant order preserved");
            foreach (var wuxing in new[] { 0, 75, 150, 300 })
            foreach (var broad in new[] { false, true })
            foreach (var poor in new[] { false, true })
            foreach (var gear in new[] { false, true })
            {
                var hero = Hero(wuxing, broad, poor, definition.Name, gear);
                var skill = new ExternalSkillInstance(content.GetExternalSkill("野球拳") with { Id = definition.StartSkill, Name = definition.StartSkill }, hero, true) { Level = Math.Max(1, definition.RequiredLevel) };
                // Isolate probability from requirements, which are checked separately below.
                var candidate = definition with { Conditions = [] };
                var multiplier = 1d + wuxing / 150d * .2;
                if (broad) multiplier += .5;
                if (poor && skill.Name == "野球拳") multiplier += .1;
                if (gear) multiplier += (double).15f;
                var chance = (double)float.Parse((string)row.Attribute("probability")!, System.Globalization.CultureInfo.InvariantCulture) * multiplier;
                foreach (var roll in new[] { 0, Math.Max(0, Math.BitDecrement(chance)), chance, .99 })
                {
                    if (roll >= 1) continue;
                    var random = new Rolls(roll);
                    var actual = resolver.Resolve([candidate], skill, random);
                    Check((actual is LegendSkillInstance) == (chance >= 1 || chance >= 0 && roll < chance), "source float probability/base Wuxing/talent/named gear boundary: " + definition.Id);
                    Check(random.Draws == (chance < 0 || chance >= 1 ? 0 : 1), "source random consumption");
                }
            }
        }
        var fighter = Hero(0, false, false, "unused", false);
        var strike = new ExternalSkillInstance(content.GetExternalSkill("野球拳"), fighter, true) { Level = 10 };
        var first = new LegendSkillDefinition("first", "first", strike.Id, .5, [new RequiredTalentLegendConditionDefinition("not-owned")], []);
        var second = first with { Id = "second", Name = "second", Conditions = [] };
        var third = second with { Id = "third" };
        var sequence = new Rolls(.1, .8, .1, .42);
        Check(resolver.Resolve([first, second, third], strike, sequence).Id == "third" && sequence.Draws == 3, "unsatisfied requirements still consume an eligible probability draw");
        Check(sequence.NextDouble() == .42, "first successful candidate stops iteration");
        var defaults = new Rolls(.1, .8);
        Check(new LegendSkillResolver().Resolve([first, second], strike, defaults).Id == "second" && defaults.Draws == 1, "default packs retain conditions-before-roll");
        foreach (var condition in new LegendSkillConditionDefinition[] {
            new RequiredExternalSkillLevelLegendConditionDefinition("野球拳", 5),
            new RequiredInternalSkillLevelLegendConditionDefinition("基本内功", 5),
            new RequiredTalentLegendConditionDefinition("博览群书") })
        {
            var c = Hero(0, false, false, "unused", false);
            var s = new ExternalSkillInstance(content.GetExternalSkill("野球拳"), c, true) { Level = 10 };
            var candidate = first with { Probability = 1, Conditions = [condition] };
            Check(resolver.Resolve([candidate], s, new Rolls(0)) == s, "unmet source requirement rejected");
            c.ExternalSkills.Add(new ExternalSkillInstance(content.GetExternalSkill("野球拳"), c, true) { Level = 5 });
            c.InternalSkills.Add(new InternalSkillInstance(content.GetInternalSkill("基本内功"), c) { Level = 5 });
            c.UnlockedTalents.Add(content.GetTalent("博览群书")); c.RebuildSnapshot();
            Check(resolver.Resolve([candidate], s, new Rolls(0)) is LegendSkillInstance, "owned source skill/internal/talent accepted");
        }
        var zero = new Rolls(.3);
        Check(resolver.Resolve([second with { Probability = 0 }], strike, zero) == strike && zero.Draws == 1, "probability zero consumes a failed draw");
        var low = new Rolls(.1);
        Check(resolver.Resolve([second with { RequiredLevel = 11 }], strike, low) == strike && low.Draws == 0, "level gate precedes probability");
        fighter.SpecialSkills.Add(new SpecialSkillInstance(content.GetSpecialSkill("闪电貂"), fighter, true));
        var special = second with { Probability = 1, Conditions = [new RequiredSpecialSkillLegendConditionDefinition("闪电貂")] };
        Check(resolver.Resolve([special], strike, new Rolls(0)) == strike, "original AoyiLogic lacks the specialskill branch even when owned");
        Check(new LegendSkillResolver().Resolve([special], strike, new Rolls(0)) is LegendSkillInstance, "other packs retain supported special-skill conditions");
        fighter.UnlockedTalents.Add(new TalentDefinition { Id = "stable-gear", Name = "stable-gear", Affixes = [
            new LegendSkillChanceModifierAffix(second.Id, ModifierValue.Add(.5))] });
        fighter.RebuildSnapshot();
        Check(resolver.Resolve([second], strike, new Rolls(.7)) is LegendSkillInstance, "stable-ID chance bonuses in existing generated equipment continue to work");
        foreach (var poor in new[] { false, true })
        {
            var actor = Hero(0, false, poor, "unused", false);
            actor.UnlockedTalents.Add(content.GetTalent("草头百姓"));
            actor.BaseStats[StatType.MaxHp] = 200000; actor.BaseStats[StatType.MaxMp] = 20000;
            var wild = new ExternalSkillInstance(content.GetExternalSkill("野球拳"), actor, true) { Level = 10 };
            actor.ExternalSkills.Add(wild); actor.RebuildSnapshot();
            var source = new BattleUnit("source", actor, 1, new GridPosition(0, 0), rage: 6);
            var victim = new BattleUnit("victim", Hero(0, false, false, "unused", false), 2, new GridPosition(1, 0));
            var state = new BattleState(new BattleGrid(3, 2), [source, victim]);
            var engine = new BattleEngine(random: new Rolls(.42), legendSkillResolver: resolver,
                legendSkillsProvider: content.GetLegendSkillsFor, buffResolver: content.GetBuff,
                damageCalculator: new BattleDamageCalculator(new Rolls(.5)));
            source.SetActionGauge(100);
            Check(engine.BeginAction(state, source.Id).Success, "begin real source-content cast");
            var result = engine.CastSkill(state, source.Id, wild, victim.Position);
            Check(result.Success, "real source-content wild fist cast succeeds");
            var cast = result.Messages.OfType<BattleFact>().Single(f => f.Kind == BattleFactKind.SkillCast).SkillCast!;
            Check(cast.IsLegend == poor, "actual cast uses original chance: .4f vs .4f*1.1 at .42 despite added panel Wuxing");
        }
        Console.WriteLine($"PASS {checks} selected legend trigger checks across {rows.Length} original records; isolated formulas, not complete campaign or legacy-engine differential parity.");
    }
}
