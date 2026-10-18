# 两种界面与原版依据

入口：设置 → 界面风格 → 现代界面／原版风格（参考复原）。选择立即生效并保存在当前浏览器，两个内容包使用同一界面偏好，各自的游戏存档仍独立。旧偏好没有新字段时默认现代界面，原有音量、倍速等值继续保留。

这是同一程序的两种显示方式。切换只更新根元素样式与浏览器偏好，不重建GameSession、不导入存档、不执行剧情或战斗命令，也不重新挂载画布和人物面板。战斗原本暂停时，切换后仍暂停；生命、内力、物品、当前回合、选招和培养选择共用。移动端继续提供大按钮、可滚动菜单、技能详情和触屏确认。

## 可以直接看到的原版资料

“设置 → 查看原版界面图片与复原说明”展示官方源码中原有的800×600教学截图，以及人物面板、技能选择面板的原始底图。教学截图的红色标记来自原文件；没有把重制版截图当成原版。

原图来自[汉家松鼠JyGameSilverlight](https://github.com/hansquirrel/JyGameSilverlight)，固定提交`3fa22b12126bd1e7a3cc2645a4cb200216643175`。这是官方公开的0.6.x Silverlight版本，**不是Unity时代1.0／1.1版本的完整界面**。`MainPage.xaml`给出800×600舞台，`RolePanel.xaml`和`SkillSelectPanel.xaml`引用实际框图和动态角色/技能列表；教学图展示左上人物信息与右下菜单。

本批使用`UI-kuang8.png`原图的边框、五个原菜单图标，采用深色面板、金色文字和地图底部图标菜单；人物、装备、修炼、队伍、对话、商店、设置和战斗共享该风格。地图仍使用当前内容加载布局；战斗菜单、触屏确认与响应式排版保留现代交互。它属于有原图依据的参考复原，没有宣称逐像素一致、重现全部旧控件，或还原Unity各版本的所有菜单位置。

上传X1.0.0.1的地图、头像、角色动作等仍使用原有内容资源映射，不改换成早期Silverlight人物和道具数据。仍以TypeScript/Phaser和C# WebAssembly运行现代代码，不执行原EXE、DLL或旧脚本。

## 可重建的资源与署名

`public/original-interface.json`记录8个原文件的来源、固定提交、长度和SHA-256；复制时逐字节保留，没有生成或重绘原图。

```bash
# 在src/Game.Web下运行；源码参考库需包含上述固定提交
python3 scripts/import-interface-reference.py --reference-root /path/to/JyGameSilverlight
python3 scripts/art-bundle.py pack --archive /path/to/jyxr-web-art.zip
```

图片继续进入独立素材包，源码Git仅保存复制脚本、元数据、锁文件和说明。原素材包保留；本批只增加`art/legacy-interface/`下8个文件，既有图像和音频不替换。交付包带有原仓库GPL许可全文和README署名／非商业使用说明，位于`public/notices/`；本仓库许可没有重新授予原素材权利。

验证入口：`npm run test:interface`；`GAME_WEB_INTERFACE=classic GAME_WEB_REPORT=classic-mobile-smoke npm run test:modern-m3`复用手机真实触摸专项。隔离存档生成方式见[现代化计划](MODERNIZATION_PLAN.md)。设备模拟不代表iPhone／Android真机与Safari已验收。

本地26项双界面检查、14项原版风格触摸检查及37项现代新手回归通过。双界面检查覆盖旧偏好保留、刷新记忆、原图实际解码、人物／装备／修炼／行囊／队伍／目标、原剧情当前对白、战斗招式与暂停、商店库存货币，以及另一内容包的同一状态；切换前后逐项对比完整C#快照。320／375竖屏与844×390触屏横屏无横向溢出。原图逐字节对照官方Git对象；交付包1413个游戏文件逐个核对，72份游戏内容JSON与上一版相同。本批没有重跑完整通关，也没有将旧最终战失败等缺口视为已解决。
