"""AttributeFinalHelper.cs: final weapon aptitude multipliers, in source order.

Do not fold these into a single percentage: every source assignment truncates.
This does not establish equivalence of all earlier equipment/skill additions.
"""
from starter_rule_effects import _definition

ATTRIBUTE_RULES = [
    ("浪子剑客", "jianfa", "jianfa", 1.2),
    ("神拳无敌", "quanzhang", "quanzhang", 1.1),
    ("拳掌增益", "quanzhang", "quanzhang", 1.05),
    ("剑法增益", "jianfa", "jianfa", 1.05),
    ("刀法增益", "daofa", "daofa", 1.05),
    ("奇门增益", "qimen", "qimen", 1.05),
]


def apply_attribute_rules(package):
    for order, (name, stat, _, multiplier) in enumerate(ATTRIBUTE_RULES):
        _definition(package, "talents", name)["affixes"] = [{
            "type": "final_stat_multiplier", "stat": stat,
            "multiplier": multiplier, "order": order}]
    return {"sourceCommit": "2c62a80de46c48e64e5647511a9c41e088293aff",
            "file": "JyGame/AttributeFinalHelper.cs:11-35",
            "talents": [rule[0] for rule in ATTRIBUTE_RULES],
            "scope": "final weapon aptitude multipliers and ordered truncation; earlier additions and battle-buff layering remain; 神拳无敌/铁拳无双 probability is configured separately"}
