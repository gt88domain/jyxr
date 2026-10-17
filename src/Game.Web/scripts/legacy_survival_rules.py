"""Original recovery, internal-energy and survival rules; no inferred effects.

Pinned JyGame source: BattleField 723–959/1583–1611, BattleSprite 731–737,
AttackLogic 774–789/970–1039/2104–2135. Configuration is not full parity.
"""
from starter_rule_effects import _definition


def apply_survival_rules(package):
    def custom(effect_id, **parameters):
        return {"type": "custom", "effectId": effect_id, "parameters": parameters}

    def hook(timing, effects, conditions=None, priority=0):
        return {"type": "hook", "timing": timing, "priority": priority,
                "conditions": conditions or [], "effects": effects}

    def chance(value):
        return {"type": "chance", "value": value}

    def apply_buff(name, level, duration, target=None):
        return {"type": "apply_buff", "target": target or {"type": "self"},
                "buffId": name, "level": level, "duration": duration}

    preparation = "BeforeActionReadiness"  # Original effects precede the stun check.
    nearby = {"type": "nearby_allies", "radius": 2}
    talents = {
        "普照": [hook(preparation, [apply_buff("恢复", 2, 3, nearby)], [chance(.4)], 950)],
        "无相": [hook(preparation, [custom("formless_healing", baseValue=50, valuePerLevel=30, maximumInclusive=True)], [chance(.3)], 940)],
        "琴胆剑心": [hook(preparation, [apply_buff("攻击强化", 3, 3, nearby)], [chance(.4)], 930)],
        "医仙": [hook(preparation, [custom("medical_immortal", useBaseGengu=True)], priority=920)],
        # Contrary to its description, the original candidate list includes self.
        "救死扶伤": [hook(preparation, [custom("heal_the_wounded", includeSelf=True, useBaseGengu=True)], priority=910)],
        "哀歌": [hook(preparation, [apply_buff("攻击弱化", 2, 3, {"type": "nearby_enemies", "radius": 3})], priority=900)],
        "悲酥清风": [hook(preparation, [custom("grieving_breeze")], [chance(.3)], 890)],
        "百穴归一": [hook(preparation, [{"type": "add_rage", "target": {"type": "self"}, "value": 1},
                                         custom("random_mp_recovery", minimum=50, maximum=200)], priority=870)],
        "倚天屠龙": [hook(preparation, [apply_buff("圣战", 2, 2)], [chance(.2)], 840)],
        "百足之虫": [hook("BeforeDefeated", [custom("survive_at_one_hp", abilityId="百足之虫", chance=.2)], priority=300)],
        "真气护体": [hook("BeforeDefeated", [custom("qi_shield_defeat_prevention", abilityId="真气护体", chance=.5, mpCostPerDamage=2)], priority=200)],
        "无尽斗志": [hook("BeforeDefeated", [custom("endless_fighting_spirit", abilityId="无尽斗志", guaranteedFirstTalentId="我就是神", chance=.1)], priority=100)],
        "不老长春": [hook("BeforeDamageApplied", [custom("eternal_spring", enhancedTalentId="万年长春",
                          chance=.1, enhancedChance=.2, recoveryFactor=.35, floatText="不老长春回血")], priority=190)],
    }
    for name, power, high, transfer, before, proc in [
        ("北冥神功", 2, 1.5, True, True, 1), ("鲲跃北溟", 1, 1, True, False, .5),
        ("化功大法", 3, 1, False, False, .5), ("吸星大法", 2, 2, True, True, 1),
    ]:
        parameters = dict(power=power, randomMinimum=1, randomMaximum=high, transfer=transfer,
                          integerArithmetic=True, multiplyPowerBeforeDivision=before)
        if name == "吸星大法": parameters["appliedBuffId"] = "封穴"
        talents[name] = [hook("OnHitConfirmed", [custom("internal_energy_attack", **parameters)],
                             [{"type": "context_unit_role", "role": "source"}, chance(proc)], 400)]
    for name, proc in [("清心", chance(.5)), ("清风", {"type": "unit_level_chance", "baseValue": 0, "valuePerLevel": .015})]:
        talents[name] = [hook("AfterBuffRound", [{"type": "remove_context_buff"}],
                             [{"type": "context_buff_negative"}, proc])]
    for name, probability in [("乾坤大挪移奥义", 1), ("乾坤大挪移", .5)]:
        conditions = [{"type": "context_unit_role", "role": "target"}]
        if name == "乾坤大挪移":
            conditions.append({"type": "context_unit_effective_talent", "talentIds": ["乾坤大挪移奥义"], "absent": True})
        conditions.append(chance(probability))
        talents[name] = [hook("BeforeDamageApplied", [{"type": "modify_damage", "op": "more", "delta": .5, "rounding": "Truncate"}], conditions, 600)]
    for name, mode in [("精打细算", "careful"), ("精明", "smart")]:
        talents[name] = [hook("BeforeDamageApplied", [custom("careful_defense", mode=mode,
            carefulTalentId="精打细算", smartTalentId="精明", carefulChance=.2, carefulDamageCap=200,
            smartChance=.25, smartDamageCap=500, carefulSpeech={"lines": ["嘿嘿，你可伤不到我。"], "chance": 1},
            smartSpeech={"lines": ["这一招太狠了，我得躲开一点。"], "chance": 1})], priority=550)]
    for identifier, affixes in talents.items():
        _definition(package, "talents", identifier)["affixes"] = affixes
    _definition(package, "talents", "右臂有伤")["affixes"].append(
        hook(preparation, [{"type": "add_rage", "target": {"type": "self"}, "value": 1}], priority=860))
    _definition(package, "talents", "嗜酒如命")["affixes"][0]["priority"] = 880
    _definition(package, "specialSkills", "天地同寿")["effects"][0]["parameters"] = {"permanentMaxHpCost": 10}
    for identifier, kind, factor, reasons in [
        ("封穴", "mp", 0, ["Rest"]),
        ("重伤", "hp", .5, ["Rest", "Item", "Lifesteal", "DamageConversion"]),
        ("重伤", "mp", .5, ["Rest", "Item"]),
    ]:
        if identifier == "封穴" or kind == "hp": _definition(package, "buffs", identifier)["affixes"] = []
        _definition(package, "buffs", identifier)["affixes"].append(hook("BeforeRecoveryResolved",
            [{"type": "modify_recovery", "op": "more", "delta": factor, "rounding": "Truncate"}],
            [{"type": "context_unit_role", "role": "target"}, {"type": "context_recovery_kind", "kind": kind},
             {"type": "context_recovery_reason", "reasons": reasons}]))
    return {"sourceCommit": "2c62a80de46c48e64e5647511a9c41e088293aff", "talents": list(talents) + ["右臂有伤"],
            "buffs": ["封穴", "重伤"],
            "scope": "Explicit original preparation, recovery, internal-energy and survival rules; selected execution tests are not whole-game equivalence."}
