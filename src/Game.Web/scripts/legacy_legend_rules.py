"""AoyiLogic/Aoyi field semantics from pinned 2c62a80; no old code executes."""
import struct
from starter_rule_effects import _definition

LEGEND_RESOLUTION = {
    "rollBeforeConditions": True, "useBaseWuxing": True,
    "useSinglePrecisionProbability": True, "matchBonusByName": True,
    "drawAtZeroProbability": True,
    "supportSpecialSkillConditions": False,
}


def single(value):
    return struct.unpack("f", struct.pack("f", value))[0]


def apply_legend_rules(package):
    _definition(package, "talents", "屌丝")["affixes"] = [
        {"type": "source_skill_legend_chance_bonus", "skillName": "野球拳", "bonus": .1}]
    # Legacy divides every integer chance trigger by 100f before adding to double.
    def visit(value):
        if isinstance(value, dict):
            if value.get("type") == "legend_skill_chance_modifier":
                value["value"]["delta"] = single(value["value"]["delta"])
            for child in value.values(): visit(child)
        elif isinstance(value, list):
            for child in value: visit(child)
    visit(package)
    selectable = {s["id"] for s in package["externalSkills"] + package["specialSkills"]}
    selectable.update(f["id"] for s in package["externalSkills"] + package["internalSkills"] for f in s.get("formSkills", []))
    unreachable = [{"id": s["id"], "name": s["name"], "startSkill": s["startSkill"]}
                   for s in package["legendSkills"] if s["startSkill"] not in selectable]
    return {"sourceCommit": "2c62a80de46c48e64e5647511a9c41e088293aff",
            "resolution": LEGEND_RESOLUTION, "records": len(package["legendSkills"]),
            "unselectableStarts": unreachable,
            "unsupportedConditionRecords": [s["id"] for s in package["legendSkills"]
                if any(c["type"] == "special_skill" for c in s["conditions"])],
            "scope": "trigger policy only; power, range, full reaction ordering and all live routes remain"}
