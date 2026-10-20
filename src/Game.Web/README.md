# 现代浏览器宿主

本分支默认构建金庸模块`content/jyx`，用冻结旧数据验证现代化宿主。完整命令见[根README](../../README.md)，模块职责和边界见[架构](../../docs/MODULAR_GAME.md)。

- `npm run assets:restore`：从固定提交恢复并校验金庸数据与素材。
- `npm run build`：共用契约、独立金庸内容、Release WASM和前端。
- `npm run audit:module`：核对原数据与素材未变。
- `npm test`：真实开局、首战和完整新手流程；需先启动静态服务。
- `npm run assets:frontier && npm run build:frontier`：用同一程序构建西方小章。
- `npm run package`：构建并核验独立金庸ZIP。

新金庸、冻结旧版和西方应用分别使用独立存储与网址。可选伙伴条件/资料馆延迟加载，游戏规则始终由共用C#会话执行。资料完整性与路线可玩性分别验证，不用历史迁移百分比代替测试证据。
