"""Build current structural counts alongside an explicitly subjective estimate."""
import json
from pathlib import Path


def build_progress(world, rules):
    estimate = json.loads((Path(__file__).resolve().parents[1] / "src/restoration-estimate.json").read_text())
    categories = estimate["categories"]
    assert sum(category["weight"] for category in categories) == 100
    weighted = sum(category["estimate"] * category["weight"] for category in categories) / 100
    talents = rules["sections"]["talents"]
    configured = talents["states"].get("configured", 0) + talents["states"].get("partial", 0)
    return {
        "estimate": round(weighted / 5) * 5, "weightedEstimate": weighted,
        "basis": estimate["basis"], "categories": categories,
        "stories": {"current": world["structurallyMigrated"]["originalStories"], "total": world["baseline"]["stories"]},
        "events": {"current": world["structurallyMigrated"]["mapEvents"], "total": world["baseline"]["mapEvents"]},
        "talents": {"configured": configured, "total": talents["total"], "metadataOnly": talents["states"].get("metadata-only", 0)},
        "fullGameVerified": False,
    }
