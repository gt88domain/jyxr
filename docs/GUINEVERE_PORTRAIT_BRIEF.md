# Guinevere候选头像：交原素材席的制作输入

核查基线 `d0e89bce6a734b3e28267b67b4ce5b05457ac3f0`。本批只补规格与下一段路线提案，不生图、不改源码、角色表、manifest或资产，不建立第二writer，不重做现有合格头像。

## 身份、去重与制作责任

| 项目 | 已核实事实 |
| --- | --- |
| 唯一制作ID | `actor-ff496f0b2e18` / `gb.guinevere`，显示Guinevere／桂妮薇儿，英国主题 |
| 形态／资源 | `程英.初级`、`程英.高级`共用一张 `头像.程英`；不是按两个形态制作两张 |
| 身份状态 | [cast-map.json](../src/Game.Web/content/worlds/cast-map.json)仍为 **proposed**，有 `legacy-form-label-review`、`story-role-review`；[figures.json](../src/Game.Web/content/worlds/figures.json)来源为Arthurian legend。未改成locked |
| 当前占位 | `art/legacy/images/400fa85aefd9dcb736a6.png`，123×128，原游戏程英头像；未找到其西化合格替换图，未以它的脸型或服饰为生成参考 |
| 已有合格图 | 当前worlds manifest只登记两项自制美术：格林头像和岛屿总图。源文件／public／dist逐字节一致，SHA与manifest相符；均保留、不重做 |
| 本任务接单核查 | 协作工具当前只列 `/root`；仓库未找到Guinevere文件或该ID的其它接单记录。本writer未接制作、未生图、未另派agent |
| 跨线程边界 | 对dot来源线程作了一次只读状态查询，未返回结果，终止等待且不重复请求。因此**不能据本地列表保证其它线程无人接单**。由dot沿原素材席台账核对并分配唯一负责人；此文不是新增接单回执 |

后续协调方明确回执：唯一Guinevere候选已分配给既有素材席 **`produce_card33`**，尚未生图，原因是其GitHub工具读取PNG报UnicodeDecodeError，未取得参考像素。本任务不再派发、不生成或绑定，由该原素材席继续负责。

再后协调方已报告源席取得原参考并完成一次生成＋一次构图编辑，优选原生PNG与私人备份均已有源端回执。此executor尚无Library落地能力，独立图审为NOT_RUN，见[候选审阅状态](GUINEVERE_CANDIDATE_REVIEW_STATUS.md)。上段保留当时未生图的历史，不再作为当前制作状态；候选不等于用户验收或游戏接入。

随后由新提供的真实Sediment原ZIP成功落地，独立核原字节并看过1254原图及包内128／256预览，建议保留候选、不追加必需返修，见[实际视觉审阅](GUINEVERE_CANDIDATE_VISUAL_REVIEW.md)。此前Library无落地工具的事实仍保留；本次使用了可用的另一下载入口，没有改图、512导出、绑定或用户验收。

### 原PNG二进制交接状态

协调方要求用现有合法Library／附件能力交付原图。已复核原PNG **2,578,580 bytes**、SHA `9fe2cf45d8270c65363443f2cb40ba14fd106683bc59674ae3e479c76748616b`，字节未变。当前可用工具清单没有Library、附件或Google Drive上传工具，也没有工具搜索入口；`download_file`只支持下载已存在的Sediment文件，`codex_app__attach_artifact`只接受PR链接，不能上传PNG。

另对现有附件作了一次只读查询，返回：`This app tool is no longer available through dynamic tools. Use the codex_app MCP server. If that server is unavailable on this host, task delegation is unavailable.` 当前宿主没有另一个可调用的codex_app上传入口，因此没有取得可复用的附件ID。

**状态：NOT_TRANSFERRED；真实FileID：无。** 本机路径、固定GitHub URL和已显示的图片都不冒充跨任务已交付文件；没有长串base64、重生、改图、新共享权限或凭据操作。由协调方在具备二进制附件／Library交付能力的原素材链路解决，现有参考继续原字节保留。本能力缺口没有中止独立游戏路线验证。

## 已在用、可直接读取的参考

**主要风格参考：** [grimm-portrait.png](../src/Game.Web/content/worlds/art/grimm-portrait.png)，1024×1536、不需重做。[来源记录](../src/Game.Web/content/worlds/art/grimm-portrait.source.json)记为本项目2026-10-20用image_gen生成，SHA-256 `9fe2cf45d8270c65363443f2cb40ba14fd106683bc59674ae3e479c76748616b`。原source记录提到的 `opening/art/grimm-study.png`不在本工作区，交付参照应使用这里已实际查看的PNG，不依赖缺失路径。

其它工作区的原素材席可以读取这份[固定版本原图](https://raw.githubusercontent.com/gt88domain/jyxr/d0e89bce6a734b3e28267b67b4ce5b05457ac3f0/src/Game.Web/content/worlds/art/grimm-portrait.png)。验文件SHA后用作绘制质感／光照参考。

- 实际画法：偏写实的数字人物插画，细密卷发、自然皮肤和织物细节，面部清晰、背景柔化。格林本人有棕褐外套、暗色纹样背心、米白衬领和深色领巾；这是19世纪角色服装，Guinevere只沿用绘制质感与布光。
- 光照：画面左上方的暖琥珀主光／发丝边光，另一侧柔和阴影，深棕背景。保留自然眼神、面部立体感和小尺寸可读性。
- 配色参考：头像的视觉主调是深棕、暖褐、琥珀和米白；现有界面实际色值为深绿 `#203F36`、旧金 `#B69558`、纸白 `#F5F0DF`。这三个十六进制值来自界面主题，不伪称是头像像素的主色统计。
- Guinevere服饰建议：深绿羊毛旅行披肩、米白亚麻衣领、低调旧金扣饰与细小头环，保持中世纪幻想语境。她是正在旅行的贵族女性，表情机敏、友善，带一点会心的幽默。
- 年龄外观建议：成年女性，外观约28～35岁；栗棕波浪发配简洁编发、榛色眼睛、自然暖肤色。年龄和服饰仅为本候选美术建议，不写角色规则数据，也不把候选身份锁定。

**次要环境色感参考：** [storybook-atlas.png](../src/Game.Web/content/worlds/art/storybook-atlas.png)，1536×1024；项目2026-10-22生成，来源见[岛屿图说明](STORYBOOK_ATLAS.md)，SHA `c7cb728cc9e39b486f0263fce72ddf8185e9dcf421de17b48a4d4f2c01ab14a7`。它提供绿地、旧金建筑和蓝绿色海面的世界色感，人物绘制仍以格林头像为主。

## 一张图的交付边界

| 项目 | 要求 |
| --- | --- |
| 用途／数量 | 对话、队伍与人物头像共用，**1张**；不包括poster、全身图或战斗动画 |
| 正式规格 | 512×512 PNG、不透明背景；胸像，头发和头环完整、肩部可读，边缘保留安全裁切余量 |
| 构图锚点 | 面部中心约(256,205)，归一化(0.5,0.4)；按原生分辨率等比放置，例如1024方图为(512,410)。这是美术构图参考，未新增引擎锚点参数 |
| 动作帧 | 0；原model `chengying`及全部动作本批不动 |
| 原生输出大于512 | **接受等比方形高分辨率候选供审阅，512正式导出仍单独待原素材席处理及对应授权。** 本writer不裁切、缩放或改写图片；不以文件名或复制操作把1024图标成512完成品。当前只交制作输入，不请求用户现在批准尚未生成的成品 |
| 非方形输出 | 不能当作符合方形构图的正式交付；保留原始尺寸及候选状态，由原素材席解决构图，不在此静默裁切 |
| 候选记录 | 原素材席保留原始输出，记录实际宽高、字节数、SHA、工具、日期、完整prompt、参考图SHA及唯一负责人；尚未生成，不虚填这些值 |
| 拟接入路径 | `content/worlds/art/guinevere-portrait.png`→`art/worlds/guinevere-portrait.png`，仅最终验收后的文件进入manifest `localAssets`；核显示资源表 `browser.media.resources['头像.程英']`的覆盖入口，绑定尚未实现 |

## 可直接交原素材席的英文prompt

参照图仅附上上述已核SHA的格林PNG，背景不透明。保持方形构图，原生输出尺寸照实记录。

```text
Create one original square dialogue portrait for Storybound, a warm, humorous fantasy RPG. Use the supplied project-generated Grimm portrait as a reference for rendering quality, material detail, warm lighting, and background treatment. Give this character her own distinct face and medieval fantasy clothing.

The subject is the proposed Guinevere from medieval Arthurian legend: an adult woman who appears about 30, intelligent and approachable, with a subtle, knowing smile. She looks like a capable noblewoman traveling without a royal procession. Chestnut-brown wavy hair with a simple braided section, hazel eyes, natural warm skin, believable human anatomy. Her expression should suggest that she appreciates a good joke and chooses her traveling companions carefully.

Dress her in a deep forest-green wool traveling cloak, an ivory linen neckline, a modest antique-gold clasp, and a delicate, understated circlet. Use rich but restrained fabric textures. Warm amber light comes from the upper left, with soft shadows and a gentle rim on her hair. Keep the background opaque, softly blurred, and dark warm umber. Render the face with the same detailed, softly painterly realism as the Grimm reference; keep the eyes and facial expression readable at small RPG portrait size.

Square 1:1 composition, chest-up. Place the center of her face near 50% of the canvas width and 40% of its height. Include all of her hair and circlet, with comfortable margins for a square portrait crop; shoulders and cloak fill the lower part. A slight three-quarter pose, looking gently toward the viewer's left. Keep the silhouette clear and the background simple. No text, lettering, signatures, logos, borders, interface elements, or additional characters. Use an original character design, without recreating the likeness or costume of a modern actor or a specific film, television, or game adaptation.
```

## 取材与版权来源记录

- Guinevere的身份取自中世纪亚瑟传说，古典基础包括12世纪克雷蒂安的骑士故事及1485年刊行的马洛礼《亚瑟之死》。这些古典基础为公共领域取材；本次不引用现代译本、台词、影视演员面貌或现代插画造型。
- 风格图来自本项目现有自生图与其来源记录，不是从第三方素材站取得的CC0图片。该来源记录不等于对尚未生成的候选作出了既成授权；新图实际来源与制作记录须随原始输出补齐。
- 当前程英旧头像只用于确认占位资源ID及尺寸，属于原游戏资源；本仓库未提供这张单图的独立再分发许可证明，不将其标为自制或公版，不把它作为本次造型参考。

## 下一条可继续的原有非战斗路径（本批未执行）

建议沿保留的 `britain-willow-complete-save.json`（SHA `cbdaa1b64f73b421643ce58e58444da6bac89ecf39d1e490d89a70309e5d3a5f`）正常返回世界→Crossroads（`洛阳`）→街头居民（`小孩`）→Merlin（`王家老爷`）的寻犬开篇。当前英文已经写有居民3句和梅林3句，下一批先实走六页与正常存读档，只有实见缺漏才改文案，不另造剧情。

原世界入口的紧急事件需要 `mainStory_紧急4`，另一支需要未在队的段誉／木婉清／阿朱及相应剧情；本档均不满足，原fallback `map('洛阳')`为true。居民优先的教学战斗只在 `newbie_教训小孩` 标志存在时触发；本档变量只有既有队伍训练完成标志、timeKeys为空，原教学已经结束，因此可走纯对白 `original_洛阳.小孩1`。该段没有命令、选项、战斗或奖励。

Merlin入口是原 `original_洛阳奇闻.阿福1`，六个旧对白槽目前压为三句英文，内容是用星象、符文和鸟也找不到自家狗的笑话；原段没有命令、选项、战斗、奖励或自动跳转。显示Merlin已在用，身份仍proposed，不在下一批擅自锁定。

其入口只在白天开放。本档为辰时、世界坐标(728,600)；按当前[MapService](../src/Game.Application/MapService.cs)的 `floor(distance/22)+1`规则，到洛阳(925,537)预计10时段，加返回世界1时段，抵达卯时。先正常读居民三句会消耗原1时段到辰时，随后梅林入口应可用；这是一次有内容的街头交谈，不等待或反复进图刷时段。实际以宿主预览和入口为准，若不符则停止核对，不强行点不可用事件。

路线不回访格林、不找亚瑟／丹麦挑战，不购物、修炼、换队或使用道具；主角仍13级且未完成格林第二会面，不满足关闭国家窗口的下一世界阶段。需要保留原地图档与全部旧报告。上述只是已读原条件后的下一批范围，**未进行浏览器旅行、六页对白或新存读档验证**，不算新增通关或本批测试通过。

后续已按该有限范围实际执行；首轮核清小地图隐藏入口的QA读取错误后，从原抵达档接续，未重复旅行，六页及正常存读档通过。见[Crossroads完整实录](CROSSROADS_CONVERSATIONS_QA.md)，保留上段作为当时提案，不能将这次实测扩成寻犬后续或完整国家线。
