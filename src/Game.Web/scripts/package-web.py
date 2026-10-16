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
instructions = """HTML5 RPG · 金庸新手章与灰烬边境试验章

解压后，在本目录打开终端，运行：
  python3 -m http.server 5173 --directory game
Windows 如只有 py 命令，可运行：
  py -3 -m http.server 5173 --directory game
然后在本地浏览器打开 http://127.0.0.1:5173
请通过 HTTP 打开，不要直接双击 index.html。

支持：双内容包切换、命名与难度选择、原七组问答/头像/摇点/一周目初始奖励、
原出生/南贤/武师剧情、木人训练、
手动走位/出招、自动交手、暂停、1/2/4倍速、真实C#规则与结算、
人物/装备/行囊/队伍/目标、真实招募与商店买卖、修炼、设置、
按世界隔离的 IndexedDB 存档和 v2 JSON 导入导出。旧 v1 仅在金庸包导入。
西方试验章包含营地、林道、岗哨探索、两场战斗和一次性委托报酬。
当前优先原版：1,887段原始剧情已归档，1,829段通过结构迁移、58段隔离；
162张地图、六阶段教学与九个门派入口已接入。结构迁移不是全路线通关证明。
本批接入队友培养、升级加点、后备编队、松鼠旅馆仓库、女主命名、
竞技场/天关/试炼/珍珑/洗练服务与参战选择；后期并未全量通关验收。
同福客栈轻功和葵花点穴手可实际游玩，按原收费、冷却、成绩结算奖励与成长。
华山连战、原结局、结局存读档、重开/下一周目人物生成与仓库/档案/试炼物品继承已接入。
具体缺口见源码 src/Game.Web/ORIGINAL_MIGRATION.md 及 data/original-migration-audit.json。
浏览器存档按网站地址隔离；更换端口或清除网站数据前请导出备份。

范围：这不是完整游戏。新手章以约20分钟为设计目标，未测定实际时长。
结伴练习为新编教学桥段。战斗尚未完全复原原版。无悔实时存档、Lua初始伙伴、全地图、全剧情、
剧情道具使用、部分旧天赋/Buff Hook、音频与完整技能特效仍待完成。
这一包使用保留反射元数据的 .NET 10 Debug WebAssembly 发布。
下载体积、AOT、性能和生产部署仍需后续优化，不要视为正式发行版。
金庸包已接入用户上传包的原版地图、背景、头像、物品图标与基本角色动作。
部分动作时序与缺失模型尚待补齐，来源见 art/legacy/README.md。
西方包保留独立生成素材；所有游戏规则仍运行现代 C# WebAssembly 内核，未运行旧版程序。
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
