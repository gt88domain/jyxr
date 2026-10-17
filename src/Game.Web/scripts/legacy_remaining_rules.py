"""Remaining pinned C# talent and status behavior, expressed as content."""
from starter_rule_effects import _definition

FORMATION_RULES = {"interceptTalentId": "真武七截阵", "sharedDamageTalentId": "五行阵",
    "transferTalentId": "八卦阵", "groupAttackTalentId": "金刚伏魔圈", "supportRadius": 5}
ENGINE_FORMATIONS = ["真武七截阵", "五行阵", "八卦阵"]


def apply_remaining_rules(package):
    _definition(package, "talents", "金刚伏魔圈")["affixes"].append({"type": "trait", "traitId": "CannotMove"})
    def role(value): return {"type": "context_unit_role", "role": value}
    def chance(value): return {"type": "chance", "value": value}
    def enemy(other="target"): return {"type": "context_unit_relation", "role": other, "relation": "enemy"}
    def names(*values): return {"type": "context_skill_name_contains", "values": list(values)}
    def inner(*values): return {"type": "context_unit_equipped_internal_skill", "internalSkillIds": list(values)}
    def custom(identifier, **parameters): return {"type": "custom", "effectId": identifier, "parameters": parameters}
    def hook(timing, effects, conditions=None, priority=0):
        return {"type": "hook", "timing": timing, "effects": effects, "conditions": conditions or [], "priority": priority}
    def stat(field, op, value): return {"type": "modify_damage_context", "field": field, "op": op, "delta": value}
    def buff(name, duration, target="target", level=0): return {"type": "apply_buff", "target": {"type": target}, "buffId": name, "level": level, "duration": duration}
    def damage_formula(formula, **p): return custom("final_damage_formula", formula=formula, **p)
    def defence_evasion(probability, duration=0, conditions=None):
        effects = [{"type": "cancel_hit", "suppressHitEffects": True}]
        if duration: effects.append(buff("晕眩", duration, "source"))
        return hook("BeforeHitResolved", effects, [role("target"), *(conditions or []), chance(probability)])
    toad_ids = [s["id"] for s in package["internalSkills"] if "蛤蟆功" in s["name"]]
    talents = {
        "光明圣火阵": [hook("BeforeActionReadiness", [custom("bright_sacred_fire_formation", rollPerVisitedUnit=True)])],
        "死生茫茫": [hook("BeforeDamageDistribution", [custom("maximum_hp_drain", damageFactor=.05, maximumLossFactor=.1, recoveryFactor=.5)], [role("source"), {"type": "damage_positive"}, chance(.1)])],
        "玄门罡气": [hook("OnHitConfirmed", [custom("action_gauge_rule", minimum=10, maximum=40)], [role("source"), inner("九阴神功")])],
        "越女剑": [hook("AfterSkillCast", [custom("action_gauge_rule", minimum=20, maximum=20, capAllEnemies=True)], [role("source"), {"type": "context_skill_kind", "kinds": ["Legend"]}, {"type": "context_skill_name_equals", "values": ["越女剑法奥义式"]}])],
        "墨家传人": [hook("OnHitConfirmed", [custom("random_debuff", buffIds=["中毒", "内伤", "致盲", "缓速", "晕眩", "攻击弱化", "诸般封印", "剑封印", "刀封印", "拳掌封印", "奇门封印", "伤害加深", "重伤", "定身", "封穴", "点穴", "诅咒"], level=3, duration=3, allowAllies=True)], [role("source"), names("墨拳", "墨剑", "缚星锁")])],
        "我是疯子": [hook("BeforeBuffApplied", [custom("random_strengthen_context_buff", chance=.5, minimumLevelDelta=0, maximumLevelDelta=2, minimumTurnDelta=0, maximumTurnDelta=2)], [role("source"), {"type": "context_buff_negative"}])],
        "百变千幻": [hook("BeforeActionReadiness", [buff("易容", 3, "self", 2)], [chance(.1)])],
        "魔神降临": [hook("BeforeActionReadiness", [buff("魔神降临", 3, "self", 2)], [chance(.12)])],
        "无形剑气": [hook("AfterDamageCalculation", [damage_formula("AbsoluteMpDifference", minimum=.1, maximum=.25)], [role("source"), {"type": "context_skill_name_equals", "values": ["六脉神剑"]}], 180)],
        "攀云乘龙": [hook("AfterDamageCalculation", [damage_formula("AttributeRandomAddition", minimum=1, maximum=2)], [role("source"), chance(.5)], 1900)],
        "黑天死炎": [hook("AfterDamageCalculation", [damage_formula("CurrentHpMinimum", minimum=.25, maximum=.25)], [role("source"), chance(.25)], 2000)],
        "木婉清的眷恋": [hook("AfterDamageCalculation", [damage_formula("NamedCompanionMultiplier", minimum=1.2, maximum=1.8, beneficiaryName="段誉", companionName="木婉清")], [role("source")], 200)],
        "长平公主的眷恋": [hook("AfterDamageCalculation", [damage_formula("NamedCompanionMultiplier", minimum=1.2, maximum=1.5, beneficiaryName="袁承志")], [role("source")], 199)],
        "赵敏的眷念": [defence_evasion(.1)],
        "沾衣十八跌": [defence_evasion(.1, 2, [enemy("source")])],
        "鹿鼎.一等鹿鼎公": [defence_evasion(.25, 3, [enemy("source")])],
        "斗转星移": [hook("BeforeDamageApplied", [custom("shifting_stars_reflection", familyTalentId="慕容世家", chance=.1, familyChance=.2, damageFactor=.25,
            floatText="斗转星移", speech="以彼之道，还施彼身！", unreactive=True, singlePrecision=True)], [role("target")], 500)],
        "狗杂种": [hook("BeforeDamageCalculation", [stat("critical_chance", "add", .3)], [role("source"), inner("太玄神功", "罗汉伏魔功"), chance(.3)]),
                    hook("BeforeDamageCalculation", [stat("target_defence", "add", 250)], [role("target"), inner("太玄神功", "罗汉伏魔功")])],
        "破甲": [hook("BeforeDamageCalculation", [stat("target_defence", "more", .9), stat("target_defence", "post_add", -70)], [role("source"), chance(.3)])],
        "臭蛤蟆": [hook("BeforeDamageCalculation", [stat("source_attack", "add", 400)], [role("source"), names("蛤蟆功")]),
                    hook("BeforeDamageCalculation", [stat("source_attack", "add", 250)], [role("source"), inner(*toad_ids), {"type": "context_skill_name_contains", "values": ["蛤蟆功"], "absent": True}]),
                    hook("BeforeDamageCalculation", [stat("target_defence", "more", 1.3)], [role("target"), inner(*toad_ids)])],
        "追魂": [hook("OnHitConfirmed", [custom("soul_chasing", buffId="伤害加深", speechChance=0, speechLines=[], truncateQuotients=True)], [role("source"), enemy()])],
        "飞向天际": [hook("OnHitConfirmed", [custom("flying_skyward")], [role("source"), enemy()])],
        "碎裂的怒吼": [hook("AfterSkillCast", [buff("晕眩", 2, "nearby_enemies") | {"target": {"type": "nearby_enemies", "radius": 3}}], [role("source"), {"type": "context_skill_kind", "kinds": ["Legend"]}, chance(.3)])],
    }
    # Female and eunuch conditions are an OR; exclude overlap to roll once.
    talents["段王爷的电眼"] = []
    for other, timing in [("target", "OnHitConfirmed"), ("source", "BeforeHitResolved")]:
        for gender in [True, False]:
            conditions = [{"type": "context_unit_gender", "role": other, "genders": ["female"]}] if gender else [
                {"type": "context_unit_effective_talent", "role": other, "talentIds": ["阉人"]},
                {"type": "context_unit_gender", "role": other, "genders": ["male", "neutral", "animal", "eunuch"]}]
            effects = [buff("晕眩", 2)] if timing == "OnHitConfirmed" else [{"type": "cancel_hit", "suppressHitEffects": True}]
            talents["段王爷的电眼"].append(hook(timing, effects, [role("source" if timing == "OnHitConfirmed" else "target"), enemy(other), *conditions, chance(.5)]))
    for name, affixes in talents.items(): _definition(package, "talents", name)["affixes"] = affixes
    for name in ["易容", "溜须拍马"]:
        effects = [hook("BeforeDamageApplied", [custom("incoming_damage_immunity")], [role("target"), enemy("source"), {"type": "context_skill_kind", "kinds": ["External", "Internal", "Form", "Legend"]}], 525)]
        if name == "易容":
            effects.append(hook("AfterDamageCalculation", [{"type": "modify_damage", "op": "more", "deltaMin": 1.1, "deltaMax": 1.3},
                {"type": "remove_buff", "target": {"type": "self"}, "buffId": name}], [role("source"), enemy()], -500))
        else:
            effects.append(hook("BeforeDamageCalculation", [{"type": "remove_buff", "target": {"type": "self"}, "buffId": name}], [role("source"), enemy()]))
        _definition(package, "buffs", name)["affixes"] = effects
    _definition(package, "buffs", "魔神降临")["affixes"] = [hook("BeforeDamageCalculation", [
        stat("critical_chance", "override", 1), stat("critical_multiplier", "add", .25)], [role("source")], -1000)]
    # These bypass defence formula but still pass the common hit, reflection,
    # formation and reaction stages in AttackLogic.Attack. Five top-level
    # branches also bypass the final attack modifiers inside its normal branch.
    top_level = {"同归剑法", "天地同寿", "腐尸毒", "过肩摔", "神龙摆尾"}
    for name in top_level | {"一刀两断", "襄儿的心愿", "火枪"}:
        skill = _definition(package, "specialSkills", name)
        skill["useAttackPipeline"] = True
        skill["applyFinalDamageModifiers"] = name not in top_level
    return {"sourceCommit": "2c62a80de46c48e64e5647511a9c41e088293aff", "formations": FORMATION_RULES,
        "talents": list(talents), "buffs": ["易容", "溜须拍马", "魔神降临"],
        "remaining": "Full source cosmetic RNG, mixed modifiers, special reactions and normal acquisition require validation."}
