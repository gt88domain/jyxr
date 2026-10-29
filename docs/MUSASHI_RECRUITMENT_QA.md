# 宫本武藏：独立正常招募复验

基线 `9441bde6e570fc40addf33da4686134b7dba6026`，同一工作区、唯一源码 writer、`feat/storybound-italian-battle`。本批只执行获准的有限复验与记录，没有改产品代码、对白、规则、数值、概率、触发、收益、存档格式或美术，没有合并／部署。

**这次剩余左→右两个路口均未遇战，实际完成武藏初遇、原道德54分支、JOIN及普通存读档。** 这是新的独立QA，不是续完上次 tick83 的战斗；上次的 `passed=false`、现场与未结算事实仍完整保留。

## 来源与操作

源 `musashi-interruption-recovery-complete-save.json`，上一批真实普通恢复档，SHA `f3ad7c451fa3a2ff7b7941944e40c4d02837f03ae30a68f7050ff35725c1eee1`，69775 bytes。原件及上次失败报告、捕获存储、路口前档和恢复报告共5份先逐字节备份至 `test-results/backups/pre-musashi-recheck-9441bde/`，结束后逐一核SHA不变。

独立 Chromium context 使用上次真实捕获的 IndexedDB／localStorage，再点击标题页正常 **Load**。只读导出与上述源的完整 `game`／`wonBattles`／`profile` 一致，才开始行走；没有修改或拼接存档，也没有重放旧内存战斗。

| 实际步骤 | 正常原结果 |
| --- | --- |
| Load：华山后山3，戌时 | 普通难度、150银币、十人、道德54、主角13级 |
| 原向左走一次 | 进入华山后山4，亥时；原5%遭遇未触发 |
| 原向右走一次 | 进入华山后山，子时；原5%遭遇未触发 |
| 点击武藏原入口 | 实际显示12句新初遇＋原加入句，共13页 |
| 原道德54加入分支结束 | 丑时，Miyamoto Musashi加入，队伍与角色列表均10→11 |
| 查看真实队伍卡、正常保存、刷新后Load | 11人及完整序列化game、战斗历史、profile一致 |

两次风险路口均先正常保存。没有绕路、返回刷概率、改时钟、换队序、购物、培养、装备调整、赠送测试物品或跳过原条件；也没有再次挑战丹麦或亚瑟。

## 实际英文与伙伴结果

13页逐页比对已编译的对白，实际对白面板没有中文残留。例如首句为 “Two swords, one road. Somehow, I still manage to take the wrong turn.”；结尾保留原已接入的 “A new road, then. I'll bring my sword; you bring a little curiosity.”。未出现原恋人／真气的旧上下文，也未增加治疗或双持机制。

真实队伍卡显示 Miyamoto Musashi、Lv.11、1000/1000 HP、队序11、Gear 0/3、Ironbody Mastery及未选择教材。未替他装备、练习或分点。原角色ID及原始存档名称 `令狐冲` 继续保留，显示名通过既有词典投影；这不是遗漏替换内部编号。

此次证明正常原JOIN可以把这份实际十人队伍增至十一人，**不等于证明任意人数无上限**。未测试更大队伍、后备切换、新战斗部署或武藏后续求医／成长。

150银币、库存、已有十名角色的全部序列化构筑／装备／研习、道德54、战斗历史和完整profile均未改变。仍死亡3／击杀131，没有本批击杀、金钱奖励、额外物品或经验注入。只新增原完成标记 `笑傲江湖_天下第一令狐冲` 与 `笑傲江湖_令狐冲加入`；丹麦、飞狐及世界主线标记／worldTriggerState保持不变，未触发关闭国家线的世界阶段。

原非对白流程已经在上一批22项内容检查及构建中冻结验证，本批产品未变，不重复重建或将旧测试冒充新增成果。

## 界面验证与剩余问题

使用无头 Chromium、390×844窄视口、鼠标操作，非真机或触摸。13页均无横向溢出，Continue均高44px、在视口内。实际查看首句和队伍卡截图，英文正文及操作可读；首帧另有正常保存toast临时浮在底部，不因此宣称全界面视觉已验收。

地图标题／路口仍有 `华山后山3`、`华山后山4`、`华山后山` 中文，原目标卡仍指向未完的丹麦祠堂，原人物头像也尚未西化。本批按有限招募范围记录，不扩大换图、导航或事件条件修改。武藏部分高级技能的描述在只读返回状态中仍为中文，技能页未在本批打开，不把状态审计算实玩全英通过；可另批只改显示说明并核原技能效果。

**没有战斗，因此修后的范围工具实战、山战胜败／结算仍NOT_RUN。** 上批tick83不是败局或通关，本批招募也不能补作那场战斗结果。道德≥65或<35拒绝／攻击分支、武藏后续、困难模式、真机及全日本章仍未验；不加全游戏完成百分比。现有HP／MP恢复边界保留，完整恢复只指既有序列化字段，不声称战中资源精确续存。

## 可核证据

工作区 `src/Game.Web/test-results/`：

| 文件 | SHA-256 |
| --- | --- |
| `musashi-route-recheck.json`，独立QA报告，809748 bytes | `ab52c51177775188e55702adb07fee8004cb851c4118d7d89d2ad37d168e29c3` |
| `musashi-route-recheck-before-junction-0-save.json` | `c3832de58b838e1ec621d8175a523de1046db94ec9af8d0c65c7d049631beb85` |
| `musashi-route-recheck-before-junction-1-save.json` | `4a3d233b089b43f8deb4d5896393baac0e1cd8c74772229baed77241f7d2035e` |
| `musashi-route-recheck-before-musashi-save.json` | `66f747e0af7637003d869c6df74ae7b97d3bea4356499f0025dfdcf10f4801a2` |
| `musashi-route-recheck-recruitment-complete-save.json`，71402 bytes | `35352bb0356fc0d6ba95b9e4d3c5478e7dbb1f7e54dc238669199d01f31e0b0d` |

报告 `passed=true`，16项限定检查通过，浏览器／HTTP／请求异常均为0；`encounterVerified=false`、`recruitmentVerified=true`、`recoveryVerified=true`，明确区分战斗与招募。13页对白、队伍卡截图和全部前后导出另有 `musashi-recheck-evidence-manifest.json` 记录bytes／SHA；上次失败报告、原97ad档、Guinevere候选和既有各国成果均未改。

本批止于武藏加入后的正常地图档。下一处可独立审阅的缺口为武藏高级招式的英文显示说明；未在这批改动、培养或进入后续剧情。
