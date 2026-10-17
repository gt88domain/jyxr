"""Build current structural counts alongside an explicitly subjective estimate."""
import json
from pathlib import Path


def build_progress(world, rules, package, companions):
    estimate = json.loads((Path(__file__).resolve().parents[1] / "src/restoration-estimate.json").read_text())
    categories = estimate["categories"]
    assert sum(category["weight"] for category in categories) == 100
    weighted = sum(category["estimate"] * category["weight"] for category in categories) / 100
    talents = rules["sections"]["talents"]
    configured = talents["states"].get("configured", 0) + talents["states"].get("partial", 0)
    collection_names = {"external": "externalSkills", "internal": "internalSkills", "special": "specialSkills", "legend": "legendSkills", "items": "items"}
    features = []
    for feature in estimate["features"]:
        row = dict(feature)
        if row["id"] in collection_names:
            row["count"] = len(package[collection_names[row["id"]]])
            row["countLabel"] = "原定义已载入"
        elif row["id"] == "battle":
            row["count"] = world["baseline"]["battles"]
            row["countLabel"] = "原战斗定义"
            row["structurallyUsable"] = row["count"] - len(world["brokenBattleReferences"])
        elif row["id"] == "talents":
            row["count"] = configured;row["total"] = talents["total"];row["countLabel"] = "已有配置或部分效果"
        elif row["id"] == "companions":
            row["count"] = companions["counts"]["characterForms"];row["countLabel"] = "图鉴角色形态"
            row["instructions"] = companions["counts"]["instructions"];row["normalVerified"] = companions["counts"]["normalVerified"]
            pools = package["browser"]["creation"]["startingCompanionPools"]
            row["startingRewardCandidates"] = sum(len(pool["characterIds"]) for pool in pools)
            row["startingRewardPoolSizes"] = [len(pool["characterIds"]) for pool in pools]
        features.append(row)
    return {
        "estimate": round(weighted / 5) * 5, "weightedEstimate": weighted,
        "basis": estimate["basis"], "categories": categories,
        "stories": {"current": world["structurallyMigrated"]["originalStories"], "total": world["baseline"]["stories"]},
        "events": {"current": world["structurallyMigrated"]["mapEvents"], "total": world["baseline"]["mapEvents"]},
        "talents": {"configured": configured, "total": talents["total"], "metadataOnly": talents["states"].get("metadata-only", 0),
                    "conditional": talents["states"].get("referenced-behavior", 0)},
        "features": features,
        "fullGameVerified": False,
    }
