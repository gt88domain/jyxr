# 现代浏览器宿主 · 西方内容模块

本分支默认只构建`content/frontier`。运行、检查和原版备份说明见[根README](../../README.md)，模块边界见[架构](../../docs/MODULAR_GAME.md)。历史迁移文档继续保留，但其中的原版完成百分比不适用于本项目。

- `npm run assets:restore`：恢复4张原创图片并校验SHA-256。
- `npm run content`：生成独立西方内容包，不读取原版子模块。
- `npm run build`：内容、Release WebAssembly、类型检查及静态站点。
- `npm run test:frontier`：从新游戏完成真实小章，含拒绝后重新招募和保存刷新。
- 浏览器进度和设置使用独立应用命名空间；部署在`western/`，原版根入口不改。

`Game.Core`与`Game.Application`继续处理真实规则与用例；前端不替代结算。内容包用稳定ID引用人物、战技、地图和物品。当前不是运行任意旧MOD脚本的插件平台。
