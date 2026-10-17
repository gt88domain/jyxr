"""Build a read-only, source-backed library. Never mutate playable content."""
from collections import defaultdict
import json
from pathlib import Path
import re
import xml.etree.ElementTree as ET

CATEGORIES = [
    ("characters", "人物", "roles.xml", "characters"),
    ("missingCharacters", "缺定义伙伴", None, None),
    ("referenceAliases", "角色引用修正", None, None),
    ("bonusCompanions", "后期开局伙伴池", None, None),
    ("externalSkills", "外功", "skills.xml", "externalSkills"),
    ("internalSkills", "内功", "internal_skills.xml", "internalSkills"),
    ("specialSkills", "特技", "special_skills.xml", "specialSkills"),
    ("legendGroups", "奥义组合", "aoyis.xml", None),
    ("items", "道具装备", "items.xml", "items"),
    ("talents", "天赋", "resource.xml", "talents"),
    ("buffs", "状态", "resource.xml", "buffs"),
    ("maps", "地图", "maps.xml", "maps"),
    ("stories", "基线剧情", None, None),
    ("supplementStories", "补充剧情", None, None),
    ("battles", "战斗配置", "battles.xml", "battles"),
    ("sects", "门派", "menpai.xml", "sects"),
    ("shops", "商店", "shops.xml", "shops"),
    ("growTemplates", "成长模板", "grow_templates.xml", "growTemplates"),
    ("creation", "开局配置", None, None),
    ("newbie", "新手任务", "newbie.xml", None),
    ("worldTriggers", "全局触发", "globaltrigger.xml", None),
    ("towers", "天关掉落", "towers.xml", "towers"),
    ("touch", "点穴配置", "touch.xml", None),
    ("randomAffixes", "装备词条池", "item_triggers.xml", "randomAffixTables"),
    ("animations", "动作配置", "animations.xml", None),
    ("tips", "原版提示", "resource_suggesttips.xml", "gameTips"),
    ("resources", "资源引用", "resource.xml", "resources"),
]
STORY_FILES = ("storys.xml", "storysCG.xml", "storysPY.xml")


def xml_node(element):
    result = {"tag": element.tag, **element.attrib}
    if len(element): result["children"] = [xml_node(c) for c in element]
    if element.text and element.text.strip(): result["text"] = element.text.strip()
    return result


def config_node(tag, value):
    if isinstance(value, dict):
        return {"tag": tag, "children": [config_node(k, v) for k, v in value.items()]}
    if isinstance(value, list):
        return {"tag": tag, "children": [config_node("entry", v) for v in value]}
    return {"tag": tag, "value": str(value)}


def named_id(n, index):
    if n.get("tag") == "aoyi": return n["name"] + "-" + n.get("start", "")
    return n.get("key") or n.get("name") or f"{n['tag']}:{index + 1}"


def build_library(package, source, companions, rule_audit, web):
    reference = web / "reference-materials"
    manifest = json.loads((reference / "manifest.json").read_text())
    upload = json.loads((reference / "original-upload.json").read_text())
    uploaded = defaultdict(list)
    for category, rows in upload["collections"].items():
        for index, row in enumerate(rows): uploaded[(category, named_id(row["node"], index))].append(row)
    accepted = {s["name"] for script in package["storyScripts"].values() for s in script["segments"]}
    recruits = {c["id"]: c for c in companions["characters"]}
    baseline_stories = {n.get("name") for f in STORY_FILES for n in ET.parse(source / f).getroot()}
    supplemental = [r for r in upload["collections"]["stories"] if r["node"].get("name") not in baseline_stories]
    # A distinct supplemental identity can occur in more than one source file.
    assert len(supplemental) == len({r["node"].get("name") for r in supplemental})
    supplemental_recruits = defaultdict(list)
    for row in supplemental:
        for a in row["node"].get("children", []):
            if a.get("tag") == "action" and a.get("type") in {"JOIN", "FOLLOW"}:
                supplemental_recruits[a["value"]].append(row["node"]["name"])
    role_ids = {n.get("key") for n in ET.parse(source / "roles.xml").getroot()}
    bonus_config = manifest["lateBonusCompanions"]
    creation = package["browser"]["creation"]
    bonus_aliases = creation["startingCompanionSource"]["aliases"]
    bonus_rounds = defaultdict(list)
    for pool in bonus_config["pools"]:
        for rid in pool["characterIds"]: bonus_rounds[bonus_aliases.get(rid, rid)].append(pool["roundLabel"])
    missing_recruits = {rid: stories for rid, stories in supplemental_recruits.items() if rid not in role_ids}
    for rid in bonus_rounds:
        if rid not in role_ids: missing_recruits.setdefault(rid, [])
    effects = {section: {r["id"]: r["configurationState"] for r in data["entries"]}
               for section, data in rule_audit["sections"].items()}
    records, summaries = {}, []
    for category, title, filename, runtime_key in CATEGORIES:
        rows = []
        if filename:
            for n in ET.parse(source / filename).getroot():
                if category == "talents" and not n.get("key", "").startswith("天赋."): continue
                if category == "buffs" and not n.get("key", "").startswith("buff."): continue
                rows.append({"source": filename, "node": xml_node(n)})
            if category == "talents":
                rows.append({"source": "storys.xml（身份声明，资源表无说明）", "node": {"tag": "identity", "key": "天赋.黑衣",
                             "value": "原剧情声明的身份标记；资源表无说明，不虚构战斗效果。"}})
        elif category == "stories":
            rows = [{"source": f, "node": xml_node(n)} for f in STORY_FILES for n in ET.parse(source / f).getroot()]
        elif category == "supplementStories": rows = supplemental
        elif category == "missingCharacters":
            rows = [{"source": "storysLudingji.txt" if rid in supplemental_recruits else bonus_config["source"], "node": {"tag": "missing_character", "key": rid,
                     "description": "有加入剧情，但四份参考的角色表均未找到双儿定义，不能补造属性。" if rid == "双儿" else
                         "奖励池使用了没有匹配定义的稳定ID。白眉鹰王可能对应殷天正，但未自动替换ID或补造数值。",
                     "children": [{"tag": "reference", "story": sid} for sid in stories] +
                         ([{"tag": "reference", "candidate": "殷天正"}] if rid == "白眉鹰王" else [])}} for rid, stories in missing_recruits.items()]
        elif category == "bonusCompanions":
            rows = [{"source": bonus_config["source"], "node": {"tag": "bonus_pool", "key": f"后期开局伙伴池{pool['index']}",
                     "name": pool["roundLabel"] + " · 开局随机伙伴候选", "description": "已接入周目开局：确认人物后抽一名；摇点和预览不发放。沿用原权重，第一名两份，其余各一份。",
                     "children": [{"tag": "candidate", "sourceId": rid, "character": bonus_aliases.get(rid, rid),
                                   "definition": "称号引用已修正" if rid in bonus_aliases else "已找到", "weight": "2" if i == 0 else "1"}
                                  for i, rid in enumerate(pool["characterIds"])]}} for pool in bonus_config["pools"]]
        elif category == "referenceAliases":
            rows = [{"source": bonus_config["source"], "node": {"tag": "alias_correction", "key": old, "character": new,
                     "description": "原奖励池使用称号；根据原鹰爪功说明“白眉鹰王殷天正的成名绝技”，对应现有人物定义，不改角色属性。",
                     "evidence": creation["startingCompanionSource"]["aliasEvidence"]}} for old, new in bonus_aliases.items()]
        elif category == "creation":
            creation = package["browser"]["creation"]
            configs = [(f"开局问答{index + 1}", q["title"], q) for index, q in enumerate(creation["questions"])]
            configs += [("初始奖励", "初始银两与奖励", {k: creation[k] for k in ("baseSilver", "baseItems", "normalItems")}),
                        ("重摇与头像", "重摇属性与头像选项", {k: creation[k] for k in ("randomStats", "portraits")}),
                        ("周目奖励", "周目与试炼奖励", {k: creation[k] for k in ("roundItems", "trialItems")}),
                        ("开局伙伴奖励", "分周目开局伙伴奖励", {k: creation[k] for k in ("startingCompanionPools", "startingCompanionSource")})]
            rows = [{"source": creation["source"]["file"], "node": {"tag": "creation", "key": rid, "name": name,
                     "description": "问答依据固定旧 C#，周目伙伴另据后期 Lua；无悔模式尚未接入。",
                     "children": [config_node("configuration", config)]}} for rid, name, config in configs]
        runtime = {r.get("id", r.get("name")): r for r in package.get(runtime_key, [])} if runtime_key else {}
        group, occurrences = [], defaultdict(int)
        for index, row in enumerate(rows):
            raw, rid = row["node"], named_id(row["node"], index)
            if category in {"talents", "buffs"}: rid = rid.split(".", 1)[1]
            occurrences[rid] += 1
            if occurrences[rid] > 1: rid += "-" + str(occurrences[rid])
            name = raw.get("name") or rid
            description = raw.get("desc") or raw.get("info") or raw.get("description") or ""
            # Resource descriptions (including talents) live in value.
            if category in {"talents", "buffs", "tips"}: description = raw.get("value", description)
            data = runtime.get(rid)
            state = ("资料已接入" if data else "资料已归档 · 运行状态待核对")
            if category == "stories": state = "剧情已接线 · 路线未全验" if rid in accepted else "原剧情已归档 · 已隔离"
            if category == "supplementStories": state = "补充资料 · 运行入口待接线"
            if category == "missingCharacters": state = "加入记录已归档 · 缺人物定义"
            if category == "bonusCompanions": state = "周目开局奖励已接入 · 确认时随机一名"
            if category == "referenceAliases": state = "引用已修正 · 使用现有人物定义"
            if category == "creation": state = "开局配置已接入 · 无悔模式待补"
            effect = effects.get(category, {}).get(rid)
            if category == "characters" and rid in recruits: description = "原剧情含加入／随行记录。" + description
            if category == "characters" and rid in supplemental_recruits:
                description = "上传包补充加入资料，运行入口待接线。" + description
            summary = {"id": rid, "category": category, "name": name, "description": description[:240],
                       "state": state, "source": row["source"], "effect": effect,
                       "initialBonusRounds": bonus_rounds.get(rid, []) if category in {"characters", "missingCharacters"} else [],
                       "recruitment": "baseline" if rid in recruits and category == "characters" else
                           "upload" if rid in supplemental_recruits and category in {"characters", "missingCharacters"} else
                           "late-bonus" if rid in bonus_rounds and category in {"characters", "missingCharacters"} else None}
            versions = uploaded.get(("stories" if category in {"stories", "supplementStories"} else category,
                                     named_id(raw, index)), [])
            if category in {"talents", "buffs"}: versions = uploaded.get(("resources", raw["key"]), [])
            version_category = "resources" if category in {"talents", "buffs"} else category
            version_id = raw.get("key") if category in {"talents", "buffs"} else named_id(raw, index)
            for alias in manifest["differences"]["upload"].get(version_category, {}).get("spellingVariants", []):
                if alias["baseline"] == version_id:
                    versions = [*versions, *uploaded.get((version_category, alias["reference"]), [])]
            # Keep baseline and upload explicitly separate, including equal records.
            variants = [{"source": r["source"], "node": r["node"], "equalRecord": r["node"] == raw} for r in versions]
            group.append({**summary, "node": raw, "runtime": data, "variants": variants,
                          "recruitmentStories": supplemental_recruits.get(rid, []) if category in {"characters", "missingCharacters"} else [],
                          "related": [], "usedBy": []})
            summaries.append(summary)
        assert len(group) == len({r["id"] for r in group}), category
        records[category] = group
    # Exact identifier references, excluding dialogue prose, labels and numeric IDs.
    # These show source links, never imply that all preconditions are satisfied.
    identities = defaultdict(list)
    for group in records.values():
        for record in group:
            if ":" not in record["id"] and len(record["id"]) > 1:
                identities[record["id"]].append(record)
    def reference_ids(n):
        if n["tag"] in identities: yield n["tag"]
        attrs = {k: v for k, v in n.items() if k not in {"children", "text", "tag", "desc", "info", "description", "name", "key"}}
        if n["tag"] not in {"action", "resource"}:
            attrs.update({k: n[k] for k in ("name", "key") if k in n})
        if n.get("type", "").upper() in {"DIALOG", "SELECT", "SUGGEST", "LOG", "NICK", "CHANGE_FEMALE_NAME"}: attrs = {}
        for value in attrs.values():
            if not isinstance(value, str): continue
            if value in identities: yield value
            for token in re.split(r"[#|,，、]", value):
                if token in identities: yield token
        for child in n.get("children", []): yield from reference_ids(child)
    def link(r): return {"category": r["category"], "id": r["id"], "name": r["name"]}
    for group in records.values():
        for record in group:
            found = {}
            for rid in sorted(set(reference_ids(record["node"]))):
                for other in identities[rid]:
                    key = (other["category"], other["id"])
                    if key != (record["category"], record["id"]): found[key] = other
            for other in found.values():
                record["related"].append(link(other)); other["usedBy"].append(link(record))
    luding = [r for r in upload["collections"]["stories"] if r["source"] == "storysLudingji.txt"]
    upload_join_forms = set(recruits) | set(supplemental_recruits) | set(bonus_rounds)
    role_names = {r["id"]: r["name"] for r in records["characters"]}
    return {"schemaVersion": 1, "categories": [{"id": c, "title": t, "count": len(records[c])} for c, t, _, _ in CATEGORIES],
            "entries": summaries, "sources": manifest["sources"],
            "counts": {"baselineCompanionForms": len(recruits), "baselineCompanionNames": len({role_names[c] for c in recruits}),
                       "referenceCompanionForms": len(upload_join_forms), "referenceCompanionNames": len({role_names.get(c, c) for c in upload_join_forms}),
                       "missingCharacterDefinitions": sorted(missing_recruits),
                       "lateBonusForms": len(bonus_rounds), "lateBonusAdditionalForms": len(set(bonus_rounds) - set(recruits)),
                       "startingCompanionRewardsImplemented": True, "correctedCharacterAliases": bonus_aliases,
                       "supplementStories": len(supplemental), "ludingStories": len(luding),
                       "ludingShared": sum(r["node"]["name"] in baseline_stories for r in luding), "runtimeLegendEntries": len(package["legendSkills"])},
            "referenceManifest": "references/manifest.json"}, records


def write_library(package, source, companions, rule_audit, web, output):
    index, records = build_library(package, source, companions, rule_audit, web)
    folder = output / "library"
    folder.mkdir(parents=True, exist_ok=True)
    for name, payload in [("index", index), *records.items()]:
        (folder / (name + ".json")).write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n")
    reference_target = folder / "references"
    reference_target.mkdir(exist_ok=True)
    for path in (web / "reference-materials").glob("*.json"):
        (reference_target / path.name).write_bytes(path.read_bytes())
    return {"categories": len(index["categories"]), "entries": len(index["entries"]), **index["counts"]}
