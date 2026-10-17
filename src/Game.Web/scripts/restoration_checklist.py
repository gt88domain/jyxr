"""Publish concrete remaining work and rule names from the current audit."""
import json
from pathlib import Path


def remaining_summary(collection, state, name, has_source):
    if state == "metadata-only":
        if not has_source: return "继续查XML、Lua与其他版本的实际规则；未找到同名旧C#引用，暂不按描述猜写效果。"
        return "已有资料和旧C#同名引用，实际效果尚未接入现代内核。"
    if state == "referenced-behavior": return "目前只作为其他效果的条件使用，原组合及完整行为仍需核对。"
    from legacy_control_rules import SEALS
    from legacy_attribute_rules import ATTRIBUTE_RULES
    from legacy_school_rules import FAMILIES
    if collection == "talents":
        if name in ["铁拳无双", *SEALS, "阴阳", "寒冰真气"]:
            return "概率、Buff等级/时长与友军保护已接入；原命中、免疫、随机调用及连击/反应的完整顺序待核对。"
        if name in [r[0] for r in ATTRIBUTE_RULES]:
            return "最终属性倍率和逐次取整已接入；全部装备/武学加成与战斗Buff的前置层次、原随机顺序待核对。"
        if name in [r[0] for r in FAMILIES]:
            return "武功匹配、最终伤害倍率和逐次取整已接入；原命中时点、随机调用与AI估值待补齐。"
    specific = {
        "金刚伏魔圈": "日月神鞭距离10且不受致盲影响已接入；阵法叠伤、破阵移除及移动规则仍待补齐。",
        "至空至明": "15%概率清空冷却已接入，原命中、受击反应与表现随机顺序仍待核对。",
        "金刚": "单独防御×1.2再加10×等级已配置，与其他防御修正的完整顺序仍待核对。",
        "御风": "已按原等级整数除以30降低暴击率，其余暴击覆盖与随机顺序仍待核对。",
        "血海魔功": "血刀单精度吸血、过量伤害计入和重伤减半已接入；逐装备浮点累加及完整反应顺序仍待核对。",
        "血魔刀法": "血刀单精度吸血、过量伤害计入和重伤减半已接入；逐装备浮点累加及完整反应顺序仍待核对。",
        "嗜血狂魔": "等级吸血、单精度与过量伤害计入已接入；逐装备浮点累加及完整反应顺序仍待核对。",
        "鬼魅": "目前已接入行动速度，仍需核对原版全部状态免疫。",
        "武学奇才": "装备/武学十维属性翻倍、使用武功与秘籍的经验路径及其组合待完整核对。",
        "幽居": "追加攻击已接入，负伤害、特技命中与原Buff结算时点仍有差异。",
        "素心神剑": "追加攻击已接入，负伤害、特技命中与原Buff结算时点仍有差异。",
        "左右互搏": "天赋连击已接入；原Buff写作左右互博，现数据写作左右互搏，不能未经证据合并。",
        "阉人": "单天赋必暴击已接入，后续天赋对暴击率的覆盖顺序仍待核对。",
        "北冥神功": "吸内整数公式已有检查，完整命中和受击反应顺序仍待核对。",
        "吸星大法": "吸内与封印已接入，重复封印替换和完整反应顺序仍待核对。",
        "化功大法": "整数公式已有边界检查，完整命中和受击反应顺序仍待核对。",
        "鲲跃北溟": "整数公式已有边界检查，完整命中和受击反应顺序仍待核对。",
        "不老长春": "选定概率与恢复已检查，原单精度舍入及取消恢复的先后仍待核对。",
        "精明": "防守伤害上限已接入，攻击方随机倍率尚未补齐。",
        "精打细算": "防守伤害上限已接入，攻击方随机倍率尚未补齐。",
        "醉酒": "行动和连击已有配置，负伤害与原Buff结算后的追加攻击时点待核对。",
        "神速攻击": "追加攻击已有配置，负伤害与原Buff结算时点待核对。",
        "诗酒飘零": "施加醉酒已有配置，醉酒连击与原Buff时点尚未完整等价。",
        "武穆兵法": "全队强化和追加攻击已有配置，负伤害及神速攻击的原时点仍待核对。",
        "天地同寿": "单次自伤、永久扣生命上限已接入，多目标依次执行与完整命中/反应管线仍待核对。",
        "易容术": "目前可施加易容Buff，伏击、免疫及消耗行为尚未实现。",
    }
    return specific.get(name, "特技可施放，直接伤害与原普通命中、受击和后续反应管线仍有差异。")


def write_checklist(rules, package, output, overall_estimate):
    web = Path(__file__).resolve().parents[1]
    tasks = json.loads((web / "src/restoration-tasks.json").read_text())
    assert len({task["id"] for task in tasks}) == len(tasks)
    definitions = {key: {item["id"]: item for item in package[key]} for key in ["talents", "buffs", "specialSkills"]}
    groups = []
    specifications = [
        ("talents", "metadata-only", True, "有旧C#同名引用、效果仍待接入的天赋"),
        ("talents", "metadata-only", False, "未找到旧C#同名引用、需继续查证的天赋"),
        ("talents", "partial", None, "已有部分效果、尚未全部等价的天赋"),
        ("talents", "referenced-behavior", None, "仅作为其他效果联动条件的天赋"),
        ("buffs", "metadata-only", None, "仅资料的Buff"),
        ("buffs", "partial", None, "部分实现的Buff"),
        ("specialSkills", "partial", None, "仍有明确差异的特技"),
    ]
    for collection, state, has_references, title in specifications:
        entries = []
        for entry in rules["sections"][collection]["entries"]:
            if entry["configurationState"] != state: continue
            if has_references is not None and bool(entry["sourceLiteralReferences"]) != has_references: continue
            entries.append({"id": entry["id"], "description": definitions[collection][entry["id"]].get("description", ""),
                "sourceReferences": entry["sourceLiteralReferences"], "remainingEvidence": entry["remaining"],
                "remainingSummary": remaining_summary(collection, state, entry["id"], bool(entry["sourceLiteralReferences"]))})
        groups.append({"id": f"{collection}-{state}-{has_references}", "title": title, "entries": entries})
    data = {"schemaVersion": 1, "basis": "具体待办与当前规则配置审计；条目不是等权工作量，不能由名称数量换算完成百分比。未找到旧C#同名引用不代表原版未使用。",
            "tasks": tasks, "groups": groups, "fullGameVerified": False}
    (output / "restoration-checklist.json").write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")
    lines = ["# 原版剩余工作清单", "", "<!-- Generated from src/restoration-tasks.json and the current rule audit by npm run content. -->", "", data["basis"], "", f"整体仍约{overall_estimate}%（主观工程估算），完整路线验收后置。", ""]
    for task in tasks:
        lines += [f"- [ ] **{task['id']} · {task['title']}**（{task['state']}，{task['area']}）", f"  {task['detail']}"]
    for group in groups:
        lines += ["", f"## {group['title']}（{len(group['entries'])}项）", ""]
        for entry in group["entries"]:
            references = "、".join(entry["sourceReferences"]) or "当前固定旧C#未找到同名字符串，继续查证XML/Lua及版本差异"
            lines += [f"- **{entry['id']}**：{entry['description']}", f"  待办：{entry['remainingSummary']}", f"  来源：{references}"]
    (output / "original-remaining.md").write_text("\n".join(lines) + "\n")
    (web / "ORIGINAL_REMAINING_CHECKLIST.md").write_text("\n".join(lines) + "\n")
    return {"tasks": len(tasks), "groups": {g["title"]: len(g["entries"]) for g in groups}}
