"""Build a source-backed companion guide, including ordered branch blockers.

All JOIN/FOLLOW instructions are retained. A route is a source reference, not
proof that a character can be recruited immediately in the current save.
"""
from collections import defaultdict, deque
import xml.etree.ElementTree as ET

STORY_FILES = ("storys.xml", "storysCG.xml", "storysPY.xml")
NORMAL_VERIFIED = {"钟灵", "田伯光", "胡斐", "郭靖", "程灵素", "阎基", "令狐冲"}
ISOLATED_VERIFIED = {"田青文", "王语嫣"}


def story_label(value):
    for prefix, title in [("original_", ""), ("tlbb.dy_", "天龙八部·"), ("tlbb.xz_", "天龙八部·"),
                          ("sdxl_", "神雕侠侣·"), ("yttlj_", "倚天屠龙·"), ("bixuejianShyou_", "碧血剑·")]:
        if value.startswith(prefix):
            return title + value[len(prefix):].replace(".", "·").replace("_", "·")
    return value.replace("_", "·").replace(".", "·")


def condition_record(node):
    kind, value = node.get("type", ""), node.get("value", "")
    labels = {
        "should_finish": f"已完成：{story_label(value)}", "should_not_finish": f"尚未完成：{story_label(value)}",
        "in_team": f"{value}在参战或随行队伍中", "not_in_team": f"{value}不在参战或随行队伍中",
        "key_in_team": f"指定角色{value}在参战或随行队伍中", "key_not_in_team": f"指定角色{value}不在参战或随行队伍中",
        "daode_more_than": f"道德 ≥ {value}", "daode_less_than": f"道德 < {value}",
        "have_money": f"银两 ≥ {value}", "have_yuanbao": f"元宝 ≥ {value}",
        "have_item": f"持有物品：{value}", "not_have_item": f"未持有物品：{value}",
        "in_round": f"当前为第{value}周目", "not_in_round": f"当前不是第{value}周目",
        "zhoumu_greater_than": f"周目 ≥ {value}", "zhoumu_less_than": f"周目 < {value}",
        "exceed_day": f"已度过天数 > {value}", "not_exceed_day": f"已度过天数 ≤ {value}",
        "probability": f"本次随机条件：{value}%", "in_menpai": f"所属门派：{value}",
        "not_in_menpai": f"不属于门派：{value}", "in_newbie_task": f"正在进行新手任务：{value}",
        "rank": f"竞技排名不低于第{value}名", "game_mode": f"游戏难度条件：{value}",
        "has_time_key": f"存在剧情计时：{value}", "not_has_time_key": f"不存在剧情计时：{value}",
        "follow_story": f"上一段剧情为：{story_label(value)}", "has_flag": f"已有剧情标记：{value}",
        "not_has_flag": f"尚无剧情标记：{value}",
        "in_time": f"当前时辰属于：{value.replace('#', '、')}",
        "not_in_time": f"当前时辰不属于：{value.replace('#', '、')}",
    }
    if kind in {"haogan_more_than", "haogan_less_than"}:
        parts = value.split("#");who, amount = parts if len(parts) == 2 else ("女主", value)
        labels[kind] = f"{who}好感 {'≥' if kind.endswith('more_than') else '<'} {amount}"
    stat_names = {"dingli": "定力", "wuxing": "悟性", "jianfa": "剑法", "quanzhang": "拳掌", "daofa": "刀法", "qimen": "奇门"}
    for stat, name in stat_names.items():
        for suffix, op in [("greater_than", "≥"), ("less_than", "<")]:
            if kind == f"{stat}_{suffix}":
                parts = value.split("#");labels[kind] = f"{'的'.join(parts[:-1])}{name} {op} {parts[-1]}"
    return {"type": kind, "value": value, "label": labels.get(kind, f"原条件：{kind} = {value}"), "translated": kind in labels}


def build_catalog(package, source, world_audit):
    stories, files = {}, {}
    for filename in STORY_FILES:
        for node in ET.parse(source / filename).getroot().findall("story"):
            stories[node.get("name")] = node;files[node.get("name")] = filename
    accepted = {segment["name"] for script in package["storyScripts"].values() for segment in script["segments"]}
    incoming, edges, roots, departures = defaultdict(list), {}, defaultdict(list), defaultdict(list)
    joins = defaultdict(list)
    for sid, story in stories.items():
        results = story.findall("result")
        actions = story.findall("action")
        for index, action in enumerate(actions):
            kind, value = action.get("type"), action.get("value", "")
            if kind in {"JOIN", "FOLLOW"}:
                joins[value].append({"storyId": sid, "kind": kind, "actionIndex": index})
            if kind in {"LEAVE", "LEAVE_FOLLOW"}:
                departures[value].append({"storyId": sid, "kind": kind, "label": story_label(sid)})
        for index, result in enumerate(results):
            if result.get("type") != "story" or result.get("value") not in stories: continue
            target, ret = result.get("value"), result.get("ret", "0")
            eid = f"{sid}:{index}"
            earlier = [r for r in results[:index] if r.get("ret", "0") == ret]
            choices = [a.get("value", "").split("#")[2:] for a in actions if a.get("type") == "SELECT"]
            label = "继续剧情"
            if ret in {"win", "lose"}:
                touch = any(a.get("type") == "TOUCH" for a in actions)
                label = ("点穴成功" if ret == "win" else "点穴失败") if touch else ("战斗胜利" if ret == "win" else "战斗失败")
            elif choices and ret.isdigit() and int(ret) < len(choices[-1]): label = "选择：" + choices[-1][int(ret)]
            elif ret == "0" and any(a.get("type") in {"BATTLE", "TOUCH"} for a in actions): label = "原默认结果分支（仍须完成战斗或点穴）"
            elif ret not in {"0", ""}: label = f"原结果分支：{ret}"
            blockers = [{"conditions": [condition_record(c) for c in r.findall("condition")], "destination": story_label(r.get("value", ""))} for r in earlier]
            edges[eid] = {"from": sid, "to": target, "label": label,
                "conditions": [condition_record(c) for c in result.findall("condition")], "earlierBranches": blockers,
                "shadowed": any(not r.findall("condition") for r in earlier)}
            # Derive only simple local morality bounds. Negating a multi-term
            # AND is not equivalent to negating every term separately.
            lower, upper = None, None
            constraints = [(c, False) for c in result.findall("condition")]
            constraints += [(r.findall("condition")[0], True) for r in earlier if len(r.findall("condition")) == 1]
            for c, negated in constraints:
                kind, value = c.get("type"), c.get("value", "")
                if kind not in {"daode_more_than", "daode_less_than"}: continue
                amount = int(value)
                if (kind == "daode_more_than") != negated: lower = amount if lower is None else max(lower, amount)
                else: upper = amount if upper is None else min(upper, amount)
            if lower is not None or upper is not None: edges[eid]["moralityWindow"] = {"minimumInclusive": lower, "maximumExclusive": upper}
            incoming[target].append(eid)
    for map_node in ET.parse(source / "maps.xml").getroot().findall("map"):
        for unit in map_node.findall("mapunit"):
            events = unit.findall("event")
            for index, event in enumerate(events):
                if event.get("type") != "story": continue
                sid = event.get("value", "")
                earlier = [{"storyId": ev.get("value", ""), "label": story_label(ev.get("value", "")), "kind": ev.get("type"), "repeat": ev.get("repeat", ""),
                    "conditions": [condition_record(c) for c in ev.findall("condition")], "probability": int(ev.get("probability", "100"))}
                    for ev in events[:index]]
                roots[sid].append({"id": f"{map_node.get('name')}/{unit.get('name')}/{index}",
                    "map": map_node.get("name"), "location": unit.get("name"), "storyId": sid,
                    "conditions": [condition_record(c) for c in event.findall("condition")],
                    "probability": int(event.get("probability", "100")), "repeat": event.get("repeat", ""), "earlierEvents": earlier})
    # Preserve all ancestor branches, then enumerate source paths from each map
    # entry. Cycles are exposed and never silently interpreted as an open route.
    all_nodes, all_edges = {}, {}
    characters = {c["id"]: c for c in package["characters"]}
    output = []
    for cid, instructions in joins.items():
        character = characters[cid];routes = []
        for instruction in instructions:
            target = instruction["storyId"];ancestors = {target};queue = deque([target])
            while queue:
                for eid in incoming[queue.popleft()]:
                    parent = edges[eid]["from"]
                    if parent not in ancestors: ancestors.add(parent);queue.append(parent)
            ancestor_edges = {eid: edge for eid, edge in edges.items() if edge["from"] in ancestors and edge["to"] in ancestors}
            for sid in ancestors:
                actions = []
                for index, a in enumerate(stories[sid].findall("action")):
                    if a.get("type") in {"BATTLE", "TOUCH", "COST_MONEY", "COST_ITEM", "COST_DAY", "DAODE", "SET_TIME_KEY", "SELECT"}:
                        actions.append({"type": a.get("type"), "value": a.get("value", ""), "index": index})
                all_nodes[sid] = {"id": sid, "label": story_label(sid), "source": files[sid], "runtimeAvailable": sid in accepted, "actions": actions}
            all_edges.update(ancestor_edges)
            entry_points = [root for sid in sorted(ancestors) for root in roots[sid]]
            outgoing = defaultdict(list)
            for eid, edge in ancestor_edges.items(): outgoing[edge["from"]].append(eid)
            paths, cycles = [], set()
            def walk(sid, seen, path, entry):
                if sid == target:
                    paths.append({"entry": entry, "edges": path, "shadowed": any(edges[e]["shadowed"] for e in path)});return
                for eid in outgoing[sid]:
                    next_id = edges[eid]["to"]
                    if next_id in seen: cycles.add(next_id);continue
                    walk(next_id, seen | {next_id}, path + [eid], entry)
            for entry in entry_points: walk(entry["storyId"], {entry["storyId"]}, [], entry)
            routes.append({**instruction, "runtimeAvailable": target in accepted,
                "paths": paths, "ancestorIds": sorted(ancestors), "cycles": sorted(cycles),
                "debug": target.startswith("test_"), "hasMapEntry": bool(entry_points)})
        media = package["browser"].get("media", {})
        output.append({"id": cid, "name": "女主" if cid == "女主" else character["name"], "variant": cid if cid != character["name"] else "",
            "portrait": media.get("portraits", {}).get(cid), "routes": routes,
            "departures": departures[cid], "verification": "normal" if cid in NORMAL_VERIFIED else "isolated" if cid in ISOLATED_VERIFIED else "unverified"})
    output.sort(key=lambda c: (c["verification"] != "normal", c["name"], c["id"]))
    journal_stories = sorted({r["storyId"] for c in output for r in c["routes"] if r["runtimeAvailable"]})
    package["browser"]["companionRecruitmentStories"] = journal_stories
    return {"schemaVersion": 1, "sourceCommit": "b41198219087858ece19d5484f5061e0289c47bc",
        "scope": "Source JOIN/FOLLOW instructions and map-entry branch graphs. Not an immediate recruitment predicate or full playthrough proof.",
        "counts": {"characterForms": len(output), "instructions": sum(len(c["routes"]) for c in output),
            "normalVerified": len(NORMAL_VERIFIED), "isolatedVerified": len(ISOLATED_VERIFIED)},
        "characters": output, "nodes": all_nodes, "edges": all_edges}
