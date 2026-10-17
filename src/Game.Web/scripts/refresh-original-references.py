#!/usr/bin/env python3
"""Explicitly refresh pinned reference snapshots; normal content builds are offline.

XML children and spreadsheet row order are retained. These are reference
documents, never automatically loaded into the executable content package.
"""
import argparse
from collections import Counter
import hashlib
import json
import re
from pathlib import Path
import subprocess
import xml.etree.ElementTree as ET
import zipfile

WEB = Path(__file__).resolve().parents[1]
REPO = WEB.parents[1]
PINS = {
    "hansquirrel/JyGameSilverlight": "3fa22b12126bd1e7a3cc2645a4cb200216643175",
    "CppCXY/jyGameXreMake": "71d4587d60622ba6adf692d5b069c072c1f42fed",
    "UnicomGamer/X-Heroes-of-Jin-Yong": "4acd2c718a8afc562f0d5a0cd38464fea6699453",
}
FILES = {"characters": "roles", "externalSkills": "skills", "internalSkills": "internal_skills",
         "specialSkills": "special_skills", "legendGroups": "aoyis", "items": "items",
         "maps": "maps", "battles": "battles", "resources": "resource", "sects": "menpai",
         "shops": "shops", "towers": "towers", "growTemplates": "grow_templates",
         "newbie": "newbie", "worldTriggers": "globaltrigger", "touch": "touch",
         "randomAffixes": "item_triggers", "animations": "animations", "tips": "resource_suggesttips"}
STORIES = ("storys", "storysCG", "storysPY", "storysLudingji")
ALIASES = {
    "externalSkills": {"虎爪绝户手": "绝户虎爪手"},
    "internalSkills": {"天山剑法诀": "天山剑法决"},
    "items": {"七星黄蜡丹": "七星黄腊丹", "莽牯朱蛤": "莽毒蛛蛤", "一等鹿鼎公印记": "一品鹿鼎公印记",
              "天下轻功总诀": "天下轻功总决", "斗转星移诀": "斗转星移决", "狂风快剑诀": "狂风快剑决",
              "虎爪绝户手秘籍": "绝户虎爪手秘籍"},
    "resources": {"天赋.易筋伐髓": "天赋.易经伐髓", "天赋.鹿鼎.一等鹿鼎公": "天赋.鹿鼎.一品鹿鼎公",
                  "物品.莽牯朱蛤": "物品.莽毒蛛蛤"},
}


def node(element):
    result = {"tag": element.tag, **element.attrib}
    if len(element): result["children"] = [node(c) for c in element]
    if element.text and element.text.strip(): result["text"] = element.text.strip()
    return result


def identity(n):
    if n.get("tag") == "aoyi": return n["name"] + "-" + n.get("start", "")
    return n.get("key") or n.get("name") or ""


def write(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n")


def snapshot(root, suffix):
    files, collections = {}, {}
    for category, stem in [*FILES.items(), *[("stories", s) for s in STORIES]]:
        path = root / (stem + suffix)
        if not path.is_file(): continue
        files[path.name] = hashlib.sha256(path.read_bytes()).hexdigest()
        collections.setdefault(category, []).extend({"source": path.name, "node": node(n)} for n in ET.parse(path).getroot())
    return {"files": files, "collections": collections}


def inventory(snapshot):
    result = {}
    for category, rows in snapshot["collections"].items():
        ids = [identity(r["node"]) for r in rows]
        result[category] = {"records": len(rows), "namedIds": len(set(ids) - {""}),
                            "duplicateIds": [k for k, n in Counter(ids).items() if k and n > 1]}
    return result


def diff(baseline, other):
    result = {}
    for category, rows in baseline["collections"].items():
        if category not in other["collections"]: continue
        a = {identity(r["node"]) for r in rows} - {""}
        b = {identity(r["node"]) for r in other["collections"][category]} - {""}
        aliases = [{"baseline": old, "reference": new} for old, new in ALIASES.get(category, {}).items()
                   if old in a - b and new in b - a]
        result[category] = {"baselineNamedIds": len(a), "referenceNamedIds": len(b), "sharedIds": len(a & b),
                            "addedIds": sorted(b - a), "absentIds": sorted(a - b), "spellingVariants": aliases}
    return result


def spreadsheet(path):
    ns = {"x": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
    with zipfile.ZipFile(path) as archive:
        strings = []
        if "xl/sharedStrings.xml" in archive.namelist():
            strings = ["".join(n.itertext()) for n in ET.fromstring(archive.read("xl/sharedStrings.xml"))]
        sheets = {}
        for name in sorted(archive.namelist()):
            if not name.startswith("xl/worksheets/sheet") or not name.endswith(".xml"): continue
            rows = []
            for row in ET.fromstring(archive.read(name)).findall("x:sheetData/x:row", ns):
                cells = {}
                for cell in row.findall("x:c", ns):
                    value = cell.findtext("x:v", default="", namespaces=ns)
                    if cell.get("t") == "s": value = strings[int(value)] if value else ""
                    if cell.get("t") == "inlineStr": value = "".join(cell.find("x:is", ns).itertext())
                    if value.strip(): cells[cell.get("r", "")] = value
                if cells: rows.append({"row": int(row.get("r")), "cells": cells})
            sheets[name] = rows
    return {"sha256": hashlib.sha256(path.read_bytes()).hexdigest(), "sheets": sheets}


def early_snapshot(root):
    # Keep file boundaries: official bundles also contain optional content.
    result = {"files": {}, "collections": {}}
    selectors = {"characters": ("role", ".//role"), "externalSkills": ("skill", ".//skills/skill"),
                 "internalSkills": ("skill", ".//internal_skills/internal_skill"),
                 "specialSkills": ("skill", ".//special_skills/skill"), "legendGroups": ("skill", ".//aoyis/aoyi"),
                 "items": ("item", ".//item"), "stories": ("storys", ".//story")}
    for category, (folder, selector) in selectors.items():
        for path in sorted((root / folder).glob("*.xml")):
            relative = str(path.relative_to(root))
            result["files"][relative] = hashlib.sha256(path.read_bytes()).hexdigest()
            result["collections"].setdefault(category, []).extend(
                {"source": relative, "node": node(n)} for n in ET.parse(path).getroot().findall(selector))
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--references", type=Path, required=True)
    parser.add_argument("--uploaded", type=Path, required=True)
    args = parser.parse_args()
    roots = {name: args.references / name.split("/")[1] for name in PINS}
    for name, root in roots.items():
        assert subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=root, text=True).strip() == PINS[name], name
    target = WEB / "reference-materials"
    baseline = snapshot(REPO / "jyx-legacy-data/data-origin", ".xml")
    upload = snapshot(args.uploaded, ".txt")
    late_root = roots["UnicomGamer/X-Heroes-of-Jin-Yong"]
    late = snapshot(late_root / "gamedata/modcache/Template/Scripts", ".xml")
    early = early_snapshot(roots["hansquirrel/JyGameSilverlight"] / "JyGameSilverlight/JyGame/Scripts")
    excel_root = roots["CppCXY/jyGameXreMake"] / "jinxExcel/excel"
    excel = {p.name: spreadsheet(p) for p in sorted(excel_root.glob("*.xlsx")) if not p.name.startswith("~$")}
    role_rows = next(iter(excel["J角色.xlsx"]["sheets"].values()))[1:]
    role_ids = [next(iter(r["cells"].values())) for r in role_rows if "A" + str(r["row"]) in r["cells"]]
    base_ids = {identity(r["node"]) for r in baseline["collections"]["characters"]}
    lua = late_root / "Assets/Resources/textassets/lua/jygame/AttackLogic.lua.lua"
    examples = ["大力士", "神.化功大法", "诅咒", "不稳定的野球拳"]
    lua_text = lua.read_text(encoding="utf-8-sig")
    lua_root = lua.parent
    lua_files = {str(p.relative_to(late_root)): {"sha256": hashlib.sha256(p.read_bytes()).hexdigest(),
                 "text": p.read_text(encoding="utf-8-sig")} for p in sorted(lua_root.glob("*.lua.lua"))}
    roll_source = "Assets/Resources/textassets/lua/jygame/rollrole.lua.lua"
    pool_text = lua_files[roll_source]["text"].split("local ROLLROLE_BonusRole = {", 1)[1].split("--入口函数", 1)[0]
    bonus_pools = [{"index": int(index), "round": int(index) + 1, "roundLabel": "第五周目起" if index == "4" else f"第{int(index)+1}周目",
                    "characterIds": re.findall(r'"([^"]+)"', values)}
                   for index, values in re.findall(r"\[(\d+)\]\s*=\s*\{([^}]*)\}", pool_text, re.S)]
    assert [len(pool["characterIds"]) for pool in bonus_pools] == [0, 17, 10, 7, 9]
    bonus_ids = {rid for pool in bonus_pools for rid in pool["characterIds"]}
    code_comparison = []
    for filename in ["GameEngine", "Battle", "BattleAI", "AttackFormula", "AoyiLogic", "Skill", "Role", "Item", "Buff", "RollRoleUI", "AttackLogic"]:
        before = REPO / "jyx-legacy-dll/JyGame" / (filename + ".cs")
        after = late_root / "Assets/Scripts/Assembly-CSharp/JyGame" / (filename + ".cs")
        a, b = [hashlib.sha256(p.read_bytes()).hexdigest() for p in (before, after)]
        code_comparison.append({"file": filename + ".cs", "baselineSha256": a, "lateSha256": b, "identical": a == b})
    declared = {identity(r["node"]).removeprefix("天赋.") for r in late["collections"]["resources"] if identity(r["node"]).startswith("天赋.")}
    manifest = {
        "schemaVersion": 1,
        "sources": [
            {"id": "baseline", "name": "gt88domain/jyxr · 原版迁移基线", "version": "现代代码与原版数据分层",
             "repository": "https://github.com/gt88domain/jyxr", "commit": "50865c7d0c0820d2e70f0258014337cc43d2475d",
             "dataCommit": "b41198219087858ece19d5484f5061e0289c47bc", "role": "当前运行内容基线"},
            {"id": "silverlight", "name": "汉家松鼠 JyGameSilverlight", "version": "官方早期 0.6.x",
             "repository": "https://github.com/hansquirrel/JyGameSilverlight", "commit": PINS["hansquirrel/JyGameSilverlight"],
             "role": "早期玩法与内容对照；目录统计含可选内容，不视为同时启用"},
            {"id": "remake", "name": "jyGameXreMake", "version": "非官方 Lua / Excel 重制",
             "repository": "https://github.com/CppCXY/jyGameXreMake", "commit": PINS["CppCXY/jyGameXreMake"],
             "role": "编辑工具和扩展参考；新增角色不直接认定为原版伙伴"},
            {"id": "late", "name": "X-Heroes-of-Jin-Yong", "version": "1.1.0.6 逆向参考",
             "repository": "https://github.com/UnicomGamer/X-Heroes-of-Jin-Yong", "commit": PINS["UnicomGamer/X-Heroes-of-Jin-Yong"],
             "role": "后期代码与 Lua 对照；本次 XML 来自 modcache/Template，属于 MOD 模板"},
            {"id": "upload", "name": "用户上传 X.rar", "version": "金庸群侠传 X 1.0.0.1",
             "repository": "https://github.com/gt88domain/jyxr/releases/tag/downloads-2026-10-15",
             "role": "用户提供的原始内容与素材；保留版本差异，未覆盖现有剧情"}],
        "inventories": {"baseline": inventory(baseline), "silverlight": inventory(early), "late": inventory(late), "upload": inventory(upload)},
        "differences": {"silverlight": diff(baseline, early), "late": diff(baseline, late), "upload": diff(baseline, upload)},
        "remakeRoles": {"rows": len(role_ids), "uniqueIds": len(set(role_ids)),
                        "duplicateIds": [k for k, n in Counter(role_ids).items() if n > 1],
                        "addedIds": sorted(set(role_ids) - base_ids), "absentIds": sorted(base_ids - set(role_ids))},
        "lateLua": {"source": "Assets/Resources/textassets/lua/jygame/AttackLogic.lua.lua", "sha256": hashlib.sha256(lua.read_bytes()).hexdigest(),
                    "examples": [{"id": name, "line": next(i for i, line in enumerate(lua_text.splitlines(), 1) if name in line),
                                  "declaredTalent": name in declared, "status": "MOD 模板脚本示例，暂不计入原版天赋"} for name in examples]},
        "lateBonusCompanions": {"source": roll_source, "caller": "JyGame/RollRoleUI.cs:664-708", "pools": bonus_pools,
                                "uniqueIds": len(bonus_ids), "missingCharacterIds": sorted(bonus_ids - base_ids),
                                "status": "后期 Lua 多周目开局随机奖励池；当前运行状态另见资料馆"},
        "legacyCodeComparison": code_comparison,
        "notes": ["XML 子节点顺序和字段结构不同，不等于新增玩法或数值改动。",
                  "同名资料的版本差异保留原记录；异名对照不改变运行中的稳定 ID。",
                  "资料归档、运行接线、规则实现、流程验证是不同进度。"]}
    for name, value in [("original-upload.json", upload), ("late-template.json", late),
                        ("silverlight.json", early), ("remake-workbooks.json", excel), ("late-lua.json", {"files": lua_files}), ("manifest.json", manifest)]:
        write(target / name, value)
    print(json.dumps({"uploadStoryDifference": manifest["differences"]["upload"]["stories"], "remakeRoles": manifest["remakeRoles"]}, ensure_ascii=False))


if __name__ == "__main__": main()
