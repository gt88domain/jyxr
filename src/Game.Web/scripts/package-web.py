#!/usr/bin/env python3
"""Package the standalone western build, without original-game files."""
import json
from pathlib import Path
import zipfile

web = Path(__file__).resolve().parents[1]
dist = web / "dist"
if not (dist / "index.html").is_file():
    raise SystemExit("Run npm run build before packaging.")
index = json.loads((dist / "data/packs/index.json").read_text())
if index["defaultPackId"] != "frontier" or len(index["packs"]) != 1:
    raise SystemExit("Expected the standalone frontier content build.")
output = web.parents[1] / "artifacts/frontier-web.zip"
output.parent.mkdir(parents=True, exist_ok=True)
instructions = """灰烬边境 · 现代 HTML5 佣兵试验章

解压后，在本目录运行：
  python3 -m http.server 5173 --directory game
Windows 如只有 py 命令：
  py -3 -m http.server 5173 --directory game
浏览器打开 http://127.0.0.1:5173，不要直接双击 index.html。

内容：营地、旧道、废塔、招募、装备、修炼、交易、两场战斗和一次委托。
战斗支持手动走位、自动攻击、暂停与变速；使用真实 C# WebAssembly 规则。
新版数据库 jyxr-modern-western 与旧版分开；不读取或修改旧版存档。
更换网站地址或端口前请导出备份，浏览器数据不会自动迁移。

这是小型试验章，不是完整游戏或无缺陷承诺。四张现有原创图中，人物仍共用佣兵图，
独立音频与更多战技尚待制作。采用 Release WebAssembly，尚未启用 AOT 或裁剪。
源码：https://github.com/gt88domain/jyxr/tree/modern-western
架构与构建说明：README.md、docs/MODULAR_GAME.md。
本体沿用 GPLv3，保留原作者虹乡俗人及贡献者署名。素材来源及摘要见
game/data/module-manifest.json；原版历史内容与素材不在此包。
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
