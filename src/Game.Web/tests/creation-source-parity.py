"""Check all answer effects against the pinned legacy C# source, without executing it."""
from pathlib import Path
import json
import re

web = Path(__file__).resolve().parents[1]
source = (web.parents[1] / "jyx-legacy-dll/JyGame/RollRoleUI.cs").read_text()
profile = json.loads((web / "public/data/content-package.json").read_text())["browser"]["creation"]
body = source.split("private void MakeBeginningCondition()", 1)[1].split("if (RuntimeData.Instance.Round == 1)", 1)[0]
checked = 0
for i, question in enumerate(profile["questions"]):
    switch = body.split(f"switch (results[{i}])", 1)[1].split("\n\t\t\tswitch", 1)[0]
    cases = re.findall(r"case (\d+):(.*?)break;", switch, re.S)
    assert len(cases) == len(question["options"]), i
    for index, block in cases:
        expected = {}
        stats = dict((s, int(n)) for s, n in re.findall(r'adjustAttr\(makeRole, "([^"]+)", (-?\d+)\)', block))
        if stats:
            expected["stats"] = stats
        items = {}
        for item in re.findall(r'Item.GetItem\("([^"]+)"\)', block):
            items[item] = items.get(item, 0) + 1
        if items:
            expected["items"] = items
        for key, pattern in [("silver", r'makeMoney \+= (\d+)'), ("silverSet", r'makeMoney = (\d+)')]:
            match = re.search(pattern, block)
            if match:
                expected[key] = int(match[1])
        match = re.search(r'makeRole.Animation = "([^"]+)"', block)
        if match:
            expected["model"] = match[1]
        match = re.search(r'makeRole.TalentValue \+= "#([^"]+)"', block)
        if match:
            expected["talents"] = [match[1]]
        if "makeRole.InternalSkills[0].level = 20" in block:
            expected["internalSkill"] = {"id": "基本内功", "level": 20}
        actual = {k: v for k, v in question["options"][int(index)].items() if k != "text"}
        assert actual == expected, (i, index, actual, expected)
        checked += 1
print(f"PASS {checked} answer effects match pinned RollRoleUI.cs; old game code was not executed")
