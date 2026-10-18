using System.Text.Json;
using Game.Application;
using Game.Core.Abstractions;
using Game.Core.Affix;
using Game.Core.Definitions;
using Game.Core.Model;
using Game.Core.Serialization;

namespace Game.Tests;

public sealed class EquipmentComparisonTests
{
    private sealed class NoRandom : IRandomService
    {
        public double NextDouble() => throw new InvalidOperationException("Preview consumed randomness.");
        public int Next(int minInclusive, int maxExclusive) => throw new InvalidOperationException("Preview consumed randomness.");
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task Comparison_MatchesRealReplacement_WithoutMovingItemsOrConsumingIdentity(bool affixed)
    {
        var old = TestContentFactory.CreateEquipment("old") with { Affixes = [new StatModifierAffix(StatType.Bili, ModifierValue.Add(2))] };
        var next = TestContentFactory.CreateEquipment("next") with { Affixes = [new StatModifierAffix(StatType.Bili, ModifierValue.Add(7)), new FinalStatMultiplierAffix(StatType.Bili, 1.2)] };
        var armor = TestContentFactory.CreateEquipment("a_guard",EquipmentSlotType.Armor) with {Affixes=[new FinalStatMultiplierAffix(StatType.Bili,1.1)]};
        var definition = TestContentFactory.CreateCharacterDefinition(Party.HeroCharacterId, new Dictionary<StatType,int>{{StatType.Bili,20},{StatType.MaxHp,500},{StatType.Gengu,10}});
        var repository = TestContentFactory.CreateRepository(characters:[definition], equipment:[old,next,armor]);
        var state = new GameState();
        var hero = TestContentFactory.CreateCharacterInstance(Party.HeroCharacterId, definition, state.EquipmentInstanceFactory);
        state.Party.AddMember(hero);
        var session = new GameSession(state, repository, randomService:new NoRandom());
        state.Inventory.AddItem(armor);session.InventoryService.EquipFromStack(hero,armor);
        state.Inventory.AddItem(old);session.InventoryService.EquipFromStack(hero,old);
        if (affixed) state.Inventory.AddEquipmentInstance(state.EquipmentInstanceFactory.Create(next,[new StatModifierAffix(StatType.Gengu, ModifierValue.Add(3))]));
        else state.Inventory.AddItem(next);
        var entry = state.Inventory.Entries.Single(e=>e.Definition.Id==next.Id);
        var before = JsonSerializer.Serialize(session.SaveGameService.CreateSave(), GameJson.Default);
        var events=0;
        using var subscription=session.Events.Subscribe<InventoryChangedEvent>(_=>events++);
        var preview=session.EquipmentComparisonService.Compare(hero.Id,entry.EntryNumber);
        Assert.True(preview.CanEquip);
        Assert.Equal(old.Id,preview.ReplacedItemId);
        Assert.Equal(before,JsonSerializer.Serialize(session.SaveGameService.CreateSave(),GameJson.Default));
        Assert.Equal(0,events);
        Assert.Equal(JsonSerializer.Serialize(preview,GameJson.Default),JsonSerializer.Serialize(session.EquipmentComparisonService.Compare(hero.Id,entry.EntryNumber),GameJson.Default));
        var result=await session.ItemUseService.UseAsync(entry,hero.Id);
        Assert.True(result.Success);
        foreach(var stat in preview.Attributes)Assert.Equal(stat.After,hero.GetStat(stat.Stat),8);
        Assert.Equal(affixed?13:10,hero.GetStat(StatType.Gengu));
        Assert.Single(state.Inventory.Entries,e=>e.Definition.Id==old.Id);
    }

    [Fact]
    public void Comparison_TracksGainedAndLostTalents_AndReadsReplacementSessionState()
    {
        var lost=new TalentDefinition{Id="lost",Name="Lost"};var gained=new TalentDefinition{Id="gained",Name="Gained"};
        var old=TestContentFactory.CreateEquipment("old") with {Affixes=[new GrantTalentAffix(lost.Id)]};
        var next=TestContentFactory.CreateEquipment("next") with {Affixes=[new GrantTalentAffix(gained.Id)]};
        var definition=TestContentFactory.CreateCharacterDefinition(Party.HeroCharacterId,new Dictionary<StatType,int>{{StatType.Bili,20}});
        var repository=TestContentFactory.CreateRepository(characters:[definition],equipment:[old,next],talents:[lost,gained]);
        foreach(var affix in old.Affixes.Concat(next.Affixes))affix.Resolve(repository);
        GameState MakeState(int power)
        {
            var state=new GameState();var hero=TestContentFactory.CreateCharacterInstance(Party.HeroCharacterId,definition,state.EquipmentInstanceFactory);
            hero.BaseStats[StatType.Bili]=power;hero.AddEquipmentInstance(state.EquipmentInstanceFactory.Create(old));hero.RebuildSnapshot();
            state.Party.AddMember(hero);state.Inventory.AddItem(next);return state;
        }
        var first=MakeState(20);var session=new GameSession(first,repository,randomService:new NoRandom());
        var service=session.EquipmentComparisonService;
        var comparison=service.Compare(Party.HeroCharacterId,first.Inventory.Entries.Single().EntryNumber);
        Assert.Equal([gained.Id],comparison.AddedTalentIds);Assert.Equal([lost.Id],comparison.RemovedTalentIds);
        var replacement=MakeState(75);session.ReplaceState(replacement);
        var after=service.Compare(Party.HeroCharacterId,replacement.Inventory.Entries.Single().EntryNumber);
        Assert.Equal(75,after.Attributes.Single(a=>a.Stat==StatType.Bili).Before);
        Assert.Same(service,session.EquipmentComparisonService);
        Assert.Throws<InvalidOperationException>(()=>service.Compare(Party.HeroCharacterId,long.MaxValue));
    }

    [Theory]
    [InlineData(ItemRequirementStatSource.Base,false)]
    [InlineData(ItemRequirementStatSource.Final,true)]
    public async Task Requirements_ShowAllGates_UsingTheSamePolicyAsActualUse(ItemRequirementStatSource source,bool statMet)
    {
        var definition=TestContentFactory.CreateCharacterDefinition(Party.HeroCharacterId,new Dictionary<StatType,int>{{StatType.Bili,20}},gender:CharacterGender.Female);
        var boost=TestContentFactory.CreateEquipment("boost") with {Affixes=[new StatModifierAffix(StatType.Bili,ModifierValue.Add(100))]};
        var item=TestContentFactory.CreateEquipment("gated") with {Requirements=[new StatItemRequirementDefinition(StatType.Bili,50),new TalentItemRequirementDefinition("scholar"),new GenderItemRequirementDefinition([CharacterGender.Male])]};
        var repository=TestContentFactory.CreateRepository(characters:[definition],equipment:[boost,item],talents:[new TalentDefinition{Id="scholar",Name="学识"}]);
        var state=new GameState();var hero=TestContentFactory.CreateCharacterInstance(Party.HeroCharacterId,definition,state.EquipmentInstanceFactory);
        state.Party.AddMember(hero);hero.AddEquipmentInstance(state.EquipmentInstanceFactory.Create(boost));hero.RebuildSnapshot();state.Inventory.AddItem(item);
        var session=new GameSession(state,repository,config:new GameConfig{ItemRequirementStatSource=source});
        var requirements=session.ItemUseService.DescribeRequirements(item,hero);
        Assert.Equal(3,requirements.Count);Assert.Equal(statMet,requirements[0].Met);
        Assert.False(requirements[1].Met);Assert.Equal("学识",requirements[1].Required);Assert.False(requirements[2].Met);
        var entry=state.Inventory.Entries.Single();var comparison=session.EquipmentComparisonService.Compare(hero.Id,entry.EntryNumber);
        Assert.False(comparison.CanEquip);
        Assert.Equal(requirements.First(r=>!r.Met).FailureReason,comparison.Reason);
        var result=await session.ItemUseService.UseAsync(entry,hero.Id);
        Assert.False(result.Success);Assert.Equal(comparison.Reason,result.Message);Assert.Same(entry,state.Inventory.Entries.Single());
    }
}
