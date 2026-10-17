#!/usr/bin/env python3
"""Compare all six final-attribute branches with the pinned original source."""
import json
from pathlib import Path
import re
import sys

WEB = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(WEB / "scripts"))
from legacy_attribute_rules import ATTRIBUTE_RULES

source = (WEB.parents[1] / "jyx-legacy-dll/JyGame/AttributeFinalHelper.cs").read_text(encoding="utf-8-sig")
rules = re.findall(r'if \(key == "([^"]+)" && owner.HasTalent\("([^"]+)"\)\)\s*\{\s*num = \(int\)\(\(double\)num \* ([\d.]+)\);', source)
assert len(rules) == len(ATTRIBUTE_RULES) == 6
package = json.loads((WEB / "public/data/content-package.json").read_text())
talents = {t["id"]: t for t in package["talents"]}
for order, ((key, name, factor), rule) in enumerate(zip(rules, ATTRIBUTE_RULES)):
    assert rule == (name, key, key, float(factor))
    assert talents[name]["affixes"] == [{"type": "final_stat_multiplier", "stat": key,
        "multiplier": float(factor), "order": order}]
print("PASS six source final-attribute multipliers, exact stat keys, source order and per-assignment integer conversion")
