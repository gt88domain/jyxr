"""Pinned AttackLogic.cs 449–528: final-damage school/weapon multipliers.

The order is explicit and each multiplication truncates separately. This does
not claim original cosmetic RNG sequence or pre-evasion timing equivalence.
"""
from starter_rule_effects import _definition

FAMILIES = [
    ("峨眉宗师", 1.5, 3.0, ["飘雪穿云掌", "四象掌", "佛光普照", "截手九式", "峨眉剑法", "回风拂柳剑", "灭剑绝剑", "九阴白骨爪", "霹雳雷火弹", "落英神剑掌", "玉箫剑法", "弹指神通"]),
    ("刚柔并济", 1.1, 1.2, ["太极拳", "太极剑", "绵掌", "玄虚刀法", "倚天屠龙笔法", "柔云剑法", "绕指柔剑", "神门十三剑", "虎爪绝户手"]),
    ("易筋伐髓", 1.2, 2.0, ["罗汉拳", "韦陀棍", "般若掌", "拈花指", "伏魔棍", "达摩剑法", "大金刚掌", "如来千叶手", "天竺佛指", "须弥山掌", "燃木刀法", "龙爪手"]),
    ("天龙.盖世英雄", 1.2, 1.8, ["降龙十八掌", "擒龙功", "易筋经", "打狗棒法"]),
    ("铁剑掌门", 1.4, 1.4, ["铁剑剑法", "漫天花雨", "碧落苍穹", "铁血大旗功"]),
    ("射雕英雄", 1.2, 1.5, ["降龙十八掌", "打狗棒法", "九阴神功"]),
    ("玲珑璇玑", 1.2, 1.5, ["打狗棒法", "九阴神功"]),
    ("大理世家", 1.2, 1.5, ["六脉神剑", "一阳指"]),
]


def apply_school_rules(package):
    for index, (name, low, high, skills) in enumerate(FAMILIES):
        effect = {"type": "modify_damage", "op": "more", "rounding": "Truncate"}
        if low == high: effect["delta"] = low
        else: effect.update(deltaMin=low, deltaMax=high)
        _definition(package, "talents", name)["affixes"] = [{
            "type": "hook", "timing": "AfterDamageCalculation", "priority": 1000 - index,
            "conditions": [{"type": "context_unit_role", "role": "source"}, {"type": "damage_positive"},
                           {"type": "context_skill_name_contains", "values": skills}], "effects": [effect]}]
    return {"sourceCommit": "2c62a80de46c48e64e5647511a9c41e088293aff", "file": "JyGame/AttackLogic.cs:449-528",
            "talents": [family[0] for family in FAMILIES], "scope": "matched weapon names, final-damage ranges and ordered integer truncation; hit/cosmetic RNG ordering remains"}
