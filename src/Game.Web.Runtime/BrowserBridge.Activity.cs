using System.Text.Json;
using Game.Application;
using Game.Core.Model;

namespace Game.Web.Runtime;

internal sealed record ActivityEntry(long Id, string Kind, string Message, bool Notice, string Time, string? MapId);
internal sealed record ActivityRecord(string JourneyId, long NextId, ActivityEntry[] Entries);

internal sealed partial class BrowserRuntimeSession
{
    private string _journeyId = Guid.NewGuid().ToString("N");
    private long _activityId;
    private readonly List<ActivityEntry> _activity = [];
    private IDisposable? _activitySubscription;

    private void AddActivity(string kind, string message, bool notice = false)
    {
        if(string.IsNullOrWhiteSpace(message))return;
        _activity.Add(new(++_activityId,kind,message,notice,DateTimeOffset.UtcNow.ToString("O"),_session?.State.Location.CurrentMapId));
        if(_activity.Count>300)_activity.RemoveAt(0);
    }

    private void BindActivity()
    {
        _activitySubscription?.Dispose();
        var session=RequireSession();
        Dictionary<string,(string Name,string Placement)> PartyPositions()=>session.State.Party.GetAllCharacters().Where(c=>c.Id!=Party.HeroCharacterId).ToDictionary(c=>c.Id,c=>(c.Name,session.State.Party.ContainsMember(c.Id)?"参战":session.State.Party.ContainsFollower(c.Id)?"随行":"后备"));
        var party=PartyPositions();
        _activitySubscription=session.Events.SubscribeAll(change=>{
            if(!ReferenceEquals(_session,session))return;
            switch(change)
            {
                case ItemAcquiredEvent item: AddActivity("item",$"获得「{item.ItemName}」×{item.Quantity}",true);break;
                case ToastRequestedEvent toast: AddActivity("notice",toast.Message,true);break;
                case CharacterLeveledUpEvent level:
                    var name=session.State.Party.TryGetCharacter(level.CharacterId,out var c)?c.Name:level.CharacterId;
                    AddActivity("growth",$"{name}从{level.OldLevel}级升至{level.NewLevel}级。",true);break;
                case AchievementUnlockedEvent achievement: AddActivity("growth",$"解锁称号：{achievement.AchievementId}",true);break;
                case PartyChangedEvent:
                    var next=PartyPositions();
                    foreach(var (id,position) in next)
                        if(!party.TryGetValue(id,out var before))AddActivity("party",$"{position.Name}加入队伍（{position.Placement}）。",true);
                        else if(position.Placement!=before.Placement)AddActivity("party",$"{position.Name}：{before.Placement} → {position.Placement}。",true);
                    foreach(var (id,position) in party)if(!next.ContainsKey(id))AddActivity("party",$"{position.Name}离开队伍。",true);
                    party=next;break;
                case SaveLoadedEvent: party=PartyPositions();break;
            }
        });
    }

    private ActivityRecord ActivitySave()=>new(_journeyId,_activityId,_activity.ToArray());
    private string OperationDetail(JsonElement args)
    {
        var labels=new Dictionary<string,string>{{"characterId","人物"},{"entryNumber","物品编号"},{"skillId","武功"},{"locationId","地点"},{"quantity","数量"},{"placement","编排"},{"slot","位置"},{"stat","属性"},{"index","选项"},{"mapId","地图"},{"name","姓名"}};
        var details=string.Join("，",args.EnumerateObject().Where(p=>p.Name!="type").Select(p=>$"{labels.GetValueOrDefault(p.Name,p.Name)} {p.Value}"));
        return details.Length==0?"":"："+details;
    }
    private ActivityRecord? ReadActivity(JsonElement root)
    {
        if(!root.TryGetProperty("activity",out var node)||node.ValueKind==JsonValueKind.Null)return null;
        var record=node.Deserialize<ActivityRecord>(Json)??throw new InvalidOperationException("操作记录无效。");
        if(!Guid.TryParseExact(record.JourneyId,"N",out _)||record.NextId<0||record.Entries is null||record.Entries.Length>300)
            throw new InvalidOperationException("操作记录版本或数量无效。");
        long previous=0;
        foreach(var entry in record.Entries)
        {
            if(entry.Id<=previous||entry.Id>record.NextId||entry.Kind is not ("item" or "notice" or "growth" or "party" or "operation" or "story" or "battle" or "dialogue")||string.IsNullOrWhiteSpace(entry.Message)||entry.Message.Length>16000||!DateTimeOffset.TryParse(entry.Time,out _))
                throw new InvalidOperationException("操作记录条目无效。");
            previous=entry.Id;
        }
        return record;
    }

    private void RestoreActivity(ActivityRecord? record)
    {
        _journeyId=record?.JourneyId??Guid.NewGuid().ToString("N");_activityId=record?.NextId??0;
        _activity.Clear();if(record is not null)_activity.AddRange(record.Entries);
    }
}
