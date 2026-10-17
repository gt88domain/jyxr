#!/usr/bin/env python3
"""Compare migrated school conditions and ranges with the pinned C# source."""
import json
from pathlib import Path
import re
import sys

WEB = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(WEB / "scripts"))
from legacy_school_rules import FAMILIES

source = (WEB.parents[1] / "jyx-legacy-dll/JyGame/AttackLogic.cs").read_text(encoding="utf-8-sig")
start, end = source.index('if (source.Role.HasTalent("峨眉宗师")'), source.index('bool flag = bf.IsRoleInField("木婉清"')
blocks = re.split(r'(?=if \(source.Role.HasTalent\(")', source[start:end])
blocks = [b for b in blocks if b.strip()]
assert len(blocks) == len(FAMILIES) == 8
package = json.loads((WEB / "public/data/content-package.json").read_text())
talents = {t["id"]: t for t in package["talents"]}
for block, (name, low, high, skills) in zip(blocks, FAMILIES):
    assert re.search(r'HasTalent\("([^"]+)"\)', block).group(1) == name
    assert re.findall(r'skill.Name.Contains\("([^"]+)"\)', block) == skills
    random = re.search(r'attackResult.Hp \* Tools.GetRandom\(([\d.]+), ([\d.]+)\)', block)
    if random: assert tuple(map(float, random.groups())) == (low, high)
    else: assert float(re.search(r'attackResult.Hp \* ([\d.]+)', block).group(1)) == low == high
    hook = talents[name]["affixes"][0]
    assert hook["timing"] == "AfterDamageCalculation"
    assert hook["conditions"][-1]["values"] == skills
    effect = hook["effects"][0]
    assert effect["rounding"] == "Truncate"
    assert (effect.get("deltaMin", effect.get("delta")), effect.get("deltaMax", effect.get("delta"))) == (low, high)
assert len({talents[name]["affixes"][0]["priority"] for name, *_ in FAMILIES}) == 8
print("PASS eight pinned school conditions, exact source ranges, source order and integer-truncation configuration")
