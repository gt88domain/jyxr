"""Export all recruitment paths as reviewable Markdown/Mermaid diagrams."""
import html


def build_atlas(catalog):
    def label(text):
        return html.escape(str(text), quote=True).replace("\n", " ").replace("|", "&#124;")
    lines = ["# 原版伙伴招募路线图册", "", "<!-- Generated from the pinned source companion catalog. -->", "",
        f"收录{catalog['counts']['characterForms']}个角色形态、{catalog['counts']['instructions']}条加入/随行指令。图为原资料分支，普通连续流程目前验证{catalog['counts']['normalVerified']}名，不能将图中路径视为已逐条通关。", "",
        "每条图的条件独立阅读；更早结果分支、入口概率、地图解锁和离队事件须同时核对。游戏内伙伴图鉴可以查看当前条件。", ""]
    for character in catalog["characters"]:
        lines += [f"## {character['name']} · {character['id']}", ""]
        for number, route in enumerate(character["routes"], 1):
            lines += [f"### 路线{number} · {'随行' if route['kind'] == 'FOLLOW' else '加入'}", "", f"原剧情：`{route['storyId']}`。", ""]
            if route["debug"]: lines += ["测试剧情，不作为普通招募入口。", ""]
            if not route["paths"]: lines += ["未找到静态地图到加入段的完整引用路径；其他触发方式待核对。", ""]
            for path_index, path in enumerate(route["paths"], 1):
                entry = path["entry"]
                prefix = f"r{number}p{path_index}n"
                lines += [f"入口{path_index}：{entry['map']} · {entry['location']}；概率{entry['probability']}%。", "", "```mermaid", "flowchart TD"]
                entry_text = "；".join([entry["map"] + " · " + entry["location"], *[c["label"] for c in entry["conditions"]]])
                lines += [f'  {prefix}0["{label(entry_text)}"]']
                for index, eid in enumerate(path["edges"], 1):
                    edge = catalog["edges"][eid]
                    conditions = "；".join(c["label"] for c in edge["conditions"])
                    text = edge["label"] + ("；" + conditions if conditions else "")
                    lines += [f'  {prefix}{index}["{label(catalog["nodes"][edge["to"]]["label"])}"]',
                        f'  {prefix}{index-1} -->|"{label(text)}"| {prefix}{index}']
                end = len(path["edges"])
                lines += [f'  {prefix}{end} --> {prefix}join["{label(character["name"])} · {route["kind"]}"]', "```", ""]
                for earlier in entry["earlierEvents"]:
                    lines += [f"- 更早入口：{earlier['label']}；" + "；".join(c["label"] for c in earlier["conditions"]) + f"；概率{earlier['probability']}%。"]
                for eid in path["edges"]:
                    for earlier in catalog["edges"][eid]["earlierBranches"]:
                        lines += ["- 更早结果须不先命中：" + ("且".join(c["label"] for c in earlier["conditions"]) or "无条件，当前路径被遮挡") + " → " + earlier["destination"]]
                access = catalog.get("mapAccess", {}).get(entry["map"], {})
                for gate in access.get("storyGates", []):
                    lines += [f"- 地图剧情入口：{gate['label']} → {' → '.join(gate['maps'])}。"]
                    for root in gate["entries"]:
                        lines += [f"  - {root['map']} · {root['location']}：" + "；".join(c["label"] for c in root["conditions"]) + f"；概率{root['probability']}%。"]
                lines += [""]
        for departure in character["departures"]:
            lines += [f"- 离队依据：`{departure['storyId']}` · {departure['kind']}。"]
        lines += [""]
    return "\n".join(lines)
