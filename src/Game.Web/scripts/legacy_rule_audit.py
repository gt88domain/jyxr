"""Inventory configuration and evidence without equating either with parity."""
from collections import Counter, defaultdict
from pathlib import Path
import re


def audit_rules(package, repository):
    references = defaultdict(list)
    for path in sorted((Path(repository) / "jyx-legacy-dll/JyGame").glob("*.cs")):
        for number, line in enumerate(path.read_text(encoding="utf-8-sig").splitlines(), 1):
            for name in re.findall(r'"([^"\n]+)"', line):
                references[name].append(f"{path.relative_to(repository)}:{number}")
    builtins = {"中毒", "恢复", "内伤", "集气", "麻痹", "神行", "晕眩", "缓速", "轻身", "致盲",
                "诸般封印", "拳掌封印", "剑封印", "刀封印", "奇门封印", "圣战"}
    partial = {
        "鬼魅": ["verify all claimed status immunity, not only action speed"],
        "武学奇才": ["validate equipment/skill attribute doubling and both cast/book EXP paths"],
        "右臂有伤": ["extra rage behavior is not configured"],
        "醉酒": ["extra-strike probability is not configured"],
        "神速攻击": ["multiple strikes are not configured"],
        "左右互搏": ["multiple strikes are not configured"],
        "易容": ["ambush, immunity and consumption are not configured"],
        "武穆兵法": ["attack/defence buffs configured; triple-strike behavior remains"],
        "天地同寿": ["verify permanent max-HP cost and unblockable self-cost semantics"],
        "同归剑法": ["verify self-cost separately from preventable incoming damage"],
    }
    sections = {}
    for collection in ["talents", "buffs", "specialSkills"]:
        entries = []
        for definition in package[collection]:
            name = definition["id"]
            remaining = list(partial.get(name, []))
            if collection == "specialSkills":
                buff_ids = [buff["id"] for buff in definition.get("buffs", [])]
                buff_ids += [effect["buffId"] for effect in definition.get("effects", []) if effect.get("type") == "apply_buff"]
                for buff in buff_ids:
                    remaining += [f"{buff}: {item}" for item in partial.get(buff, [])]
                if any(effect.get("effectId") in {"sever_in_two", "firearm_damage", "mutual_destruction_sword", "heaven_and_earth_same_lifespan", "shoulder_throw", "dragon_tail_sweep", "corpse_poison", "xiang_er_wish_damage"} for effect in definition.get("effects", [])):
                    remaining.append("verify special damage hit/reaction pipeline against original; currently direct damage")
            configured = bool(definition.get("affixes") or definition.get("effects") or
                              collection == "specialSkills" and definition.get("buffs"))
            state = "configured" if configured else "metadata-only"
            if collection == "buffs" and name in builtins:
                state = "engine-behavior"
            if remaining and (configured or state == "engine-behavior"):
                state = "partial"
            if name == "黑衣" and collection == "talents":
                state = "identity-only"
            entries.append({"id": name, "configurationState": state,
                            "sourceLiteralReferences": references.get(name, []),
                            "remaining": remaining,
                            "fullBehaviorVerified": False})
        sections[collection] = {"total": len(entries), "states": dict(Counter(e["configurationState"] for e in entries)), "entries": entries}
    return {"scope": "Configuration inventory and source literal references, not a completion percentage. Engine behavior and configured effects still need formula/route/combination verification.",
            "sourceCommit": "2c62a80de46c48e64e5647511a9c41e088293aff", "sections": sections}
