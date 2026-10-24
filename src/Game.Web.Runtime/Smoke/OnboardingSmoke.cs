using System.Text.Json;
using System.Text.Json.Nodes;
using Game.Web.Runtime;

internal static class OnboardingSmoke
{
    public static async Task Run(string contentPath, string originalPath, string previousSave, string output)
    {
        Directory.CreateDirectory(output);
        JsonNode last = null!;
        void Read(string raw)
        {
            var result=JsonNode.Parse(raw)!;
            if(result["ok"]?.GetValue<bool>()!=true)throw new InvalidOperationException(result["error"]?.ToString()??raw);
            last=result["state"]!;
        }
        async Task Cmd(object command)=>Read(await BrowserBridge.Dispatch(JsonSerializer.Serialize(command)));
        async Task Finish()
        {
            for(var n=0;n<100 && last["phase"]!.ToString()=="dialogue";n++)await Cmd(new{type="next"});
            if(last["phase"]!.ToString()!="world")throw new InvalidOperationException("Unexpected onboarding phase: "+last["phase"]);
        }
        int OwnedBlade()=>last["inventory"]!.AsArray().Where(i=>i!["id"]!.ToString()=="木刀").Sum(i=>i!["count"]!.GetValue<int>())
            +last["hero"]!["equipment"]!.AsArray().Count(e=>e!["item"]?["id"]?.ToString()=="木刀");
        async Task Create(string difficulty,bool modern)
        {
            Read(BrowserBridge.Initialize(File.ReadAllText(modern?contentPath:originalPath)));
            await Cmd(new{type="beginCreation",name="Wren",difficulty});
            var answers=new[]{3,3,0,0,0,0,0};
            for(var q=0;q<answers.Length;q++)await Cmd(new{type="answerCreation",questionIndex=q,index=answers[q]});
            await Cmd(new{type="selectCreationPortrait",portraitId="头像.主角"});
            if(modern)
            {
                for(var n=0;n<3;n++)
                {
                    var blade=last["creation"]!["preview"]!["items"]!.AsArray().Single(i=>i!["id"]!.ToString()=="木刀");
                    if(blade!["quantity"]!.GetValue<int>()!=1)throw new InvalidOperationException("Starter weapon duplicated on reroll");
                    await Cmd(new{type="rollCreation"});
                }
            }
            await Cmd(new{type="confirmCreation"});await Finish();
        }
        foreach(var difficulty in new[]{"normal","hard"})
        {
            await Create(difficulty,true);
            if(OwnedBlade()!=1||!last["hero"]!["internalSkills"]!.AsArray().Any(s=>s!["id"]!.ToString()=="基本内功"))
                throw new InvalidOperationException("New traveler lacks a real weapon or basic mastery");
            var blade=last["inventory"]!.AsArray().Single(i=>i!["id"]!.ToString()=="木刀")!;
            await Cmd(new{type="equipItem",entryNumber=blade["entryNumber"]!.GetValue<long>()});
            await Cmd(new{type="interact",locationId="南贤"});await Finish();
            var manual=last["inventory"]!.AsArray().Single(i=>i!["id"]!.ToString()=="内功入门")!;
            if(!manual["canCultivate"]!.GetValue<bool>())throw new InvalidOperationException("New traveler cannot start basic study");
            File.WriteAllText(Path.Combine(output,"fresh-"+difficulty+".json"),BrowserBridge.ExportSave());
            await Cmd(new{type="setCultivation",entryNumber=manual["entryNumber"]!.GetValue<long>()});
            await Cmd(new{type="equipInternalSkill",skillId="基本内功"});
            var save=BrowserBridge.ExportSave();Read(BrowserBridge.ImportSave(save));
            if(OwnedBlade()!=1||last["hero"]!["cultivation"]!["itemId"]!.ToString()!="内功入门")throw new InvalidOperationException("Onboarding build did not survive reload");
            File.WriteAllText(Path.Combine(output,"ready-"+difficulty+".json"),BrowserBridge.ExportSave());
            Console.WriteLine("PASS "+difficulty+": real starter weapon, existing mastery, original Grimm manual, study/equip and save/import; rerolls never duplicate gear");
        }
        await Create("hard",false);
        if(OwnedBlade()!=0)throw new InvalidOperationException("Original hard creation unexpectedly received modern starter gear");
        Console.WriteLine("PASS original package retains its original hard-mode starting inventory");
        Read(BrowserBridge.Initialize(File.ReadAllText(contentPath)));
        Read(BrowserBridge.ImportSave(File.ReadAllText(previousSave)));
        var inventory=JsonNode.Parse(BrowserBridge.ExportSave())!["game"]!["inventory"]!.ToJsonString();
        Read(BrowserBridge.ImportSave(BrowserBridge.ExportSave()));
        if(inventory!=JsonNode.Parse(BrowserBridge.ExportSave())!["game"]!["inventory"]!.ToJsonString())throw new InvalidOperationException("Import retroactively granted starter items");
        await Cmd(new{type="clearCultivation"});
        var completed=last["inventory"]!.AsArray().Single(i=>i!["id"]!.ToString()=="内功入门")!;
        if(!completed["training"]!["mastered"]!.GetValue<bool>()||completed["canCultivate"]!.GetValue<bool>()||!completed["reason"]!.ToString().Contains("已掌握"))
            throw new InvalidOperationException("Completed primer still looks like a broken study button");
        if(!last["objectives"]!.AsArray().Single(o=>o!["id"]!.ToString()=="cultivation")!["completed"]!.GetValue<bool>())
            throw new InvalidOperationException("Onboarding demands studying an already completed primer");
        File.WriteAllText(Path.Combine(output,"completed-primer.json"),BrowserBridge.ExportSave());
        File.WriteAllText(Path.Combine(output,"report.json"),JsonSerializer.Serialize(new{passed=true,checks=4,method="Fresh normal/hard creation, real equip/study commands, intact old save; no edited saves or forced progression"}));
        Console.WriteLine("PASS completed primer has explicit status and does not block modern onboarding; existing inventory remains intact");
    }
}
