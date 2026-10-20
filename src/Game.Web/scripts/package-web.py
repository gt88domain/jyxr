#!/usr/bin/env python3
"""Package the selected, verified content module."""
import json
from pathlib import Path
import zipfile
from content_modules import verify

web = Path(__file__).resolve().parents[1]
dist = web / "dist"
if not (dist / "index.html").is_file():
    raise SystemExit("Run npm run build before packaging.")
index = json.loads((dist / "data/packs/index.json").read_text())
module = index["defaultPackId"]
if module not in {"jyx", "frontier"} or len(index["packs"]) != 1:
    raise SystemExit("Expected one independent content module.")
manifest, _ = verify(module, dist)
output = web.parents[1] / "artifacts" / ("modern-jyx-web.zip" if module == "jyx" else "frontier-web.zip")
output.parent.mkdir(parents=True, exist_ok=True)
instructions = f"""{manifest.get('title', '灰烬边境')} · 现代 HTML5

解压后，在本目录运行：
  python3 -m http.server 5173 --directory game
Windows 如只有 py 命令：
  py -3 -m http.server 5173 --directory game
浏览器打开 http://127.0.0.1:5173，不要直接双击 index.html。

战斗支持手动走位、自动攻击、暂停与变速；使用真实 C# WebAssembly 规则。
应用数据库 {manifest['app']['database']} 与旧版及其他题材分开；不自动读取或修改其存档。
更换网站地址或端口前请导出备份，浏览器数据不会自动迁移。

金庸模块按冻结清单使用旧版已有迁移数据，不改变剧情、技能与物品数值；
完整资料不等于全路线验证。西方模块仍为小型试验章。
采用 Release WebAssembly，尚未启用 AOT 或裁剪。
源码：https://github.com/gt88domain/jyxr/tree/modern-jyx
架构与构建说明：README.md、docs/MODULAR_GAME.md。
本体沿用 GPLv3，保留原作者虹乡俗人及贡献者署名。素材来源及摘要见
game/data/module-manifest.json；原素材署名与说明见 game/notices 及 game/art 中的说明文件。
"""
files = [p for p in sorted(dist.rglob("*")) if p.is_file() and p.suffix not in {".gz", ".br"}]
with zipfile.ZipFile(output, "w", zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
    for path in files:
        archive.write(path, "game/" + path.relative_to(dist).as_posix())
    archive.writestr("开始试玩.txt", instructions)
    archive.write(web.parents[1] / "LICENSE", "LICENSE")
with zipfile.ZipFile(output) as archive:
    if archive.testzip() is not None:
        raise SystemExit("Archive verification failed.")
    for path in files:
        if archive.read("game/" + path.relative_to(dist).as_posix()) != path.read_bytes():
            raise SystemExit(f"Archive mismatch: {path}")
print(f"Packaged and verified {output} ({output.stat().st_size:,} bytes; {len(files)} game files)")
