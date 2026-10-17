"""Bind the original asset manifest to modern definitions, without changing rules."""
import json
import xml.etree.ElementTree as ET
from pathlib import Path


def apply_legacy_media(package: dict, web: Path) -> dict:
    path = web / "public/art/legacy/manifest.json"
    if not path.is_file():
        raise ValueError("Original art manifest missing; run scripts/extract-legacy-art.py first.")
    manifest = json.loads(path.read_text(encoding="utf-8"))
    audio_path = path.with_name("audio-manifest.json")
    if audio_path.is_file():
        audio = json.loads(audio_path.read_text())
        for relative, entry in audio["files"].items():
            if not (path.parent / relative).is_file(): raise ValueError("Original audio missing: " + relative)
        package["browser"]["audio"] = {"resources": audio["resources"], "titleMusic": "音乐.武侠回忆", "battleMusic": "战斗音乐.云狐之战",
            "eventSounds": {"ItemUsed": "音效.恢复类物品", "CharacterLeveledUp": "音效.升级"}, "source": audio["source"]}
    if manifest.get("schemaVersion") != 1:
        raise ValueError("Unsupported original art manifest version")
    for relative in manifest["files"]:
        if not (path.parent / relative).is_file():
            raise ValueError("Original artwork file missing: " + relative)
    paths = {key.casefold(): value["path"] for key, value in manifest["images"].items()}
    original = {r.get("key"): r.get("value", "") for r in ET.parse(web.parents[1] / "jyx-legacy-data/data-origin/resource.xml").getroot()}
    resources = {}
    for resource in package["resources"]:
        # The modern importer normalizes Heads/Maps/Items to head/map/item.
        # Use the source ID to bind those paths without guessing by basename.
        source_path = original.get(resource["id"], resource.get("value", "")).casefold()
        if source_path in paths:
            resources[resource["id"]] = paths[source_path]
            paths[resource["value"].casefold()] = paths[source_path]

    def resolve(key):
        return resources.get(key) or paths.get((key or "").casefold())

    media = package["browser"]["media"]
    media["resources"], media["paths"], media["models"] = resources, paths, manifest["models"]
    media["portraits"] = {c["id"]: resolve(c.get("portrait")) for c in package["characters"] if resolve(c.get("portrait"))}
    media["characters"] = {c["id"]: manifest["models"][c["model"]]["poster"] for c in package["characters"] if c.get("model") in manifest["models"]}
    animated_characters = len(media["characters"])
    for character in package["characters"]:
        if character["id"] not in media["characters"] and character["id"] in media["portraits"]:
            media["characters"][character["id"]] = media["portraits"][character["id"]]
    media["maps"] = {m["id"]: resolve(m.get("picture")) for m in package["maps"] if resolve(m.get("picture"))}
    media["battles"] = {b["id"]: resolve(b.get("background")) for b in package["battles"] if resolve(b.get("background"))}
    media["items"] = {i["id"]: resolve(i.get("picture")) for i in package["items"] if resolve(i.get("picture"))}
    media["titleBackground"] = media["maps"]["大地图"]
    media["worldBackground"] = media["maps"]["南贤屋内"]
    media["battleBackground"] = media["battles"]["南贤居_木头人_战斗"]
    media["defaultFriendly"] = media["characters"]["主角"]
    media["defaultEnemy"] = media["characters"]["主角"]
    for required in ["主角", "木头人", "钟灵"]:
        if required not in media["characters"] or required not in media["portraits"]:
            raise ValueError("Opening artwork is incomplete: " + required)
    package["browser"]["artSource"] = {"kind": "legacy", **manifest["source"]}
    return {"source": manifest["source"], "library": manifest["counts"],
            "animatedCharacters": animated_characters,
            "unresolvedModelIds": [{"characterId": c["id"], "model": c["model"]} for c in package["characters"] if c.get("model") and c["model"] not in manifest["models"]],
            "mapped": {key: len(media[key]) for key in ["characters", "portraits", "maps", "battles", "items"]},
            "missing": {key: [d["id"] for d in package[definitions] if d["id"] not in media[key]] for key, definitions in [
                ("characters", "characters"), ("portraits", "characters"), ("maps", "maps"), ("battles", "battles"), ("items", "items")]},
            "notes": ["Artwork comes from the uploaded X1.0.0.1 archive; rule/content definitions keep the pinned modern migration baseline.",
                      "Clip sample rates/order are recovered when available; numbered-frame fallbacks are identified in the model manifest.",
                      "No old executable, assembly or Lua code is run. Audio and skill visual effects are outside this artwork pass."]}
