"""Selected common rules backed by pinned AttackLogic/BattleField source.

Effects execute in Core, not in the browser display. This is deliberately an
explicit list; unsupported complex talents remain unclaimed.
"""
from starter_rule_effects import _definition, _damage_hook, _multiply


def apply_common_rules(package):
    def hook(role, effects, conditions=None):
        return _damage_hook(role, effects, conditions)

    def multiply(field, value):
        return _multiply(field, value)

    def add(field, value, **extra):
        return {"type": "modify_damage_context", "field": field, "op": "add", "delta": value, **extra}

    def gender(role, value):
        return {"type": "context_unit_gender", "role": role, "genders": [value]}

    def received_damage(factor, priority):
        # Legacy casts the calculated damage to int before each target talent.
        # Preserve both truncation and 宝甲 → 神经病 → 鲁莽 ordering.
        return {"type": "hook", "timing": "BeforeDamageApplied", "priority": priority,
                "conditions": [{"type": "context_unit_role", "role": "target"}],
                "effects": [{"type": "modify_damage", "op": "more", "delta": factor, "rounding": "Truncate"}]}

    talents = {
        "神兵": [hook("source", [multiply("source_attack", 1.05)])],
        "右臂有伤": [hook("source", [multiply("source_attack", 0.95)])],
        "左手剑": [hook("source", [multiply("source_attack", 1.05), add("critical_chance", -0.02)])],
        "老江湖": [hook("source", [multiply("source_attack_low", 1.2), multiply("source_attack_high", 0.9)])],
        "神经病": [hook("source", [multiply("source_attack_high", 1.1)]), received_damage(1.1, 320)],
        "鲁莽": [hook("source", [multiply("source_attack", 1.06)]), received_damage(1.1, 310)],
        "宝甲": [received_damage(0.95, 330)],
        "苦命儿": [hook("target", [add("target_defence", 30)])],
        "好色": [hook("source", [multiply("source_attack", 1.2)], [gender("target", "female")]),
                 hook("target", [multiply("target_defence", 0.8)], [gender("source", "female")])],
        "猎人": [hook("source", [multiply("source_attack", 1.5)], [gender("target", "animal")])],
        "暴躁": [{"type": "trait", "traitId": "Irascible"}, hook("target", [add("critical_chance", 0.1)])],
        "斗魂": [{"type": "trait", "traitId": "DoubleCombatRageGain"}],
        "心眼通明": [{"type": "trait", "traitId": "MindEye"}],
        "隔空取物": [{"type": "trait", "traitId": "CanUseItemOnAlly"}],
        "妙手仁心": [{"type": "trait", "traitId": "IgnoreItemCooldown"}],
    }
    for identifier, affixes in talents.items():
        _definition(package, "talents", identifier)["affixes"] = affixes
    _definition(package, "buffs", "攻击弱化")["affixes"] = [hook("source", [_multiply("source_attack", 1.0, deltaPerBuffLevel=-0.1)])]
    _definition(package, "buffs", "防御强化")["affixes"] = [hook("target", [add("target_defence", 20, deltaPerBuffLevel=20)])]
    return {"sourceCommit": "2c62a80de46c48e64e5647511a9c41e088293aff", "files": ["JyGame/AttackLogic.cs", "JyGame/BattleSprite.cs", "JyGame/BattleField.cs"],
            "talents": list(talents), "buffs": ["攻击弱化", "防御强化"],
            "scope": "explicit source-backed common rules; not full talent/Buff parity"}
