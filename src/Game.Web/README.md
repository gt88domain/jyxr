# 双内容包 HTML5 RPG 原型

TypeScript / Phaser 显示界面，.NET 10 WebAssembly 运行现有的 `Game.Core`、`Game.Content`、`Game.Application` 与 `Game.Presentation`。战斗、AI、剧情执行和存档沿用 C# 内核，不在前端重复实现伤害公式。

同一程序提供两个可切换的内容包，人物、地图、剧情、物品、目标、术语和美术由数据配置。两包共用战斗、AI、队伍、交易、装备、修炼和存档规则。

- `jyx`：原出生对白、南贤与武师教学、木人首战 → 原教学款与洛阳购物 → 装备和修炼 → 招募钟灵 → 新编结伴训练 → 章节回顾与保存。当前共 37 段剧情、6 张地图，以约 20 分钟体验为设计目标，实际游玩时长尚未测定。结伴训练是明确记录的教学改编，不冒充原版缺失事件。
- `frontier`：《灰烬边境》，原创低魔佣兵试验章。营地接委托、招募伙伴、购买装备、自由选择战技修炼，经过林道和废弃岗哨的两场战斗，返回营地领取一次性报酬。

战斗支持手动走位/出招、自动交手、暂停和 1/2/4 倍速，实际伤害事件驱动受击反馈。首战已补齐部分旧版天赋、Buff 和使用经验差异，仍不等同完整原版；具体已验证和未复原项目见 [战斗对照](../Game.Web.Runtime/BATTLE_PARITY.md)。

人物、装备、功法修炼、行囊与设置均有独立入口。装备穿戴/卸下、切换主内功、选择秘籍修炼、启停外功和支持的物品使用调用实际规则；《内功入门》可选为修炼秘籍，战斗结算后获得真实经验，修炼选择与主运内功独立。原版主角已有基本内功，初始武器、防具、饰品为空，界面如实显示，不额外发放道具。存档保存在 IndexedDB，可导出与重新导入 JSON 备份；原 v1 浏览器存档仍可导入。

这不是完整游戏移植。完整开局属性问答、其他地图交互、全量剧情、剧情道具使用及更多天赋/Buff Hook 仍待完成。内容包中的定义总数不代表这些系统都已经接入。Silverlight/Unity 旧版存档导入不在本轮范围。

标题页或右上角可切换世界，URL 的 `pack=jyx` / `pack=frontier` 可指定启动包。IndexedDB 使用独立包键；v2 导出绑定内容包，错包导入不替换当前会话。原 v1 浏览器存档只在金庸包导入。切换世界前会保存世界地图上的进度；对话、交易及战斗中尚未保存的进度不能续接。

## 开发

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
```

仓库根还可验证不依赖浏览器 UI 的同一完整流程：

```bash
dotnet run --project src/Game.Web.Runtime/Smoke/Smoke.csproj
```

`dist/` 可以由支持 WASM MIME 类型的 HTTP 静态服务器提供。不要双击 `index.html` 使用 `file://` 打开；浏览器模块与 WASM 需要 HTTP。当前使用保留反射元数据的 Debug 发布，下载体积、裁剪及 AOT 优化尚未完成。生产网站应使用 HTTPS；发布部署另行处理。

## 在线托管

静态产物使用相对资源路径，同一份文件支持域名根目录和 GitHub Pages 的 `/jyxr/` 子目录。保留 `public/.nojekyll`，避免 Pages 忽略 .NET 的 `_framework` 目录；`runtime-loader.js` 作为普通脚本复制，由 .NET SDK 自己处理内部模块和资源指纹，不将它改成 Vite 打包的入口。

构建按运行时、内容包及加载器的实际字节生成版本标识，放到加载器、内嵌清单的 `dotnet.js` 和内容 JSON 请求参数中，避免网站升级时浏览器混用旧运行时清单与新程序。SDK 的哈希校验照常保留。

对应源码保存在 `html5-web` 分支，预构建的静态网站发布到独立 `gh-pages` 分支。GitHub 仓库的 Settings → Pages 应选择 Deploy from a branch、`gh-pages`、`/ (root)`。平台完成 Pages 构建后，预期地址为 `https://gt88domain.github.io/jyxr/`；必须通过实际 HTTP 和浏览器检查才能称为上线，推送分支本身不代表网站已经可用。

浏览器存档按网站来源隔离，本地试玩和线上网站不会自动共享存档；需要通过 JSON 导出与导入转移。

## 内容与素材

- [内容导入说明](scripts/CONTENT.md)：源提交、转换范围、原剧情与训练入口。
- [运行时桥接说明](../Game.Web.Runtime/README.md)：导出 API、支持指令、真实 C# 规则与限制。
- `public/art/`：十张原创图片，包括山居、练武场、侠客、木人、绿衣旅人，以及西方营地、林道、岗哨、佣兵和灰狼；来源与视角见目录内 README。没有复制原游戏图片，灰狼暂为备用素材。声音尚未制作。
- `public/data/`、`public/runtime/` 均为构建输出，已忽略；请从锁定的参考源重新生成，不手改生成文件。
- 原 `Game.Godot` 宿主与既有测试未修改。Core 仅新增可注入的技能经验策略以支持金庸旧规则，默认现代规则保留。普通 .NET 全套测试仍受缺少正式 `mods/jyxr-base` 的既有单项失败影响；本工程使用单独生成的浏览器内容包，不能将它误称为恢复了正式 MOD。

代码和原始内容保留各自许可与署名要求；自生成美术与旧版剧情/数据的来源分别记录。此工程的可运行验证不代表已经获得外部内容的发行许可。
