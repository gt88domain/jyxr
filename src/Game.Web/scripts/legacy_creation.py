"""First-round creation profile transcribed from pinned RollRoleUI.cs.

Keep this data separate from both UI and the shared engine. The optional Lua
override has a zero/one-based random-index discrepancy; use the pinned C#
MakeRandomCondition's ten uniform attributes and document that baseline.
"""
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
               "randomStats": ["gengu", "bili", "fuyuan", "shenfa", "dingli", "wuxing", "quanzhang", "jianfa", "daofa", "qimen"],
               "portraits": [{"id": "头像." + h, "name": h, "image": media["resources"]["头像." + h]} for h in heads]}
    items = {i["id"] for i in package["items"]}
    talents = {t["id"] for t in package["talents"]}
    for group in [profile["baseItems"], profile["normalItems"]]:
        assert set(group) <= items, set(group) - items
    for question in questions:
        for o in question["options"]:
            assert set(o.get("items", {})) <= items, o
            assert set(o.get("talents", [])) <= talents, o
            assert not o.get("model") or o["model"] in media["models"], o
    package["browser"]["creation"] = profile
    return {"source": profile["source"], "questions": len(questions), "portraits": len(heads),
            "deferred": ["无悔实时存档模式", "多周目及试炼继承奖励", "Lua随机下标差异", "部分问答天赋的完整战斗效果"]}
