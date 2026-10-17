#!/usr/bin/env python3
"""Check lossless source records, missing definitions and reference boundaries."""
import json
from pathlib import Path
import xml.etree.ElementTree as ET

WEB = Path(__file__).resolve().parents[1]
SOURCE = WEB.parents[1] / "jyx-legacy-data/data-origin"
DATA = WEB / "public/data"
LIBRARY = DATA / "library"


def read(path): return json.loads(path.read_text())


def assert_node(original, archived):
    assert original.tag == archived["tag"]
    assert original.attrib == {k: v for k, v in archived.items() if k not in {"tag", "children", "text"}}
    assert (original.text or "").strip() == archived.get("text", "")
    children = archived.get("children", [])
    assert len(original) == len(children)
    for a, b in zip(original, children): assert_node(a, b)


index = read(LIBRARY / "index.json")
groups = {c["id"]: read(LIBRARY / (c["id"] + ".json")) for c in index["categories"]}
keys = {(r["category"], r["id"]) for group in groups.values() for r in group}
assert len(keys) == len(index["entries"]) == sum(c["count"] for c in index["categories"])
assert len(groups["characters"]) == 513
assert len(groups["externalSkills"]) == 158
assert len(groups["internalSkills"]) == 43
assert len(groups["items"]) == 347
assert len(groups["legendGroups"]) == 137
assert len(groups["buffs"]) == 33
checked = 0
for category, group in groups.items():
    by_source = {}
    for record in group:
        for kind in ["related", "usedBy"]:
            for target in record[kind]: assert (target["category"], target["id"]) in keys, target
        if record["source"].endswith(".xml"):
            by_source.setdefault(record["source"], []).append(record)
    for filename, records in by_source.items():
        originals = list(ET.parse(SOURCE / filename).getroot())
        if category == "talents": originals = [n for n in originals if n.get("key", "").startswith("天赋.")]
        if category == "buffs": originals = [n for n in originals if n.get("key", "").startswith("buff.")]
        assert len(originals) == len(records), (category, filename)
        for original, record in zip(originals, records):
            assert_node(original, record["node"]); checked += 1
print(f"PASS {checked} full original records, including every ordered condition and child instruction")

upload = read(LIBRARY / "references/original-upload.json")
luding = [r for r in upload["collections"]["stories"] if r["source"] == "storysLudingji.txt"]
baseline_ids = {r["id"] for r in groups["stories"]}
supplement_ids = {r["id"] for r in groups["supplementStories"]}
assert len(luding) == 78 and len(baseline_ids) == 1887 and len(supplement_ids) == 39
assert len({r["node"]["name"] for r in luding} & baseline_ids) == 39
assert not baseline_ids & supplement_ids
assert all(r["state"] == "补充资料 · 运行入口待接线" for r in groups["supplementStories"])
join = next(r for r in groups["supplementStories"] if r["id"] == "鹿鼎剧情4.4")
assert any(a.get("type") == "JOIN" and a.get("value") == "双儿" for a in join["node"]["children"])
assert {r["id"] for r in groups["missingCharacters"]} == {"双儿", "白眉鹰王"}
assert index["counts"]["missingCharacterDefinitions"] == ["双儿", "白眉鹰王"]
assert index["counts"]["baselineCompanionForms"] == 65 and index["counts"]["baselineCompanionNames"] == 63
assert len([r for r in index["entries"] if r["recruitment"]]) == 106
package = read(DATA / "content-package.json")
assert "双儿" not in {r["id"] for r in package["characters"]}
assert not supplement_ids & {s["name"] for script in package["storyScripts"].values() for s in script["segments"]}
assert "虎爪绝户手" in {r["id"] for r in package["externalSkills"]}
assert "绝户虎爪手" not in {r["id"] for r in package["externalSkills"]}
assert {r["id"] for r in groups["legendGroups"]} == {r["id"] for r in package["legendSkills"]}
print("PASS all 78 uploaded chapter records, 39 supplemental IDs, missing Shuang'er definition and no runtime overwrite")

manifest = read(LIBRARY / "references/manifest.json")
assert len(manifest["sources"]) == 5
assert manifest["remakeRoles"]["rows"] == 580 and manifest["remakeRoles"]["uniqueIds"] == 579
assert manifest["remakeRoles"]["duplicateIds"] == ["路人甲"]
assert len(manifest["remakeRoles"]["addedIds"]) == 67
assert all(not example["declaredTalent"] for example in manifest["lateLua"]["examples"])
for filename in ["manifest.json", "original-upload.json", "late-template.json", "late-lua.json", "silverlight.json", "remake-workbooks.json"]:
    assert (LIBRARY / "references" / filename).read_bytes() == (WEB / "reference-materials" / filename).read_bytes()
creation = package["browser"]["creation"]
assert len(groups["creation"]) == len(creation["questions"]) + 3 == 10
for row, question in zip(groups["creation"], creation["questions"]):
    assert row["name"] == question["title"]
    assert len(row["node"]["children"][0]["children"][1]["children"]) == len(question["options"])
print("PASS five pinned/provided sources, preserved workbook duplicates, template examples and complete creation questions")
assert [len(pool["characterIds"]) for pool in manifest["lateBonusCompanions"]["pools"]] == [0, 17, 10, 7, 9]
assert manifest["lateBonusCompanions"]["missingCharacterIds"] == ["白眉鹰王"]
assert index["counts"]["lateBonusForms"] == 43 and index["counts"]["lateBonusAdditionalForms"] == 40
assert len(groups["bonusCompanions"]) == 5
assert all(len(r["node"]["children"]) == len(p["characterIds"]) for r, p in zip(groups["bonusCompanions"], manifest["lateBonusCompanions"]["pools"]))
assert len(read(LIBRARY / "references/late-lua.json")["files"]) == 10
print("PASS 43 late-version round-dependent starting candidates, 40 additional reference IDs and 10 preserved Lua files")
