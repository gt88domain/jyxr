#!/usr/bin/env python3
"""Pack/restore local media separately from source Git, with a locked SHA-256."""
from pathlib import Path
import argparse
import hashlib
import json
import shutil
import tempfile
import urllib.request
import zipfile

web = Path(__file__).resolve().parents[1]
lock_path = web / "scripts/art-bundle-lock.json"
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("action", choices=["pack", "restore"])
parser.add_argument("--archive", type=Path, required=True)
parser.add_argument("--url", help="Optional HTTPS source for the locked bundle")
args = parser.parse_args()
if args.action == "pack":
    args.archive.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(args.archive, "w", zipfile.ZIP_DEFLATED, compresslevel=6) as z:
        for path in sorted((web / "public/art").rglob("*")):
            if path.is_file() and path.name not in {"README.md", "manifest.json", "audio-manifest.json"}:
                info = zipfile.ZipInfo(path.relative_to(web / "public").as_posix(), date_time=(2026, 1, 1, 0, 0, 0))
                info.compress_type = zipfile.ZIP_DEFLATED
                z.writestr(info, path.read_bytes())
    lock = {"schemaVersion": 1, "filename": args.archive.name, "bytes": args.archive.stat().st_size,
            "sha256": hashlib.sha256(args.archive.read_bytes()).hexdigest()}
    lock_path.write_text(json.dumps(lock, indent=2) + "\n")
    print(json.dumps(lock))
else:
    lock = json.loads(lock_path.read_text())
    if args.url:
        if not args.url.startswith("https://"):
            raise SystemExit("A verified HTTPS bundle URL is required.")
        args.archive.parent.mkdir(parents=True, exist_ok=True)
        with urllib.request.urlopen(args.url, timeout=90) as response, tempfile.TemporaryFile() as tmp:
            shutil.copyfileobj(response, tmp)
            tmp.seek(0)
            data = tmp.read()
        if hashlib.sha256(data).hexdigest() != lock["sha256"]:
            raise SystemExit("Downloaded artwork bundle checksum mismatch.")
        args.archive.write_bytes(data)
    data = args.archive.read_bytes()
    if len(data) != lock["bytes"] or hashlib.sha256(data).hexdigest() != lock["sha256"]:
        raise SystemExit("Artwork bundle does not match the source lock.")
    with zipfile.ZipFile(args.archive) as z:
        entries = []
        for info in z.infolist():
            path = Path(info.filename)
            if path.is_absolute() or ".." in path.parts or not path.parts or path.parts[0] != "art" or "\\" in info.filename or (info.external_attr >> 16) & 0o170000 == 0o120000:
                raise SystemExit("Unsafe artwork bundle entry: " + info.filename)
            if not info.is_dir():
                entries.append((web / "public" / path, z.read(info)))
        # Verify the complete archive and existing files before writing anything.
        for path, raw in entries:
            if path.exists() and path.read_bytes() != raw:
                raise SystemExit("Existing media differs; preserve it before restoring: " + str(path))
        for path, raw in entries:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(raw)
    print(f"Restored {len(entries)} verified media files; they remain ignored by Git.")
