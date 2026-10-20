# Thirteen Realms · 十三国幻想

本分支 fantasy-worlds 从现代金庸基线 624f4e8 独立开发，在同一个真实游戏里替换人物、对白与美术。当前格林替换原位置上的南贤，原开场、小村介绍、修炼书奖励、装备、首战与存档继续执行原游戏流程。后续人物和界面文字仍有原版内容，完整英文版与十三国全量替换尚未完成。

- [Game · Grimm's Request](https://gt88domain.github.io/jyxr/fantasy-worlds/game/)
- [同一游戏的中文文案对照](https://gt88domain.github.io/jyxr/fantasy-worlds/game/?lang=zh-CN)；[中文原版游戏](https://gt88domain.github.io/jyxr/)

- [English cast preview](https://gt88domain.github.io/jyxr/fantasy-worlds/en/)
- [中文角色对照](https://gt88domain.github.io/jyxr/fantasy-worlds/zh/)
- [范围、角色统计与迁移约定](docs/FANTASY_WORLDS.md)
- [现代金庸冻结备份](https://github.com/gt88domain/jyxr/tree/legacy-jyx)；旧原版仍保留在 html5-web。

构建需要 Python 3、Node、.NET 10 wasm-tools。进入 src/Game.Web，先运行 python3 scripts/restore-module.py --module worlds，再运行 npm run build:worlds。结果位于 artifacts/fantasy-worlds-site，包含 game/ 和人物审阅页，可在仓库根目录通过 python3 -m http.server 4214 --directory artifacts/fantasy-worlds-site 预览。npm run test:opening 检查真实开场、奖励、装备、修炼、首战和存档，浏览器检查另需 Playwright 与 Chromium。角色表本身仍可通过 python3 scripts/world_cast.py 单独校验。

## 保留的金庸 HTML5 宿主

以下旧命令构建保留的金庸游戏，不会生成完整十三国游戏。TypeScript / Phaser 负责显示和触屏操作，.NET 10 WebAssembly 执行战斗、装备、修炼和存档规则。新角色表不改动其剧情、数值和存档编号。

- 新版金庸入口：https://gt88domain.github.io/jyxr/modern-jyx/
- 冻结旧版：[html5-web](https://github.com/gt88domain/jyxr/tree/html5-web)，基线 `e5bcf716591569bfea4747a8b3b6f4c8a91f5e1c`；根网址不变。
- 西方试验章：https://gt88domain.github.io/jyxr/western/ ，保留现有部署。

## 本地运行

需要 Python3、Node24、.NET10 及 wasm-tools 工作负载，不需要 Godot 或原版参考子模块。

```sh
cd src/Game.Web
npm ci
npm run assets:restore
npm run build
npm run preview -- --port 4212
```

`assets:restore`从固定 Git 提交恢复1,272个文件，并核对长度和SHA-256。包括70个金庸JSON、1,196个素材/素材说明文件及原署名文件，总计约284MB。后续复用正确文件。金庸运行包保持原字节，构建时不重新迁移剧情、不覆盖技能数值。

`npm run package`生成并逐文件核验 `artifacts/modern-jyx-web.zip`。解压后按说明启动HTTP服务，不能直接双击HTML。当前为Release WebAssembly，尚未启用AOT或裁剪。

## 共用代码，独立内容

```sh
npm run assets:frontier
npm run build:frontier
```

以上用同一构建管线选择西方模块，覆盖本地`dist`，不同时混装两套内容。重新运行`npm run build`恢复金庸构建。模块清单决定应用设置、静态资源和可选资料面板；代码不再固定西方存档空间或西方内容入口。

金庸新版数据库为`jyxr-modern-jyx`，旧版为`jyxr-web`，西方版为`jyxr-modern-western`；自动进度、手动档和偏好均隔离。显式导入仍通过包ID和数据校验，不自动搬动旧玩家档案。

## 检查

```sh
npm run audit:module
GAME_WEB_URL=http://127.0.0.1:4212 npm test
```

浏览器检查从真实问答、出生和木人首战出发，再完成教学、购物、装备、钟灵招募、双人练习、章节回顾、存档和刷新。还检查伙伴条件/资料馆、320/375px面板，以及旧版与西方存储不变。仅通过公开界面行动，不补钱、不改人物、不强制胜利。

另单独完成原版六阶段教学、实际小孩战斗、九门派选择和少林拜师存读档，避免把浏览器章节回顾当作原教学全部完成。

浏览器默认使用`/usr/bin/chromium`，可用`CHROMIUM_PATH`覆盖。项目根可另运行原门派与完整教学的C#检查：

```sh
dotnet run --project src/Game.Web.Runtime/Smoke/Smoke.csproj -- --original src/Game.Web/public/data/packs/jyx/content-package.json
```

模块边界与已知限制见[模块架构](docs/MODULAR_GAME.md)。162张地图、513个人物定义和1,887段剧情是已有迁移包的资料规模，不代表全部路线验证完成；原有缺口按原审计保留。旧迁移文档中的百分比不作为本分支的完成率。

本体沿用[GPLv3](LICENSE)，保留原作者虹乡俗人及贡献者署名。原素材来源、许可与说明随包保留，内容源提交和逐文件摘要见`src/Game.Web/content/jyx/`。
