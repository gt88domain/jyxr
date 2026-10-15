"""Original low-magic mercenary chapter, authored against current Core models.

No legacy character, item, map, story, talent or art is copied into this pack.
Names and numerical balancing here belong to a new prototype, not Jin Yong X.
"""
from __future__ import annotations


def build_frontier() -> dict:
    collections = "battles scopedBattleEffects characters externalSkills gameTips growTemplates internalSkills legendSkills maps worldTriggers resources sects shops specialSkills items itemTags randomAffixTables buffs talents towers".split()
    package = {name: [] for name in collections}
    package["resources"] = [{"id": "frontier.battle", "group": "background", "value": "battle_bg/frontier-forest"}]

    def command(call):
        return {"kind": "command", "call": call}

    def dialogue(speaker, text):
        return {"kind": "dialogue", "speaker": speaker, "text": text}

    def segment(name, steps):
        return {"name": name, "steps": steps}

    def choice(speaker, text, options):
        return {"kind": "choice", "prompt": {"speaker": speaker, "text": text}, "blocks": [{"kind": "options", "options": [{"text": label, "steps": steps} for label, steps in options]}]}

    def location(id_, name, description, events):
        return {"id": id_, "name": name, "description": description, "events": events}

    def event(id_, action, when=None, once=False):
        result = {"id": id_, "action": action}
        if when:
            result["when"] = when
        if once:
            result["repeatMode"] = "once"
        return result

    package["growTemplates"] = [{"id": "frontier_recruit_growth", "name": "旅人的历练", "statGrowth": {"bili": 2, "dingli": 2, "fuyuan": 1, "gengu": 2, "jianfa": 2, "daofa": 1, "quanzhang": 1, "qimen": 1, "shenfa": 1, "wuxing": 0, "wuxue": 8, "max_hp": 70, "max_mp": 45}}]
    package["externalSkills"] = [
        {"id": "frontier_arming_cut", "name": "步进斩", "description": "保持护手在前，踏进一步挥出短促的一斩。", "type": "jianfa", "isHarmony": True, "hard": 1, "powerBase": 3.4, "powerStep": 0.3, "targeting": {"castSize": 1, "impactType": "single", "impactSize": 0}},
        {"id": "frontier_hook_strike", "name": "斜钩击", "description": "向对手侧面挥击，迫使对手转身。", "type": "qimen", "isHarmony": True, "hard": 1, "powerBase": 2.7, "powerStep": 0.25, "targeting": {"castSize": 1, "impactType": "single", "impactSize": 0}},
        {"id": "frontier_rough_swing", "name": "鲁莽挥砍", "description": "只凭蛮力挥动手里的旧刀。", "type": "daofa", "isHarmony": True, "hard": 1, "powerBase": 1.2, "powerStep": 0.1, "targeting": {"castSize": 1, "impactType": "single", "impactSize": 0}},
    ]
    package["internalSkills"] = [{"id": "frontier_steady_breath", "name": "稳息训练", "description": "行军时练出的呼吸节奏，让双手在危险面前保持稳定。", "hard": 1, "yin": 24, "yang": 24, "attackScale": 0.1, "criticalScale": 0.05, "defenceScale": 0.12}]

    def character(id_, name, hp, mp, skill, level=1, strength=30, agility=28):
        return {"id": id_, "name": name, "level": level, "gender": "neutral", "growTemplate": "frontier_recruit_growth", "stats": {"bili": strength, "dingli": 30, "fuyuan": 25, "gengu": 30, "jianfa": 30, "daofa": 20, "quanzhang": 20, "qimen": 30, "shenfa": agility, "wuxing": 35, "wuxue": 30, "max_hp": hp, "max_mp": mp}, "externalSkills": [{"id": skill, "level": 1, "maxLevel": 10}], "internalSkills": [{"id": "frontier_steady_breath", "level": 1, "maxLevel": 10, "equipped": True}], "talentIds": [], "equipmentIds": [], "specialSkillIds": []}

    package["characters"] = [
        character("frontier_recruit", "无名旅人", 360, 180, "frontier_arming_cut", strength=38, agility=36),
        character("frontier_mara", "玛拉", 310, 160, "frontier_hook_strike", strength=32, agility=34),
        character("frontier_deserter", "断粮的逃兵", 120, 80, "frontier_rough_swing", strength=12, agility=18),
        character("frontier_raider", "路匪", 160, 90, "frontier_rough_swing", strength=16, agility=22),
        character("frontier_raider_captain", "灰巾头目", 260, 130, "frontier_rough_swing", strength=22, agility=24),
    ]

    def item(id_, name, type_, price, description, effects, category="normal", **extra):
        return {"category": category, "id": id_, "name": name, "type": type_, "price": price, "consumeOnUse": type_ == "consumable", "level": 1, "canDrop": False, "description": description, "requirements": [], "useEffects": effects, **extra}

    package["items"] = [
        item("frontier_arming_sword", "旧制骑兵剑", "equipment", 50, "剑刃已有缺口，重心仍然可靠。", [], "equipment", slotType="weapon", affixes=[{"type": "stat_modifier", "stat": "attack", "value": {"op": "add", "delta": 18}}]),
        item("frontier_padded_jack", "绗缝护衣", "equipment", 45, "厚布与羊毛填充，适合囊中羞涩的新佣兵。", [], "equipment", slotType="armor", affixes=[{"type": "stat_modifier", "stat": "defence", "value": {"op": "add", "delta": 8}}]),
        item("frontier_field_dressing", "野战敷药", "consumable", 15, "用烈酒清洗伤口后，再敷上草药。", [{"type": "add_hp", "value": 180}]),
        item("frontier_breathing_notes", "行军稳息笔记", "skill_book", 30, "一名老哨兵留下的练习记录。把它选入修炼栏，在实战中积累经验。", [{"type": "internal_skill", "skillId": "frontier_steady_breath", "level": 10}]),
        item("frontier_guard_drills", "步进斩操典", "skill_book", 35, "记录护手、步伐和挥斩的配合，供佣兵反复练习。", [{"type": "external_skill", "skillId": "frontier_arming_cut", "level": 10}]),
        item("frontier_sealed_ledger", "封蜡账册", "quest_item", 0, "账册上的货单列着药品和粮食，封蜡压着黑鸦印记。", []),
    ]
    package["shops"] = [{"id": "frontier_quartermaster", "name": "营地军需摊", "products": [
        {"id": "frontier_padded_jack", "reward": {"kind": "item", "itemId": "frontier_padded_jack"}, "price": 45},
        {"id": "frontier_field_dressing", "reward": {"kind": "item", "itemId": "frontier_field_dressing"}, "price": 15},
        {"id": "frontier_guard_drills", "reward": {"kind": "item", "itemId": "frontier_guard_drills"}, "price": 35, "maxClaims": 1},
    ]}]

    def encounter(id_, name, enemies):
        return {"id": id_, "name": name, "background": "frontier.battle", "participants": [
            {"position": {"x": 2, "y": 1}, "team": 1, "facing": 1, "partyIndex": 0},
            {"position": {"x": 2, "y": 3}, "team": 1, "facing": 1, "partyIndex": 1},
            *[{"position": {"x": 7 + index % 2, "y": 1 + index}, "team": 2, "facing": 0, "characterId": enemy} for index, enemy in enumerate(enemies)],
        ]}

    package["battles"] = [encounter("frontier_road_skirmish", "断粮者的路障", ["frontier_deserter"]), encounter("frontier_ruins_skirmish", "废塔下的灰巾", ["frontier_raider", "frontier_raider_captain"])]
    package["maps"] = [
        {"id": "frontier_camp", "name": "灰烬渡口营地", "description": "河渡旁的临时营地挤满了难民与佣兵，炊烟里带着湿木的气味。", "locations": [
            location("captain", "营地执事", "领取委托，或把失踪货物的线索交给执事。", [event("claim-contract", "story('frontier_contract_complete')", "has_flag('frontier_ruins_won')", True), event("contract-reminder", "story('frontier_contract_briefing')")]),
            location("quartermaster", "军需摊", "出售护衣、药品和基础操典。", [event("open-shop", "shop('frontier_quartermaster')")]),
            location("mara", "斥候玛拉", "她正在擦拭钩矛，似乎熟悉东边的道路。", [event("recruit-mara", "story('frontier_recruit_mara')", "!in_team('frontier_mara')", True), event("mara-ready", "story('frontier_mara_ready')", "in_team('frontier_mara')")]),
            location("east-road", "东行旧道", "沿着车辙寻找失踪补给。", [event("leave-camp", "map('frontier_wilds')")]),
        ]},
        {"id": "frontier_wilds", "name": "荆棘旧道", "description": "雨水积在车辙里。路边有人用新砍的树干搭起一道粗糙路障。", "locations": [
            location("roadblock", "拦路的逃兵", "一名饥饿的逃兵攥着生锈的刀。", [event("road-skirmish", "story('frontier_road_encounter')", "!has_flag('frontier_road_won')"), event("road-aftermath", "story('frontier_road_after')", "has_flag('frontier_road_won')")]),
            location("watchtower", "旧瞭望塔", "车辙通向林边废弃的瞭望塔。", [event("enter-ruins", "map('frontier_ruins')", "has_flag('frontier_road_won') && in_team('frontier_mara')")]),
            location("camp", "返回营地", "沿河回到灰烬渡口。", [event("return-camp", "map('frontier_camp')")]),
        ]},
        {"id": "frontier_ruins", "name": "黑鸦废塔", "description": "断墙上新钉着一面灰巾。塔底传来搬动木箱的声音，隐约可见商队的封蜡。", "locations": [
            location("storehouse", "塔底仓间", "灰巾路匪正把补给装进新的货箱。", [event("ruins-skirmish", "story('frontier_ruins_encounter')", "!has_flag('frontier_ruins_won')"), event("ruins-cleared", "story('frontier_ruins_cleared')", "has_flag('frontier_ruins_won')")]),
            location("old-road", "返回旧道", "穿过倒塌的拱门回到荆棘旧道。", [event("leave-ruins", "map('frontier_wilds')")]),
        ]},
    ]
    package["storyScripts"] = {"frontier": {"version": 3, "segments": [
        segment("frontier_arrival", [
            dialogue("营地执事", "你来得正好。渡口的药和粮已经见底，送货的两辆车却迟了整整一天。"),
            dialogue("主角", "我只带着一把旧剑。你需要的是骑士，还是肯干活的人？"),
            dialogue("营地执事", "肯干活、懂得活着回来的人。先拿这些钱置办护衣，带上敷药。东边的斥候玛拉也许愿意同去。"),
            command("item('frontier_arming_sword', 1)"), command("item('frontier_breathing_notes', 1)"), command("item('frontier_field_dressing', 2)"), command("change_silver(80)"),
            dialogue("营地执事", "稳息笔记是我从前的行军记录。装备好剑，把笔记放进修炼栏；学会的本领，比好运气更靠得住。"),
            command("suggest('此地罕有真正的魔法。装备、走位和伙伴配合将决定你能否完成第一份委托。')"),
        ]),
        segment("frontier_contract_briefing", [dialogue("营地执事", "沿东行旧道查查车辙。若找到补给，带回封蜡账册；别一个人逞英雄。")]),
        segment("frontier_recruit_mara", [
            dialogue("玛拉", "你也是为失踪的补给来的？我听见废塔那边有车轮声。"),
            choice("主角", "要邀请这名斥候同行吗？", [("一起去，战利品公平分。", [dialogue("玛拉", "说定了。你守正面，我从侧面寻找机会。"), command("join('frontier_mara')")]), ("我先准备一下。", [])]),
        ]),
        segment("frontier_mara_ready", [dialogue("玛拉", "东行旧道有一处路障。记住，追着一个敌人跑的时候，也要看住同伴的退路。")]),
        segment("frontier_road_encounter", [
            dialogue("逃兵", "留下吃的。我们已经三天没有领到口粮了。"),
            dialogue("主角", "你拦住的是给难民送药的车。把路让开，我们才都有机会活下去。"),
            dialogue("逃兵", "少说漂亮话！"),
            {"kind": "battle", "battleId": "frontier_road_skirmish", "outcomes": {"win": [command("set_flag('frontier_road_won')"), dialogue("逃兵", "车没在我这里……是灰巾帮，他们把车拖进了废塔。")], "lose": [dialogue("主角", "先撤回营地，重新准备护衣与敷药。"), command("map('frontier_camp')")]}},
        ]),
        segment("frontier_road_after", [dialogue("主角", "车辙还很新。叫上玛拉，去瞭望塔看看。")]),
        segment("frontier_ruins_encounter", [
            dialogue("玛拉", "那是渡口商队的封蜡。一个人在门口，另一个守着账册。"),
            dialogue("灰巾头目", "交不起过路钱，就别想让货过去。"),
            choice("主角", "如何处理这批补给？", [("拿回补给，协同进攻。", [{"kind": "battle", "battleId": "frontier_ruins_skirmish", "outcomes": {"win": [command("set_flag('frontier_ruins_won')"), command("item('frontier_sealed_ledger', 1)"), dialogue("玛拉", "账册找到了。回营把好消息交给执事，大家今晚终于能吃上饭。")], "lose": [dialogue("玛拉", "还撑得住！先撤，我们重新准备。"), command("map('frontier_camp')")]}}]), ("先退回旧道准备。", [command("map('frontier_wilds')")])]),
        ]),
        segment("frontier_ruins_cleared", [dialogue("玛拉", "补给已经交给车夫运回去。我们也该返回渡口了。")]),
        segment("frontier_contract_complete", [{"kind": "branch", "cases": [{"when": "has_flag('frontier_contract_paid')", "steps": [dialogue("营地执事", "你的第一份委托完成得很好。休整一下，下一段路还很长。")]}], "fallback": [
            dialogue("营地执事", "我认得这枚封蜡。你们保住了营地这一周的口粮。"),
            dialogue("主角", "塔里那些人知道商队的路线。有人向他们递了消息。"),
            dialogue("玛拉", "账册上还有一个黑鸦印记。我会去查查。"),
            command("change_silver(120)"), command("set_flag('frontier_contract_paid')"),
            dialogue("营地执事", "这是说好的报酬。今晚先歇一歇；等你们准备好了，再去找那个印记的主人。"),
            command("suggest('第一份委托完成。装备、修炼、队伍与货币会一起存入当前世界的存档。')"),
        ]}]),
    ]}}
    package["browser"] = {
        "id": "frontier", "title": "灰烬边境", "subtitle": "佣兵的第一份委托", "chapterTitle": "灰烬渡口 · 失踪的补给",
        "description": "原创低魔佣兵冒险。一个营地、一段旧道、一座废塔，靠装备与战技活着回来。",
        "defaultName": "旅人", "heroDefinitionId": "frontier_recruit", "initialMapId": "frontier_camp", "initialStoryId": "frontier_arrival", "currencyName": "银币", "currencyUnit": "银币", "completionStoryId": "frontier_contract_complete",
        "terms": {"cultivation": "战技研习", "internalSkills": "专注流派", "externalSkills": "战技", "energy": "耐力"},
        "media": {"titleBackground": "art/frontier-camp.png", "worldBackground": "art/frontier-camp.png", "battleBackground": "art/frontier-forest.png", "defaultFriendly": "art/mercenary.png", "defaultEnemy": "art/mercenary.png", "characters": {"frontier_recruit": "art/mercenary.png", "frontier_mara": "art/mercenary.png", "frontier_deserter": "art/mercenary.png", "frontier_raider": "art/mercenary.png", "frontier_raider_captain": "art/mercenary.png"}, "maps": {"frontier_camp": "art/frontier-camp.png", "frontier_wilds": "art/frontier-forest.png", "frontier_ruins": "art/frontier-ruins.png"}, "battles": {"frontier_road_skirmish": "art/frontier-forest.png", "frontier_ruins_skirmish": "art/frontier-ruins.png"}},
        "objectives": [
            {"id": "arrival", "title": "接下失踪补给的委托", "kind": "story", "target": "frontier_arrival"},
            {"id": "equipment", "title": "装备旧制骑兵剑或护衣", "kind": "equipment"},
            {"id": "cultivation", "title": "选择战技笔记进行修炼", "kind": "cultivation"},
            {"id": "purchase", "title": "在军需摊完成一次交易", "kind": "purchase", "target": "frontier_quartermaster"},
            {"id": "party", "title": "邀请斥候玛拉同行", "kind": "party", "target": "frontier_mara"},
            {"id": "road", "title": "突破旧道上的路障", "kind": "battle", "target": "frontier_road_skirmish"},
            {"id": "ruins", "title": "在黑鸦废塔夺回账册", "kind": "battle", "target": "frontier_ruins_skirmish"},
            {"id": "payment", "title": "返回营地领取委托报酬", "kind": "story", "target": "frontier_contract_complete"},
            {"id": "save", "title": "保存第一份委托的旅程", "kind": "save"},
        ],
    }
    return package
