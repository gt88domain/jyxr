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
当前优先原版：1,887段原始剧情已归档，1,885段通过结构迁移、2段隔离；
162张地图、六阶段教学与九个门派入口已接入。结构迁移不是全路线通关证明。
本批接入队友培养、升级加点、后备编队、松鼠旅馆仓库、女主命名、
竞技场/天关/试炼/珍珑/洗练服务与参战选择；后期并未全量通关验收。
同福客栈轻功和葵花点穴手可实际游玩，按原收费、冷却、成绩结算奖励与成长。
华山连战、原结局、结局存读档、重开/下一周目人物生成与仓库/档案/试炼物品继承已接入。
新增常用天赋/Buff、原称号与战斗队友用药；正常成长已验证22级八人队及前三段主线消息。
显示真实剧情记事与原主线触发条件；战斗超过3000 tick时限按原版判负。
原剧情点穴救治按五轮八穴、实际时机得分继续原胜负分支；同地图战败后可恢复并重试。
人物成长改用原累计经验、严格门槛与升级经验重设，旧网页档保留等级及本级进度换算。
正常路线已从22级推进至26级，紧急首战和三城救援四胜；最终战场仍未获胜。
新增原特技效果、33项后续天赋配置、毒系强化、嗜酒与怪病触发；战斗显示真实状态等级和剩余回合。
秘籍修炼沿用原悟性增量及外功/内功倍率，武学奇才不加倍人物经验。
五毒圣地地图引用按上传源修正，两句无署名的武当对白保留原文并可继续。
新增14项天赋配置与217项选定组合检查，覆盖队伍光环、夫妻同心及追加攻击的组合。
新增23项治疗、回合、吸内与生存天赋；修复右臂怒气、封穴和重伤恢复规则。
目前87/158项天赋有配置或部分配置，另4项为联动条件、66项仅有元数据；不代表完整等价。
同归剑法与天地同寿支付独立HP代价，避免受伤反应／复活抵消；天地同寿永久扣10基础生命上限。
支持可关闭的环境明暗、行动聚光与受击/治疗柔光；减少动态设置会关闭动态柔光。
首页及帮助中可查看复原进度、已知问题、优点和流程建议。目前约65%是工程估算，不是通关率。
进度已按战斗、外功、内功、特技、奥义、道具、天赋和伙伴拆分，分别说明缺口。
新增独立伙伴图鉴，记录65个角色形态、80条加入/随行指令及155条地图入口路径。
可按角色或地点搜索，并区分当前参战、随行、后备、曾加入和待验证；图鉴不会直接发放伙伴。
普通连续旅程已验证10名伙伴，新增蓝凤凰、平一指和曲非烟；其余仍保留待验证标记。
没有匹配原失败分支的剧情战败进入GameOver，显式失败路线及竞技场按各自原规则处理。
完整目标见源码 src/Game.Web/ORIGINAL_RESTORATION_TARGET.md；缺口见 ORIGINAL_MIGRATION.md、
data/original-migration-audit.json 及 data/original-battle-rule-audit.json。规则审计不是完成率。
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
