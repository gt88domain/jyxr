#!/usr/bin/env python3
"""Package the validated static site without redundant precompressed variants."""
from pathlib import Path
import zipfile

web = Path(__file__).resolve().parents[1]
dist = web / "dist"
if not (dist / "index.html").is_file():
    raise SystemExit("Run npm run build before packaging.")
output = web.parents[1] / "artifacts" / "jyxr-web-first-playable.zip"
output.parent.mkdir(parents=True, exist_ok=True)
instructions = """金庸群侠传 X · HTML5 首个可玩流程

解压后，在本目录打开终端，运行：
  python3 -m http.server 5173 --directory game
Windows 如只有 py 命令，可运行：
  py -3 -m http.server 5173 --directory game
然后在本地浏览器打开 http://127.0.0.1:5173
请通过 HTTP 打开，不要直接双击 index.html。

支持：命名与难度选择、原出生/南贤/武师剧情、原创素材木头人训练、
手动走位/出招、自动交手、暂停、1/2/4倍速、真实C#规则与结算、
人物/装备/行囊、内外功与秘籍修炼、设置、IndexedDB存档、JSON导入导出。
浏览器存档按网站地址隔离；更换端口或清除网站数据前请导出备份。

范围：这不是完整游戏。完整开局问答、全地图、全剧情、商店操作、
剧情道具使用、部分旧天赋/Buff Hook、音频与其他美术仍待完成。
这一包使用保留反射元数据的 .NET 10 Debug WebAssembly 发布。
下载体积、AOT、性能和生产部署仍需后续优化，不要视为正式发行版。
只使用四张新生成的原创图片，未复制旧版图片或运行旧版程序。
原代码、数据与剧情文本保留各自的许可及署名要求。

重建源码位于仓库 src/Game.Web 与 src/Game.Web.Runtime；
更多说明见 src/Game.Web/README.md。
"""
with zipfile.ZipFile(output, "w", zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
    for path in sorted(dist.rglob("*")):
        if path.is_file() and path.suffix not in {".gz", ".br"}:
            archive.write(path, "game/" + path.relative_to(dist).as_posix())
    archive.writestr("开始试玩.txt", instructions)
    archive.write(web.parents[1] / "LICENSE", "LICENSE")
print(f"Packaged {output} ({output.stat().st_size:,} bytes)")
