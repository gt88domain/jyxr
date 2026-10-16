"""Explicit source combinations. Never infer mechanics from talent descriptions.

Pinned AttackLogic.cs: 1211–1277, 1472–1515, 1539–1546, 1768–1811.
The source's 左右互博 buff typo is intentionally not rewritten to 左右互搏.
"""
from starter_rule_effects import _definition, _damage_hook, _multiply


def apply_combination_rules(package):
    def custom(effect, **parameters):
        return {"type": "custom", "effectId": effect, "parameters": parameters}

    def talent_condition(ids, absent=False):
        return {"type": "context_unit_effective_talent", "talentIds": ids, "absent": absent}

    def hook(timing, effects, conditions=None):
        return {"type": "hook", "timing": timing, "conditions": conditions or [], "effects": effects}

    talents = {}
    # One aura per provider, including a provider who owns both talents. Its
    # lifetime follows actual living providers and it excludes the provider.
    aura_id = "original_self_interest_team_penalty"
    package["scopedBattleEffects"].append({
        "id": aura_id, "scope": {"type": "all_allies", "includeSelf": False},
        "activation": "source_alive", "grantMode": "per_provider", "lifetime": "battle",
        "affixes": [_damage_hook("source", [_multiply("source_attack", .9)])],
    })
    for name, factor in [("大小姐", .1), ("自我主义", .18)]:
        conditions = [talent_condition(["自我主义"], absent=True)] if name == "大小姐" else []
        grant_conditions = conditions.copy()
        talents[name] = [
            _damage_hook("source", [custom("team_count_attack_bonus", factorPerUnit=factor,
                maximumUnits=10, includeSelf=True, singlePrecision=True, field="source_attack")], conditions),
            hook("OnBattleStart", [{"type": "grant_scoped_battle_effect", "effectId": aura_id}], grant_conditions),
        ]
    talents["夫妻同心"] = [
        _damage_hook("source", [custom("couple_unity_attack", talentId="夫妻同心")]),
        _damage_hook("target", [custom("couple_unity_defence", talentId="夫妻同心")]),
    ]
    talents["奋战"] = [_damage_hook("source", [_multiply("source_attack", 1.5), _multiply("critical_chance", 1.5)],
        [{"type": "context_unit_hp_ratio", "maxInclusive": .3}, talent_condition(["异世人"], absent=True)])]
    talents["孤独求败"] = [_damage_hook("source", [_multiply("target_defence", .3),
        {"type": "modify_damage_context", "field": "critical_chance", "op": "add", "delta": .25}], [{"type": "chance", "value": .3}])]
    talents["金钟罩"] = [_damage_hook("target", [_multiply("target_defence", 2)], [{"type": "chance", "value": .25}])]
    talents["芷若的眷念"] = [_damage_hook("source", [_multiply("source_attack", 1.1)])]
    talents["臭叫花"] = [_damage_hook("source", [_multiply("source_attack", 1.2),
        {"type": "modify_damage_context", "field": "critical_chance", "op": "add", "delta": .2}],
        [{"type": "context_skill_name_contains", "values": ["打狗棒法"]}])]
    talents["阉人"] = [_damage_hook("source", [{"type": "modify_damage_context", "field": "critical_chance", "op": "override", "delta": 1}],
        [{"type": "context_skill_name_contains", "values": ["葵花宝典", "辟邪剑法"]}])]
    talents["俗家弟子"] = [_damage_hook("source", [_multiply("target_defence", .8, deltaPerUnitLevel=-.005)], [{"type": "chance", "value": .3}])]
    talents["阴毒"] = [_damage_hook("source", [custom("poisoned_target_level_damage", buffId="中毒", maximumBonus=.2, referenceLevel=30)])]

    # Aggregate one shared probability, then roll each extra hit separately.
    # Only the first matching talent/buff owns execution, avoiding double casts.
    names = ["幽居", "素心神剑", "左右互搏"]
    extra = {"type": "extra_strike", "target": {"type": "target"}, "damageFactors": [.6, .3],
        "runDamageHooks": False,
        "talentContributions": [
            {"talentId": "幽居", "chancePerLevel": .005, "singlePrecision": True},
            {"talentId": "素心神剑", "randomMaximum": .2},
            {"talentId": "左右互搏", "randomMaximum": .6}],
        "buffContributions": [
            {"buffId": "醉酒", "maximumStrikes": 1, "singlePrecision": True},
            {"buffId": "神速攻击", "maximumStrikes": 2, "singlePrecision": True, "stopAfterMatch": True}]}
    for index, name in enumerate(names):
        conditions = [talent_condition(names[:index], absent=True)] if index else []
        talents[name] = [hook("OnHitConfirmed", [extra], conditions)]
    for name, affixes in talents.items():
        _definition(package, "talents", name)["affixes"] = affixes
    for name in ["醉酒", "神速攻击"]:
        conditions = [talent_condition(names, absent=True)]
        if name == "神速攻击": conditions.append({"type": "context_unit_buff", "buffIds": ["醉酒"], "absent": True})
        _definition(package, "buffs", name).setdefault("affixes", []).append(hook("OnHitConfirmed", [extra], conditions))
    return {"sourceCommit": "2c62a80de46c48e64e5647511a9c41e088293aff", "talents": list(talents),
        "buffs": ["醉酒", "神速攻击"], "scope": "explicit combinations; negative damage, special-hit and global modifier ordering still require verification"}
