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
        "醉酒": ["combined positive-damage extra strikes tested; negative damage and original post-buff timing remain"],
        "神速攻击": ["combined positive-damage extra strikes tested; negative damage and original post-buff timing remain"],
        "左右互搏": ["talent has combined extra strikes; buff spelling differs from source 左右互博 and remains unmodified"],
        "幽居": ["combined positive-damage extra strikes tested; original negative damage and special-hit timing remain"],
        "素心神剑": ["combined positive-damage extra strikes tested; original negative damage and special-hit timing remain"],
        "阉人": ["single-talent guaranteed critical configured; ordered interaction with later critical modifiers remains"],
        "易容": ["ambush, immunity and consumption are not configured"],
        "武穆兵法": ["team buffs and combined extra strikes configured; negative damage and original post-buff timing remain"],
        "天地同寿": ["single-cast HP snapshot, unblockable cost and permanent max-HP loss tested; multi-target source iteration remains"],
        "北冥神功": ["integer formula and selected boundaries tested; full hit/reaction ordering remains"],
        "吸星大法": ["integer formula and seal/recovery tested; original repeat-seal replacement and full ordering remain"],
        "化功大法": ["integer formula and selected boundaries tested; full hit/reaction ordering remains"],
        "鲲跃北溟": ["integer formula and selected boundaries tested; full hit/reaction ordering remains"],
        "不老长春": ["selected probability and recovery checks; legacy single-precision rounding and cancellation ordering remain"],
        "精明": ["defensive cap and overflow tested; offensive random multipliers remain"],
        "精打细算": ["defensive cap and priority tested; offensive random multipliers remain"],
    }
    sections = {}
    from legacy_school_rules import FAMILIES
    for name, _, _, _ in FAMILIES:
        partial[name] = ["source skill-name matching, damage multiplier range and ordered truncation configured; modern hit-check timing, cosmetic RNG sequence and AI valuation remain"]
    from legacy_attribute_rules import ATTRIBUTE_RULES
    for name, *_ in ATTRIBUTE_RULES:
        partial[name] = ["final weapon aptitude multiplier and sequential truncation configured; earlier equipment/skill additions and battle buff layering still require source comparison"]
    partial["浪子剑客"].append("original cosmetic speech RNG ordering remains")
    partial["神拳无敌"].append("铁拳无双 stun probability enhancement and cosmetic speech RNG remain")
    conditional = {
        "万年长春": "不老长春 enhanced activation probability",
        "我就是神": "无尽斗志 first successful revival guarantee",
        "吴侬软语": "吴侬软语 special-skill stun gate",
        "草头百姓": "异世人 extended HP window; full legend interaction remains",
    }
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
            elif collection == "talents" and name in conditional and not configured:
                state = "referenced-behavior"
                remaining.append("Used as a secondary condition: " + conditional[name] + "; full combinations remain")
            entries.append({"id": name, "configurationState": state,
                            "sourceLiteralReferences": references.get(name, []),
                            "remaining": remaining,
                            "fullBehaviorVerified": False})
        sections[collection] = {"total": len(entries), "states": dict(Counter(e["configurationState"] for e in entries)), "entries": entries}
    return {"scope": "Configuration inventory and source literal references, not a completion percentage. Engine behavior and configured effects still need formula/route/combination verification.",
            "sourceCommit": "2c62a80de46c48e64e5647511a9c41e088293aff", "sections": sections}
