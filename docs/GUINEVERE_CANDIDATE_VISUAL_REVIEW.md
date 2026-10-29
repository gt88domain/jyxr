# Guinevere原生候选：已实际看图，建议保留候选

基线 `2789bb501f38956d4bc825cb56930527bb3310cf`，沿原reviewer `/root`，与制作席 `produce_card33`分开。本次通过协调方新提供的真实Sediment原ZIP取得文件，完成独立字节核验和实际查看；[此前Library不能落地、未看图的回执](GUINEVERE_CANDIDATE_REVIEW_STATUS.md)保留为历史，不改称当时已验。

**审阅意见：保留修后原生候选，不追加必需返修单。** 原稿同样保留。此结论只针对候选视觉可保留性，不是用户通过、512正式文件验收或游戏接入。

## 原字节与清单核验

| 项目 | 本executor实际结果 |
| --- | --- |
| 下载 | `download_file`接受本次真实Sediment文件ID并返回当前workspace的原ZIP；不再拿Library ID调用不匹配的下载器 |
| ZIP | 7,201,326 bytes，SHA `1082c6a2f95ab90dd9f2ae71d2f3a799e47520f5682907b263595fe9dc1da393`，与预期一致 |
| 安全读取 | 名称唯一、相对路径、无父目录跳转／绝对路径／符号链接／加密项，总解压大小有界；CRC全通过，没有执行包内文件 |
| manifest | PART-MANIFEST列出的22项payload全部逐项核bytes／SHA一致，无遗漏或额外payload；5项PATH-ALIASES的来源、路径及bytes／SHA也核过 |
| 指定候选 | `payload/jyxr-guinevere-20261029/candidate-repaired-native.png`，实际2,143,956 bytes、1254×1254、RGB、不透明，PNG解码验证通过 |
| 候选实际SHA | `c87139477d9b2263c37966aceefe2d32da80ce07bfd42f5ed20a683df82b1fbe` |
| 原始内容保护 | ZIP及22项原成员按原字节保留在workspace／忽略产物目录；本reviewer没有裁切、缩放、重编码、另行生成或编辑图片 |

实际读取目录为工作区 `src/Game.Web/test-results/asset-review-guinevere-20261029/`。`materialization-verification.json`记录查看前的核验阶段；随后 `independent-visual-review.json`记录实际看图结论，两阶段及先前未落地回执分别保留。它们不进入游戏资源或manifest。

## 看过的文件与视觉意见

通过view_image实际查看修后1254原图、包内已有128px和256px修后预览，以及原稿1254与128px预览；没有为此次审阅再做缩图。

| 项目 | 独立观察 |
| --- | --- |
| 与格林参考一致性 | 左上暖琥珀光、深棕背景、自然脸部／头发和织物细节与现用格林画法契合。绿披肩、米白领口、旧金饰物也与制作方向一致 |
| 人物表现 | 成年外观，微笑与眼神友善且机敏；编发、细头环与披肩能传达贵族旅行者身份。不是对年龄或原作形象的精确历史测量 |
| 留白与面部比重 | 修后头顶空间明显较多、面部比原稿更小；原稿128px更紧凑，修后128px仍能读面容和表情。建议两版都留存，不在这里擅自替换优选或再发构图编辑单 |
| 金饰密度 | 头环、圆扣与胸前纹样偏精细，整体更像贵族正式肖像，但没有压过面部。作为候选可保留；无需因此立即返工 |
| 精确锚点 | 未作人脸landmark定位，不把手工估计或file-qa中的 `design_face_center_normalized`设计目标当成实测达标。以后实际头像槽位的脸部比重仍须单独核验 |

提供的小预览文件名带dark／light，但PATH-ALIASES明确说明light名是dark成员的原字节副本；它们不能当成两种UI底色已分别验证的证据。这里的128／256观察仅为这些实际预览文件可读性，不是实际游戏、真机或圆形裁切验收。

## 处置与边界

- 推荐保留 `candidate-repaired-native.png`为候选，原 `candidate-native.png`及两次制作原稿／prompt／来源记录继续保留。没有新增返修规格或另开制作席。
- actor `actor-ff496f0b2e18`／`gb.guinevere`保持proposed，本reviewer没有锁定身份。
- 1254原生方图仍是高分辨率候选。512正式导出、与实际头像槽位匹配、manifest登记和显示绑定均未执行；动作帧／游戏接入／用户验收仍为0。
- [制作规格](GUINEVERE_PORTRAIT_BRIEF.md)继续适用；图像来源包已在本地核原字节，私人Drive完整备份的其它历史revision没有重新独立下载，不扩大本次核验范围。
- 游戏源码、存档、旧失败、既有格林／地图图像及共享资产未改。本批没有游戏实玩、新运行测试或构建，不合并部署。
