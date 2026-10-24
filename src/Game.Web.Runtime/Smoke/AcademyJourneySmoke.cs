using System.Security.Cryptography;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.RegularExpressions;
using Game.Web.Runtime;

// Ordinary creation, interaction and battle commands only. No edited saves,
// direct story launch, date changes or forced battle/recruitment outcomes.
internal static class AcademyJourneySmoke
{
    public static async Task Run(string contentPath,string output)
    {
        Directory.CreateDirectory(output);
        JsonNode s=null!;
        var events=new List<object>();var battles=new List<object>();var snapshots=new List<object>();
        var commands=0;var practiceWon=false;var inAcademy=false;var sessions=0;
        void Read(string raw)
        {
            var r=JsonNode.Parse(raw)!;
            if(r["ok"]?.GetValue<bool>()!=true)throw new InvalidOperationException(r["error"]?.ToString()??raw);
            s=r["state"]!;
        }
        async Task Cmd(object c){Read(await BrowserBridge.Dispatch(JsonSerializer.Serialize(c)));commands++;}
        string Phase()=>s["phase"]!.ToString();
        string Map()=>s["map"]!["id"]!.ToString();
        JsonNode Save()=>JsonNode.Parse(BrowserBridge.ExportSave())!;
        bool Graduated()=>s["chapterJournal"]!["completedStories"]!.AsArray().Any(n=>n!.ToString()=="门派大轮寺_大轮寺出师");
        void Snapshot(string name)
        {
            var raw=BrowserBridge.ExportSave();if(JsonNode.Parse(raw)?["error"] is not null)throw new InvalidOperationException("Unstable checkpoint "+name);
            File.WriteAllText(Path.Combine(output,name+".json"),raw);
            snapshots.Add(new{name,sha256=Convert.ToHexStringLower(SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(raw)))});
        }
        async Task Resolve()
        {
            for(var n=0;n<2000;n++)
            {
                switch(Phase())
                {
                    case "dialogue":
                        if(inAcademy&&Regex.IsMatch(s["dialogue"]!["text"]!.ToString(),"[\\u3400-\\u9fff]"))throw new InvalidOperationException("Untranslated academy dialogue "+s["dialogue"]);
                        await Cmd(new{type="next"});break;
                    case "choice":
                        await Cmd(new{type="choose",index=s["dialogue"]?["speaker"]?.ToString()=="武师"&&practiceWon?1:0});break;
                    case "battle":
                        var id=s["battle"]!["id"]!.ToString();
                        for(var turn=0;turn<1800&&s["battle"]!["outcome"]!.ToString()=="ongoing";turn++)await Cmd(new{type="autoTurn"});
                        var outcome=s["battle"]!["outcome"]!.ToString();
                        if(outcome=="ongoing")throw new InvalidOperationException("Unsettled battle "+id);
                        battles.Add(new{id,outcome});Console.WriteLine("BATTLE "+id+" "+outcome);
                        if(id=="南贤居_木头人_战斗"&&outcome=="win")practiceWon=true;
                        if(id!="南贤居_木头人_战斗"&&id!="大轮寺大理高手_战斗"&&outcome!="win")throw new InvalidOperationException("Tutorial battle lost: "+id);
                        await Cmd(new{type="leaveBattle"});break;
                    default:return;
                }
            }
            throw new InvalidOperationException("Interaction did not settle");
        }
        async Task Visit(string id)
        {
            if(Phase()!="world"||!s["map"]!["locations"]!.AsArray().Any(p=>p!["id"]!.ToString()==id&&p["action"] is not null))throw new InvalidOperationException("Unavailable map action "+Map()+" / "+id);
            events.Add(new{map=Map(),location=id,day=s["adventure"]!["days"]!.GetValue<int>()});
            await Cmd(new{type="interact",locationId=id});await Resolve();
        }
        async Task World()
        {
            for(var n=0;n<8&&Map()!="大地图";n++)await Visit(s["map"]!["locations"]!.AsArray().Any(p=>p!["id"]!.ToString()=="返回"&&p["action"] is not null)?"返回":"出村");
            if(Map()!="大地图")throw new InvalidOperationException("Could not leave to world");
        }
        async Task Travel(string id){await World();await Visit(id);}
        async Task Manage()
        {
            foreach(var slot in new[]{"Weapon","Armor","Accessory"})
            {
                if(s["hero"]!["equipment"]!.AsArray().Any(e=>e!["slot"]!.ToString()==slot&&e["item"] is not null))continue;
                var item=s["inventory"]!.AsArray().FirstOrDefault(i=>i!["slot"]?.ToString()==slot&&i["canEquip"]!.GetValue<bool>());
                if(item is not null)await Cmd(new{type="equipItem",entryNumber=item["entryNumber"]!.GetValue<long>()});
            }
            if(s["hero"]!["cultivation"] is null)
            {
                var book=s["inventory"]!.AsArray().FirstOrDefault(i=>i!["id"]!.ToString()=="内功入门"&&i["canCultivate"]!.GetValue<bool>());
                if(book is not null)await Cmd(new{type="setCultivation",entryNumber=book["entryNumber"]!.GetValue<long>()});
            }
            await Cmd(new{type="equipInternalSkill",skillId="基本内功"});
        }
        try
        {
            Read(BrowserBridge.Initialize(File.ReadAllText(contentPath)));
            await Cmd(new{type="beginCreation",name="Wren",difficulty="normal"});
            var answers=new[]{3,3,0,0,0,0,0};
            for(var q=0;q<answers.Length;q++)await Cmd(new{type="answerCreation",questionIndex=q,index=answers[q]});
            await Cmd(new{type="selectCreationPortrait",portraitId="头像.主角"});await Cmd(new{type="confirmCreation"});await Resolve();Snapshot("new-traveler");
            await Visit("南贤");await Manage();Snapshot("ready-for-practice");
            var elixir=s["inventory"]!.AsArray().SingleOrDefault(i=>i!["id"]!.ToString()=="新手礼包-大蟠桃");
            for(var n=0;n<(elixir?["count"]?.GetValue<int>()??0);n++)await Cmd(new{type="useItem",entryNumber=elixir!["entryNumber"]!.GetValue<long>()});
            for(var n=0;n<12&&!practiceWon;n++)await Visit("武师");
            if(!practiceWon)throw new InvalidOperationException("First practice never won");
            await Visit("南贤居");await Visit("南贤");
            await Travel("洛阳");await Visit("商店");await Visit("商店");
            var product=s["shop"]!["products"]!.AsArray().First(p=>p!["itemId"]!.ToString()=="小还丹")!;
            await Cmd(new{type="buy",productId=product["id"]!.ToString(),quantity=1});await Cmd(new{type="closeShop"});
            await Travel("南贤居");await Visit("南贤");
            if(Phase()=="world"&&s["tutorial"] is not null)await Visit("南贤");
            await Travel("洛阳");await Visit("小孩");await Travel("南贤居");Snapshot("before-school-choice");await Visit("南贤");
            if(Phase()=="world"&&s["tutorial"] is not null)await Visit("南贤");
            if(Phase()!="sect")throw new InvalidOperationException("Full tutorial did not reach school picker");
            File.WriteAllText(Path.Combine(output,"school-choice-state.json"),s.ToJsonString());
            inAcademy=true;await Cmd(new{type="selectSect",sectId="大轮寺"});await Resolve();await Manage();Snapshot("joined");
            if(Map()!="门派大轮寺"||s["adventure"]!["sect"]!.ToString()!="大轮寺")throw new InvalidOperationException("Did not really join");
            // Try the real exit early. It must remain blocked, not turn into a UI teleport.
            await Visit("大轮寺雪山");await Visit("返回");if(Map()!="大轮寺雪山"||Graduated())throw new InvalidOperationException("Early departure gate bypassed");await Visit("大轮寺");
            var activities=new[]{"修炼密宗大手印","修炼无上大力杵","修炼漫天花雨"};
            for(var n=0;n<80&&!Graduated();n++)
            {
                if(s["adventure"]!["days"]!.GetValue<int>()==60)Snapshot("near-graduation");
                await Visit(activities[n%3]);sessions++;
                if(n==2)Snapshot("learning");
            }
            if(!Graduated()||!s["party"]!.AsArray().Any(c=>c!["definitionId"]!.ToString()=="达尔巴"))throw new InvalidOperationException("No actual graduation companion");
            if(s["adventure"]!["days"]!.GetValue<int>()<=60)throw new InvalidOperationException("Graduated before original day gate");
            Snapshot("graduated");
            await Visit("大轮寺雪山");Snapshot("exit-open");await Visit("返回");
            if(Map()!="大地图"||s["adventure"]!["sect"]!.ToString()!="大轮寺")throw new InvalidOperationException("Departure lost affiliation");
            Snapshot("departed");var before=Save()["game"]!.ToJsonString();Read(BrowserBridge.ImportSave(BrowserBridge.ExportSave()));
            if(Save()["game"]!.ToJsonString()!=before)throw new InvalidOperationException("School departure did not persist");
            File.WriteAllText(Path.Combine(output,"report.json"),JsonSerializer.Serialize(new{passed=true,commands,sessions,battles,events,snapshots,finalMap=Map(),days=s["adventure"]!["days"],method="New normal character; full tutorial, original organization entry/training/duel/graduation/departure; real intact checkpoints, no save editing or forced outcomes"},new JsonSerializerOptions{WriteIndented=true}));
            Console.WriteLine($"PASS full tutorial → Grail Lodge → {sessions} training sessions → graduation companion → world → save/load");
        }
        catch(Exception e)
        {
            File.WriteAllText(Path.Combine(output,"failure-state.json"),s?.ToJsonString()??"null");File.WriteAllText(Path.Combine(output,"failure.json"),JsonSerializer.Serialize(new{error=e.ToString(),commands,events,battles}));throw;
        }
    }
}
