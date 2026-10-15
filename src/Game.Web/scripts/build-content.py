#!/usr/bin/env python3
"""Rebuild browser content from the checked-in legacy data submodule.

The legacy directory contains every existing converter's unmodified output.
The runtime package excludes story-dependent world data until its DSL migration
is implemented. starter-world.json is a lossless, attributed XML projection;
it is deliberately separate from the current C# story DSL.
"""
from __future__ import annotations

import argparse
import copy
import importlib
import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import xml.etree.ElementTree as ET

WEB = Path(__file__).resolve().parents[1]
REPO = WEB.parents[1]
LEGACY = REPO / "jyx-legacy-data"
SOURCE = LEGACY / "data-origin"

# package property, output filename, converter module, source XML, entry point
CONVERTERS = [
    ("battles", "battles.json", "battles", "battles.xml", "convert_battles"),
    ("characters", "characters.json", "roles", "roles.xml", "convert_roles"),
    ("externalSkills", "external-skills.json", "skills", "skills.xml", "convert_skills"),
    ("gameTips", "game-tips.json", "game_tips", "resource_suggesttips.xml", "convert_game_tips"),
    ("growTemplates", "grow-templates.json", "grow_templates", "grow_templates.xml", "convert_grow_templates"),
    ("internalSkills", "internal-skills.json", "internal_skills", "internal_skills.xml", "convert_internal_skills"),
    ("legendSkills", "legend-skills.json", "aoyis", "aoyis.xml", "convert_aoyis"),
    ("maps", "maps", "maps", "maps.xml", "convert_maps"),
    ("worldTriggers", "world-triggers.json", "world_triggers", "globaltrigger.xml", "convert_world_triggers"),
    ("resources", "resources.json", "resource", "resource.xml", "convert_resource"),
    ("sects", "sects.json", "menpai", "menpai.xml", "convert_menpai"),
    ("shops", "shops.json", "shops", "shops.xml", "convert_shops"),
    ("specialSkills", "special-skills.json", "special_skills", "special_skills.xml", "convert_special_skills"),
    ("items", "items.json", "items", "items.xml", "convert_items"),
    ("randomAffixTables", "random-affix-tables.json", "equipment_random_affixes", "item_triggers.xml", "convert_tables"),
    ("buffs", "buffs.json", "resource_buffs", "resource.xml", "convert_resource_buffs"),
    ("talents", "talents.json", "resource_talents", "resource.xml", "convert_resource_talents"),
    ("towers", "towers.json", "towers", "towers.xml", "convert_towers"),
]

# Source: X-Heroes-of-Jin-Yong/Assets/Resources/textassets/lua/jygame/main.lua.lua,
# BUFF_LIST; jyx-legacy-dll/JyGame/Buff.cs IsDebuff returns !BUFF_LIST.Contains.
POSITIVE_BUFF_IDS = set("恢复 集气 攻击强化 飘渺 左右互搏 神速攻击 醉酒 溜须拍马 易容 狂战 坚守 沾衣十八跌 圣战 轻身 防御强化 魔神降临 神行".split())


def write_json(path: Path, payload: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def xml_node(element: ET.Element) -> dict:
    """Preserve instruction order and conditions, without interpreting them."""
    node = {"tag": element.tag, **element.attrib}
    if list(element):
        node["children"] = [xml_node(child) for child in element]
    if element.text and element.text.strip():
        node["text"] = element.text.strip()
    return node


def starter_world() -> dict:
    stories = {}
    wanted = lambda name: name.startswith("新手村_") or name in {
        "original_主角之家.殴打木头人", "original_主角之家.殴打练功木头人",
        "original_主角之家.回家", "杂货店_商店教程",
    }
    for filename in ("storys.xml", "storysCG.xml", "storysPY.xml"):
        for story in ET.parse(SOURCE / filename).getroot().findall("story"):
            name = story.get("name", "")
            if wanted(name):
                stories[name] = {
                    "id": name, "source": f"jyx-legacy-data/data-origin/{filename}",
                    "instructions": [xml_node(child) for child in story],
                }
    maps = {}
    for element in ET.parse(SOURCE / "maps.xml").getroot().findall("map"):
        name = element.get("name")
        if name in {"南贤屋内", "小村", "南贤居"}:
            maps[name] = {"id": name, "source": "jyx-legacy-data/data-origin/maps.xml", **xml_node(element)}
    return {
        "schemaVersion": 1,
        "source": "jyx-legacy-data/data-origin (legacy X data; original IDs retained)",
        "entry": {"characterId": "主角", "storyId": "新手村_出生", "mapId": "南贤屋内"},
        "training": {"storyId": "新手村_武师木头人", "battleId": "南贤居_木头人_战斗", "enemyId": "木头人"},
        "scope": "Original opening and trainer dialogue/choices; unimplemented actions must be reported, never silently treated as completed.",
        "supplementalSources": [{
            "archive": "X.rar", "archiveVersionLabel": "X1.0.0.1",
            "entry": "storysLudingji", "reportedStoryCount": 78,
            "status": "discovered separately; not merged with pinned legacy baseline",
        }],
        "maps": maps, "stories": stories,
    }


def starter_script(world: dict) -> dict:
    """Migrate an explicit, closed subset; reject every unsupported action."""
    from expression_dsl import build_condition_expression, quote
    selected = {
        "新手村_出生", "新手村_南贤开场", "新手村_小村介绍", "新手村_武师",
        "新手村_武师选择", "新手村_武师7", "新手村_武师不能打木头人", "新手村_武师木头人",
        *(f"新手村_武师{number}" for number in range(1, 7)),
    }

    def results_steps(results: list[dict]) -> list[dict]:
        if not results:
            return []
        cases = []
        fallback = None
        for result in results:
            target = result["value"]
            if result["type"] == "story":
                if target not in selected:
                    raise ValueError(f"Starter script is not closed: {target}")
                steps = [{"kind": "jump", "target": target}]
            elif result["type"] == "map":
                steps = [{"kind": "command", "call": f"map({quote(target)})"}]
            else:
                raise ValueError(f"Unsupported starter result: {result}")
            conditions = result.get("children", [])
            if conditions:
                when = " && ".join(build_condition_expression(c["type"], c["value"]) for c in conditions)
                cases.append({"when": when, "steps": steps})
            elif fallback is None:
                fallback = steps
        return [{"kind": "branch", "cases": cases, "fallback": fallback}] if cases else (fallback or [])

    segments = []
    for name, story in world["stories"].items():
        if name not in selected:
            continue
        instructions = story["instructions"]
        results = [node for node in instructions if node["tag"] == "result"]
        steps = []
        consumed_results = False
        for action in (node for node in instructions if node["tag"] == "action"):
            kind, value = action["type"], action["value"]
            if kind == "DIALOG":
                speaker, _, text = value.partition("#")
                steps.append({"kind": "dialogue", "speaker": speaker, "text": text})
            elif kind == "SELECT":
                speaker, prompt, *options = value.split("#")
                steps.append({"kind": "choice", "prompt": {"speaker": speaker, "text": prompt}, "blocks": [{"kind": "options", "options": [
                    {"text": text, "steps": results_steps([r for r in results if r.get("ret") == str(index)])}
                    for index, text in enumerate(options)
                ]}]})
                consumed_results = True
            elif kind == "BATTLE":
                steps.append({"kind": "battle", "battleId": value, "outcomes": {
                    outcome: results_steps([r for r in results if r.get("ret") == outcome])
                    for outcome in ("win", "lose")
                }})
                consumed_results = True
            elif kind == "ITEM":
                item_id, separator, amount = value.partition("#")
                steps.append({"kind": "command", "call": f"item({quote(item_id)}, {int(amount) if separator else 1})"})
            elif kind in {"MUSIC", "BACKGROUND", "SUGGEST", "NICK", "LOG"}:
                command = {"LOG": "journal"}.get(kind, kind.lower())
                steps.append({"kind": "command", "call": f"{command}({quote(value)})"})
            else:
                raise ValueError(f"Unsupported starter action {name}: {kind}")
        if not consumed_results:
            steps.extend(results_steps([r for r in results if r.get("ret") == "0"]))
        segments.append({"name": name, "steps": steps})
    assert {segment["name"] for segment in segments} == selected
    return {"version": 3, "segments": segments}


def migrate_random_affix_tables(tables: list[dict]) -> list[dict]:
    """Make ITTrigger.cs's implicit formula branches explicit in current DSL.

    Authoritative formula source: jyx-legacy-dll/JyGame/ITTrigger.cs,
    GenerateItemTrigger. Explicit XML ranges only apply in its final fallback;
    the attack/attribute/weapon/skill/criticalp branches override those ranges.
    """
    migrated = copy.deepcopy(tables)

    def range_(minimum: object, maximum: object) -> dict:
        return {"min": str(minimum), "max": str(maximum)}

    for table in migrated:
        lower, upper = table.pop("minItemLevel"), table.pop("maxItemLevel")
        table["when"] = f"item_level >= {lower} && item_level <= {upper}"
        for option in table["options"]:
            kind = option["kind"]
            ranges = [range_(r["min"], r["max"]) for r in option.get("ranges", [])]
            if kind == "attack_combo":
                ranges = [range_("item_level * (1 + round * 2)", "item_level * 2 * (1 + round * 2)"), range_(1, "item_level")]
            elif kind == "random_attribute":
                ranges = [range_("floor(item_level * (round + 3) / 4) + item_level", "floor(item_level * (round + 3) / 3) + item_level * 2")]
            elif kind == "weapon_bonus":
                ranges = [range_("floor(item_level * 0.2 * (1 + round * 2))", "floor(item_level * 0.4 * (1 + round * 2))")]
            elif kind == "crit_chance":
                ranges = [{**range_(0.5, "item_level"), "mode": "decimal", "decimalPlaces": 2}]
            elif kind in {"external_skill_bonus", "internal_skill_bonus", "form_skill_bonus", "legend_skill_bonus"}:
                option["candidateWhen"] = "skill_hard <= item_level + 4 && skill_hard + 1 >= item_level"
                low, high, bonus = {
                    "external_skill_bonus": (3, 15, 15),
                    "internal_skill_bonus": (2, 10, 10),
                    "form_skill_bonus": (10, 25, 15),
                    "legend_skill_bonus": (15, 30, 15),
                }[kind]
                ranges = [range_(f"floor({low} * (round + 3) / (skill_hard / 2 + 1))", f"floor({high} * (round + 3) / (skill_hard / 2 + 1)) + (skill_hard < 6 ? round * {bonus} : 0)")]
                if kind == "legend_skill_bonus":
                    ranges.append(range_(0, 10))
            option["ranges"] = ranges
    return migrated


def build(output: Path) -> None:
    if not SOURCE.is_dir():
        raise SystemExit("Initialize jyx-legacy-data submodule before building content.")
    sys.path.insert(0, str(LEGACY / "scripts"))
    from current_content_schema import collect_named_ids
    external_ids = collect_named_ids(SOURCE / "skills.xml", "skill")
    internal_ids = collect_named_ids(SOURCE / "internal_skills.xml", "internal_skill")
    package = {}
    report = {
        "sourceCommit": subprocess.check_output(["git", "-C", str(LEGACY), "rev-parse", "HEAD"], text=True).strip(),
        "ruleSources": [
            {"repository": "jyx-legacy-dll", "commit": "2c62a80de46c48e64e5647511a9c41e088293aff", "files": ["JyGame/ITTrigger.cs", "JyGame/Item.cs", "JyGame/Buff.cs"]},
            {"repository": "X-Heroes-of-Jin-Yong", "commit": "4acd2c718a8afc562f0d5a0cd38464fea6699453", "files": ["Assets/Resources/textassets/lua/jygame/main.lua.lua: BUFF_LIST"]},
        ],
        "counts": {}, "deferred": {},
    }
    for prop, filename, name, source, function in CONVERTERS:
        suffix = "_to_json" if name.startswith("resource_") else "_xml_to_json"
        module = importlib.import_module(name + suffix)
        arguments = [SOURCE / source]
        if prop in {"shops", "towers"}:
            arguments.extend([external_ids, internal_ids])
        values = getattr(module, function)(*arguments)
        package[prop] = values
        report["counts"][prop] = len(values)
        if prop == "maps":
            module.write_maps(output / "legacy" / filename, values)
        else:
            write_json(output / "legacy" / filename, values)
    # These current-model collections have no legacy converter/source equivalent.
    for prop, filename in (("scopedBattleEffects", "scoped-battle-effects.json"), ("itemTags", "item-tags.json")):
        package[prop] = []
        write_json(output / "legacy" / filename, [])
    write_json(output / "legacy" / "content-package.json", package)
    # Runtime world/story migration is independent of lossless rule conversion.
    source_maps = package["maps"]
    for prop in ("maps", "worldTriggers"):
        report["deferred"][prop] = [value["id"] for value in package[prop]]
        package[prop] = []
    # MapService can enter the real opening maps. Events remain in the lossless
    # starter-world projection until the browser adapter supports their commands.
    package["maps"] = [copy.deepcopy(value) for value in source_maps if value["id"] in {"南贤屋内", "小村", "南贤居"}]
    for map_definition in package["maps"]:
        for location in map_definition["locations"]:
            location["events"] = []
    package["randomAffixTables"] = migrate_random_affix_tables(package["randomAffixTables"])
    for buff in package["buffs"]:
        buff["isDebuff"] = buff["id"] not in POSITIVE_BUFF_IDS
    story_items = [item for item in package["items"] if any(effect.get("type") == "run_story" for effect in item.get("useEffects", []))]
    report["deferred"]["storyItems"] = [item["id"] for item in story_items]
    package["items"] = [item for item in package["items"] if item not in story_items]
    world = starter_world()
    script = starter_script(world)
    package["storyScripts"] = {"starter": script}
    from starter_rule_effects import apply_starter_rule_effects
    report["starterRuleEffects"] = apply_starter_rule_effects(package)
    from browser_packs import assemble_jyx
    package = assemble_jyx(package, source_maps, SOURCE, script)
    frontier_module_spec = importlib.util.spec_from_file_location("build_frontier", Path(__file__).with_name("build-frontier.py"))
    frontier_module = importlib.util.module_from_spec(frontier_module_spec)
    frontier_module_spec.loader.exec_module(frontier_module)
    frontier_package = frontier_module.build_frontier()
    packs = [package, frontier_package]
    for pack in packs:
        write_json(output / "packs" / pack["browser"]["id"] / "content-package.json", pack)
    write_json(output / "packs" / "index.json", {
        "schemaVersion": 1, "defaultPackId": "jyx", "packs": [
            {"id": pack["browser"]["id"], "title": pack["browser"]["title"], "subtitle": pack["browser"]["subtitle"], "description": pack["browser"]["description"], "url": f"packs/{pack['browser']['id']}/content-package.json"}
            for pack in packs
        ],
    })
    write_json(output / "content-package.json", package)
    write_json(output / "starter-world.json", world)
    write_json(output / "starter.story.json", script)
    # Item.cs Generate uses sequential conditional probability tests:
    # 4 = .1; 3 = .9*.2; 2 = .9*.8*.4; 1 = .9*.8*.6.
    write_json(output / "runtime-config.json", {
        "equipmentRandomAffixCountWeights": [{"count": count, "weight": weight} for count, weight in ((4, 100), (3, 180), (2, 288), (1, 432))],
        "source": "jyx-legacy-dll/JyGame/Item.cs Generate(bool): conditional .1/.2/.4/else",
    })
    dialogue_segments = []
    for story in world["stories"].values():
        steps = []
        for instruction in story["instructions"]:
            if instruction.get("tag") == "action" and instruction.get("type") == "DIALOG":
                speaker, _, text = instruction["value"].partition("#")
                steps.append({"kind": "dialogue", "speaker": speaker, "text": text})
        if steps:
            dialogue_segments.append({"name": story["id"], "steps": steps})
    # Dialogue-only projections are explicitly labelled: no choices, rewards or
    # event completion should be inferred from playing these excerpts.
    write_json(output / "starter-dialogue-excerpts.story.json", {"version": 3, "segments": dialogue_segments})
    report["starterStories"] = len(world["stories"])
    report["migratedStorySegments"] = len(script["segments"])
    report["browserPacks"] = [{"id": p["browser"]["id"], "maps": len(p["maps"]), "storySegments": sum(len(s["segments"]) for s in p["storyScripts"].values())} for p in packs]
    report["deferred"]["maps"] = [m["id"] for m in source_maps if m["id"] not in {m["id"] for m in package["maps"]}]
    report["chapterAdaptations"] = [
        {"id": "browser_结伴练习", "reason": "Legacy battle references missing role 经验木头人; a separately named encounter uses the existing 木头人 definition and two party slots."},
        {"id": "browser_新手章节回顾", "reason": "New browser chapter boundary; does not finish or reward unported original sect/world stories."},
        {"id": "大地图", "reason": "Destination-card map exposes only supported chapter locations, without claiming full legacy travel simulation."},
        {"id": "NEWBIE", "reason": "Supported buying-medicine stage explicitly maps to a persisted Boolean flag; other original newbie stages are not presented as migrated."},
    ]
    report["runtimeCounts"] = {key: len(value) for key, value in package.items()}
    report["limitations"] = [
        "The 14 original opening/trainer segments remain unchanged; the extended chapter adds attributed original stories, with unsupported sect choice explicitly unavailable. Full world events/global triggers remain deferred.",
        "Runtime maps expose only supported story/map/shop events. NEWBIE state uses explicit Boolean flags for the supported buying-medicine tutorial; no false placeholder is treated as implemented.",
        "The original four-enemy training battle references missing role 经验木头人. browser_结伴练习 is explicitly authored using the real 木头人 definition, not a claim that this missing role was recovered.",
        "Converted talent/buff descriptions do not implement missing legacy battle hooks; this is an integration slice, not full original-rule parity.",
        "Original media references are retained; browser rendering supplies its own generated art.",
        "The separately uploaded X1.0.0.1 archive and its 78 Ludingji story records are not merged into the pinned baseline.",
    ]
    write_json(output / "content-build-report.json", report)
    print(json.dumps({"runtimeCounts": report["runtimeCounts"], "starterStories": report["starterStories"], "deferredStoryItems": report["deferred"]["storyItems"]}, ensure_ascii=False))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=WEB / "public" / "data")
    build(parser.parse_args().output.resolve())
