"""Pinned AttackLogic.cs 1671–1769: on-hit stun, seals and paralysis.

These use the modern hit/Buff pipeline; cross-reaction ordering remains partial.
Do not 'correct' the source's integer division or 寒冰真气 level*0.5.
"""
from starter_rule_effects import _definition

SEALS = ["诸般封印", "剑封印", "刀封印", "拳掌封印", "奇门封印"]


def apply_control_rules(package):
    def apply(buff, level=0):
        return {"type": "apply_buff", "target": {"type": "target"},
                "buffId": buff, "level": level, "duration": 2}

    def hook(effects, conditions, priority):
        return {"type": "hook", "timing": "OnHitConfirmed", "priority": priority,
                "conditions": [{"type": "context_unit_role", "role": "source"},
                    {"type": "context_unit_relation", "role": "target", "relation": "enemy"},
                    {"type": "context_skill_kind", "kinds": ["External", "Internal", "Form", "Legend"]}, *conditions],
                "effects": effects}

    iron = []
    for enhanced, probability in [(False, .25), (True, .37)]:
        iron.append(hook([apply("晕眩")], [
            {"type": "context_skill_weapon_type", "weaponTypes": ["quanzhang"]},
            {"type": "context_unit_effective_talent", "talentIds": ["神拳无敌"], "absent": not enhanced},
            {"type": "chance", "value": probability}], -100))
    _definition(package, "talents", "铁拳无双")["affixes"] = iron
    for order, name in enumerate(SEALS):
        _definition(package, "talents", name)["affixes"] = [hook([apply(name)], [{
            "type": "stat_difference_chance", "sourceStat": "fuyuan", "targetStat": "dingli",
            "divisor": 100, "truncateQuotients": True, "inclusive": name == "诸般封印"}], -101 - order)]
    for order, (name, per_level, buff_level) in enumerate([("阴阳", .01, 0), ("寒冰真气", .5, 3)]):
        _definition(package, "talents", name)["affixes"] = [hook([apply("麻痹", buff_level)], [{
            "type": "unit_level_chance", "baseValue": 0, "valuePerLevel": per_level, "maxValue": 1}], -106 - order)]
    # Ordinary friendly fire also carries debuffs in the source. Aoyi and
    # 灵心慧质 clear friendly debuffs (AttackLogic.cs 2168–2186).
    import copy
    for name in ["铁拳无双", *SEALS, "阴阳", "寒冰真气"]:
        affixes = _definition(package, "talents", name)["affixes"]
        friendly = []
        for original in affixes:
            ally = copy.deepcopy(original)
            ally["conditions"][1]["relation"] = "ally"
            ally["conditions"][2]["kinds"] = ["External", "Internal", "Form"]
            ally["conditions"].insert(3, {"type": "context_unit_effective_talent", "talentIds": ["灵心慧质"], "absent": True})
            friendly.append(ally)
        affixes.extend(friendly)
    return {"sourceCommit": "2c62a80de46c48e64e5647511a9c41e088293aff",
            "file": "JyGame/AttackLogic.cs:1671-1769", "talents": ["铁拳无双", *SEALS, "阴阳", "寒冰真气"],
            "scope": "confirmed normal hits, original buff levels/durations and probability formulas; friendly hits clear for 灵心慧质 and legends; full reaction/extra-strike and RNG timing remain"}
