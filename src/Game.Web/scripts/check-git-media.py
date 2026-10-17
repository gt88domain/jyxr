#!/usr/bin/env python3
"""Reject newly staged media payloads; metadata/provenance are source files."""
import argparse
from pathlib import PurePosixPath
import subprocess

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--base", default="HEAD")
args = parser.parse_args()
paths = subprocess.check_output(["git", "diff", "--cached", "--no-renames", "--name-only", "--diff-filter=ACM", "-z", args.base], text=True).split("\0")
allowed = {"src/Game.Web/public/art/README.md", "src/Game.Web/public/art/legacy/README.md", "src/Game.Web/public/art/legacy/manifest.json", "src/Game.Web/public/art/legacy/audio-manifest.json"}
extensions = {".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg", ".avif", ".bmp", ".tga", ".ogg", ".mp3", ".wav", ".flac", ".aac", ".mp4", ".webm", ".rar", ".zip", ".ttf", ".otf", ".woff", ".woff2"}
bad = [p for p in paths if p and p not in allowed and (p.startswith("src/Game.Web/public/art/") or PurePosixPath(p).suffix.lower() in extensions)]
if bad:
    raise SystemExit("Media must use the external bundle, not Git:\n" + "\n".join(bad))
print("PASS staged source changes contain no new media payloads")
