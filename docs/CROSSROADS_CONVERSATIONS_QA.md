# Crossroads居民与Merlin：六句实走及存读档

基于 `1282ffa6e0adb675da187a3bd306fced996f4766`，同一 writer、工作区与 `feat/storybound-italian-battle`。执行[原有限路线](GUINEVERE_PORTRAIT_BRIEF.md)：真实Willow空屋档→Crossroads居民→Merlin寻犬开篇→正常存读档。英文已有，本批没有发现这六句的实际文案缺漏，因此**没有改源码、文案、角色表、规则或资源**；仅记录原路径实测，不为交付制造修改。

## 真实入口与首轮停止

来源 `britain-willow-complete-save.json`，SHA `cbdaa1b64f73b421643ce58e58444da6bac89ecf39d1e490d89a70309e5d3a5f`；Normal、主角13级、150银币、十人、54道德、原圆桌、辰时。四份本批原档／报告另作字节备份至工作区 `test-results/backups/pre-crossroads-conversations-1282ffa/`，没有覆盖Willow、英国战败、丹麦或法国／意大利证据。

| 原步骤 | 实际宿主结果 |
| --- | --- |
| Willow原Back | 正常消耗1时段，辰→巳，返回大地图；不重访小屋概率相遇 |
| Crossroads世界入口 | 宿主实际action为map，预览10时段，与原坐标及旅行规则相符；只走一次，抵达洛阳卯时、界面Day126／5–7 a.m. |
| 居民／Merlin在卯时 | 居民入口可用；Merlin未出现在宿主locations中，符合原白天门槛未满足，不是已可用却点不到 |
| 首轮QA错误 | 脚本以为Merlin应是action为空的对象，读取不存在的对象.action而抛TypeError，**尚未点击任何人物、0页对白**。原报告 `passed=false`保留，不归为网页或条件错误 |

核[MapService.BuildLocations](../src/Game.Application/MapService.cs)确认：小地图没有可用事件的位置直接略去；[BrowserBridge](../src/Game.Web.Runtime/BrowserBridge.cs)投影的是该列表。没有改游戏去显示隐藏人物或取消白天条件。停止后通过正常界面导出卯时Crossroads世界档，再给报告／停止档各一份字节备份及 `resume-manifest.json`。

## 从真实抵达档接续，没有重复旅行

独立context正常导入这个实际停止档，SHA `39639be190811cd7bb2ed3e7c2c793d326eb59d25232af327249bf1c58d3cb21`。只修QA对“隐藏即不可用”的读取方式，继续原两段交谈，没有重新走Willow或世界路程、等待、刷概率、调时钟或改存档。

实际六页如下，角色显示为Young Apprentice、Rowan、Merlin；Merlin的既有候选身份保持proposed。

1. Young Apprentice: “I can tell you're new. You're looking at the sign instead of the shortcuts.”
2. Rowan: “I had planned to learn the sensible route first.”
3. Young Apprentice: “How unusual. You may do rather well here.”
4. Merlin: “I've consulted the stars, the runes, and three very unhelpful birds. My dog is still out walking.”
5. Rowan: “Have you tried calling him?”
6. Merlin: “Naturally. He appears to regard his name as a suggestion.”

居民普通三句结束后由卯到辰，Merlin入口按原条件自然出现；随后他的三句结束到巳。没有进入已结束的新手战斗分支、寻犬后续、选择、购物、培养、换队或奖励。原世界第二阶段需要主角15级及格林回访，本档仍13级、未回访，没有关闭其它国家线。

## 保存与验收证据

居民／Merlin两段结束后，正常保存→刷新→Continue→独立导出。最终9项操作／入口／显示／恢复检查通过，6页均为英文；每个Continue实际44px，390×844视口内可用、无横向溢出。已查看Merlin现场截图；仍是旧人物画和场景，没有借此声称西化美术完成。两次浏览器异常、请求失败和HTTP错误均0；首轮的Node QA异常单独保留。

完整序列化game对象与保存前导出逐字段相同。与原Willow档相比，game仅clock、location、storyState自然变化；全部人物／装备／教材／库存／经济／商店、完整profile、wonBattles、变量／timeKeys和世界触发保持不变。新增完成标记仅 `original_洛阳.小孩1`、`original_洛阳奇闻.阿福1`，没有删除任何旧标记；丹麦和mainStory不变。

实际余额150银币、十人、54道德、主角13级，profile仍死亡3／击杀131。原返回＋旅行＋两次交谈共13时段，最终raw时钟year1／month5／day6／Si，界面Day126／9–11 a.m.。这是两段开篇交谈，不是寻犬任务、国家章或整游通关；没有招募或新收益。

| 工作区原始证据 | SHA-256 |
| --- | --- |
| `crossroads-conversations.json`，首轮读取错误，保留false | `3122206608af2bcb79cc1068f2f058604000481531537d6f614e5e12e9c4c7a2` |
| `crossroads-conversations-stopped-save.json`，真实卯时抵达档 | `39639be190811cd7bb2ed3e7c2c793d326eb59d25232af327249bf1c58d3cb21` |
| `crossroads-conversations-resumed.json`，六页及恢复通过 | `e6b61fafd63c0ff32df00c7d99ae2b72a9ead878e0b559f1836f532d8217166e` |
| `crossroads-conversations-resumed-outcome-save.json` | `e6bb51b16312bdf5cdf9df054a747b0d3054d3b54e5f4e6584856f953a37e96b` |
| `crossroads-conversations-resumed-complete-save.json` | `97ad46252c9018b2fb6ed9ba953707c230a9441f5ab57b8d04ae41531f7a6e44` |

执行脚本在工作区 `test-results/check-crossroads-conversations.mjs`、`check-crossroads-conversations-resumed.mjs`；都有独占启动标记，不重跑覆盖。本批没有产品变化，使用上一通过构建及原WASM，没有重复构建或虚报新增.NET／单元测试。

## 未验与素材事项

真机／触摸、中文实玩、实际寻犬后续、其它NPC分支与整游仍未验；[HP／MP保存边界](MAP_SAVE_VITALS.md)保持，不据地图档完整恢复声称已解决战斗资源保存。原亚瑟／丹麦挑战未重跑，Guinevere概率未重试，候选未锁定，头像未生成、绑定或改manifest。本批未合并或部署。

dot后续明确将唯一Guinevere候选交给既有素材席 `produce_card33`。格林参考PNG的二进制交接能力缺口、原始bytes／SHA与未取得FileID的状态，另见[头像制作输入](GUINEVERE_PORTRAIT_BRIEF.md)；本次路线验证不因该缺口中止，也不以本机路径假称已上传。

后续[失犬话题引用核查](MERLIN_DOG_FOLLOWUP_REVIEW.md)确认当前冻结包只有这段闲谈，没有找狗／交付／奖励的后续链。本文的“寻犬开篇”描述当时对白主题，不再作为存在完整任务的依据；六句与存读档实测仍有效，没有完成一条寻犬任务的声称。
