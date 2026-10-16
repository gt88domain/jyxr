"""Explicit, source-backed effects needed by the first Jin Yong encounter.

XML resource conversion preserves labels, not the legacy C# behavior behind
them. Apply this only to the Jin Yong rule package, before deriving other packs.
This intentionally does not pretend to migrate the full talent/Buff catalog.
"""

from __future__ import annotations


def _definition(package: dict, collection: str, identifier: str) -> dict:
    matches = [value for value in package[collection] if value["id"] == identifier]
    if len(matches) != 1:
        raise ValueError(f"Expected exactly one {collection}/{identifier}")
    return matches[0]


def _damage_hook(role: str, effects: list[dict], conditions: list[dict] | None = None) -> dict:
    return {
        "type": "hook",
        "timing": "BeforeDamageCalculation",
        "conditions": [{"type": "context_unit_role", "role": role}, *(conditions or [])],
        "effects": effects,
    }


def _multiply(field: str, delta: float, **extra: float) -> dict:
    return {"type": "modify_damage_context", "field": field, "op": "more", "delta": delta, **extra}


def apply_starter_rule_effects(package: dict) -> dict:
    """Mutate converted content using current Core Affix/Effect definitions.

    Assignments are deterministic and idempotent. The returned source manifest
    is suitable for the content build report; it is not runtime gameplay data.
    """
    # BattleSprite.MoveAbility, lines 261–264: 瘸子 subtracts one move point.
    _definition(package, "talents", "瘸子")["affixes"] = [
        {"type": "stat_modifier", "stat": "movement", "value": {"op": "add", "delta": -1}},
    ]

    # AttackLogic 1444–1470: base 20%; 草头百姓 extends the attack window to
    # 50%. The defender branch deliberately checks the attacker's 草头百姓.
    # Split the ranges to prevent multiplying twice below the base threshold.
    low_health = [{"type": "context_unit_hp_ratio", "maxInclusive": 0.2}]
    extended_health = [{"type": "context_unit_hp_ratio", "minExclusive": 0.2, "maxInclusive": 0.5},
                       {"type": "context_unit_effective_talent", "role": "source", "talentIds": ["草头百姓"]}]
    _definition(package, "talents", "异世人")["affixes"] = [
        _damage_hook("source", [_multiply("source_attack", 2.0), _multiply("critical_chance", 2.0)], low_health),
        _damage_hook("target", [_multiply("target_defence", 1.5)], low_health),
        _damage_hook("source", [_multiply("source_attack", 2.0), _multiply("critical_chance", 2.0)], extended_health),
        _damage_hook("target", [_multiply("target_defence", 1.5)], extended_health),
    ]

    # AttackLogic, lines 2058–2063: ×(1 + level/10), NOT ×(2 + level/10).
    _definition(package, "buffs", "攻击强化")["affixes"] = [
        # Core's `more` delta is the full multiplier, not a relative increase.
        _damage_hook("source", [_multiply("source_attack", 1.0, deltaPerBuffLevel=0.1)]),
    ]

    # AttackLogic, lines 1341–1347: 打鸡血 grants two rage in addition to its
    # XML-defined three-level, five-round attack Buff and its original MP cost.
    inspiration = _definition(package, "specialSkills", "打鸡血")
    # Otherwise missing legacy intent defaults to Offensive, and normal-mode
    # friendly-fire filtering excludes the caster from its own positive Buff.
    inspiration["intent"] = "support"
    inspiration["effects"] = [
        {"type": "add_rage", "target": {"type": "self"}, "value": 2},
    ]

    return {
        "profile": "jyx-first-encounter",
        "sourceCommit": "2c62a80de46c48e64e5647511a9c41e088293aff",
        "files": ["JyGame/BattleSprite.cs", "JyGame/AttackLogic.cs"],
        "talents": ["瘸子", "异世人", "草头百姓（异世人联动）"],
        "buffs": ["攻击强化"],
        "specialSkills": ["打鸡血"],
        "deferred": ["其余未显式装配的天赋及Buff效果"],
    }
