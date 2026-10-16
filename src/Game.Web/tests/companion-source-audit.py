"""Check guide coverage against pinned XML, not just hand-written examples."""
import json
from pathlib import Path
import xml.etree.ElementTree as ET

repo = Path(__file__).resolve().parents[3]
web = repo / "src/Game.Web"
catalog = json.loads((web / "public/data/companion-catalog.json").read_text())
package = json.loads((web / "public/data/content-package.json").read_text())
source = repo / "jyx-legacy-data/data-origin"
stories = {s.get("name"): s for f in ["storys.xml", "storysCG.xml", "storysPY.xml"] for s in ET.parse(source / f).getroot().findall("story")}
expected = {(sid, i, a.get("type"), a.get("value")) for sid, s in stories.items() for i, a in enumerate(s.findall("action")) if a.get("type") in {"JOIN", "FOLLOW"}}
actual = {(r["storyId"], r["actionIndex"], r["kind"], c["id"]) for c in catalog["characters"] for r in c["routes"]}
assert actual == expected
assert catalog["counts"]["characterForms"] == 65 and len(actual) == 80
print("PASS all 65 source character forms and 80 JOIN/FOLLOW instructions are represented exactly")
characters = {c["id"]: c for c in catalog["characters"]}
paths = 0
for character in characters.values():
    for route in character["routes"]:
        for path in route["paths"]:
            sid = path["entry"]["storyId"];seen = {sid}
            for edge_id in path["edges"]:
                edge = catalog["edges"][edge_id]
                assert edge["from"] == sid and edge["to"] not in seen
                seen.add(edge["to"]);sid = edge["to"]
            assert sid == route["storyId"]
            paths += 1
assert paths == 155
print("PASS all 155 map-entry reference paths connect to their actual join segment without repeated story nodes")
edge = next(e for e in catalog["edges"].values() if e["from"] == "笑傲江湖_天下第一令狐冲" and e["to"] == "笑傲江湖_令狐冲加入")
assert edge["moralityWindow"] == {"minimumInclusive": 35, "maximumExclusive": 65}
assert len(edge["earlierBranches"]) == 2
print("PASS Linghu Chong keeps both earlier rejection branches and the exact 35 <= morality < 65 window")
assert {r["storyId"] for r in characters["田伯光"]["routes"]} == {"笑傲江湖_田伯光居.胜田伯光", "笑傲江湖_田伯光居.负田伯光"}
assert len(characters["王语嫣"]["routes"]) == 4
assert [r["kind"] for r in characters["女主"]["routes"]].count("FOLLOW") == 3
assert [r["kind"] for r in characters["女主"]["routes"]].count("JOIN") == 1
assert characters["程英.初级"]["name"] == characters["程英.高级"]["name"]
assert any(r["debug"] and not r["hasMapEntry"] for r in characters["张无忌"]["routes"])
print("PASS alternative loss/win recruitment, four Wang routes, follower/member distinction, variants and debug-only entry labels")
def inspect(value):
    if isinstance(value, dict):
        assert value.get("translated") is not False, value
        for item in value.values(): inspect(item)
    elif isinstance(value, list):
        for item in value: inspect(item)
inspect(catalog)
progress = json.loads((web / "public/data/restoration-progress.json").read_text())
features = {f["id"]: f for f in progress["features"]}
for key, collection in {"external": "externalSkills", "internal": "internalSkills", "special": "specialSkills", "legend": "legendSkills", "items": "items"}.items():
    assert features[key]["count"] == len(package[collection])
assert features["battle"]["count"] == 393 and features["battle"]["structurallyUsable"] == 391
assert features["companions"]["count"] == 65 and features["companions"]["normalVerified"] == 7
assert progress["fullGameVerified"] is False
print("PASS source conditions have readable labels and eight feature rows use actual counts without claiming whole-game verification")
