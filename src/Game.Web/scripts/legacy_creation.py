"""First-round creation profile transcribed from pinned RollRoleUI.cs.

Keep this data separate from both UI and the shared engine. The optional Lua
override has a zero/one-based random-index discrepancy; use the pinned C#
MakeRandomCondition's ten uniform attributes and document that baseline.
"""
import json
from pathlib import Path


def apply_legacy_creation(package: dict) -> dict:
    def option(text, **effects):
        return {"text": text, **effects}

    def stats(text, **values):
        return option(text, stats=values)

    questions = [
        {"title": "你希望你在武侠小说中的出身是", "options": [
            option("商人的儿子", stats={"bili": -5}, silver=5000, items={"黑玉断续膏": 1, "九转熊蛇丸": 1, "金丝道袍": 1, "金头箍": 1}, model="zydx"),
            option("大草原上长大的孩子", stats={"shenfa": 15, "dingli": -2, "quanzhang": 15}, talents=["猎人"], model="caoyuan"),
            option("名门世家", stats={"fuyuan": 3, "bili": -3, "dingli": 2, "wuxing": 20, "jianfa": 2, "gengu": 2}, items={"银手镯": 1}, silver=100, model="huodu"),
            option("市井流浪的汉子", stats={"fuyuan": -5, "bili": 12, "daofa": 15, "qimen": 12}, items={"草帽": 1}, silverSet=0, model="shijing"),
            option("疯子", stats={"wuxing": 35, "dingli": 10, "gengu": 10}, talents=["神经病"], model="fengzi"),
            option("书香门第", stats={"wuxing": 20, "bili": 1, "shenfa": -10, "gengu": -5}, model="xiake"),
        ]},
        {"title": "以下你觉得最宝贵的是", "options": [option("无尽的财宝", silver=1000), stats("永恒的爱情", fuyuan=15), stats("坚强的意志", dingli=15), stats("自由", shenfa=15), option("至高无上的权力", talents=["自我主义"])]},
        {"title": "以下你觉得最可恶的行为是", "options": [stats("调戏妇女", dingli=9), stats("欺软怕硬", gengu=6, bili=6), stats("偷奸耍滑", wuxing=10), stats("切JJ练神功", gengu=10), option("有美女不泡", talents=["好色"])]},
        {"title": "你最喜欢的兵刃是", "options": [stats("拳", quanzhang=10), stats("剑", jianfa=10), stats("刀", daofa=20), stats("暗器", qimen=20)]},
        {"title": "以下女性角色你最喜欢的是", "options": [stats("黄蓉", wuxing=5), stats("小龙女", dingli=5), stats("郭襄", fuyuan=5, gengu=5), stats("梅超风", quanzhang=6, bili=6), stats("周芷若", dingli=10)]},
        {"title": "以下男性角色你最喜欢的是", "options": [stats("张无忌", wuxing=5, gengu=10), stats("郭靖", wuxing=-10, fuyuan=15, bili=5), stats("杨过", wuxing=5, dingli=5), stats("令狐冲", wuxing=10), stats("林平之", jianfa=10, dingli=10)]},
        {"title": "以下你觉得最牛逼的人是", "options": [stats("乔峰", bili=10, quanzhang=9), stats("韦小宝", fuyuan=30), stats("金庸先生", wuxing=13, jianfa=5, daofa=5, quanzhang=5, qimen=5), stats("东方不败", gengu=20), option("汉家松鼠", stats={"gengu": 10}, internalSkill={"id": "基本内功", "level": 20}, items={"松果": 3}), option("半瓶神仙醋", items={"天王保命丹": 6})]},
    ]
    heads = "主角 主角3 主角4 魔君 全冠清 李白 林平之瞎 侠客2 归辛树 狄云 独孤求败 陈近南 石中玉 商宝震 尹志平 流浪汉 梁发 卓一航 烟霞神龙 双手开碑 流星赶月 盖七省 公子1 主角2".split()
    media = package["browser"]["media"]
    profile = {"source": {"commit": "2c62a80de46c48e64e5647511a9c41e088293aff", "file": "JyGame/RollRoleUI.cs", "scope": "first round; pinned C# questions, rewards and uniform random-stat rules"},
               "questions": questions, "baseSilver": 100, "baseItems": {"小还丹": 3}, "normalItems": {"新手礼包-大蟠桃": 5},
               "roundItems": {"2": [["佛光普照", "百变千幻云雾十三式秘籍", "反两仪刀法", "伏魔杖法"], ["灭仙爪", "倚天剑", "屠龙刀", "打狗棒"]],
                              "3": [["隔空取物", "妙手仁心", "飞向天际", "血刀"], ["仙丽雅的项链", "李延宗的项链", "王语嫣的武学概要", "神木王鼎"]],
                              "later": [["碎裂的怒吼", "沾衣十八跌", "灵心慧质", "不老长春功法"], ["仙丽雅的项链", "李延宗的项链", "王语嫣的武学概要", "神木王鼎"]]},
               "trialItems": [{"minimum": 3, "items": ["王母蟠桃", "道家仙丹"]}, {"minimum": 6, "items": ["灵心慧质", "妙手仁心"]},
                              {"minimum": 9, "items": ["素心神剑心得", "太极心得手抄本", "乾坤大挪移心法"]}, {"minimum": 12, "items": ["沾衣十八跌", "易筋经", "厚黑学"]},
                              {"minimum": 15, "items": ["武穆遗书", "笑傲江湖曲"]}, {"minimum": 20, "items": ["真葵花宝典"]}],
               "randomStats": ["gengu", "bili", "fuyuan", "shenfa", "dingli", "wuxing", "quanzhang", "jianfa", "daofa", "qimen"],
               "portraits": [{"id": "头像." + h, "name": h, "image": media["resources"]["头像." + h]} for h in heads]}
    items = {i["id"] for i in package["items"]}
    talents = {t["id"] for t in package["talents"]}
    for group in [profile["baseItems"], profile["normalItems"]]:
        assert set(group) <= items, set(group) - items
    for groups in profile["roundItems"].values():
        for group in groups:
            assert set(group) <= items, set(group) - items
    for tier in profile["trialItems"]:
        assert set(tier["items"]) <= items, set(tier["items"]) - items
    for question in questions:
        for o in question["options"]:
            assert set(o.get("items", {})) <= items, o
            assert set(o.get("talents", [])) <= talents, o
            assert not o.get("model") or o["model"] in media["models"], o
    reference = json.loads((Path(__file__).resolve().parents[1] / "reference-materials/manifest.json").read_text())
    bonus_source = reference["lateBonusCompanions"]
    # The original Eagle Claw description explicitly identifies this title.
    # Correct the pool reference; keep all original role statistics intact.
    aliases = {"白眉鹰王": "殷天正"}
    assert "白眉鹰王殷天正" in next(s["description"] for s in package["externalSkills"] if s["id"] == "鹰爪功")
    role_ids = {c["id"] for c in package["characters"]}
    profile["startingCompanionPools"] = [{"minimumRound": pool["round"], "characterIds": [aliases.get(rid, rid) for rid in pool["characterIds"]]}
                                         for pool in bonus_source["pools"]]
    # GetRandomInt(0, Count) includes Count, then % Count wraps it to the
    # first candidate. Preserve those two tickets rather than flatten odds.
    for pool in profile["startingCompanionPools"]:
        pool["weights"] = [2, *([1] * (len(pool["characterIds"]) - 1))] if pool["characterIds"] else []
    assert [len(p["characterIds"]) for p in profile["startingCompanionPools"]] == [0, 17, 10, 7, 9]
    for pool in profile["startingCompanionPools"]:
        assert len(pool["characterIds"]) == len(set(pool["characterIds"]))
        assert set(pool["characterIds"]) <= role_ids
    profile["startingCompanionSource"] = {"commit": "4acd2c718a8afc562f0d5a0cd38464fea6699453", "file": bonus_source["source"],
        "caller": bonus_source["caller"], "drawAt": "confirmation", "aliases": aliases,
        "randomRule": "GetRandomInt(0, Count) % Count; first candidate has two tickets, others one",
        "randomSource": "JyGame/RollRoleUI.cs:712; JyGame/Tools.cs:45-48",
        "aliasEvidence": "jyx-legacy-data/data-origin/skills.xml:492 · 鹰爪功说明：白眉鹰王殷天正的成名绝技"}
    package["browser"]["creation"] = profile
    return {"source": profile["source"], "questions": len(questions), "portraits": len(heads),
            "startingCompanions": {"candidates": 43, "poolSizes": [0, 17, 10, 7, 9], "source": profile["startingCompanionSource"]},
            "deferred": ["无悔实时存档模式", "Lua随机下标差异", "部分问答天赋的完整战斗效果"]}
