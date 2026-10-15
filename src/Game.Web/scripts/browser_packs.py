"""Browser chapter assembly; the legacy export remains an untouched reference.

The tutorial extension uses XML from the same pinned baseline. Any newly authored
bridge or encounter is explicitly named browser_* and reported as an adaptation.
"""
from __future__ import annotations

import copy
import xml.etree.ElementTree as ET


JYX_STORIES = {
    "新手村_南贤", "新手村_南贤_出村", "新手村_南贤_善恶之分",
    "新手村_南贤_募集队友", "新手村_南贤_DOS版", "新手村_南贤_目标", "新手村_南贤_打一架",
    "original_教学开始", "original_新手引导.开始", "original_新手引导.任务买药",
    "original_新手引导.买药", "original_新手引导.买药拳", "original_新手引导.买药剑",
    "original_新手引导.买药刀", "original_新手引导.买药奇门", "original_新手引导.买药继续",
    "杂货店_商店教程", "tlbb.dy_钟灵", "tlbb.dy_钟灵找", "tlbb.dy_钟灵不找", "tlbb.dy_钟灵不找2",
}


def assemble_jyx(package: dict, source_maps: list[dict], source, script: dict) -> dict:
    from expression_dsl import build_condition_expression, quote

    result = copy.deepcopy(package)
    migrated = copy.deepcopy(script)
    selected = JYX_STORIES | {segment["name"] for segment in migrated["segments"]}

    def condition(element: ET.Element) -> str:
        if element.get("type") == "in_newbie_task":
            return f"has_flag({quote('newbie_' + element.get('value', ''))})"
        return build_condition_expression(element.get("type"), element.get("value"))

    def exits(nodes: list[ET.Element]) -> list[dict]:
        cases, fallback = [], []
        for node in nodes:
            target, kind = node.get("value"), node.get("type")
            if kind == "story":
                if target not in selected:
                    raise ValueError(f"Unmigrated chapter target: {target}")
                steps = [{"kind": "jump", "target": target}]
            elif kind == "map":
                steps = [{"kind": "command", "call": f"map({quote(target)})"}]
            else:
                raise ValueError(f"Unmigrated chapter result: {kind}")
            if list(node):
                cases.append({"when": " && ".join(condition(c) for c in node), "steps": steps})
            elif not fallback:
                fallback = steps
        return [{"kind": "branch", "cases": cases, "fallback": fallback}] if cases else fallback

    for filename in ("storys.xml", "storysCG.xml", "storysPY.xml"):
        for story in ET.parse(source / filename).getroot().findall("story"):
            name = story.get("name")
            if name not in JYX_STORIES:
                continue
            results = story.findall("result")
            steps, consumed = [], False
            for action in story.findall("action"):
                kind, value = action.get("type"), action.get("value", "")
                if kind == "DIALOG":
                    speaker, _, text = value.partition("#")
                    steps.append({"kind": "dialogue", "speaker": speaker, "text": text})
                elif kind == "SELECT":
                    speaker, text, *options = value.split("#")
                    choices = []
                    for index, option in enumerate(options):
                        branches = [r for r in results if r.get("ret") == str(index)]
                        # Keep the original text and position, but explicitly hide
                        # the sect-selection branch until its actual UI exists.
                        unsupported = any(r.get("type") == "story" and r.get("value") not in selected for r in branches)
                        entry = {"text": option, "steps": [] if unsupported else exits(branches)}
                        if unsupported:
                            entry["when"] = "false"
                        choices.append(entry)
                    steps.append({"kind": "choice", "prompt": {"speaker": speaker, "text": text}, "blocks": [{"kind": "options", "options": choices}]})
                    consumed = True
                elif kind == "ITEM":
                    item_id, _, amount = value.partition("#")
                    steps.append({"kind": "command", "call": f"item({quote(item_id)}, {int(amount or 1)})"})
                elif kind == "GET_MONEY":
                    steps.append({"kind": "command", "call": f"change_silver({int(value)})"})
                elif kind == "NEWBIE":
                    steps.append({"kind": "command", "call": f"set_flag({quote('newbie_' + value)})"})
                elif kind == "JOIN":
                    steps.append({"kind": "command", "call": f"join({quote(value)})"})
                elif kind in {"BACKGROUND", "MUSIC", "SUGGEST", "LOG", "SHOP"}:
                    call = {"LOG": "journal"}.get(kind, kind.lower())
                    steps.append({"kind": "command", "call": f"{call}({quote(value)})"})
                else:
                    raise ValueError(f"Unmigrated chapter action: {name} {kind}")
            if not consumed:
                steps.extend(exits([r for r in results if r.get("ret") == "0"]))
            migrated["segments"].append({"name": name, "steps": steps})

    # This is deliberately an explicitly authored browser encounter. The legacy
    # four-enemy battle references missing character ID 经验木头人; substituting
    # 木头人 there would falsely claim that missing definition was recovered.
    result["battles"].append({
        "id": "browser_结伴练习", "name": "结伴练习", "background": "battle_bg/city2",
        "participants": [
            {"position": {"x": 2, "y": 1}, "team": 1, "facing": 1, "partyIndex": 0},
            {"position": {"x": 2, "y": 3}, "team": 1, "facing": 1, "partyIndex": 1},
            {"position": {"x": 7, "y": 2}, "team": 2, "facing": 0, "characterId": "木头人"},
        ],
    })
    migrated["segments"].extend([
        {"name": "browser_结伴练习", "steps": [
            {"kind": "dialogue", "speaker": "主角", "text": "先和伙伴配合一下，再继续闯荡江湖。"},
            {"kind": "battle", "battleId": "browser_结伴练习", "outcomes": {
                "win": [{"kind": "command", "call": "set_flag('browser_team_training_won')"}, {"kind": "command", "call": "map('南贤居')"}],
                "lose": [{"kind": "command", "call": "map('南贤居')"}],
            }},
        ]},
        {"name": "browser_新手章节回顾", "steps": [
            {"kind": "command", "call": "suggest('本章开放了剧情、装备、修炼、结伴与交易。可以对照旅程目标补完尚未尝试的内容，并保存旅程；寻找闪电貂和门派拜师将在后续章节开放。')"},
        ]},
    ])
    result["storyScripts"] = {"starter": migrated}

    supported_maps = {"南贤屋内", "小村", "南贤居", "大地图", "洛阳", "万劫谷"}
    supported_shops = {"新手村.杂货店", "洛阳.商店"}
    maps = []
    for original in source_maps:
        if original["id"] not in supported_maps:
            continue
        current = copy.deepcopy(original)
        if current["id"] == "大地图":
            current["kind"] = "small"  # Browser chapter uses destination cards.
            current.pop("travelSpeed", None)
            current.pop("defaultLocation", None)
            current["description"] = "有人的地方，就是江湖！本章可前往洛阳、万劫谷与南贤居；其他地区将随章节开放。"
        locations = []
        for location in current["locations"]:
            events = []
            for event in location["events"]:
                action = event["action"]
                allowed = any(action == f"{call}({quote(target)})" for call, targets in (("story", selected), ("map", supported_maps), ("shop", supported_shops)) for target in targets)
                if allowed:
                    events.append(event)
            location["events"] = events
            if events:
                locations.append(location)
        current["locations"] = locations
        maps.append(current)
    # Rebuild the one supported legacy newbie condition from XML rather than
    # accepting the reference converter's deliberately deferred `false`.
    for current in maps:
        for location in current["locations"]:
            for event in location["events"]:
                if event["action"] == "story('original_新手引导.买药')":
                    event["when"] = "has_flag('newbie_购买物品')"
                if current["id"] == "南贤屋内" and event["action"] == "story('新手村_南贤')":
                    event["when"] = "!story_completed('original_新手引导.任务买药')"
        if current["id"] == "南贤屋内":
            current["locations"].append({"id": "出村", "name": "出村", "description": "返回已经开放的江湖地图。", "events": [
                {"id": "browser-return-world", "action": "map('大地图')", "when": "story_completed('original_新手引导.任务买药')"},
            ]})
    home = next(m for m in maps if m["id"] == "南贤居")
    home["locations"].append({"id": "结伴练习", "name": "结伴练习", "description": "本章新增的伙伴配合练习；使用原木头人规则。", "events": [
        {"id": "browser-team-training", "action": "story('browser_结伴练习')", "when": "in_team('钟灵')"},
    ]})
    home["locations"].append({"id": "章节回顾", "name": "章节回顾", "description": "回顾本章，准备下一段旅程。", "events": [
        {"id": "browser-chapter-review", "action": "story('browser_新手章节回顾')", "when": "has_flag('browser_team_training_won')"},
    ]})
    result["maps"] = maps
    result["browser"] = {
        "id": "jyx", "title": "金庸群侠传 X", "subtitle": "初入江湖", "chapterTitle": "初入江湖 · 新手章节",
        "description": "原版开场与规则迁移；本章新增结伴训练，门派与后续世界逐步开放。",
        "defaultName": "小虾米", "heroDefinitionId": "主角", "initialMapId": "南贤屋内", "initialStoryId": "新手村_出生",
        "trainingMapId": "小村", "trainingStoryId": "新手村_武师7", "currencyName": "银两", "currencyUnit": "两",
        "terms": {"cultivation": "功法修炼", "internalSkills": "内功", "externalSkills": "外功招式", "energy": "内力"},
        "completionStoryId": "browser_新手章节回顾",
        "media": {"titleBackground": "art/nanxian-retreat.png", "worldBackground": "art/nanxian-retreat.png", "battleBackground": "art/training-courtyard.png", "defaultFriendly": "art/hero-swordsman.png", "defaultEnemy": "art/training-dummy.png", "characters": {"主角": "art/hero-swordsman.png", "木头人": "art/training-dummy.png", "钟灵": "art/green-traveler.png"}, "maps": {}},
        "objectives": [
            {"id": "opening", "title": "听南贤说说这个江湖", "kind": "story", "target": "新手村_小村介绍"},
            {"id": "cultivation", "title": "选择一本秘籍修炼", "kind": "cultivation"},
            {"id": "training", "title": "在武师处完成第一场练习", "kind": "battle", "target": "南贤居_木头人_战斗"},
            {"id": "tutorial", "title": "找南贤出村，接下买药教学", "kind": "story", "target": "original_新手引导.任务买药"},
            {"id": "shopping", "title": "到洛阳商店完成一次交易", "kind": "purchase", "target": "洛阳.商店"},
            {"id": "equipment", "title": "穿上一件装备", "kind": "equipment"},
            {"id": "companion", "title": "去万劫谷邀请钟灵同行", "kind": "party", "target": "钟灵"},
            {"id": "team", "title": "回南贤居完成结伴练习", "kind": "battle", "target": "browser_结伴练习"},
            {"id": "save", "title": "保存这段江湖旅程", "kind": "save"},
        ],
    }
    return result
