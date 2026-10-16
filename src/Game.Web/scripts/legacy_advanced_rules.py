"""Explicit original X effects, using modern engine capabilities.

This is configuration coverage, not a claim of complete legacy equivalence.
Source: pinned JyGame/AttackLogic.cs, BattleSprite.cs, AoyiLogic.cs and Role.cs.
"""
from starter_rule_effects import _definition, _damage_hook, _multiply


def apply_advanced_rules(package):
    def custom(effect_id, **parameters):
        return {"type": "custom", "effectId": effect_id, "parameters": parameters}

    def ability(effect_id, target="target", **parameters):
        return {"type": "custom_ability", "effectId": effect_id, "target": {"type": target}, "parameters": parameters}

    def hook(timing, role, effects, conditions=None, priority=0):
        return {"type": "hook", "timing": timing, "priority": priority,
                "conditions": ([{"type": "context_unit_role", "role": role}] if role else []) + list(conditions or []), "effects": effects}

    def add(field, value):
        return {"type": "modify_damage_context", "field": field, "op": "add", "delta": value}

    def names(*values):
        return {"type": "context_skill_name_contains", "values": list(values)}

    def internal(*values):
        ids = [s["id"] for s in package["internalSkills"] if any(v in s["name"] for v in values)]
        if not ids:
            raise ValueError(f"Missing referenced internal skill: {values}")
        return {"type": "context_unit_equipped_internal_skill", "internalSkillIds": ids}

    def evade(chance, conditions=None):
        return hook("BeforeHitResolved", "target", [{"type": "cancel_hit"}],
                    [{"type": "chance", "value": chance}, *(conditions or [])])

    talents = {
        "武学奇才": [{"type": "trait", "traitId": "DoubleSkillEquipmentTenDimensionAffixes"}],
        "灵心慧质": [{"type": "trait", "traitId": "AvoidFriendlyFire"}],
        "毒素抗性": [{"type": "trait", "traitId": "PoisonResistance"}],
        "轻功高超": [{"type": "stat_modifier", "stat": "movement", "value": {"op": "add", "delta": 1}}],
        "鬼魅": [{"type": "trait", "traitId": "Ghost"}],
        "博览群书": [{"type": "trait", "traitId": "BroadLearning"}],
        "轻功大师": [{"type": "trait", "traitId": "IgnoreZoneOfControl"}],
        "毒圣": [hook("BeforeBuffApplied", "source", [{"type": "strengthen_context_buff", "levelDelta": 5, "turnDelta": 4}], [{"type": "context_buff_id", "buffId": "中毒"}])],
        "毒系精通": [hook("BeforeBuffApplied", "source", [{"type": "strengthen_context_buff", "levelDelta": 3, "turnDelta": 2}], [{"type": "context_buff_id", "buffId": "中毒"}])],
        "嗜酒如命": [hook("BeforeActionReadiness", None, [{"type": "apply_buff", "target": {"type": "self"}, "buffId": "醉酒", "level": 2, "duration": 3}], [{"type": "chance", "value": 0.15}])],
        "令狐冲的怪病": [hook("BeforeActionStart", None, [custom("illness", protectorCharacterId="平一指", minimumProtectorHp=2, skipReason="咳嗽", chance=0.4)], priority=-100)],
        "阴谋家": [_damage_hook("source", [custom("low_health_target_damage", maximumBonus=0.5)])],
        "怒不可遏": [_damage_hook("source", [custom("rage_damage", bonusPerRage=0.1)])],
        "不稳定的六脉神剑": [_damage_hook("source", [_multiply("source_attack_low", 0.5), _multiply("source_attack_high", 1.5)], [names("六脉神剑")])],
        "神雕大侠": [_damage_hook("source", [_multiply("source_attack", 1.3), add("critical_chance", 0.25)], [{"type": "context_skill_name_equals", "values": ["玄铁剑法", "黯然销魂掌"]}])],
        "雪山飞狐": [_damage_hook("source", [add("critical_chance", 0.5)], [names("胡家刀法")]), evade(0.1)],
        "太极高手": [_damage_hook("source", [add("critical_chance", 0.25)], [names("太极")])],
        "太极宗师": [_damage_hook("source", [_multiply("source_attack", 1.2), add("critical_chance", 0.15)], [names("太极")]),
                   _damage_hook("target", [_multiply("target_defence", 1.2)], [internal("太极", "纯阳无极功")])],
        "混元一气": [_damage_hook("source", [add("critical_chance", 0.25)], [names("混元掌")]),
                   _damage_hook("target", [_multiply("target_defence", 1.5)], [internal("混元功")])],
        "北冥真气": [_damage_hook("source", [_multiply("source_attack", 1.8)], [internal("北冥神功")]),
                   _damage_hook("target", [_multiply("target_defence", 2.0)], [internal("北冥神功")])],
        "金蛇郎君": [_damage_hook("source", [add("critical_chance", 0.5)], [names("金蛇剑法")])],
        "金蛇狂舞": [_damage_hook("source", [_multiply("source_attack", 1.4)], [names("金蛇剑法")])],
        "铁骨墨萼": [_damage_hook("source", [_multiply("source_attack", 1.4), add("critical_chance", 0.2)], [names("连城剑法")])],
        "飘然": [evade(0.08)],
        "神行百变": [evade(0.15, [{"type": "context_unit_hp_ratio", "minInclusive": 0.8}]),
                    evade(0.07, [{"type": "context_unit_hp_ratio", "maxExclusive": 0.8}])],
        "奇门遁甲": [evade(0.09), hook("BeforeHitResolved", "source", [{"type": "set_hit_success"}],
                    [{"type": "context_hit_state", "state": "miss"}, {"type": "chance", "value": 0.8}])],
        "白内障": [hook("BeforeHitResolved", "source", [{"type": "cancel_hit"}], [{"type": "chance", "value": 0.1}])],
        "锐眼": [hook("BeforeHitResolved", "source", [{"type": "set_hit_success"}],
                    [{"type": "context_hit_state", "state": "miss"}, {"type": "chance", "value": 0.05}])],
        "铁口直断": [hook("BeforeHitResolved", "source", [{"type": "set_hit_success"}],
                    [{"type": "context_hit_state", "state": "miss"}, {"type": "chance", "value": 0.1}])],
    }
    for identifier, weapon in {"拳系装备": "quanzhang", "剑系装备": "jianfa", "刀系装备": "daofa", "奇门装备": "qimen"}.items():
        talents[identifier] = [_damage_hook("source", [custom("weapon_equipment_penalty", expectedWeaponType=weapon, damageFactor=0.9)])]
    for identifier, affixes in talents.items():
        _definition(package, "talents", identifier)["affixes"] = affixes

    buffs = {
        "定身": [{"type": "trait", "traitId": "CannotMove"}],
        "伤害加深": [_damage_hook("target", [_multiply("source_attack", 1.0, deltaPowerBasePerBuffLevel=1.15)])],
        "飘渺": [hook("BeforeHitResolved", "target", [{"type": "cancel_hit"}],
                    [{"type": "buff_level_chance", "baseValue": 0, "valuePerLevel": 0.07, "maxValue": 1}])],
        "醉酒": [hook("BeforeActionStart", None, [custom("drunkenness", skipChance=0.2, rage=6, skipReason="醉酒")])],
    }
    for identifier, affixes in buffs.items():
        _definition(package, "buffs", identifier)["affixes"] = affixes

    def apply_buff(identifier, level, duration, target="all_allies"):
        return {"type": "apply_buff", "target": {"type": target}, "buffId": identifier, "level": level, "duration": duration}

    special = {
        "华佗再世": ("support", [ability("huatuo_reborn_healing")]),
        "一刀两断": ("offensive", [ability("sever_in_two")]),
        "沉鱼落雁": ("offensive", [{"type": "set_rage", "target": {"type": "target"}, "value": 0}]),
        "同归剑法": ("offensive", [ability("mutual_destruction_sword")]),
        "天地同寿": ("offensive", [ability("heaven_and_earth_same_lifespan")]),
        "笑傲江湖曲": ("support", [apply_buff("攻击强化", 5, 3)]),
        "襄儿的心愿": ("offensive", [ability("xiang_er_wish_damage")]),
        "火枪": ("offensive", [ability("firearm_damage")]),
        "过肩摔": ("offensive", [ability("shoulder_throw")]),
        "神龙摆尾": ("offensive", [ability("dragon_tail_sweep")]),
        "清心普善咒": ("support", [{"type": "remove_negative_buffs", "target": {"type": "all_allies"}}]),
        "阿碧的歌声": ("support", [{"type": "remove_negative_buffs", "target": {"type": "all_allies"}}]),
        "吴侬软语": ("support", [{"type": "remove_positive_buffs", "target": {"type": "all_enemies"}},
                     ability("random_buff", "all_enemies", buffId="晕眩", chance=1, minimumLevel=0, maximumLevel=0, minimumDuration=2, maximumDuration=2, requiredTalentId="吴侬软语")]),
        "易容术": ("support", [apply_buff("易容", 0, 3, "self")]),
        "武穆兵法": ("support", [apply_buff(name, 5, 3) for name in ["攻击强化", "防御强化", "神速攻击"]]),
        "解毒": ("support", [{"type": "remove_buff", "target": {"type": "allied_targets"}, "buffId": "中毒"}]),
        "六合劲": ("offensive", [{"type": kind, "target": {"type": "target"}, "value": 0} for kind in ["set_rage", "set_action_gauge"]]),
        "腐尸毒": ("offensive", [ability("corpse_poison")]),
        "飞星术": ("support", [ability("random_buff", "all_units", buffId="中毒", chance=1, minimumLevel=1, maximumLevel=10, minimumDuration=3, maximumDuration=6)]),
    }
    for identifier in ["诗酒飘零", "凌波微步", "雪遁步行", "溜须拍马", "梯云纵"]:
        special[identifier] = ("support", [])
    for identifier, (intent, effects) in special.items():
        definition = _definition(package, "specialSkills", identifier)
        definition["intent"] = intent
        definition["effects"] = effects
    return {"sourceCommit": "2c62a80de46c48e64e5647511a9c41e088293aff", "talents": list(talents), "buffs": list(buffs),
            "specialSkills": list(special), "scope": "configured effects; individual execution and cross-effect order require validation",
            "remaining": ["stat-specialist integer transforms", "multi-strike timing", "disguise ambush", "special damage shared pipeline and self-cost semantics"]}
