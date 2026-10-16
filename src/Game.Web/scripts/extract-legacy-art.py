#!/usr/bin/env python3
"""Convert the uploaded Unity 5 assets to PNG/Phaser atlases, never run code.

Requires UnityPy==1.24.2 and Pillow. Sprite pixels, mesh masks and clip order are
decoded from the archive. Atlas packing is a format conversion, not new art.
"""
from __future__ import annotations

import argparse
from collections import defaultdict
import hashlib
import io
import json
from pathlib import Path
import re
import xml.etree.ElementTree as ET

import UnityPy
from PIL import Image, ImageDraw
from UnityPy.export import SpriteHelper

ARCHIVE_SHA = "331d5df9e7867621fda2e42ca0fe0072591fd03df57a2b6bfe1162b319b4d995"
WEB = Path(__file__).resolve().parents[1]


def run(data: Path, output: Path, archive: Path) -> None:
    if hashlib.sha256(archive.read_bytes()).hexdigest() != ARCHIVE_SHA:
        raise ValueError("Archive does not match the reviewed X1.0.0.1 upload.")
    output.mkdir(parents=True, exist_ok=True)
    manifest = {"schemaVersion": 1, "source": {"archive": "X.rar", "versionLabel": "X1.0.0.1", "sha256": ARCHIVE_SHA},
                "images": {}, "models": {}, "files": {}, "missingModels": [], "inputs": {}}
    environments = {}

    def load(name):
        if name not in environments:
            path = data / name
            manifest["inputs"][name] = hashlib.sha256(path.read_bytes()).hexdigest()
            env = UnityPy.load(str(path))
            environments[name] = {o.path_id: o for o in env.objects}
        return environments[name]

    resources = load("resources.assets")
    main = load("mainData")
    manager = next(o for o in main.values() if o.type.name == "ResourceManager")
    externals = {i + 1: Path(e.path).name for i, e in enumerate(manager.assets_file.externals)}
    registry = defaultdict(list)
    for key, ptr in manager.read_typetree()["m_Container"]:
        filename = externals.get(ptr["m_FileID"], "mainData")
        if (data / filename).is_file():
            registry[key.casefold()].append((filename, ptr["m_PathID"]))

    def pointer(ptr, filename):
        if not ptr.get("m_PathID"):
            return None
        if ptr.get("m_FileID", 0):
            owner = next(iter(load(filename).values())).assets_file
            filename = Path(owner.externals[ptr["m_FileID"] - 1].path).name
        return load(filename).get(ptr["m_PathID"])

    def image_asset(key, kind=None):
        candidates = [load(f)[n] for f, n in registry.get(key.casefold(), [])]
        return next((o for o in candidates if o.type.name == (kind or "Sprite")), None) or (
            next((o for o in candidates if o.type.name == "Texture2D"), None) if kind is None else None)

    def animators(prefab):
        pending, seen = [prefab], set()
        while pending:
            game_object = pending.pop()
            identity = (game_object.assets_file.name, game_object.path_id)
            if identity in seen:
                continue
            seen.add(identity)
            for _, ptr in game_object.read_typetree()["m_Component"]:
                component = pointer(ptr, game_object.assets_file.name)
                if not component:
                    continue
                if component.type.name == "Animator":
                    yield component
                elif component.type.name == "Transform":
                    for child_ptr in component.read_typetree().get("m_Children", []):
                        child = pointer(child_ptr, component.assets_file.name)
                        if child:
                            target = pointer(child.read_typetree()["m_GameObject"], child.assets_file.name)
                            if target:
                                pending.append(target)

    def store(raw, suffix, category):
        digest = hashlib.sha256(raw).hexdigest()
        relative = f"{category}/{digest[:20]}{suffix}"
        path = output / relative
        path.parent.mkdir(parents=True, exist_ok=True)
        if path.exists() and path.read_bytes() != raw:
            raise ValueError("Content hash collision")
        path.write_bytes(raw)
        manifest["files"][relative] = {"sha256": digest, "bytes": len(raw)}
        return "art/legacy/" + relative

    def png(image, category="images"):
        stream = io.BytesIO()
        image.save(stream, format="PNG", compress_level=6)
        return store(stream.getvalue(), ".png", category)

    def sprite_image(obj):
        sprite = obj.read()
        raw = obj.read_typetree()
        rd = raw["m_RD"]
        # UnityPy's modern MeshHandler does not decode Unity 5.0's inline
        # vertices/indices. Decode that original mesh mask explicitly.
        texture = SpriteHelper.get_image(sprite, sprite.m_RD.texture, sprite.m_RD.alphaTexture)
        rect = rd["textureRect"]
        image = texture.crop(tuple(round(v) for v in (rect["x"], rect["y"], rect["x"] + rect["width"], rect["y"] + rect["height"])))
        settings = SpriteHelper.SpriteSettings(rd["settingsRaw"])
        rotation = int(settings.packingRotation)
        if settings.packed and rotation:
            image = image.transpose({1: Image.Transpose.FLIP_LEFT_RIGHT, 2: Image.Transpose.FLIP_TOP_BOTTOM,
                                     3: Image.Transpose.ROTATE_180, 4: Image.Transpose.ROTATE_270}[rotation])
        vertices = [v["pos"] for v in rd.get("vertices", [])]
        factor = raw["m_PixelsToUnits"]
        minimum_x = min((v["x"] for v in vertices), default=0)
        minimum_y = min((v["y"] for v in vertices), default=0)
        maximum_y = max((v["y"] for v in vertices), default=image.height / factor)
        if int(settings.packingMode) == 0 and vertices:
            mask = Image.new("1", image.size, 0)
            draw = ImageDraw.Draw(mask)
            indices = rd["indices"]
            for i in range(0, len(indices), 3):
                draw.polygon([((vertices[j]["x"] - minimum_x) * factor, (vertices[j]["y"] - minimum_y) * factor)
                              for j in indices[i:i + 3]], fill=1)
            image = Image.composite(image.convert("RGBA"), Image.new("RGBA", image.size), mask)
        image = image.transpose(Image.Transpose.FLIP_TOP_BOTTOM).convert("RGBA")
        return image, (minimum_x * factor, minimum_y * factor, maximum_y * factor)

    def export_static(key, obj):
        if obj.type.name == "Sprite":
            image, _ = sprite_image(obj)
        else:
            image = obj.read().image
        manifest["images"][key.casefold()] = {"path": png(image), "width": image.width, "height": image.height,
                                               "sourceFile": obj.assets_file.name, "pathId": obj.path_id}

    for key in sorted(registry):
        if key.startswith(("heads/", "items/", "town/", "ui/")):
            obj = image_asset(key)
            if obj:
                export_static(key, obj)
    for filename, prefixes in [("maps", ["maps"]), ("battlebg", ["battle_bg", "battlebg"]), ("cgs", ["cgs", "cg"])]:
        for obj in load("StreamingAssets/" + filename).values():
            if obj.type.name != "Sprite":
                continue
            for prefix in prefixes:
                export_static(prefix + "/" + obj.peek_name(), obj)
    print("Static original images:", len(manifest["images"]), flush=True)

    by_model = defaultdict(lambda: defaultdict(list))
    for obj in resources.values():
        if obj.type.name != "Sprite":
            continue
        match = re.fullmatch(r"(.+)-(stand|move|attack|be)(\d+)", obj.peek_name() or "")
        if match:
            by_model[match[1]][match[2]].append((int(match[3]), obj))
    originals = ET.parse(WEB.parents[1] / "jyx-legacy-data/data-origin/animations.xml").getroot()
    models = sorted({x.get("name") for x in originals} | set(by_model) | {k.split('/', 1)[1] for k in registry if k.startswith('animations/')})
    for model in models:
        clips = {}
        prefab = image_asset("animations/" + model, "GameObject")
        if prefab:
            for component in animators(prefab):
                controller = pointer(component.read_typetree()["m_Controller"], component.assets_file.name)
                if not controller or controller.type.name != "AnimatorController":
                    continue
                for ptr in controller.read_typetree().get("m_AnimationClips", []):
                    clip = pointer(ptr, controller.assets_file.name)
                    if not clip:
                        continue
                    tree = clip.read_typetree()
                    if tree["m_Name"] not in {"stand", "move", "attack", "be"}:
                        continue
                    frames = [pointer(p, clip.assets_file.name) for p in tree.get("m_ClipBindingConstant", {}).get("pptrCurveMapping", [])]
                    if frames and all(f and f.type.name == "Sprite" for f in frames):
                        clips[tree["m_Name"]] = {"objects": frames, "frameRate": tree["m_SampleRate"], "orderSource": "Unity AnimationClip pptrCurveMapping"}
        for name, values in by_model.get(model, {}).items():
            if name not in clips:
                clips[name] = {"objects": [o for _, o in sorted(values)], "frameRate": 12,
                               "orderSource": "numbered original sprite names; timing not recovered"}
        if "stand" not in clips:
            manifest["missingModels"].append(model)
            continue
        def frame_key(obj):
            return Path(obj.assets_file.name).name + ":" + str(obj.path_id)
        objects = {frame_key(f): f for c in clips.values() for f in c["objects"]}
        decoded = {identifier: sprite_image(obj) for identifier, obj in objects.items()}
        standing = clips["stand"]["objects"][0]
        stand_image, (_, ground_y, _) = decoded[frame_key(standing)]
        # Pack unchanged decoded frames into one lossless atlas. Their original
        # mesh coordinates keep the body/feet aligned across wider attack frames.
        entries, cursor_x, cursor_y, row_height, max_x = {}, 1, 1, 0, 0
        for identifier, (image, bounds) in decoded.items():
            if cursor_x + image.width + 1 > 2048:
                cursor_x, cursor_y, row_height = 1, cursor_y + row_height + 2, 0
            entries[str(identifier)] = {"frame": {"x": cursor_x, "y": cursor_y, "w": image.width, "h": image.height},
                                       "rotated": False, "trimmed": False, "sourceSize": {"w": image.width, "h": image.height},
                                       "spriteSourceSize": {"x": 0, "y": 0, "w": image.width, "h": image.height},
                                       "pivot": {"x": -bounds[0] / image.width, "y": (bounds[2] - ground_y) / image.height}}
            cursor_x += image.width + 2
            row_height, max_x = max(row_height, image.height), max(max_x, cursor_x)
        sheet = Image.new("RGBA", (max_x + 1, cursor_y + row_height + 1))
        for identifier, (image, _) in decoded.items():
            rect = entries[str(identifier)]["frame"]
            sheet.paste(image, (rect["x"], rect["y"]))
        texture = png(sheet, "atlases")
        atlas = store((json.dumps({"frames": entries, "meta": {"image": texture.split('/')[-1], "scale": "1"}}, separators=(",", ":")) + "\n").encode(), ".json", "atlases")
        manifest["models"][model] = {"id": model, "texture": texture, "atlas": atlas, "poster": png(stand_image), "baseHeight": stand_image.height,
                                      "clips": {name: {"frames": [frame_key(o) for o in c["objects"]], "frameRate": c["frameRate"], "orderSource": c["orderSource"]} for name, c in clips.items()}}
        if len(manifest["models"]) % 25 == 0:
            print("Original models:", len(manifest["models"]), flush=True)
    manifest["counts"] = {"resourcePaths": len(manifest["images"]), "models": len(manifest["models"]),
                           "clips": sum(len(m["clips"]) for m in manifest["models"].values()),
                           "files": len(manifest["files"]), "bytes": sum(v["bytes"] for v in manifest["files"].values())}
    (output / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(manifest["counts"]), flush=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data-root", required=True, type=Path)
    parser.add_argument("--archive", required=True, type=Path)
    parser.add_argument("--output", default=WEB / "public/art/legacy", type=Path)
    args = parser.parse_args()
    run(args.data_root, args.output, args.archive)
