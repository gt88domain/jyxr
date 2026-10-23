# 项目协作约定

`fantasy-worlds` 开发现代 HTML5 童话冒险游戏（暂名童话旅人 / Storybound），继承 `modern-jyx / 624f4e87ae251f8e0162e90d1eda11a1ef386cd7` 的共用规则与宿主。新版必须直接运行现有游戏，按原位置替换人物、对白与美术；不要再制作独立故事阅读器。当前覆盖格林开场、村中教学、出村补给与训练、埃尔招募和寻宠对白、九个门派入口、已定名伙伴的加入场景，以及常用英文界面；不能声称完整英文游戏、全部招募路线与新素材已完成。英文是新版主要语言，中文原版另留独立入口；新版中文仅供对照。角色与换装数据入口是 `src/Game.Web/content/worlds`，两种语言使用同一套稳定角色身份。对白按新角色创作，不逐句换名；幽默符合原著基础与角色目的，不使用现代影视独有台词。写作口吻与当前接入范围见 [WRITING.md](src/Game.Web/content/worlds/WRITING.md)，伙伴身份与接入边界见 [伙伴对照](docs/FANTASY_COMPANIONS.md)。

开场用五六句交代：格林收集各国陪伴人们长大的童话，故事出了问题，因此召唤玩家来帮忙。游戏名、开场和宣传语不强调国家总数；国家线数量仅是内部内容规划。格林始终是主要引导者，其他著名作家可作后续彩蛋或访客。格林替换原角色南贤；保留其编号、地图坐标、位置顺序、选择分支、发奖命令与跳转。允许缩短纯对白段落，不能连带删改命令、条件或奖励。装备、奖励、战斗与正式存档继续由共用游戏宿主执行。

worlds 是 jyx 的显示内容覆盖，运行态 packId 保留 jyx，以维持原版经验、教学与战斗规则；模块与存储使用独立 jyxr-fantasy-worlds 身份。切勿为了给换装重新编号而改变旧规则分派。中英文运行包在构建时由同一冻结数据生成，并检查流程与数值一致。

原版 `html5-web / e5bcf716591569bfea4747a8b3b6f4c8a91f5e1c` 及现代金庸 `legacy-jyx / 624f4e87ae251f8e0162e90d1eda11a1ef386cd7` 保留备份。新批次使用独立功能分支和 PR 回到 `fantasy-worlds`；部署仅更新 `gh-pages` 的 `fantasy-worlds/`，根目录旧版、`modern-jyx/` 与 `western/` 必须逐文件保持一致。原始运行包、技能数值、条件与存档编号不因角色表而修改。

发布通过正常 Git 推送触发 Pages，按命令使用 `gh auth git-credential` 凭据助手；API 上传或旧的成功构建不能当作新版已上线。发布及触发排查见 [部署说明](docs/FANTASY_DEPLOYMENT.md)。

原宿主存在按 `Skill.Name`、`Character.Name` 和天赋参数中的技能名称匹配规则的路径。运行包保留全部规则定义的原值，包含名称与说明；换装名称存入 `browser.displayCatalog`，只在 TypeScript 返回视图中投影。不能把编辑用显示包直接交给 C#，也不能翻译 ID、请求参数、条件、存档或命令中的名称。

新版整系显示对应固定为拳掌→拳套、奇门→法术、内功→被动专精；剑术保留，刀系对应重武器。拳套不能再误标为施法，法术不能再统称魔杖；四系数值与条件保留。主专精与教材研习分别设置，原内功解锁的主动绝招继续保留。目前只换皮：所有触发条件、剧情链、任务链、奖励、概率与数值保持原版；不增强法术、不重排培养阶段。英文统一采用美式表达。学派与培养仅改呈现的说明见 [设计说明](docs/FANTASY_SCHOOL_TRAINING.md)。

前期指引与推荐短章路线配置在 `chapter-guide.json`，只指向当前地图真实可用的地点或已有面板，不通过传送、赠送测试道具或补完成标志推进。所有目标保留原版判定，包含首场练习的获胜要求；战斗胜负、奖励、剧情条件与任务跳转不得改动。无初始装备时先继续其他准备，之后从商店购买，不把缺装备当作已完成。

角色选材优先各国知名文学、民间传说和历史人物；普通兵种、动物与物件单独分类。确实缺少适合的既有人物才允许命名原创，必须记录缺口原因。国家表示游戏中固定的主要归属；跨国剧情另列，不多造一份角色。成长形态共用同一身份，不能仅凭显示名合并人物，尤其温家五兄弟和不同的“神秘人”。已锁定身份不能由脚本重新随机分配。未审阅映射明确标候选。

采用轻量开放幻想世界的叙述，重点是探索、收伙伴、培养与组合，不强补人物动机。道德值、指定物品、天赋、队伍和剧情阶段条件均保留原判定；物品改名不得改编号或用途。不要为了合理化新角色而增加加入条件、赠送物品或解除旧限制。伙伴清单须从冻结包 JOIN/FOLLOW 指令导出，区分身份、成长形态、测试记录、候选、实际名称接入与对白覆盖；清单不等于正常路线全部可招募。

小说逐条交付与测试边界见 [STORY_CHAPTERS.md](docs/STORY_CHAPTERS.md)。新手9项目标算一个教学闭环；小说分支分别验收，不按目标数膨胀闭环数。白马线的高低好感、夜间概率、假名揭露和两种结局保持原流程。测试可复用实际正常成长且未编辑的导出存档，须记录来源和校验值；不得将测试培养或导入步骤放进玩家开局。

## 工作方式

- 遵循第一性原理，从职责与状态模型解决问题，不做补丁性或兼容性修改。
- 用户要求实现、修复或重构时，在已授权范围内完成必要修改与验证；仅讨论方案或排查原因时，不顺手修改正式代码。
- 除非用户明确要求，不访问当前工作区以外的文件。复现存读档问题使用隔离的临时数据目录，不覆盖玩家存档。
- 保留用户和其他流程的未提交修改，不使用破坏性 Git 命令。手动编辑使用 `apply_patch`。
- 提交信息采用带 scope 的 Conventional Commits，例如 `fix(world-events): preserve triggers across map transitions`。
- 只阅读当前任务需要的代码和文档。文档与实现冲突时核实代码与测试，并在本次涉及的范围内修正文档。

## 工程边界

- `Game.Expressions` 提供通用表达式；`Game.Core` 承载领域规则和状态；`Game.Content` 装配、解析和校验内容；`Game.Application` 负责会话与用例。
- `Game.Presentation` 只依赖 `Game.Core`，表达交互状态和展示流程。`Game.Godot` 承载节点、资源、音频和演出，不把业务规则挪进 UI。
- `GameSession` 是普通实例，不改成静态单例。服务通过当前 session 取状态；读档替换 `State`，不重建服务。跨异步等待的操作应确认仍属于原状态。
- 运行态可持有已解析 definition；存档只保存稳定 ID 和实例状态。`GameProfile` 独立于单个存档。
- 正式内容在 `mods/<modId>/data`，新增定义与修改既有定义的 MOD patch 分工见下方文档。资源覆盖走 PCK，不增加 loose assets 覆盖路径。
- `World`、`UIRoot`、`AudioManager` 由 bootstrap 挂在 `/root/__GameRuntime`，不是 Godot autoload；先完成初始化，再使用各自 `Instance`。
- Godot 运行期日志使用 `Game.Logger`。资源加载统一经 `AssetResolver`，不要在面板重复拼接资源路径或实现扩展名回退。
- 场景脚本取节点优先使用 `unique_name_in_owner = true` 与 `%Name`；仅在层级本身具有语义时使用固定 NodePath。UI 默认使用轻量面板脚本，复杂显示可提取 Presenter，不为每个面板创建 ViewModel。
- `tests/Game.Tests` 不引用 Godot 宿主或 GodotSharp。节点生命周期、延迟回调和实际演出可按需在 Godot 中验证。
- `jyx-legacy-data`、`jyx-legacy-dll` 用于参考，不恢复已移除的旧运行路径。

## 按任务查阅

| 任务 | 入口 |
| --- | --- |
| 启动项目、目录位置、常用命令 | [README](README.md) |
| 会话、存档、MOD 启动、地图与全局事件 | [运行时架构](docs/runtime-architecture.md) |
| 剧情、条件表达式、地图 action、控制台 | [游戏内容 DSL v3](docs/game-dsl-v3.md) |
| MOD 数据目录、补丁、原版迁移 | [MOD 数据补丁](docs/mod-data-patching.md)、[迁移指南](docs/legacy-mod-migration-guide.md) |
| 战斗规则、结算、AI、表现边界 | [战斗运行时架构](docs/battle-runtime-architecture.md)；修改 Hook 时读 [Effect 与 Phase Hook](docs/battle-effect-phase-hook-design.md) |
| 后续设计与未解决事项 | [TODO](TODO.md)、[战斗后续议题](docs/battle-runtime-refactoring-backlog.md)；设计草案不视为已实现行为 |

## 验证入口

按改动影响选择验证，已有通过结果且代码未变化时不重复运行。文档修改检查内容与链接即可；涉及宿主时补宿主构建。实际 Godot 场景验证按风险与现有验证覆盖情况选择，不因涉及执行时序而强制执行；未执行时说明仍未验证的运行期行为。

```powershell
# 普通 .NET 测试，可加 --filter 限定受影响用例
dotnet test engine-free-rpg.slnx

# Godot 宿主编译
dotnet build src/Game.Godot/engine-free-rpg.csproj

# 新增或删除 Godot C# 文件后检查配对的 .uid
./tools/ValidateGodotScriptUids.ps1
```

在任务范围内可自行执行本地构建、隔离测试并修复本次改动引入的失败。结束时说明变更、验证结果和仍未验证的部分。

## 文档维护

本文件只保留跨任务需要的约束和阅读入口。架构事实写入对应专题文档，待办集中在 `TODO.md` 或专题 backlog；不要追加会话摘要、完整成员列表或已完成迁移清单。
