# 武藏高级战技：只读说明与中英实测

基线 `54d29d6358171676aabe4fd4b85e480eacc7c688`，同一工作区、唯一源码 writer、`feat/storybound-italian-battle`。本批完成前批已实见的说明入口缺口，不改变战斗或剧情，不合并／部署。

## 实际产品改动

- `src/Game.Web/src/panels.ts`：在既有Character／Learned techniques列表中，为宿主已返回、具有说明的高级招式增加原生 `details/summary`。初始收起，可点击或键盘展开；没有新命令、按钮动作、解锁、属性或存档字段。
- 只遍历原 `hero.skills`，不从整包补未拥有技能；稳定的带点号高级招式ID用于辨识已有形态，不重编号。本档实际6项，未解锁的 Final Principle没有显示。入口限制为 `jyxr-fantasy-worlds` 应用，原版应用保持原列表结构。
- `panels.css`：限定新行使用两列名称／等级与跨列说明，摘要最小44px，长名称与长段落换行，不重设计整个人物页。
- `chapter-equipment-copy.json`：经原description文本键补6条中英文显示映射，沿用已有英文名称。真正交给宿主的原技能定义、名称、数值、buff、几何、条件和消耗均保持原值，仅在既有投影层显示新说明。

6项为 Swordbreaker、Cleaverbreaker、Fistbreaker、Spellbreaker、Welcoming Pine和Ironbody Awakening。未改3个中文天赋、地图、世界目标、头像、其它国家或剧情。

## 文案依据与限制

四类封印明确对应 Swordsmanship／Heavy Weapons／Gauntlets／Spells，持续原4回合；会影响对应技艺及高级形态，不把特殊能力写成也被封印。文案说明目标可以抵抗，不将数据中的chance100写成无条件必定生效。

Welcoming Pine描述为以施术者为中心的星形范围招式，无自带附加状态，不承诺取消天赋或其它作用。Ironbody Awakening描述命中后可让目标Energy Drain III持续3回合、让施术者Defense Up X持续1回合；没有全队护盾、无敌或新增治疗的表述。说明提示实际Energy／Rage／冷却及高亮目标以战斗面板为准，没有用静态说明覆盖现场消耗或几何。

来源：原 `formSkills`／buff定义；`BattleEngine.Availability.cs` 的系别封印及SpecialSkill排除；`BattleEngine.Effects.cs` 的命中后buff流程与 `IsDebuff ? target : source`；`BattleSkillBuffChanceResolver` 和 `BattleBuffResolver` 的概率、抵抗与应用条件；`BattleEngine.Impact.cs` 的原星形范围。这里只读核实现，**本批未执行战斗或.NET效果测试**，不称已实战验证命中／抵抗／伤害。

## 真实页面测试

源 `musashi-route-recheck-recruitment-complete-save.json`，SHA `35352bb0356fc0d6ba95b9e4d3c5478e7dbb1f7e54dc238669199d01f31e0b0d`，71402 bytes。源及4份既有报告／存档先逐字节备份至 `test-results/backups/pre-musashi-details-54d29d6/`，结束逐份核SHA不变。

| 独立检查 | 实际覆盖 |
| --- | --- |
| 英文390×844 | 原存档正常导入→Party→武藏Character；6个真实高级说明逐一展开／收起，首项键盘Enter；英文逐段与词典一致，无中文说明残留 |
| 中文390×844 | 同一原存档的独立context，6条名称／说明及“战技说明”均使用中文；逐一展开／收起，未覆盖成英文 |
| 英文320×740 | 同一原存档的另一独立context，重复有限说明操作；最长名称实际换成两行，说明正常换行，无横向溢出 |

三组各15项限定检查通过。6条说明每组均初始收起、展开后可见、收起后隐藏；summary高44px以上。390px可用宽358px、320px可用宽288px，段落scrollWidth不超clientWidth；最长英文说明由约5行变约6行，实际截图已查看。这里使用云端无头Chromium、鼠标及一次键盘Enter／组，**不是真机或触摸**，也没有声称其它页面全部英文。

每组均正常保存、导出、刷新Load，重新打开后6条仍在且回到收起状态。完整序列化 `game`、`wonBattles`、`profile` 在保存前后与原源档一致；仍11人、150银币、道德54、原装备／教材／属性／技能状态／时钟／剧情及死亡3／击杀131，没有旅行、战斗、培养、切技能开关或准备操作。当前HP／MP既有机制不改，不扩称战中精确续存。

## 构建、冻结与证据

内容构建、TypeScript检查及Vite前端构建通过；原非模块runtime-loader及较大chunk警告仍在，没有.NET SDK，未重建宿主。22项现有内容／流程冻结测试及8项投影回归通过；另逐语言核已编译运行包：除允许的browser／storyScripts之外，全部原定义逐字段一致。原包SHA仍 `c348d1bc161dbe3a9f9a321232526da75b8d3c7638db7fb2b089d30981e9bcd3`。

工作区 `src/Game.Web/test-results/`：

| 报告／正常完成档 | SHA-256 |
| --- | --- |
| `musashi-technique-details-en.json`，15979 bytes | `2902250e81ae5fe605861b9aea723461f703abd9a38b3a72f7736ebd501bdf5b` |
| `musashi-technique-details-zh-CN.json`，15091 bytes | `a07ec272ea187bdf24b18f440264a17a82d389aba309284f510896a57fcc3bff` |
| `musashi-technique-details-320-en.json`，15991 bytes | `56a4b5e0f896076e7bc5918cacdfebf957aff3667cdb031a4d3f3abbd9cfb028` |
| 英文390完成档 | `ef370c4c83fd5113ac2655154893b9e43905903b5f6ca375323d67648e4e0714` |
| 中文390完成档 | `feb2f8bfde4b9ba5ef371d2a1b9ca762f964e1b27c294c046aa49779131b2df7` |
| 英文320完成档 | `ca6661f5d056ca233b738e78d27e32c2623d392dbfacda79f171912070bc782a` |

三份报告均passed=true、浏览器／HTTP／请求异常为0。原存档、前批“无说明入口”的真实报告、旧tick83山战中断、各国成果及Guinevere候选不覆盖。截图、脚本、前后导出另有 `musashi-technique-details-evidence-manifest.json` 的bytes／SHA台账；没有新素材或发布计数。

未验仍包括：这6招实战、其它角色高级说明、真机、原版应用运行期回归、武藏后续、道德拒绝分支及全日本章。人物页3个中文天赋保持下一独立文案缺口，本批没有顺手修改；旧山战没有因这次页面通过而产生结算。

后续[三项天赋英语显示](MUSASHI_TALENTS_QA.md)已另批补齐，复用既有展开控件；390／320px中英及原档保存核查通过，中文原文保留，效果与旧失败不变。本页所述3个中文天赋是当时的待办；其它未验项没有因此自动完成。
