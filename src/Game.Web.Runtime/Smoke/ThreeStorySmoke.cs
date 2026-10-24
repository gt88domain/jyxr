using System.Diagnostics;
using System.Security.Cryptography;
using System.Text.Json;
using System.Text.Json.Nodes;
using Game.Web.Runtime;

// An observed playthrough, using only the same commands available to players.
// Checkpoints are intact exports; no flags, items, RNG, or combat results edited.
internal static class ThreeStorySmoke
{
    public static async Task Run(string contentPath, string startPath, string output, bool resume = false, bool firstTwoOnly = false)
    {
        Directory.CreateDirectory(output);
        var events = new List<object>();
        var timings = new List<object>();
        var checkpoints = new Dictionary<string, string>();
        var inputSave = startPath;
        var sourceHash = Convert.ToHexStringLower(SHA256.HashData(File.ReadAllBytes(startPath)));
        if (resume)
        {
            using var old = JsonDocument.Parse(File.ReadAllText(Path.Combine(output, "report.json")));
            events.AddRange(old.RootElement.GetProperty("events").EnumerateArray().Select(e => (object)e.Clone()));
            timings.AddRange(old.RootElement.GetProperty("timings").EnumerateArray().Select(e => (object)e.Clone()));
            foreach (var p in old.RootElement.GetProperty("checkpoints").EnumerateObject()) checkpoints[p.Name] = p.Value.GetString()!;
            if (sourceHash != checkpoints["italy-ready"]) throw new InvalidOperationException("Recovery export changed");
            inputSave = old.RootElement.GetProperty("sourceSave").GetString()!;
            sourceHash = old.RootElement.GetProperty("sourceSha256").GetString()!;
        }
        var package = JsonNode.Parse(File.ReadAllText(contentPath))!;
        var attacks = package["externalSkills"]!.AsArray().SelectMany(k => new[] { k!["id"]!.ToString() }.Concat((k["formSkills"]?.AsArray() ?? []).Select(f => f!["id"]!.ToString()))).ToHashSet();
        var heals = package["items"]!.AsArray().Where(i => i!["useEffects"]!.AsArray().Any(e => e!["type"]!.ToString() == "add_hp" && e["value"]!.GetValue<int>() > 0)).Select(i => i!["id"]!.ToString()).ToHashSet();
        JsonNode state = null!;
        string stage = "preparation";
        int sequence = events.Count;
        string Phase() => state["phase"]!.ToString();
        string Hash(string raw) => Convert.ToHexStringLower(SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(raw)));
        void Record(string kind, object data) => events.Add(new { sequence = ++sequence, stage, kind, data });
        JsonNode Parse(string raw)
        {
            var r = JsonNode.Parse(raw)!;
            if (r["ok"]?.GetValue<bool>() != true) throw new InvalidOperationException(r["error"]?.ToString());
            return state = r["state"]!;
        }
        async Task<JsonNode> Cmd(object command)
        {
            var previous = state;
            var watch = Stopwatch.StartNew();
            var raw = await BrowserBridge.Dispatch(JsonSerializer.Serialize(command));
            var dispatchMs = watch.Elapsed.TotalMilliseconds;
            Parse(raw);
            timings.Add(new { type = JsonSerializer.SerializeToNode(command)!["type"]!.ToString(), dispatchMs, totalMs = watch.Elapsed.TotalMilliseconds, bytes = System.Text.Encoding.UTF8.GetByteCount(raw), phase = Phase() });
            if (Phase() == "dialogue") Record("dialogue", state["dialogue"]!.DeepClone());
            if (Phase() == "choice") Record("choice", new { prompt = state["dialogue"]?.DeepClone(), options = state["choices"]!.DeepClone() });
            if (previous is not null)
            {
                foreach (var c in state["roster"]!.AsArray().Where(c => !previous["roster"]!.AsArray().Any(p => p!["definitionId"]!.ToString() == c!["definitionId"]!.ToString()))) Record("recruit", c!.DeepClone());
                if (Phase() != "battle" && previous["phase"]!.ToString() != "battle")
                {
                    foreach (var item in state["inventory"]!.AsArray())
                    {
                        var before = previous["inventory"]!.AsArray().Where(i => i!["id"]!.ToString() == item!["id"]!.ToString()).Sum(i => i!["count"]!.GetValue<int>());
                        var delta = item!["count"]!.GetValue<int>() - before;
                        if (delta != 0) Record("item", new { id = item["id"]!.ToString(), delta });
                    }
                    var silver = state["silver"]!.GetValue<int>() - previous["silver"]!.GetValue<int>();
                    if (silver != 0) Record("silver", silver);
                    var morality = state["adventure"]!["morality"]!.GetValue<int>() - previous["adventure"]!["morality"]!.GetValue<int>();
                    if (morality != 0) Record("morality", morality);
                }
            }
            return state;
        }
        bool Done(string id) => JsonNode.Parse(BrowserBridge.ExportSave())!["game"]!["storyState"]!["completedStoryIds"]!.AsArray().Any(n => n!.ToString() == id);
        void Checkpoint(string name)
        {
            var raw = BrowserBridge.ExportSave();
            if (JsonNode.Parse(raw)?["error"] is { } error) throw new InvalidOperationException("Checkpoint rejected: " + error);
            checkpoints[name] = Hash(raw);
            File.WriteAllText(Path.Combine(output, name + ".json"), raw);
            Record("checkpoint", new { name, sha256 = Hash(raw), heroLevel = state["hero"]!["level"], party = state["party"]!.DeepClone(), adventure = state["adventure"]!.DeepClone() });
        }
        async Task Resolve()
        {
            for (int n = 0; n < 5000; n++)
            {
                switch (Phase())
                {
                    case "dialogue": await Cmd(new { type = "next" }); break;
                    case "choice":
                        var index = state["dialogue"]?["text"]?.ToString() == "How will you answer?" ? 1 : 0;
                        Record("decision", new { index });
                        await Cmd(new { type = "choose", index }); break;
                    case "combatants":
                        var selection = state["combatantSelection"]!;
                        var candidates = selection["candidates"]!.AsArray().Where(c => !c!["forbidden"]!.GetValue<bool>()).ToArray();
                        var ids = candidates.Where(c => c!["required"]!.GetValue<bool>()).Select(c => c!["id"]!.ToString()).ToList();
                        foreach (var c in candidates) if (ids.Count < selection["capacity"]!.GetValue<int>() && !ids.Contains(c!["id"]!.ToString())) ids.Add(c!["id"]!.ToString());
                        Record("deployment", new { battleId = selection["battleId"]!.ToString(), capacity = selection["capacity"]!.GetValue<int>(), ids });
                        await Cmd(new { type = "selectCombatants", characterIds = ids }); break;
                    case "battle":
                        var battleId = state["battle"]!["id"]!.ToString();
                        Record("battle-start", new { id = battleId, units = state["battle"]!["units"]!.DeepClone() });
                        int turns = 0, medicine = 0, offensive = 0, automated = 0;
                        long lastEvent = -1;
                        for (; turns < 2500 && state["battle"]!["outcome"]!.ToString() == "ongoing"; turns++)
                        {
                            var b = state["battle"]!;
                            foreach (var e in b["events"]!.AsArray().Where(e => e!["sequence"]!.GetValue<long>() > lastEvent)) Record("combat", e!.DeepClone());
                            if (b["events"]!.AsArray().Count > 0) lastEvent = b["events"]!.AsArray().Max(e => e!["sequence"]!.GetValue<long>());
                            var active = b["activeUnitId"]!.ToString();
                            var unit = b["units"]!.AsArray().Single(u => u!["id"]!.ToString() == active)!;
                            var potion = unit["team"]!.GetValue<int>() == 1 && unit["hp"]!.GetValue<int>() < unit["maxHp"]!.GetValue<int>() * .6
                                ? state["inventory"]!.AsArray().FirstOrDefault(i => heals.Contains(i!["id"]!.ToString()) && i["canUse"]!.GetValue<bool>() && i["battleTargets"]!.AsArray().Any(t => t!["id"]!.ToString() == active && t["canUse"]!.GetValue<bool>())) : null;
                            if (potion is not null) { medicine++; await Cmd(new { type = "useItem", entryNumber = potion["entryNumber"]!.GetValue<long>(), targetId = active }); continue; }
                            var enemies = b["units"]!.AsArray().Where(u => u!["team"]!.GetValue<int>() == 2 && u["hp"]!.GetValue<int>() > 0).ToArray();
                            var target = b["targets"]!.AsArray().Where(t => attacks.Contains(t!["skillId"]!.ToString()) && enemies.Any(e => e!["id"]!.ToString() == t["targetId"]?.ToString())).OrderByDescending(t => b["skills"]!.AsArray().First(k => k!["id"]!.ToString() == t!["skillId"]!.ToString())!["rageCost"]!.GetValue<int>()).ThenBy(t => enemies.First(e => e!["id"]!.ToString() == t!["targetId"]!.ToString())!["hp"]!.GetValue<int>()).FirstOrDefault();
                            if (target is not null) { offensive++; await Cmd(new { type = "attack", skillId = target["skillId"]!.ToString(), x = target["x"]!.GetValue<int>(), y = target["y"]!.GetValue<int>() }); continue; }
                            if (b["action"]?["canMove"]?.GetValue<bool>() == true && enemies.Length > 0)
                            {
                                int Distance(JsonNode cell) => enemies.Min(e => Math.Abs(e!["x"]!.GetValue<int>() - cell["x"]!.GetValue<int>()) + Math.Abs(e["y"]!.GetValue<int>() - cell["y"]!.GetValue<int>()));
                                var nearest = b["reachable"]!.AsArray().OrderBy(c => Distance(c!)).FirstOrDefault();
                                if (nearest is not null && Distance(nearest) < Distance(unit)) { await Cmd(new { type = "move", x = nearest["x"]!.GetValue<int>(), y = nearest["y"]!.GetValue<int>() }); continue; }
                            }
                            automated++; await Cmd(new { type = "autoTurn" });
                        }
                        var outcome = state["battle"]!["outcome"]!.ToString();
                        Record("battle-end", new { id = battleId, outcome, turns, medicine, offensive, automated, tick = state["battle"]!["tick"], units = state["battle"]!["units"]!.DeepClone() });
                        Console.WriteLine($"BATTLE {stage}: {battleId} {outcome} ({turns} actions)");
                        if (outcome != "win") throw new InvalidOperationException("Battle not won: " + battleId + " " + outcome);
                        await Cmd(new { type = "leaveBattle" }); break;
                    case "world": return;
                    default: throw new InvalidOperationException("Unexpected phase: " + Phase());
                }
            }
            throw new InvalidOperationException("Interaction limit reached");
        }
        async Task Visit(string id)
        {
            await Resolve();
            if (!state["map"]!["locations"]!.AsArray().Any(l => l!["id"]!.ToString() == id && l["action"] is not null)) throw new InvalidOperationException("Unavailable: " + state["map"]!["id"] + "/" + id);
            Record("visit", new { mapId = state["map"]!["id"]!.ToString(), locationId = id, time = state["adventure"]!.DeepClone() });
            await Cmd(new { type = "interact", locationId = id }); await Resolve();
        }
        async Task World() { for (int n = 0; n < 8 && state["map"]!["id"]!.ToString() != "大地图"; n++) await Visit("返回"); }
        async Task Travel(string id) { await World(); await Visit(id); }
        async Task Retry(string id, string completed)
        {
            for (int n = 0; n < 120 && !Done(completed); n++) { await Travel(id); if (!Done(completed)) await World(); }
            if (!Done(completed)) throw new InvalidOperationException("Chance gate failed: " + completed);
        }
        async Task Manage()
        {
            foreach (var c in state["party"]!.AsArray().Select(c => c!["id"]!.ToString()).ToArray())
            {
                await Cmd(new { type = "selectCharacter", characterId = c });
                var points = state["managedCharacter"]!["unspentStatPoints"]!.GetValue<int>();
                if (points > 0) await Cmd(new { type = "allocateStat", stat = c == "李文秀" ? "qimen" : "bili", points });
                foreach (var slot in new[] { "Weapon", "Armor", "Accessory" })
                {
                    if (state["managedCharacter"]!["equipment"]!.AsArray().Any(e => e!["slot"]!.ToString() == slot && e["item"] is not null)) continue;
                    var item = state["inventory"]!.AsArray().FirstOrDefault(i => i!["canEquip"]!.GetValue<bool>() && i["slot"]?.ToString() == slot);
                    if (item is not null) await Cmd(new { type = "equipItem", entryNumber = item["entryNumber"]!.GetValue<long>() });
                }
                if (state["managedCharacter"]!["cultivation"] is null)
                {
                    var item = state["inventory"]!.AsArray().FirstOrDefault(i => i!["canCultivate"]!.GetValue<bool>());
                    if (item is not null) await Cmd(new { type = "setCultivation", entryNumber = item["entryNumber"]!.GetValue<long>() });
                }
            }
            await Cmd(new { type = "selectCharacter", characterId = "主角" });
        }
        void Report(bool passed, string? error = null)
        {
            File.WriteAllText(Path.Combine(output, "report.json"), JsonSerializer.Serialize(new { passed, error, scope = firstTwoOnly ? "first two endings and Dulcinea training" : "three-story trial", difficulty = "normal", sourceSave = inputSave, sourceSha256 = sourceHash, contentSha256 = Hash(File.ReadAllText(contentPath)), method = "Sequential ordinary player commands from an unedited, previously played normal save; manual offense and real potions; no forced outcomes", checkpoints, events, timings }, new JsonSerializerOptions { WriteIndented = false }));
        }
        try
        {
            Parse(BrowserBridge.Initialize(File.ReadAllText(contentPath)));
            Parse(BrowserBridge.ImportSave(File.ReadAllText(startPath)));
            if (state["adventure"]!["difficulty"]!.ToString() != "normal") throw new InvalidOperationException("Source is not normal difficulty");
            if (!resume)
            {
            Checkpoint("start");
            for (int n = 0; n < 25; n++) await Cmd(new { type = "state" });
            stage = "spain";
            await Travel("哈萨克部落"); await Visit("李文秀");
            for (int n = 0; n < 120 && !Done("白马啸西风_沙漠赔笑"); n++) await Visit("李文秀");
            if (!Done("白马啸西风_沙漠赔笑")) throw new InvalidOperationException("Night gate failed");
            await Retry("哈萨克部落", "白马啸西风_李文秀加入"); await Manage();
            await World(); Checkpoint("spain-ready");
            await Retry("高昌迷宫", "白马啸西风_完结2"); await World(); Checkpoint("spain-complete");
            await Cmd(new { type = "selectCharacter", characterId = "李文秀" });
            var tome = state["inventory"]!.AsArray().Single(i => i!["id"]!.ToString() == "黑血神针秘籍");
            await Cmd(new { type = "setCultivation", entryNumber = tome["entryNumber"]!.GetValue<long>() });
            await Cmd(new { type = "equipInternalSkill", skillId = "基本内功" });
            await Cmd(new { type = "reorderParty", characterId = "李文秀", index = 1 });
            await Travel("南贤居");
            for (int n = 0; n < 8; n++) { await Visit("结伴练习"); await Manage(); }
            await Cmd(new { type = "selectCharacter", characterId = "李文秀" });
            var trained = state["managedCharacter"]!["cultivation"]!;
            if (trained["itemId"]!.ToString() != "黑血神针秘籍" || trained["level"]!.GetValue<int>() == 1 && trained["exp"]!.GetValue<int>() == 0) throw new InvalidOperationException("Dulcinea did not earn actual spell study XP");
            Record("companion-build", state["managedCharacter"]!.DeepClone());
            await Cmd(new { type = "selectCharacter", characterId = "主角" }); await World(); Checkpoint("spain-trained");
            stage = "france";
            await Travel("回族部落"); Checkpoint("france-recruited"); await Manage();
            for (int n = 0; n < 120 && !Done("书剑恩仇录_六和塔胜"); n++)
            {
                await Travel("杭州"); await Visit("六和塔");
                if (state["map"]!["locations"]!.AsArray().Any(l => l!["id"]!.ToString() == "朝廷走狗" && l["action"] is not null)) await Visit("朝廷走狗");
                await World();
            }
            if (!Done("书剑恩仇录_六和塔胜")) throw new InvalidOperationException("Tower encounter did not open");
            await Travel("回族部落"); await Visit("张召重"); await World(); Checkpoint("france-complete");
            if (firstTwoOnly)
            {
                var export = BrowserBridge.ExportSave(); Parse(BrowserBridge.ImportSave(export));
                if (!Done("书剑恩仇录_庖丁解牛胜") || !Done("白马啸西风_完结2")) throw new InvalidOperationException("Ending lost on reload");
                var before = JsonNode.Parse(BrowserBridge.ExportSave())!["game"]!.ToJsonString();
                await Cmd(new { type = "state" }); await Cmd(new { type = "state" });
                var journal = state["chapterJournal"]!["completedStories"]!.AsArray().Select(n => n!.ToString()).ToHashSet();
                if (!journal.Contains("书剑恩仇录_庖丁解牛胜") || !journal.Contains("白马啸西风_完结2") || before != JsonNode.Parse(BrowserBridge.ExportSave())!["game"]!.ToJsonString()) throw new InvalidOperationException("Multi-story guide must read saved facts without changing state");
                Report(true); Console.WriteLine("PASS first two endings, actual spell study, save reload and read-only multi-story guide"); return;
            }
            stage = "italy"; await Manage(); Checkpoint("italy-ready");
            }
            else
            {
                stage = "recovery"; Record("reload", new { checkpoint = "italy-ready", sha256 = Hash(File.ReadAllText(startPath)), reason = "Lost the original solo finale; restore a full pre-encounter export and train normally." });
                await Travel("洛阳");
                await Cmd(new { type = "interact", locationId = "商店" });
                foreach (var (id, wanted) in new[] { ("小还丹", 20), ("粗布道袍", 4) })
                {
                    var item = state["shop"]!["products"]!.AsArray().FirstOrDefault(p => p!["itemId"]?.ToString() == id && p["canBuy"]!.GetValue<bool>());
                    if (item is null || item["price"] is null) continue;
                    var quantity = Math.Min(wanted, state["silver"]!.GetValue<int>() / Math.Max(1, item["price"]!.GetValue<int>()));
                    if (item["remaining"] is not null) quantity = Math.Min(quantity, item["remaining"]!.GetValue<int>());
                    if (quantity > 0) await Cmd(new { type = "buy", productId = item["id"]!.ToString(), quantity });
                }
                await Cmd(new { type = "closeShop" });
                await Cmd(new { type = "selectCharacter", characterId = "主角" });
                var manual = state["inventory"]!.AsArray().FirstOrDefault(i => i!["id"]!.ToString() == "柔云剑法秘籍" && i["canCultivate"]!.GetValue<bool>());
                if (manual is not null) await Cmd(new { type = "setCultivation", entryNumber = manual["entryNumber"]!.GetValue<long>() });
                await Travel("南贤居");
                for (int n = 0; n < 48; n++) { await Visit("结伴练习"); await Manage(); }
                await World(); Checkpoint("italy-trained"); stage = "italy-retry";
            }
            await Retry("风陵渡口", "鸳鸯刀正_风陵渡胜"); await World(); Checkpoint("italy-complete");
            var raw = BrowserBridge.ExportSave(); Parse(BrowserBridge.ImportSave(raw));
            foreach (var id in new[] { "白马啸西风_完结2", "书剑恩仇录_庖丁解牛胜", "鸳鸯刀正_风陵渡胜" }) if (!Done(id)) throw new InvalidOperationException("Ending lost after reload: " + id);
            if (!state["roster"]!.AsArray().Any(c => c!["definitionId"]!.ToString() == "袁冠南") || state["roster"]!.AsArray().Any(c => c!["definitionId"]!.ToString() == "萧中慧")) throw new InvalidOperationException("Italy recruitment does not match source");
            Report(true); Console.WriteLine("PASS sequential Spain, France, Italy and save roundtrip");
        }
        catch (Exception e) { Report(false, e.ToString()); throw; }
    }
}
