# 灰烬边境 · 现代 HTML5 佣兵冒险

当前开发分支是 `modern-western`。基于 TypeScript / Phaser 前端与 .NET 10 WebAssembly 共用规则内核，先完成一个低魔佣兵试验章：营地、旧道、废塔，包含招募、装备、战技研习、交易、两场战斗和一次委托。

原版保留在 [html5-web](https://github.com/gt88domain/jyxr/tree/html5-web)，冻结基线 `e5bcf716591569bfea4747a8b3b6f4c8a91f5e1c`。旧入口不变；新版独立入口为 `https://gt88domain.github.io/jyxr/western/`，浏览器存储也独立。

## 本地运行

需要Python3、Node24与.NET10的wasm-tools工作负载，不需要Godot或原版资料子模块。

```sh
cd src/Game.Web
npm ci
npm run assets:restore
npm run build
npm run preview -- --port 4211
```

资源恢复只下载4张既有原创PNG并核对固定SHA-256，已有正确文件直接复用。`npm run build`生成独立的`dist`；规则使用Release WebAssembly，不宣称已做AOT或裁剪。

`npm run package`构建并核验独立离线服务包`artifacts/frontier-web.zip`，解压后的启动命令见包内说明。素材和内容仍须通过HTTP服务，不能直接双击HTML。

## 检查

仓库根运行C#内容与招募检查：

```sh
dotnet run --project src/Game.Web.Runtime/Smoke/Smoke.csproj -- --frontier src/Game.Web/public/data/packs/frontier/content-package.json
```

保持静态服务运行，在`src/Game.Web`运行完整浏览器小章：

```sh
GAME_WEB_URL=http://127.0.0.1:4211 npm run test:frontier
```

检查使用隔离浏览器上下文，真正完成战斗和交易，不发测试奖励或强制胜利。需要Chromium；默认读取`/usr/bin/chromium`，其他位置可通过`CHROMIUM_PATH`指定。

模块边界、存档隔离与仍待完善部分见[模块架构](docs/MODULAR_GAME.md)。本体沿用[GPLv3](LICENSE)，保留原作者虹乡俗人及贡献者署名。四张生成素材的来源与摘要分别见素材说明和`content/frontier/manifest.json`。
