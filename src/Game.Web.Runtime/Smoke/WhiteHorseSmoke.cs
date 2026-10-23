using System.Security.Cryptography;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.RegularExpressions;
using Game.Web.Runtime;

// Every progression action is an ordinary player command. Checkpoints are
// exported intact, never edited; no playStory/map/forced battle outcome API.
internal static class WhiteHorseSmoke
{
    public static async Task Run(string contentPath, string directory, string difficulty = "normal")
    {
        if (difficulty is not ("normal" or "hard")) throw new ArgumentException("Use normal or hard difficulty");
        Directory.CreateDirectory(directory);
        JsonNode? last = null;
        var commands = new List<object>();
        var battles = new List<object>();
        var restoredSnapshots = new List<object>();
        var saves = new Dictionary<string, string>();
        var stage = "opening";
        var practiceDone = false;
        var package = JsonNode.Parse(File.ReadAllText(contentPath))!;
        var externalSkills = package["externalSkills"]!.AsArray().SelectMany(k => new[] { k!["id"]!.ToString() }
            .Concat((k["formSkills"]?.AsArray() ?? []).Select(f => f!["id"]!.ToString()))).ToHashSet();
        var healingItems = package["items"]!.AsArray().Where(i => i!["useEffects"]!.AsArray()
            .Any(effect => effect!["type"]!.ToString() == "add_hp" && effect["value"]!.GetValue<int>() > 0)).Select(i => i!["id"]!.ToString()).ToHashSet();
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
        async Task AuditGuide()
        {
            var before = Save()["game"]!.ToJsonString();
            var s = await Cmd(new { type = "state" });
            var journal = s["chapterJournal"] ?? throw new InvalidOperationException("Chapter guide has no recorded facts");
            var tracked = s["pack"]!["chapterGuide"]!["story"]!["trackedStories"]!.AsArray().Select(n => n!.ToString());
            if (!journal["completedStories"]!.AsArray().Select(n => n!.ToString()).ToHashSet().SetEquals(tracked.Where(Completed().Contains))
                || journal["trust"]!.GetValue<int>() != Favor()) throw new InvalidOperationException("Guide facts disagree with actual save");
            await Cmd(new { type = "state" });
            if (before != Save()["game"]!.ToJsonString()) throw new InvalidOperationException("Reading guidance mutated game/clock/random state");
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
                            var medicine = unit["team"]!.GetValue<int>() == 1 && unit["hp"]!.GetValue<int>() < unit["maxHp"]!.GetValue<int>() * .75
                                ? s["inventory"]!.AsArray().FirstOrDefault(i => healingItems.Contains(i!["id"]!.ToString()) && i["canUse"]!.GetValue<bool>() && i["battleTargets"]!.AsArray().Any(t => t!["id"]!.ToString() == active && t["canUse"]!.GetValue<bool>())) : null;
                            if (medicine is not null) { s = await Cmd(new { type = "useItem", entryNumber = medicine["entryNumber"]!.GetValue<long>(), targetId = active }); continue; }
                            if (stage is "don-quixote" or "dulcinea" or "cultivation" || difficulty == "hard")
                            {
                                // Manual offensive choices avoid spending the
                                // original time limit repeatedly casting a buff.
                                var enemies = s["battle"]!["units"]!.AsArray().Where(u => u!["team"]!.GetValue<int>() == 2 && u["hp"]!.GetValue<int>() > 0).ToArray();
                                var target = s["battle"]!["targets"]!.AsArray().Where(t => externalSkills.Contains(t!["skillId"]!.ToString()) && enemies.Any(e => e!["id"]!.ToString() == t["targetId"]?.ToString()))
                                    .OrderByDescending(t => s["battle"]!["skills"]!.AsArray().First(k => k!["id"]!.ToString() == t!["skillId"]!.ToString())!["rageCost"]!.GetValue<int>())
                                    .ThenBy(t => enemies.First(e => e!["id"]!.ToString() == t!["targetId"]!.ToString())!["hp"]!.GetValue<int>()).FirstOrDefault();
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
                        if (outcome != "win" && id != "南贤居_木头人_战斗") throw new InvalidOperationException("Actual battle was not won: " + id + " " + outcome);
                        if (stage == "opening" && outcome == "win") practiceDone = true;
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
                if (s["managedCharacter"]!["equipment"]!.AsArray().Any(e => e!["slot"]!.ToString() == slot && e["item"] is not null)) continue;
                var entry = s["inventory"]!.AsArray().FirstOrDefault(i => i!["canEquip"]!.GetValue<bool>() && i["slot"]?.ToString() == slot);
                if (entry is not null) s = await Cmd(new { type = "equipItem", entryNumber = entry["entryNumber"]!.GetValue<long>() });
            }
            var points = s["managedCharacter"]?["unspentStatPoints"]?.GetValue<int>() ?? 0;
            if (points > 0) s = await Cmd(new { type = "allocateStat", stat = s["managedCharacter"]!["definitionId"]!.ToString() == "李文秀" ? "qimen" : "bili", points });
            if (s["managedCharacter"]!["cultivation"] is not null) return;
            var scroll = s["inventory"]!.AsArray().FirstOrDefault(i => i!["id"]!.ToString() == "罗汉拳谱" && i["canCultivate"]!.GetValue<bool>());
            scroll ??= s["inventory"]!.AsArray().FirstOrDefault(i => i!["id"]!.ToString() == "内功入门" && i["canCultivate"]!.GetValue<bool>());
            if (scroll is not null) await Cmd(new { type = "setCultivation", entryNumber = scroll["entryNumber"]!.GetValue<long>() });
        }
        async Task ManageParty()
        {
            var ids = (await Resolve())["party"]!.AsArray().Select(c => c!["id"]!.ToString()).ToArray();
            foreach (var id in ids) { await Cmd(new { type = "selectCharacter", characterId = id }); await Manage(); }
            await Cmd(new { type = "selectCharacter", characterId = "主角" });
        }
        async Task Resupply()
        {
            var neededArmor = last!["party"]!.AsArray().Count(c => c!["equipment"]!.AsArray().Any(e => e!["slot"]!.ToString() == "Armor" && e["item"] is null));
            await Travel("洛阳"); await Visit("商店");
            foreach (var (itemId, wanted) in new[] { ("粗布道袍", neededArmor), ("小还丹", 8) })
            {
                var s = last!;
                var item = s["shop"]!["products"]!.AsArray().FirstOrDefault(p => p!["itemId"]?.ToString() == itemId && p["canBuy"]!.GetValue<bool>());
                if (item is null || item["price"] is null) continue;
                var quantity = Math.Min(wanted, s["silver"]!.GetValue<int>() / Math.Max(1, item["price"]!.GetValue<int>()));
                if (item["remaining"] is not null) quantity = Math.Min(quantity, item["remaining"]!.GetValue<int>());
                if (quantity > 0) await Cmd(new { type = "buy", productId = item["id"]!.ToString(), quantity });
            }
            await Cmd(new { type = "closeShop" }); await ManageParty(); await World();
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
        async Task WinWarrens(string completed, string checkpoint)
        {
            var routeStage = stage;
            for (var attempt = 0; attempt < 8; attempt++)
            {
                try { await Retry("高昌迷宫", completed); return; }
                catch (InvalidOperationException error) when (difficulty == "hard" && error.Message.StartsWith("Actual battle was not won:"))
                {
                    // The same recovery available to a player: reload an
                    // intact pre-fight export, then train and buy supplies.
                    var raw = File.ReadAllText(Path.Combine(directory, checkpoint + ".json"));
                    var hash = Convert.ToHexStringLower(SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(raw)));
                    if (hash != saves[checkpoint]) throw new InvalidOperationException("Retry checkpoint was modified");
                    restoredSnapshots.Add(new { checkpoint, sha256 = hash });
                    Parse(BrowserBridge.ImportSave(raw));
                    Console.WriteLine("RETRY actual loss: reload " + checkpoint + ", train 24 fights, resupply");
                    stage = "preparation"; await Travel("南贤居");
                    for (var n = 0; n < 24; n++) { await Visit("结伴练习"); await ManageParty(); }
                    await Resupply(); await World(); stage = routeStage;
                    checkpoint = routeStage + "-retry-" + (attempt + 1); Checkpoint(checkpoint);
                }
            }
            throw new InvalidOperationException("Hard route still not won after normal recovery attempts");
        }
        try
        {
            Parse(BrowserBridge.Initialize(File.ReadAllText(contentPath)));
            await Cmd(new { type = "beginCreation", name = "Wren", difficulty });
            var answers = new[] { 3, 3, 0, 0, 0, 0, 0 };
            for (var q = 0; q < answers.Length; q++) await Cmd(new { type = "answerCreation", questionIndex = q, index = answers[q] });
            await Cmd(new { type = "selectCreationPortrait", portraitId = "头像.主角" });
            await Cmd(new { type = "confirmCreation" }); await Resolve(); await Visit("南贤");
            var initial = await Resolve();
            var elixir = initial["inventory"]!.AsArray().SingleOrDefault(i => i!["id"]!.ToString() == "新手礼包-大蟠桃");
            for (var n = 0; n < (elixir?["count"]?.GetValue<int>() ?? 0); n++) await Cmd(new { type = "useItem", entryNumber = elixir!["entryNumber"]!.GetValue<long>() });
            await Manage(); await Visit("武师");
            for (var retry = 0; retry < 12 && !Save()["wonBattles"]!.AsArray().Any(n => n!.ToString() == "南贤居_木头人_战斗"); retry++) { await Manage(); await Visit("武师"); }
            if (!Save()["wonBattles"]!.AsArray().Any(n => n!.ToString() == "南贤居_木头人_战斗")) throw new InvalidOperationException("Tutorial practice never won");
            await Visit("南贤居"); await Visit("南贤");
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
            if (last!["adventure"]!["difficulty"]!.ToString() != difficulty) throw new InvalidOperationException("Wrong actual difficulty");
            Console.WriteLine("PREPARED " + difficulty + " training level " + last!["hero"]!["level"]);

            stage = "dulcinea";
            await Travel("哈萨克部落"); await Visit("李文秀"); Checkpoint("met"); await AuditGuide();
            for (var n = 0; n < 120 && !Completed().Contains("白马啸西风_沙漠赔笑"); n++) await Visit("李文秀");
            if (!Completed().Contains("白马啸西风_沙漠赔笑")) throw new InvalidOperationException("Night/politeness route did not complete");
            Checkpoint("night"); await AuditGuide();
            await Retry("哈萨克部落", "白马啸西风_李文秀加入");
            if (!InParty(last!, "李文秀") || Favor() < 60) throw new InvalidOperationException("Recruitment did not meet native trust gate");
            await World(); Checkpoint("recruited");
            await ManageParty();
            if (difficulty == "hard")
            {
                stage = "preparation"; await Travel("南贤居");
                for (var n = 0; n < 40; n++) { await Visit("结伴练习"); await ManageParty(); }
                await Resupply();
                stage = "dulcinea"; await World();
            }
            Checkpoint("final-ready");
            await AuditGuide();
            var before = Save()["game"]!["characters"]!.AsArray().Single(c => c!["id"]!.ToString() == "李文秀")!.DeepClone();
            await WinWarrens("白马啸西风_完结2", "final-ready");
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
            await World(); Checkpoint("dulcinea-ending"); await AuditGuide();
            var ending = BrowserBridge.ExportSave(); Parse(BrowserBridge.ImportSave(ending));
            if (!Completed().Contains("白马啸西风_完结2") || !InParty(last!, "李文秀")) throw new InvalidOperationException("Ending did not survive save/import");
            Console.WriteLine("PASS Dulcinea: night, trust, recruitment, real final battle, original reward and save roundtrip");

            stage = "cultivation";
            await Resupply();
            await Cmd(new { type = "reorderParty", characterId = "李文秀", index = 1 });
            await Cmd(new { type = "selectCharacter", characterId = "李文秀" });
            await Manage();
            var spell = last!["inventory"]!.AsArray().Single(i => i!["id"]!.ToString() == "黑血神针秘籍");
            if (!spell["canCultivate"]!.GetValue<bool>()) throw new InvalidOperationException("Dulcinea cannot study her real reward");
            await Cmd(new { type = "setCultivation", entryNumber = spell["entryNumber"]!.GetValue<long>() });
            await Cmd(new { type = "equipInternalSkill", skillId = "基本内功" });
            await Travel("南贤居");
            for (var n = 0; n < 8; n++) { await Visit("结伴练习"); await ManageParty(); }
            await Cmd(new { type = "selectCharacter", characterId = "李文秀" });
            var built = last!["managedCharacter"]!;
            if (built["unspentStatPoints"]!.GetValue<int>() != 0 || !built["equipment"]!.AsArray().Any(e => e!["item"] is not null)
                || built["equippedInternalSkillId"]!.ToString() != "基本内功" || built["cultivation"]!["itemId"]!.ToString() != "黑血神针秘籍"
                || built["cultivation"]!["level"]!.GetValue<int>() == 1 && built["cultivation"]!["exp"]!.GetValue<int>() == 0)
                throw new InvalidOperationException("Companion build lacks actual gear, points, mastery or combat scroll XP");
            await World(); Checkpoint("dulcinea-trained");
            var trained = BrowserBridge.ExportSave(); Parse(BrowserBridge.ImportSave(trained));
            await Cmd(new { type = "selectCharacter", characterId = "李文秀" });
            if (last!["managedCharacter"]!["cultivation"]!["itemId"]!.ToString() != "黑血神针秘籍") throw new InvalidOperationException("Companion build did not survive reload");
            Console.WriteLine("PASS actual companion equipment, allocated points, mastery and reward-scroll combat XP survive save/import");

            stage = "don-quixote";
            Parse(BrowserBridge.ImportSave(File.ReadAllText(Path.Combine(directory, "met.json"))));
            // This branch lacks the strong third ally. Build the two existing
            // companions through actual repeatable fights instead of editing
            // levels, weakening the encounter or forcing its outcome.
            stage = "preparation"; await Travel("南贤居");
            for (var n = 0; n < 32; n++) { await Visit("结伴练习"); await ManageParty(); }
            if (difficulty == "hard") await Resupply();
            stage = "don-quixote"; await World(); Checkpoint("alternate-trained");
            await Retry("哈萨克部落", "白马啸西风_前往高昌");
            if (InParty(last!, "李文秀") || Favor() >= 60) throw new InvalidOperationException("Low-trust route recruited Dulcinea");
            await World(); Checkpoint("alternate-ready");
            await WinWarrens("白马啸西风_高昌秘宝3", "alternate-ready");
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
            File.WriteAllText(Path.Combine(directory, "report.json"), JsonSerializer.Serialize(new { passed = true, difficulty, contentSha256 = Convert.ToHexStringLower(SHA256.HashData(File.ReadAllBytes(contentPath))), method = "Fresh creation at recorded difficulty and player commands only; intact self-exported checkpoints; no edited saves or forced outcomes", saves, restoredSnapshots, battles, commands }, new JsonSerializerOptions { WriteIndented = true }));
        }
        catch (Exception error)
        {
            File.WriteAllText(Path.Combine(directory, "failure.json"), JsonSerializer.Serialize(new { passed = false, stage, error = error.ToString(), state = last, commands }, new JsonSerializerOptions { WriteIndented = true }));
            throw;
        }
    }
}
