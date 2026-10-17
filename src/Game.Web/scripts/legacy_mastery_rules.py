"""Pinned SkillBox, InternalSkillInstance and AttackLogic rules.

Shared Core executes these rules. Configuration coverage is not full parity.
"""
from starter_rule_effects import _definition

MASTERY_TALENTS = ["寸长寸强", "吴钩霜雪", "金刚伏魔圈", "至刚至阳", "至空至明", "金刚", "御风", "血海魔功", "血魔刀法", "嗜血狂魔"]
BLOOD_TALENTS = ["嗜血狂魔", "血海魔功", "血魔刀法"]
BLOOD_FORMULA = {
    "type": "custom", "effectId": "single_precision_lifesteal", "parameters": {
        "skillRates": [{"name": "血刀大法", "rate": .1}, {"name": "血刀大法.吸", "rate": .2}],
        "talentRates": [{"talentId": "血海魔功", "rate": .2}, {"talentId": "血魔刀法", "rate": .15}],
        "levelRate": {"talentId": "嗜血狂魔", "baseRate": .05, "ratePerLevel": .05, "divisor": 30}}}


def apply_mastery_rules(package):
    def targeting(field, op, value, name=None, stage="BeforeBlind"):
        return {"type": "skill_targeting_modifier", "sourceSkillId": None, "field": field,
            "value": {"op": op, "delta": value}, "skillName": name, "stage": stage}
    def hook(timing, role, effects, conditions=None):
        return {"type": "hook", "timing": timing,
            "conditions": [{"type": "context_unit_role", "role": role}, *(conditions or [])], "effects": effects}
    talents = {
        "寸长寸强": [targeting("impact_size", "add", 1, stage="AfterBlind")],
        "吴钩霜雪": [targeting("cast_size", "add", 3, "太玄神功")],
        "金刚伏魔圈": [targeting("cast_size", "override", 10, "日月神鞭", "AfterBlind")],
        "至刚至阳": [{"type": "trait", "traitId": "IncreaseInternalSkillYangAffinity"}],
        "至空至明": [hook("BeforeHitResolved", "target", [{"type": "custom", "effectId": "reset_skill_cooldowns", "parameters": {"talentId": "至空至明"}}], [{"type": "chance", "value": .15}])],
        "金刚": [hook("BeforeDamageCalculation", "target", [
            {"type": "modify_damage_context", "field": "target_defence", "op": "more", "delta": 1.2},
            {"type": "modify_damage_context", "field": "target_defence", "op": "post_add", "deltaPerUnitLevel": 10}])],
        "御风": [hook("BeforeDamageCalculation", "target", [
            {"type": "modify_damage_context", "field": "critical_chance", "op": "add", "deltaPerUnitLevel": -.3, "unitLevelStep": 30}])],
    }
    for index, name in enumerate(BLOOD_TALENTS):
        conditions = [{"type": "context_unit_effective_talent", "talentIds": BLOOD_TALENTS[:index], "absent": True}] if index else []
        if name != "嗜血狂魔": conditions += [{"type": "context_skill_name_equals", "values": ["血刀大法", "血刀大法.吸"]}]
        talents[name] = [hook("OnDamageDealt", "source", [BLOOD_FORMULA], conditions)]
    blood = _definition(package, "externalSkills", "血刀大法")
    blood.setdefault("affixes", []).append({"effect": hook("OnDamageDealt", "source", [BLOOD_FORMULA], [
        {"type": "context_unit_effective_talent", "talentIds": BLOOD_TALENTS, "absent": True},
        {"type": "context_skill_name_equals", "values": ["血刀大法", "血刀大法.吸"]}])})
    for name, affixes in talents.items(): _definition(package, "talents", name)["affixes"] = affixes
    return {"sourceCommit": "2c62a80de46c48e64e5647511a9c41e088293aff", "talents": MASTERY_TALENTS,
            "files": ["JyGame/SkillBox.cs:341-390", "JyGame/InternalSkillInstance.cs:43-53", "JyGame/AttackLogic.cs:561-568,928-975,1505-1511,1849-1853"],
            "scope": "blind-stage targeting, Yang affinity, cooldowns, selected defence/critical and blood drain; full formation, ordering and per-equipment float accumulation remain"}
