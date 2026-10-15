# 浏览器内容导入

在仓库根执行 `python3 src/Game.Web/scripts/build-content.py`。仅使用 Python 标准库与已初始化的 `jyx-legacy-data` 子模块；输出可重复，不修改子模块。

- `public/data/content-package.json`：运行用的当前模型内容包；20 个定义集合加 `storyScripts.starter`。
- `public/data/starter.story.json`：14 段真实开局、武师讲解、八项选择与训练战斗的 DSL v3 迁移；保留原始 ID、对白、奖励、等级条件及跳转。
- `public/data/starter-world.json`：25 段剧情与南贤屋内、小村、南贤居的原始指令投影，保存顺序、条件、出处，可供后续迁移核对。
- `public/data/starter-dialogue-excerpts.story.json`：只含对白的查阅摘录，不应作为完整剧情执行。
- `public/data/runtime-config.json`：原版装备随机词缀数量概率及出处。
- `public/data/legacy/`：现有转换器的完整原样导出，不是已迁移完的可运行 MOD。
- `public/data/content-build-report.json`：数据计数、来源提交、未支持范围。

真实入口为 `新手村_出生` → `南贤屋内`，南贤开场后前往 `小村`。在 `小村` 的 `武师` 位置选择第一项“【战斗】请让我实战练习一下吧”，进入 `新手村_武师7` → `新手村_武师木头人` → `南贤居_木头人_战斗`。主角定义 ID `主角`，敌人 `木头人`；战场位置依原版为 (2,2)、(8,2)。

`南贤居` 是另一张后续地图，该处原本触发的是四个“经验木头人”战斗，不能将它误称为上述新手一对一训练入口。

本轮没有完成全量剧情、地图事件、世界触发器或所有天赋/Buff 的旧版战斗 Hook。运行地图暂不含事件，原始完整事件仍在 `legacy/maps/` 与投影文件。随机词缀表达式取自 `jyx-legacy-dll/JyGame/ITTrigger.cs` 的实际分支；正负 Buff 分类取自后期 Lua `BUFF_LIST` 与旧 `Buff.cs`，详细版本见生成报告。
