# 双内容包 HTML5 RPG 原型

TypeScript / Phaser 显示界面，.NET 10 WebAssembly 运行现有的 `Game.Core`、`Game.Content`、`Game.Application` 与 `Game.Presentation`。战斗、AI、剧情执行和存档沿用 C# 内核，不在前端重复实现伤害公式。

同一程序提供两个可切换的内容包，人物、地图、剧情、物品、目标、术语和美术由数据配置。两包共用战斗、AI、队伍、交易、装备、修炼和存档规则。

- `jyx`：优先恢复原版江湖。已从35段原剧情／6张地图扩展为1,885段通过结构与依赖检查的原剧情／162张原地图，接入六阶段教学、九个门派／无门派入口、大地图行程时间和21个世界触发。完整新手教学实际跑通；大部分后续剧情尚未逐条实玩，不能将结构迁移率当作游戏完成率。原版尚缺项目见[迁移清单](ORIGINAL_MIGRATION.md)。此前的新编结伴训练保留独立ID，兼容既有存档。
- `frontier`：《灰烬边境》，保留之前的低魔佣兵试验章，暂停扩展，当前开发优先原版。

战斗支持手动走位/出招、自动交手、暂停和 1/2/4 倍速，实际伤害事件驱动受击反馈。首战已补齐部分旧版天赋、Buff 和使用经验差异，仍不等同完整原版；具体已验证和未复原项目见 [战斗对照](../Game.Web.Runtime/BATTLE_PARITY.md)。

当前工程粗估约70%（加权69后取整），没有达到完整复原。门派伤害、属性、控制、分阶段范围及单精度血刀吸血已接入；天赋119项有配置或部分配置，34项仍仅资料。具体工作和全部待办名称见[19项剩余清单](ORIGINAL_REMAINING_CHECKLIST.md)，原定义缺件见[完整复原缺口](ORIGINAL_COMPLETION_GAPS.md)；对下一版的[阶段观察与建议](NEXT_GAME_NOTES.md)不代替原版验收。

人物、装备、功法修炼、行囊与设置均有独立入口。装备穿戴/卸下、切换主内功、选择秘籍修炼、启停外功和支持的物品使用调用实际规则；《内功入门》可选为修炼秘籍，战斗结算后获得真实经验，修炼选择与主运内功独立。原版主角已有基本内功，初始武器、防具、饰品为空；问答奖励放在行囊，需要自行穿戴。存档保存在 IndexedDB，可导出与重新导入 JSON 备份；原 v1 浏览器存档仍可导入。

原版开局已接入七组问答、24个头像、基础属性重摇、初始银两与物品预览确认，规则来源为固定 `RollRoleUI.cs`。结局、华山、同周目重开与下一周目使用真实服务；结局可存读档，仓库／元宝／档案继承。原周目伙伴池已接入：第二／三／四周目17／10／7人、第五周目起9人，确认后随机加入一名；第一周目不送伙伴。无悔实时存档及新增天赋的完整战斗效果仍须补齐。

同福客栈轻功与葵花点穴手可实际操作，沿用原收费、月度冷却和 Application 奖励／成长服务；Presentation 模拟碰撞与点击，运行时按自身时钟计时，不接受前端提交成绩。支持暂停、触屏和轻功方向键操作。

这不是完整游戏移植。基线仍有2段隔离剧情及剩余特殊流程、剧情道具使用和更多天赋/Buff Hook待完成。地图数、角色数和武学数不代表对应全部流程都已验收。Silverlight/Unity旧版存档导入不在本轮范围。

当前优先补资料，暂停通关测试。首页及游戏菜单“资料”打开[原版资料馆](ORIGINAL_REFERENCE_LIBRARY.md)，可查513个人物定义、原武学与道具、开局配置、剧情及关联引用，并对照四个仓库与上传包。原伙伴图鉴包含63个显示名、65个角色形态；“10名”只是普通流程已验证数量。上传包《鹿鼎记》78段已归档，其中39段为缺失补充；双儿仅有加入指令，仍缺人物定义与运行入口。
后期43个多周目开局随机伙伴候选已经实际接入，其中40个不在剧情图鉴里。预览列候选、确认时抽一名；取消和读档不会再次发放。奖励池的“白眉鹰王”依据原鹰爪功说明对应到“殷天正”，原人物属性不改，资料馆保留称号引用修正的依据。

标题页或右上角可切换世界，URL 的 `pack=jyx` / `pack=frontier` 可指定启动包。IndexedDB 使用独立包键；v2 导出绑定内容包，错包导入不替换当前会话。原 v1 浏览器存档只在金庸包导入。切换世界前会保存世界地图上的进度；对话、交易及战斗中尚未保存的进度不能续接。

## 开发

后续目标及验收范围见[原版完整复原目标](ORIGINAL_RESTORATION_TARGET.md)。素材不再随源码提交；
新 checkout 先恢复独立媒体包，现有本地素材保持不动：

```bash
cd src/Game.Web
python3 scripts/art-bundle.py restore --archive /path/to/jyxr-web-art.zip
# 如有外部 HTTPS 托管，可额外传 --url；下载和恢复都必须匹配 scripts/art-bundle-lock.json。
```

`public/art/` 的图片与图集已忽略，仅保留来源说明和资源索引。不得用 `git add -f` 绕过。
发布源码前运行 `python3 src/Game.Web/scripts/check-git-media.py --base html5-web`（使用发布索引）。
已有素材提交仍存在于旧历史，未经用户要求不重写；线上继续复用已部署的同一批素材。

需要 Node.js 24（或满足 Vite 要求的 Node >=22.12）、Python >=3.10、.NET SDK 10 与 `wasm-tools`。Linux 使用 `python3` 命令；其他系统需提供同名 Python 3 命令或调整 package.json 的内容构建命令。

在仓库根初始化已记录的参考子模块；使用已有 checkout，无需额外 worktree：

```bash
git submodule update --init jyx-legacy-data jyx-legacy-dll
dotnet workload install wasm-tools --skip-manifest-update
python3 src/Game.Web.Runtime/scripts/verify-wasm-workload.py
```

`build-content.py` 使用固定的原版 Buff 分类清单，出处记录为第四参考仓库的 Lua `BUFF_LIST` 与旧 `Buff.cs`；构建不依赖另一个参考仓库的本地路径。后续更新分类时需要核对原始依据，不能将所有 Buff 随意归为同一类。

```bash
cd src/Game.Web
npm ci
npm run prepare:game
npm run dev
```

云环境先加载 `source /workspace/.cloud-setup-jyxr/env.sh`。如果 npm 默认缓存目录只读，设置 `NPM_CONFIG_CACHE=/workspace/.cloud-setup-jyxr/npm-cache`。

运行时构建脚本发布 C# 工程并将完整 `_framework` 复制到 `public/runtime`。重新构建运行时后，应停止并重新启动 Vite：动态替换整个 public 目录可能使 Vite 的静态文件索引过期，导致 WASM URL 被错误地回退到 HTML。保留 SDK 的资源指纹和完整性校验，不能通过关闭 SRI 来处理加载错误。

## 构建与验证

```bash
npm run build
npm run preview -- --port 4173 --strictPort
```

另一个终端运行：

```bash
CHROMIUM_PATH=/usr/bin/chromium GAME_WEB_URL=http://127.0.0.1:4173 npm test
```

浏览器测试需要可用的 Chromium。Linux 云环境已提供 `/usr/bin/chromium`；本地也可安装 Playwright Chromium，再将 `CHROMIUM_PATH` 指向其程序。测试从用户可见按钮进入游戏，逐条核对原对白、奖励、真实棋盘点击移动和施法、手动/自动切换与暂停、修炼经验、设置持久化及刷新后的存档恢复，并实际下载、导入存档，确认非法 JSON 不会破坏当前会话。同时检查移动屏幕溢出、未预期控制台异常及资源请求失败。截图与 trace 保存在被忽略的 `test-results/`。

交付压缩包可用 `npm run package` 重新生成，位置为仓库根的 `artifacts/jyxr-web-first-playable.zip`。解压后按其中的 `开始试玩.txt` 启动 HTTP 服务。自动化验收核对 37 条原对白与提示，包含 375 像素窄屏检查；以 `test-results/browser-smoke.json` 中当前运行的结果为准。

验收包含原首战主流程（37 条原对白）、独立装备流程和两个章节的实际购物、伙伴参战及跨包存档隔离。测试在独立静态服务器的 `/jyxr/` 路径运行，含 1440×900 和 375 像素屏幕；当前结果以 `test-results/` 中报告为准。装备专项使用隔离存档加入木刀，正式开局不额外发放。

主流程测试生成导出存档后，可在同一静态服务器上运行独立装备验收：

```bash
CHROMIUM_PATH=/usr/bin/chromium GAME_WEB_URL=http://127.0.0.1:4173 node tests/equipment-smoke.mjs
CHROMIUM_PATH=/usr/bin/chromium GAME_WEB_URL=http://127.0.0.1:4173 node tests/chapter-smoke.mjs
CHROMIUM_PATH=/usr/bin/chromium GAME_WEB_URL=http://127.0.0.1:4173 node tests/original-world-smoke.mjs
CHROMIUM_PATH=/usr/bin/chromium GAME_WEB_URL=http://127.0.0.1:4173 npm run test:art
CHROMIUM_PATH=/usr/bin/chromium GAME_WEB_URL=http://127.0.0.1:4173 npm run test:creation
```

仓库根还可验证不依赖浏览器 UI 的同一完整流程：

```bash
dotnet run --project src/Game.Web.Runtime/Smoke/Smoke.csproj
dotnet run --project src/Game.Web.Runtime/Smoke/Smoke.csproj -- --original src/Game.Web/public/data/content-package.json
dotnet run --project src/Game.Web.Runtime/Smoke/Smoke.csproj -- --creation src/Game.Web/public/data/content-package.json
```

`dist/` 可以由支持 WASM MIME 类型的 HTTP 静态服务器提供。不要双击 `index.html` 使用 `file://` 打开；浏览器模块与 WASM 需要 HTTP。当前使用保留反射元数据的 Debug 发布，下载体积、裁剪及 AOT 优化尚未完成。生产网站应使用 HTTPS；发布部署另行处理。

## 在线托管

静态产物使用相对资源路径，同一份文件支持域名根目录和 GitHub Pages 的 `/jyxr/` 子目录。保留 `public/.nojekyll`，避免 Pages 忽略 .NET 的 `_framework` 目录；`runtime-loader.js` 作为普通脚本复制，由 .NET SDK 自己处理内部模块和资源指纹，不将它改成 Vite 打包的入口。

构建按运行时、内容包及加载器的实际字节生成版本标识，放到加载器、内嵌清单的 `dotnet.js` 和内容 JSON 请求参数中，避免网站升级时浏览器混用旧运行时清单与新程序。SDK 的哈希校验照常保留。

对应源码保存在 `html5-web` 分支，预构建的静态网站发布到独立 `gh-pages` 分支。GitHub 仓库的 Settings → Pages 应选择 Deploy from a branch、`gh-pages`、`/ (root)`。平台完成 Pages 构建后，预期地址为 `https://gt88domain.github.io/jyxr/`；必须通过实际 HTTP 和浏览器检查才能称为上线，推送分支本身不代表网站已经可用。

浏览器存档按网站来源隔离，本地试玩和线上网站不会自动共享存档；需要通过 JSON 导出与导入转移。

## 内容与素材

本批还接入队友角色选择、真实升级加点、各人装备／功法／秘籍、编队后备、松鼠旅馆储物箱，
以及竞技场／天关／试炼／珍珑／洗练的服务和浏览器参战选择。女主名字通过原剧情实际输入。
玩家后备与剧情离队分开管理，不能在 UI 强行招回剧情限制角色。详细范围及测试边界见迁移清单。

- [内容导入说明](scripts/CONTENT.md)：源提交、转换范围、原剧情与训练入口。
- [运行时桥接说明](../Game.Web.Runtime/README.md)：导出 API、支持指令、真实 C# 规则与限制。
- `public/art/legacy/`：金庸包使用用户上传的原版图片与角色帧，按内容资源引用加载；地图、头像、物品图标和基本战斗动作已接入。提取工具及来源见 [原版素材记录](public/art/legacy/README.md)，动作时间线、音频与完整特效仍有缺口。完整素材库约 146 MiB，按当前场景加载；启动体积仍需优化。
- `public/art/` 根目录保留此前生成的十张原创图；西方试验章继续使用其中的营地、林道、岗哨、佣兵等，金庸包已切回原版素材。
- `public/data/`、`public/runtime/` 均为构建输出，已忽略；请从锁定的参考源重新生成，不手改生成文件。
- 原 `Game.Godot` 宿主与既有测试未修改。Core 仅新增可注入的技能经验策略以支持金庸旧规则，默认现代规则保留。普通 .NET 全套测试仍受缺少正式 `mods/jyxr-base` 的既有单项失败影响；本工程使用单独生成的浏览器内容包，不能将它误称为恢复了正式 MOD。

代码和原始内容保留各自许可与署名要求；自生成美术与旧版剧情/数据的来源分别记录。此工程的可运行验证不代表已经获得外部内容的发行许可。
