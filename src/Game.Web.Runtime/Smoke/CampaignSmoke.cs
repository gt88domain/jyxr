using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.RegularExpressions;
using Game.Web.Runtime;

// Normal progression only: no edited saves, direct story/map commands or forced outcomes.
internal static class CampaignSmoke
{
    public static async Task Run(string contentPath,string directory,string stage)
    {
        Directory.CreateDirectory(directory);
var args=new[]{stage};
var events=new List<object>();var battles=0;var wins=0;JsonNode? last=null;
JsonNode Parse(string json){var r=JsonNode.Parse(json)!;if(!r["ok"]!.GetValue<bool>())throw new InvalidOperationException(r["error"]!.GetValue<string>());return last=r["state"]!;}
async Task<JsonNode> Cmd(object c)=>Parse(await BrowserBridge.Dispatch(JsonSerializer.Serialize(c)));
string Phase(JsonNode s)=>s["phase"]!.GetValue<string>();
async Task<JsonNode> Resolve()
{
    var s=await Cmd(new{type="state"});
    for(var i=0;i<2000;i++)
    {
        switch(Phase(s))
        {
            case "dialogue":s=await Cmd(new{type="next"});break;
            case "choice":
                var choices=s["choices"]!.AsArray();
                var chosen=choices.FirstOrDefault(c=>c!["text"]!.GetValue<string>().Contains("【结束新手村】"))
                    ??choices.FirstOrDefault(c=>battles>0&&s["dialogue"]?["speaker"]?.GetValue<string>()=="武师"&&c!["text"]!.GetValue<string>().Contains("【离开】"))
                    ??choices.FirstOrDefault(c=>c!["text"]!.GetValue<string>().Contains("不加入黑衣"))
                    ??choices.FirstOrDefault(c=>c!["text"]!.GetValue<string>()=="留他狗命")
                    ??choices.FirstOrDefault(c=>c!["text"]!.GetValue<string>()=="不接")??choices[0];
                s=await Cmd(new{type="choose",index=chosen!["index"]!.GetValue<int>()});break;
            case "rename":s=await Cmd(new{type="renameHeroine",name="同路人"});break;
            case "shop":s=await Cmd(new{type="closeShop"});break;
            case "battle":
                var name=s["battle"]!["id"]!.GetValue<string>();
                for(var turn=0;turn<2000&&s["battle"]!["outcome"]!.GetValue<string>()=="ongoing";turn++)s=await Cmd(new{type="autoTurn"});
                var outcome=s["battle"]!["outcome"]!.GetValue<string>();
                if(outcome=="ongoing")throw new InvalidOperationException("Battle did not settle: "+name);
                battles++;if(outcome=="win")wins++;
                events.Add(new{battle=name,outcome});Console.WriteLine($"BATTLE {battles}: {name} {outcome}");
                s=await Cmd(new{type="leaveBattle"});break;
            default:return s;
        }
    }
    throw new InvalidOperationException("Unfinished interaction loop");
}
async Task<bool> Step(string id)
{
    var s=await Resolve();if(Phase(s)!="world")throw new InvalidOperationException("Not on map: "+Phase(s));
    var loc=s["map"]!["locations"]!.AsArray().FirstOrDefault(l=>l!["id"]!.GetValue<string>()==id);
    if(loc?["action"] is null)return false;
    await Cmd(new{type="interact",locationId=id});await Resolve();return true;
}
async Task World()
{
    for(var i=0;i<8;i++)
    {
        var s=await Resolve();if(s["map"]!["id"]!.GetValue<string>()=="大地图")return;
        if(!await Step("返回")&&!await Step("出村"))throw new InvalidOperationException("No real map exit from "+s["map"]!["id"]);
    }
    throw new InvalidOperationException("World exit loop");
}
async Task Travel(string id){await World();if(!await Step(id))throw new InvalidOperationException("No world destination: "+id);}
async Task TryChanceDestination(string id)
{
    await World();
    for(var n=0;n<30;n++)
    {
        if(await Step(id))return;
        await Travel("昆仑山");await World();
    }
    throw new InvalidOperationException("Repeated unavailable source chance event: "+id);
}
async Task Navigate(string target)
{
    var maps=JsonNode.Parse(File.ReadAllText(contentPath))!["maps"]!.AsArray();
    for(var iteration=0;iteration<60;iteration++)
    {
        var s=await Resolve();var current=s["map"]!["id"]!.GetValue<string>();if(current==target)return;
        var queue=new Queue<(string map,List<string> steps)>();var seen=new HashSet<string>{current};queue.Enqueue((current,[]));List<string>? path=null;
        while(queue.TryDequeue(out var entry))
        {
            if(entry.map==target){path=entry.steps;break;}
            var m=maps.Single(n=>n!["id"]!.GetValue<string>()==entry.map)!;
            foreach(var l in m["locations"]!.AsArray())foreach(var e in l!["events"]!.AsArray())
            {
                var match=Regex.Match(e!["action"]!.GetValue<string>(),"^map\\('([^']+)'\\)$");
                if(match.Success&&seen.Add(match.Groups[1].Value))queue.Enqueue((match.Groups[1].Value,[..entry.steps,l["id"]!.GetValue<string>()]));
            }
        }
        if(path is null||path.Count==0)throw new InvalidOperationException($"No map path {current} -> {target}");
        Console.WriteLine($"WALK {current}: {path[0]} -> {target}");
        if(!await Step(path[0]))throw new InvalidOperationException("Map path currently blocked: "+path[0]);
    }
    throw new InvalidOperationException("Map navigation did not finish: "+target);
}
async Task Manage()
{
    var s=await Resolve();if(Phase(s)!="world")return;
    foreach(var slot in new[]{"Weapon","Armor","Accessory"})
    {
        if(s["hero"]!["equipment"]!.AsArray().Single(e=>e!["slot"]!.GetValue<string>()==slot)!["item"] is not null)continue;
        var entry=s["inventory"]!.AsArray().FirstOrDefault(i=>i!["canEquip"]!.GetValue<bool>()&&i["slot"]?.GetValue<string>()==slot);
        if(entry is not null)s=await Cmd(new{type="equipItem",entryNumber=entry["entryNumber"]!.GetValue<long>()});
    }
    var points=s["managedCharacter"]!["unspentStatPoints"]!.GetValue<int>();
    if(points>0)s=await Cmd(new{type="allocateStat",stat="bili",points});
    var book=s["inventory"]!.AsArray().FirstOrDefault(i=>i!["id"]!.GetValue<string>()=="罗汉拳谱"&&i["canCultivate"]!.GetValue<bool>());
    if(book is not null)s=await Cmd(new{type="setCultivation",entryNumber=book["entryNumber"]!.GetValue<long>()});
}
try
{
    Parse(BrowserBridge.Initialize(File.ReadAllText(contentPath)));
    if(args.Contains("--resume")||args.Contains("--midgame")||args.Contains("--chapter2"))
    {
        Parse(BrowserBridge.ImportSave(File.ReadAllText(directory+"/normal-save.json")));
        var previous=JsonNode.Parse(File.ReadAllText(directory+"/normal-report.json"))!;
        battles=previous["battles"]!.GetValue<int>();wins=previous["wins"]!.GetValue<int>();
        foreach(var e in previous["events"]!.AsArray())events.Add(e!.DeepClone());
        if(args.Contains("--chapter2"))
        {
            await Navigate("华山后山");await Step("令狐冲");await Manage();
            await Travel("风陵渡口");await Step("袁承志");await Manage();
            Console.WriteLine("PARTY "+string.Join(',',(await Resolve())["party"]!.AsArray().Select(c=>c!["name"]!.GetValue<string>())));
        }
        else if(args.Contains("--midgame"))
        {
            await TryChanceDestination("阎基居");await Manage();
            await Travel("苗人凤居");await Step("苗人凤");await Manage();
            await Navigate("药王庄");await Step("程灵素");await Manage();
            await TryChanceDestination("阎基居");await Manage();
            Console.WriteLine("PARTY "+string.Join(',',(await Resolve())["party"]!.AsArray().Select(c=>c!["name"]!.GetValue<string>())));
        }
        else foreach(var destination in new[]{"田伯光居","胡斐居","帐篷"})
        {
            if(destination=="帐篷")
            {
                await World();
                for(var n=0;n<12&&(await Resolve())["map"]!["locations"]!.AsArray().Single(l=>l!["id"]!.GetValue<string>()==destination)!["action"] is null;n++)
                {await Travel("昆仑山");await World();}
            }
            await Travel(destination);
            for(var i=0;i<3;i++)
            {
                var s=await Resolve();
                var action=s["map"]!["locations"]!.AsArray().FirstOrDefault(l=>l!["action"] is not null&&l["id"]!.GetValue<string>()!="返回");
                if(action is null||s["map"]!["id"]!.GetValue<string>()=="大地图")break;
                Console.WriteLine($"VISIT {destination}: {action["id"]}");
                await Step(action["id"]!.GetValue<string>());await Manage();
            }
            Console.WriteLine("PARTY "+string.Join(',',(await Resolve())["party"]!.AsArray().Select(c=>c!["name"]!.GetValue<string>())));
        }
        for(var i=0;i<(args.Contains("--chapter2")?100:24);i++)
        {
            await Travel("同福客栈");await Step("邢捕头");await Manage();
            await Travel("南贤居");await Step("南贤");await Manage();
            var s=await Resolve();Console.WriteLine($"PROGRESS {i}: day={s["adventure"]!["days"]} level={s["hero"]!["level"]} party={s["party"]!.AsArray().Count}");
        }
    }
    else
    {
    await Cmd(new{type="beginCreation",name="正常路线校验侠",difficulty="normal"});
    for(var i=0;i<7;i++)await Cmd(new{type="answerCreation",questionIndex=i,index=0});
    await Cmd(new{type="selectCreationPortrait",portraitId="头像.主角"});await Cmd(new{type="confirmCreation"});await Resolve();
    if(!await Step("南贤"))throw new InvalidOperationException("Opening Naxian unavailable");
    await Manage();await Step("武师");await Step("南贤居");await Step("南贤");
    await Travel("洛阳");await Step("商店");await Travel("南贤居");await Step("南贤");
    await Travel("洛阳");await Step("小孩");await Travel("南贤居");await Step("南贤");
    var menu=await Resolve();if(Phase(menu)!="sect")throw new InvalidOperationException("Full actual tutorial did not reach sect selection: "+Phase(menu));
    await Cmd(new{type="selectSect",sectId="无门派"});await Resolve();
    await Travel("万劫谷");await Step("钟灵");await Manage();
    await Travel("同福客栈");await Step("佟湘玉");await Step("邢捕头");await Manage();
    await Travel("南贤居");
    for(var i=0;i<20;i++){await Step("结伴练习");await Manage();}
    for(var i=0;i<24;i++)
    {
        await Travel("同福客栈");await Step("邢捕头");await Manage();
        await Travel("昆仑山");
        var s=await Resolve();Console.WriteLine($"TRAVEL {i}: day={s["adventure"]!["days"]} level={s["hero"]!["level"]} silver={s["silver"]}");
    }
    }
    await World();var save=BrowserBridge.ExportSave();var saved=JsonNode.Parse(save)!;
    if(saved["error"] is not null)throw new InvalidOperationException(saved["error"]!.ToString());
    File.WriteAllText(directory+"/normal-save.json",save);
    var mainline=saved["game"]!["storyState"]!["completedStoryIds"]!.AsArray().Select(n=>n!.GetValue<string>()).Where(id=>id.StartsWith("mainStory_")).ToArray();
    File.WriteAllText(directory+"/normal-report.json",JsonSerializer.Serialize(new{battles,wins,mainline,events},new JsonSerializerOptions{WriteIndented=true}));
    Console.WriteLine($"DONE legitimate creation/tutorial/recruitment/training/travel: battles={battles}, wins={wins}, mainline={string.Join(',',mainline)}");
}
catch(Exception e)
{
    File.WriteAllText(directory+"/failure.json",JsonSerializer.Serialize(new{error=e.Message,state=last,events},new JsonSerializerOptions{WriteIndented=true}));
    throw;
}

    }
}
