"""Compile pinned original stories and expose only dependency-closed events.

This reports structural migration, not proof of combat fidelity or playthrough.
Unknown commands, broken IDs and their callers stay quarantined with reasons.
The first 14 already verified opening segments are retained byte-for-byte.
"""
from __future__ import annotations

import copy
from collections import Counter
import xml.etree.ElementTree as ET

STORY_FILES = ("storys.xml", "storysCG.xml", "storysPY.xml")


def expand_original(package: dict, source_maps: list[dict], source, opening: dict) -> tuple[dict, dict]:
    from expression_dsl import build_condition_expression, character_guard, quote

    result = copy.deepcopy(package)
    records = {s.get("name"): (filename, s) for filename in STORY_FILES
               for s in ET.parse(source / filename).getroot().findall("story")}
    # NICK instructions themselves declare stable achievement IDs. Some have
    # no resource description; preserve their original names without inventing
    # resources/effects or blocking otherwise valid gameplay behind UI text.
    achievements = {r["id"][5:]: {"id": r["id"][5:], "name": r["id"][5:], "description": r.get("value", "")}
                    for r in result.get("resources", []) if r["id"].startswith("nick.")}
    missing_achievement_descriptions = set()
    for _, story in records.values():
        for action in story.findall("action"):
            if action.get("type") == "NICK" and action.get("value"):
                identifier = action.get("value")
                if identifier not in achievements:
                    achievements[identifier] = {"id": identifier, "name": identifier, "description": ""}
                    missing_achievement_descriptions.add(identifier)
    result["browser"]["achievements"] = sorted(achievements.values(), key=lambda a: a["id"])
    ids = {key: {x["id"] for x in values} for key, values in result.items() if isinstance(values, list)}
    ids["maps"] = {x["id"] for x in source_maps}
    broken_battles = {b["id"]: sorted({p["characterId"] for p in b.get("participants", [])
                       if p.get("characterId") and p["characterId"] not in ids["characters"]})
                      for b in result["battles"]}
    broken_battles = {k: v for k, v in broken_battles.items() if v}
    tasks_xml = ET.parse(source / "newbie.xml").getroot().findall("task")
    task_ids = [t.get("name") for t in tasks_xml]
    dependencies, failures, compiled = {}, {}, {}
    name_ids = {}
    for c in result["characters"]:
        name_ids.setdefault(c.get("name", c["id"]), []).append(c["id"])

    def condition(node):
        kind, value = node.get("type"), node.get("value", "")
        if kind == "in_newbie_task":
            if value not in task_ids:
                raise ValueError(f"unknown newbie task: {value}")
            return f"has_flag({quote('newbie_' + value)})"
        if kind in {"in_team", "not_in_team"}:
            candidates = name_ids.get(value, [value])
            expression = "(" + " || ".join(f"in_team({quote(c)})" for c in candidates) + ")"
            return "!" + expression if kind == "not_in_team" else expression
        if kind in {"daode_more_than", "daode_less_than", "have_money", "have_yuanbao"}:
            variable = {"have_money": "silver", "have_yuanbao": "yuanbao"}.get(kind, "morality")
            return f"{variable} {'<' if kind.endswith('less_than') else '>='} {int(value)}"
        if kind == "not_have_item":
            return f"item_count({quote(value)}) == 0"
        if kind == "probability":
            amount = int(value)
            if not 0 <= amount <= 100:
                raise ValueError(f"invalid probability: {value}")
            return f"chance({amount / 100:g})"
        if kind == "rank":
            return f"rank != -1 && rank <= {int(value)}"
        if kind in {"haogan_more_than", "haogan_less_than"}:
            parts = value.split("#")
            character, amount = ("女主", parts[0]) if len(parts) == 1 else parts
            return f"favorability({quote(character)}) {'<' if kind.endswith('less_than') else '>='} {int(amount)}"
        if kind and any(kind == f"{stat}_{op}_than" for stat in ("dingli", "wuxing", "jianfa", "quanzhang", "daofa", "qimen") for op in ("greater", "less")):
            character, amount = value.split("#")
            stat = kind.split("_")[0]
            return character_guard(character, f"character_stat({quote(character)}, {quote(stat)}) {'<' if '_less_' in kind else '>='} {int(amount)}")
        return build_condition_expression(kind, value)

    def command(call):
        return {"kind": "command", "call": call}

    def require(collection, identifier):
        if identifier not in ids[collection]:
            raise ValueError(f"unknown {collection}: {identifier}")

    def battle(identifier):
        require("battles", identifier)
        if identifier in broken_battles:
            raise ValueError(f"battle {identifier} missing characters: {', '.join(broken_battles[identifier])}")

    def exits(nodes, story_id):
        # Legacy tests results in document order; the first successful branch wins.
        cases, fallback = [], []
        for node in nodes:
            kind, value = node.get("type"), node.get("value", "")
            if kind == "story":
                if value not in records:
                    raise ValueError(f"unknown story: {value}")
                dependencies[story_id].add(value)
                steps = [{"kind": "jump", "target": value}]
            elif kind == "map":
                require("maps", value)
                steps = [command(f"map({quote(value)})")]
            elif kind == "tutorial":
                # GameEngine's tutorial scene first enters the world, then
                # executes original_教学开始; a map-only result drops teaching.
                require("maps", "大地图")
                dependencies[story_id].add("original_教学开始")
                steps = [command(f"map({quote('大地图')})"), {"kind": "jump", "target": "original_教学开始"}]
            elif kind == "shop":
                require("shops", value)
                steps = [command(f"shop({quote(value)})")]
            elif kind in {"tower", "trial", "zhenlongqiju", "xilian", "huashan"}:
                steps = [command({"tower": "tower()", "trial": "trial()", "zhenlongqiju": "zhenlongqiju()", "xilian": "refine()", "huashan": "huashan()"}[kind])]
                if kind == "huashan":
                    dependencies[story_id].add("original_华山论剑分枝判断")
                if kind == "zhenlongqiju":
                    dependencies[story_id].update({"珍珑棋局_胜利", "珍珑棋局_失败"})
                if kind == "trial":
                    dependencies[story_id].update({"original_试炼之地.失败", "霹雳堂_胜利"})
            elif kind == "arena":
                # test_ARENA is a legacy scene key, not a callback story.
                steps = [command("arena()")]
            elif kind == "game" and value in {"levelup", "qinggong", "dianxue"}:
                steps = [command(f"minigame({quote(value)})")]
            elif kind in {"restart", "nextZhoumu", "gameFin", "gameOver", "mainmenu"}:
                mode = {"restart": "restart", "nextZhoumu": "next", "gameFin": "complete", "gameOver": "gameover", "mainmenu": "title"}[kind]
                steps = [command(f"legacy_flow({quote(mode)})")]
            else:
                raise ValueError(f"unsupported result: {kind} ({value})")
            conditions = node.findall("condition")
            if conditions:
                cases.append({"when": " && ".join(f"({condition(c)})" for c in conditions), "steps": steps})
            else:
                fallback = steps
                break
        return [{"kind": "branch", "cases": cases, "fallback": fallback}] if cases else fallback

    def simple_action(action, story_id):
        kind, value = action.get("type"), action.get("value", "")
        parts = value.split("#")
        if kind == "DIALOG":
            speaker, separator, text = value.partition("#")
            if not separator or not text:
                raise ValueError("invalid dialogue")
            return [{"kind": "dialogue", "speaker": speaker, "text": text}]
        if kind in {"BACKGROUND", "MUSIC", "SUGGEST", "LOG", "SHOP", "NICK"}:
            if kind == "SHOP":
                require("shops", value)
            if kind == "NICK":
                if value not in achievements:
                    raise ValueError(f"unknown original achievement: {value}")
                return [command(f"legacy_nick({quote(value)})")]
            call = {"LOG": "journal"}.get(kind, kind.lower())
            return [command(f"{call}({quote(value)})")]
        if kind == "ITEM":
            require("items", parts[0])
            return [command(f"item({quote(parts[0])}, {int(parts[1]) if len(parts) > 1 else 1})")]
        if kind in {"GET_MONEY", "COST_MONEY", "YUANBAO", "DAODE", "COST_DAY"}:
            call = {"GET_MONEY": "change_silver", "COST_MONEY": "change_silver", "YUANBAO": "change_yuanbao", "DAODE": "change_morality", "COST_DAY": "advance_days"}[kind]
            amount = int(value) * (-1 if kind == "COST_MONEY" else 1)
            return [command(f"{call}({amount})")]
        if kind == "NEWBIE":
            if value not in task_ids:
                raise ValueError(f"unknown newbie task: {value}")
            return [command(f"legacy_newbie({quote(value)})")]
        if kind in {"JOIN", "FOLLOW", "LEAVE", "LEAVE_FOLLOW"}:
            require("characters", value)
            return [command(f"{'leave_follower' if kind == 'LEAVE_FOLLOW' else kind.lower()}({quote(value)})")]
        if kind == "LEAVE_ALL":
            return [command("leave_all()")]
        if kind == "SELECT_MENPAI":
            return [command("select_sect()")]
        if kind == "MENPAI":
            # Original 少林派 stores 少林寺 as its runtime sect ID.
            return [command(f"set_sect({quote(value)})")]
        if kind == "GROWTEMPLATE":
            require("characters", parts[0]); require("growTemplates", parts[1])
            return [command(f"set_growth({quote(parts[0])}, {quote(parts[1])})")]
        if kind in {"SET_FLAG", "CLEAR_FLAG"}:
            if value == "NO_GLOBAL_EVENT":
                return [command(f"world_triggers({'false' if kind == 'SET_FLAG' else 'true'})")]
            return [command(f"{'set_flag' if kind == 'SET_FLAG' else 'clear_flag'}({quote(value)})")]
        if kind == "SET_TIME_KEY":
            if len(parts) not in {2, 3}:
                raise ValueError(f"invalid SET_TIME_KEY: {value}")
            if len(parts) == 3:
                if parts[2] not in records:
                    raise ValueError(f"unknown time-key story: {parts[2]}")
                dependencies[story_id].add(parts[2])
            return [command(f"set_time_key({quote(parts[0])}, {int(parts[1])}, {quote(parts[2] if len(parts) == 3 else '')})")]
        if kind == "HAOGAN":
            character, amount = ("女主", parts[0]) if len(parts) == 1 else parts
            return [command(f"change_favorability({quote(character)}, {int(amount)})")]
        if kind == "CHANGE_FEMALE_NAME":
            require("characters", "女主")
            return [command(f"legacy_rename_heroine({quote(value)})")]
        if kind == "GET_POINT":
            return [command(f"grant_points({quote(parts[0])}, {int(parts[1])})")]
        if kind == "MAXLEVEL":
            if parts[0] not in ids["externalSkills"] | ids["internalSkills"]:
                raise ValueError(f"unknown maxlevel skill: {parts[0]}")
            # Stable once key prevents replay/import from duplicating account rewards.
            return [command(f"legacy_maxlevel({quote(parts[0])}, {int(parts[1])}, {quote('legacy.' + story_id + '.' + parts[0])})")]
        if kind in {"LEARN.SKILL", "LEARN.INTERNALSKILL", "LEARN.TALENT", "LEARN.SPECIALSKILL", "REMOVE.TALENT", "UPGRADE.SKILL", "UPGRADE.INTERNALSKILL"}:
            collection, call = {
                "LEARN.SKILL": ("externalSkills", "learn_external"), "LEARN.INTERNALSKILL": ("internalSkills", "learn_internal"),
                "LEARN.TALENT": ("talents", "learn_talent"), "LEARN.SPECIALSKILL": ("specialSkills", "learn_special"),
                "REMOVE.TALENT": ("talents", "remove_talent"), "UPGRADE.SKILL": ("externalSkills", "upgrade_external"),
                "UPGRADE.INTERNALSKILL": ("internalSkills", "upgrade_internal"),
            }[kind]
            require("characters", parts[0]); require(collection, parts[1])
            amount = f", {int(parts[2]) if len(parts) > 2 else 1}" if collection in {"externalSkills", "internalSkills"} else ""
            return [command(f"{call}({quote(parts[0])}, {quote(parts[1])}{amount})")]
        if kind.startswith("UPGRADE."):
            stat = {"MAXHP": "max_hp", "MAXMP": "max_mp"}.get(kind[8:], kind[8:])
            if stat not in {"max_hp", "max_mp", "定力", "福缘", "拳掌", "奇门", "剑法", "刀法", "臂力", "悟性", "根骨", "身法"}:
                raise ValueError(f"unsupported stat action: {kind}")
            require("characters", parts[0])
            return [command(f"change_stat({quote(parts[0])}, {quote(stat)}, {int(parts[1])})")]
        if kind == "COST_ITEM":
            require("items", parts[0])
            return [command(f"remove_item({quote(parts[0])}, {int(parts[1]) if len(parts) > 1 else 1})")]
        if kind == "SET_MAP":
            require("maps", value)
            return [command(f"map({quote(value)})")]
        if kind == "ANIMATION":
            require("characters", parts[0])
            return [command(f"set_model({quote(parts[0])}, {quote(parts[1])})")]
        if kind == "HEAD":
            character, portrait = ("主角", parts[0]) if len(parts) == 1 else parts
            require("characters", character)
            return [command(f"set_portrait({quote(character)}, {quote(portrait)})")]
        if kind in {"EFFECT", "SHAKE"}:
            # Presentation-only requests are recorded; no legacy sound is shipped.
            return [command(f"legacy_presentation({quote(kind)}, {quote(value)})")]
        raise ValueError(f"unsupported action: {kind} ({value})")

    def compile_story(name, story):
        actions, results = story.findall("action"), story.findall("result")

        def sequence(index=0, ret="0"):
            steps = []
            for i in range(index, len(actions)):
                a = actions[i]
                kind, value = a.get("type"), a.get("value", "")
                if kind == "SELECT":
                    speaker, prompt, *options = value.split("#")
                    if not options:
                        raise ValueError("choice has no options")
                    # Legacy results are resolved AFTER all actions, including
                    # MENPAI following SELECT in the original 少林入门 segment.
                    steps.append({"kind": "choice", "prompt": {"speaker": speaker, "text": prompt}, "blocks": [{"kind": "options", "options": [
                        {"text": text, "steps": sequence(i + 1, str(number))} for number, text in enumerate(options)
                    ]}]})
                    return steps
                if kind == "BATTLE":
                    battle(value)
                    steps.append({"kind": "battle", "battleId": value, "outcomes": {outcome: sequence(i + 1, outcome) for outcome in ("win", "lose", "timeout")}})
                    return steps
                steps.extend(simple_action(a, name))
            steps.extend(exits([r for r in results if r.get("ret", "0") == ret], name))
            return steps

        return {"name": name, "steps": sequence()}

    for name, (_, story) in records.items():
        dependencies[name] = set()
        try:
            compiled[name] = compile_story(name, story)
        except (ValueError, KeyError, IndexError) as error:
            failures[name] = {"source": records[name][0], "reason": str(error)}
    # The proven opening is retained verbatim; it has no deferred dependencies.
    for segment in opening["segments"]:
        compiled[segment["name"]] = copy.deepcopy(segment)
        failures.pop(segment["name"], None)
        dependencies[segment["name"]] = {r.get("value") for r in records[segment["name"]][1].findall("result") if r.get("type") == "story"}
    direct_failures = copy.deepcopy(failures)
    changed = True
    while changed:
        changed = False
        for name in compiled:
            if name in failures:
                continue
            blocked = sorted(target for target in dependencies[name] if target in failures)
            if blocked:
                failures[name] = {"source": records[name][0], "reason": "blocked story dependencies", "targets": blocked}
                changed = True
    accepted = {name for name in compiled if name not in failures}
    # Preserve explicitly named previous browser adaptations for save continuity.
    adaptations = [s for script in result["storyScripts"].values() for s in script["segments"] if s["name"].startswith("browser_")]
    for segment in adaptations:
        if segment["name"] == "browser_新手章节回顾":
            segment["steps"] = [command("suggest('入门体验告一段落。原版买药教学、门派选择和其他江湖地点已逐步接入；可继续完成南贤的原版任务。尚未迁移的特殊流程不会被当作已完成。')")]
    result["storyScripts"] = {"legacy": {"version": 3, "segments": [compiled[n] for n in records if n in accepted] + adaptations}}

    deferred_events, accepted_events, maps = [], 0, []
    original_maps = {m.get("name"): m for m in ET.parse(source / "maps.xml").getroot().findall("map")}
    # The reference map converter already removes this malformed original
    # event. Keep it in the audit so migrated + deferred still equals source.
    for map_id, raw_map in original_maps.items():
        for unit in raw_map.findall("mapunit"):
            for index, event in enumerate(unit.findall("event"), 1):
                if event.get("type") == "not_has_time_key":
                    deferred_events.append({"map": map_id, "location": unit.get("name"), "eventId": f"source-{index}", "reason": "invalid legacy event action type: not_has_time_key"})
    for original in source_maps:
        current = copy.deepcopy(original)
        raw_locations = {u.get("name"): u for u in original_maps[current["id"]].findall("mapunit")}
        if current["id"] == "大地图":
            current["defaultLocation"] = "南贤居"
        for location in current["locations"]:
            raw_events = [e for e in raw_locations[location["id"]].findall("event") if e.get("type") != "not_has_time_key"]
            events = []
            for event, raw in zip(location["events"], raw_events, strict=True):
                kind, value = raw.get("type"), raw.get("value", "")
                try:
                    if kind == "story" and value not in accepted:
                        raise ValueError("story deferred: " + value)
                    if kind == "battle":
                        battle(value)
                    if kind == "xiangzi":
                        event["action"] = "chest()"
                    event["when"] = " && ".join(f"({condition(c)})" for c in raw.findall("condition")) or "true"
                    probability = int(raw.get("probability", "100"))
                    if probability != 100:
                        event["when"] += f" && chance({probability / 100:g})"
                    events.append(event)
                    accepted_events += 1
                except (ValueError, KeyError) as error:
                    deferred_events.append({"map": current["id"], "location": location["id"], "eventId": event["id"], "reason": str(error)})
            location["events"] = events
        maps.append(current)
    for current in maps:
        if not current["locations"]:
            current["locations"].append({"id": "browser-empty-map-exit", "name": "返回大地图", "description": "原始地图没有配置事件，可返回继续探索。", "events": [{"id": "browser-empty-map-exit", "action": "map('大地图')"}]})
    # Save-compatible browser practice remains explicitly separate from legacy events.
    home = next(m for m in maps if m["id"] == "南贤居")
    old_home = next(m for m in result["maps"] if m["id"] == "南贤居")
    home["locations"].extend(copy.deepcopy(l) for l in old_home["locations"] if l["id"] in {"结伴练习", "章节回顾"})
    result["maps"] = maps
    # Existing browser saves remember 南贤屋内 with its opening 南贤 event. The
    # original event remains; the old one-time 300-silver reward cannot be farmed.
    inside = next(m for m in maps if m["id"] == "南贤屋内")
    inside["locations"].append({"id": "出村", "name": "出村", "description": "返回江湖地图。", "events": [
        {"id": "browser-return-world", "action": "map('大地图')", "when": "story_completed('original_新手引导.任务买药') || story_completed('original_门派选择')"},
    ]})
    for m in maps:
        if m["id"] == "南贤屋内":
            for location in m["locations"]:
                for event in location["events"]:
                    if event["action"] == "story('新手村_南贤')":
                        event["when"] += " && !story_completed('original_新手引导.任务买药') && !story_completed('original_门派选择')"

    tasks = []
    for t in tasks_xml:
        target = t.find("result").get("value")
        if target not in accepted:
            continue
        tasks.append({"id": t.get("name"), "description": t.get("description"), "locations": [l.get("name") for l in t.findall("location")],
                      "when": " || ".join("(" + " && ".join(condition(c) for c in f.findall("condition")) + ")" for f in t.findall("finish")), "storyId": target})
    triggers, deferred_triggers = [], []
    for index, raw in enumerate(ET.parse(source / "globaltrigger.xml").getroot().findall("trigger"), 1):
        target = raw.get("story")
        if target not in accepted:
            deferred_triggers.append(target)
            continue
        triggers.append({"id": f"legacy-global-{index}", "action": f"story({quote(target)})", "when": " && ".join(f"({condition(c)})" for c in raw.findall("condition")), "repeatMode": "once"})
    result["worldTriggers"] = triggers
    metadata = result["browser"]
    metadata.update({"subtitle": "原版江湖", "chapterTitle": "原版江湖 · 教学与拜师", "description": "原版剧情、地图事件和门派流程持续迁移；西方试验暂停扩展。", "legacyTasks": tasks})
    metadata["media"]["defaultEnemy"] = "art/hero-swordsman.png"
    report = {
        "baseline": {"stories": len(records), "maps": len(source_maps), "mapEvents": sum(len(u.findall('event')) for m in original_maps.values() for u in m.findall('mapunit')), "battles": len(result["battles"]) - 1, "characters": len(result["characters"]), "items": len(result["items"]), "sects": len(result["sects"]), "worldTriggers": 21},
        "previous": {"originalStories": 35, "maps": 6},
        "structurallyMigrated": {"originalStories": len(accepted), "maps": len(maps), "mapEvents": accepted_events, "worldTriggers": len(triggers), "newbieTasks": len(tasks)},
        "deferredStories": failures, "directStoryFailures": direct_failures,
        "achievementTextFallbacks": sorted(missing_achievement_descriptions),
        "deferredMapEvents": deferred_events, "deferredWorldTriggers": deferred_triggers, "brokenBattleReferences": broken_battles,
        "actionCounts": dict(Counter(a.get("type") for _, s in records.values() for a in s.findall("action"))),
        "notes": ["Structural compilation and dependency closure do not prove full playability or original-rule equivalence.", "All 14 verified opening segments remain unchanged. Browser-authored practice IDs remain for existing saves.", "All original destinations use Core large-map distance and time progression; media resolution is a separate build step.", "Unsupported commands, malformed source and missing references are quarantined with their callers; no successful no-op completion."]}
    metadata["migration"] = {"stories": len(accepted), "totalStories": len(records), "maps": len(maps), "totalMaps": len(source_maps), "deferredStories": len(failures)}
    return result, report
