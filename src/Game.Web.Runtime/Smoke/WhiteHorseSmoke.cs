using System.Security.Cryptography;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.RegularExpressions;
using Game.Web.Runtime;

// Every progression action is an ordinary player command. Checkpoints are
// exported intact, never edited; no playStory/map/forced battle outcome API.
internal static class WhiteHorseSmoke
{
    public static async Task Run(string contentPath, string directory)
    {
        Directory.CreateDirectory(directory);
        JsonNode? last = null;
        var commands = new List<object>();
        var battles = new List<object>();
        var saves = new Dictionary<string, string>();
        var stage = "opening";
        var practiceDone = false;
        var externalSkills = JsonNode.Parse(File.ReadAllText(contentPath))!["externalSkills"]!.AsArray().Select(k => k!["id"]!.ToString()).ToHashSet();
        JsonNode Parse(string value)
        {
            var result = JsonNode.Parse(value)!;
            if (result["ok"]?.GetValue<bool>() != true)
                throw new InvalidOperationException(result["error"]?.ToString() ?? value);
            return last = result["state"]!;
        }
        async Task<JsonNode> Cmd(object command)
        {
            var s = Parse(await BrowserBridge.Dispatch(JsonSerializer.Serialize(command)));
            commands.Add(new { command, phase = s["phase"]!.ToString(), map = s["map"]?["id"]?.ToString() });
            return s;
        }
        string Phase(JsonNode s) => s["phase"]!.ToString();
        JsonNode Save() => JsonNode.Parse(BrowserBridge.ExportSave())!;
        HashSet<string> Completed() => Save()["game"]!["storyState"]!["completedStoryIds"]!.AsArray().Select(x => x!.ToString()).ToHashSet();
        int Favor() => Save()["game"]!["adventure"]?["favorabilityByTarget"]?["李文秀"]?.GetValue<int>() ?? 50;
        bool InParty(JsonNode s, string id) => s["roster"]!.AsArray().Any(c => c!["definitionId"]!.ToString() == id);
        void Checkpoint(string name)
        {
            var raw = BrowserBridge.ExportSave();
            if (JsonNode.Parse(raw)?["error"] is not null) throw new InvalidOperationException("Cannot save checkpoint " + name);
            File.WriteAllText(Path.Combine(directory, name + ".json"), raw);
            saves[name] = Convert.ToHexStringLower(SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(raw)));
        }
        async Task<JsonNode> Resolve()
        {
            var s = await Cmd(new { type = "state" });
            for (var step = 0; step < 4000; step++)
            {
                switch (Phase(s))
                {
                    case "dialogue":
                        if (stage != "opening" && Regex.IsMatch(s["dialogue"]!["text"]!.ToString(), "[\\u3400-\\u9fff]"))
                            throw new InvalidOperationException("Untranslated route dialogue: " + s["dialogue"]!["text"]);
                        s = await Cmd(new { type = "next" });
                        break;
                    case "choice":
                        var text = s["dialogue"]?["text"]?.ToString() ?? "";
                        var index = text == "How will you answer?" ? 1 :
                            stage == "opening" && s["dialogue"]?["speaker"]?.ToString() == "武师" && practiceDone ? 1 : 0;
                        s = await Cmd(new { type = "choose", index });
                        break;
                    case "sect":
                        s = await Cmd(new { type = "selectSect", sectId = "无门派" });
                        break;
                    case "combatants":
                        var selection = s["combatantSelection"]!;
                        var candidates = selection["candidates"]!.AsArray().Where(c => !c!["forbidden"]!.GetValue<bool>()).ToArray();
                        var ids = candidates.Where(c => c!["required"]!.GetValue<bool>()).Select(c => c!["id"]!.ToString()).ToList();
                        foreach (var candidate in candidates)
                            if (ids.Count < selection["capacity"]!.GetValue<int>() && !ids.Contains(candidate!["id"]!.ToString())) ids.Add(candidate["id"]!.ToString());
                        s = await Cmd(new { type = "selectCombatants", characterIds = ids });
                        break;
                    case "battle":
                        var id = s["battle"]!["id"]!.ToString();
                        for (var turn = 0; turn < 2000 && s["battle"]!["outcome"]!.ToString() == "ongoing"; turn++)
                        {
                            var active = s["battle"]!["activeUnitId"]!.ToString();
                            var unit = s["battle"]!["units"]!.AsArray().Single(u => u!["id"]!.ToString() == active)!;
                            var medicine = unit["team"]!.GetValue<int>() == 1 && unit["hp"]!.GetValue<int>() < unit["maxHp"]!.GetValue<int>() * .45
                                ? s["inventory"]!.AsArray().FirstOrDefault(i => i!["id"]!.ToString() == "小还丹" && i["canUse"]!.GetValue<bool>() && i["battleTargets"]!.AsArray().Any(t => t!["id"]!.ToString() == active && t["canUse"]!.GetValue<bool>())) : null;
                            if (medicine is not null) { s = await Cmd(new { type = "useItem", entryNumber = medicine["entryNumber"]!.GetValue<long>(), targetId = active }); continue; }
                            if (stage == "don-quixote")
                            {
                                // Manual offensive choices avoid spending the
                                // original time limit repeatedly casting a buff.
                                var enemies = s["battle"]!["units"]!.AsArray().Where(u => u!["team"]!.GetValue<int>() == 2 && u["hp"]!.GetValue<int>() > 0).ToArray();
                                var target = s["battle"]!["targets"]!.AsArray().FirstOrDefault(t => externalSkills.Contains(t!["skillId"]!.ToString()) && enemies.Any(e => e!["id"]!.ToString() == t["targetId"]?.ToString()));
                                if (target is not null) { s = await Cmd(new { type = "attack", skillId = target["skillId"]!.ToString(), x = target["x"]!.GetValue<int>(), y = target["y"]!.GetValue<int>() }); continue; }
                                if (s["battle"]!["action"]?["canMove"]?.GetValue<bool>() == true && enemies.Length > 0)
                                {
                                    int Distance(JsonNode cell) => enemies.Min(e => Math.Abs(e!["x"]!.GetValue<int>() - cell["x"]!.GetValue<int>()) + Math.Abs(e["y"]!.GetValue<int>() - cell["y"]!.GetValue<int>()));
                                    var nearest = s["battle"]!["reachable"]!.AsArray().Where(c => c is not null).OrderBy(c => Distance(c!)).FirstOrDefault();
                                    if (nearest is not null && Distance(nearest) < Distance(unit)) { s = await Cmd(new { type = "move", x = nearest["x"]!.GetValue<int>(), y = nearest["y"]!.GetValue<int>() }); continue; }
                                }
                            }
                            s = await Cmd(new { type = "autoTurn" });
                        }
                        var outcome = s["battle"]!["outcome"]!.ToString();
                        battles.Add(new { stage, id, outcome });
                        Console.WriteLine($"BATTLE {stage}: {id} {outcome}");
                        if (outcome != "win") throw new InvalidOperationException("Actual battle was not won: " + id + " " + outcome);
                        if (stage == "opening") practiceDone = true;
                        s = await Cmd(new { type = "leaveBattle" });
                        break;
                    default: return s;
                }
            }
            throw new InvalidOperationException("Unfinished normal route interaction");
        }
        async Task<JsonNode> Visit(string location)
        {
            var s = await Resolve();
            if (Phase(s) != "world") throw new InvalidOperationException("Not on map: " + Phase(s));
            if (!s["map"]!["locations"]!.AsArray().Any(l => l!["id"]!.ToString() == location && l["action"] is not null))
                throw new InvalidOperationException("Destination unavailable: " + s["map"]!["id"] + "/" + location);
            await Cmd(new { type = "interact", locationId = location });
            return await Resolve();
        }
        async Task World()
        {
            for (var n = 0; n < 8; n++)
            {
                var s = await Resolve();
                if (s["map"]!["id"]!.ToString() == "大地图") return;
                await Visit("返回");
            }
            throw new InvalidOperationException("No normal route to world map");
        }
        async Task Travel(string id) { await World(); await Visit(id); }
        async Task Manage()
        {
            var s = await Resolve();
            foreach (var slot in new[] { "Weapon", "Armor", "Accessory" })
            {
                var entry = s["inventory"]!.AsArray().FirstOrDefault(i => i!["canEquip"]!.GetValue<bool>() && i["slot"]?.ToString() == slot);
                if (entry is not null) s = await Cmd(new { type = "equipItem", entryNumber = entry["entryNumber"]!.GetValue<long>() });
            }
            var points = s["managedCharacter"]?["unspentStatPoints"]?.GetValue<int>() ?? 0;
            if (points > 0) await Cmd(new { type = "allocateStat", stat = "bili", points });
            var scroll = s["inventory"]!.AsArray().FirstOrDefault(i => i!["id"]!.ToString() == "罗汉拳谱" && i["canCultivate"]!.GetValue<bool>());
            if (scroll is not null) await Cmd(new { type = "setCultivation", entryNumber = scroll["entryNumber"]!.GetValue<long>() });
        }
        async Task ManageParty()
        {
            var ids = (await Resolve())["party"]!.AsArray().Select(c => c!["id"]!.ToString()).ToArray();
            foreach (var id in ids) { await Cmd(new { type = "selectCharacter", characterId = id }); await Manage(); }
            await Cmd(new { type = "selectCharacter", characterId = "主角" });
        }
        async Task Retry(string location, string completed)
        {
            for (var attempt = 0; attempt < 120 && !Completed().Contains(completed); attempt++)
            {
                await Travel(location);
                if (!Completed().Contains(completed)) await World();
            }
            if (!Completed().Contains(completed)) throw new InvalidOperationException("Original chance gate did not open: " + completed);
        }
        try
        {
            Parse(BrowserBridge.Initialize(File.ReadAllText(contentPath)));
            await Cmd(new { type = "beginCreation", name = "Wren", difficulty = "normal" });
            var answers = new[] { 3, 3, 0, 0, 0, 0, 0 };
            for (var q = 0; q < answers.Length; q++) await Cmd(new { type = "answerCreation", questionIndex = q, index = answers[q] });
            await Cmd(new { type = "selectCreationPortrait", portraitId = "头像.主角" });
            await Cmd(new { type = "confirmCreation" }); await Resolve(); await Visit("南贤");
            var initial = await Resolve();
            var elixir = initial["inventory"]!.AsArray().Single(i => i!["id"]!.ToString() == "新手礼包-大蟠桃")!;
            for (var n = 0; n < 5; n++) await Cmd(new { type = "useItem", entryNumber = elixir["entryNumber"]!.GetValue<long>() });
            await Manage(); await Visit("武师"); await Visit("南贤居"); await Visit("南贤");
            await Travel("洛阳"); await Visit("商店"); await Visit("商店");
            var shop = last!;
            var product = shop["shop"]!["products"]!.AsArray().First(p => p!["itemId"]!.ToString() == "小还丹")!;
            await Cmd(new { type = "buy", productId = product["id"]!.ToString(), quantity = 1 });
            await Cmd(new { type = "closeShop" });
            await Travel("南贤居"); await Visit("南贤");
            if (Phase(last!) == "world" && last!["map"]!["id"]!.ToString() == "南贤居" && last["tutorial"] is not null) await Visit("南贤");
            await Travel("洛阳"); await Visit("小孩");
            await Travel("南贤居"); await Visit("南贤");
            if (Phase(last!) == "world" && last!["map"]!["id"]!.ToString() == "南贤居" && last["tutorial"] is not null) await Visit("南贤");
            await Travel("万劫谷"); await Visit("钟灵");
            await Manage(); await Travel("南贤居");
            for (var n = 0; n < 24; n++) { await Visit("结伴练习"); await ManageParty(); }
            await World(); Checkpoint("start");
            Console.WriteLine("PREPARED normal training level " + last!["hero"]!["level"]);

            stage = "dulcinea";
            await Travel("哈萨克部落"); await Visit("李文秀"); Checkpoint("met");
            for (var n = 0; n < 120 && !Completed().Contains("白马啸西风_沙漠赔笑"); n++) await Visit("李文秀");
            if (!Completed().Contains("白马啸西风_沙漠赔笑")) throw new InvalidOperationException("Night/politeness route did not complete");
            Checkpoint("night");
            await Retry("哈萨克部落", "白马啸西风_李文秀加入");
            if (!InParty(last!, "李文秀") || Favor() < 60) throw new InvalidOperationException("Recruitment did not meet native trust gate");
            await World(); Checkpoint("recruited");
            var before = Save()["game"]!["characters"]!.AsArray().Single(c => c!["id"]!.ToString() == "李文秀")!.DeepClone();
            await Retry("高昌迷宫", "白马啸西风_完结2");
            if (!InParty(last!, "李文秀")) throw new InvalidOperationException("Dulcinea lost after ending");
            var reward = last!["inventory"]!.AsArray().SingleOrDefault(i => i!["id"]!.ToString() == "黑血神针秘籍");
            if (reward is null) throw new InvalidOperationException("Missing native ending scroll reward");
            var after = Save()["game"]!["characters"]!.AsArray().Single(c => c!["id"]!.ToString() == "李文秀")!;
            var leveled = after["level"]!.GetValue<int>() > before["level"]!.GetValue<int>();
            foreach (var (stat, delta) in new[] { ("qimen", 40), ("max_hp", 500), ("max_mp", 500) })
            {
                var gain = after["baseStats"]![stat]!.GetValue<int>() - before["baseStats"]![stat]!.GetValue<int>();
                if (gain < delta || !leveled && gain != delta) throw new InvalidOperationException("Wrong original stat reward: " + stat);
            }
            var pointGain = after["unspentStatPoints"]!.GetValue<int>() - before["unspentStatPoints"]!.GetValue<int>();
            if (pointGain < 30 || !leveled && pointGain != 30) throw new InvalidOperationException("Wrong original training-point reward");
            await World(); Checkpoint("dulcinea-ending");
            var ending = BrowserBridge.ExportSave(); Parse(BrowserBridge.ImportSave(ending));
            if (!Completed().Contains("白马啸西风_完结2") || !InParty(last!, "李文秀")) throw new InvalidOperationException("Ending did not survive save/import");
            Console.WriteLine("PASS Dulcinea: night, trust, recruitment, real final battle, original reward and save roundtrip");

            stage = "don-quixote";
            Parse(BrowserBridge.ImportSave(File.ReadAllText(Path.Combine(directory, "met.json"))));
            // This branch lacks the strong third ally. Build the two existing
            // companions through actual repeatable fights instead of editing
            // levels, weakening the encounter or forcing its outcome.
            stage = "preparation"; await Travel("南贤居");
            for (var n = 0; n < 32; n++) { await Visit("结伴练习"); await ManageParty(); }
            stage = "don-quixote"; await World(); Checkpoint("alternate-trained");
            await Retry("哈萨克部落", "白马啸西风_前往高昌");
            if (InParty(last!, "李文秀") || Favor() >= 60) throw new InvalidOperationException("Low-trust route recruited Dulcinea");
            await World(); Checkpoint("alternate-ready");
            await Retry("高昌迷宫", "白马啸西风_高昌秘宝3");
            if (!last!["inventory"]!.AsArray().Any(i => i!["id"]!.ToString() == "河岳英灵集")) throw new InvalidOperationException("Missing alternate native reward");
            var morality = last!["adventure"]!["morality"]!.GetValue<int>();
            for (var n = 0; n < 120 && !InParty(last!, "陈达海"); n++)
            {
                if (last!["map"]!["id"]!.ToString() != "高昌迷宫") await Travel("高昌迷宫");
                var npc = last!["map"]!["locations"]!.AsArray().SingleOrDefault(l => l!["id"]!.ToString() == "陈达海");
                if (npc?["action"] is not null) await Visit("陈达海"); else { await World(); await Travel("高昌迷宫"); }
            }
            if (!InParty(last!, "陈达海") || last!["adventure"]!["morality"]!.GetValue<int>() != morality - 2) throw new InvalidOperationException("Knight's native JOIN/morality cost missing");
            await World(); Checkpoint("knight-ending");
            Console.WriteLine("PASS alternate ending: no false Dulcinea join, two actual battles, almanac, knight recruitment and morality -2");
            File.WriteAllText(Path.Combine(directory, "report.json"), JsonSerializer.Serialize(new { passed = true, contentSha256 = Convert.ToHexStringLower(SHA256.HashData(File.ReadAllBytes(contentPath))), method = "Fresh normal creation and player commands only; intact self-exported checkpoints; no edited saves or forced outcomes", saves, battles, commands }, new JsonSerializerOptions { WriteIndented = true }));
        }
        catch (Exception error)
        {
            File.WriteAllText(Path.Combine(directory, "failure.json"), JsonSerializer.Serialize(new { passed = false, stage, error = error.ToString(), state = last, commands }, new JsonSerializerOptions { WriteIndented = true }));
            throw;
        }
    }
}
