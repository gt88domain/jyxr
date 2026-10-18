#!/usr/bin/env python3
"""Write the complete named checklist from the verified comparison output."""
import json
from pathlib import Path
web=Path(__file__).resolve().parents[1];d=json.loads((web/'public/late-version-comparison.json').read_text())
def cell(value):return str(value).replace('|','\\|').replace('\n',' ')
lines=['# 当前 HTML5 版与后期 X1.1.0.6 的具体对照','',
'目标依据是逆向参考工程固定提交 `'+d['commit']+'`。本次读取其真实 Unity 场景、原图和打包 XML；没有运行旧 EXE/DLL，没有做通关测试。该工程经过 Unity LTS/xLua 等修改，尚未与独立取得的官方实发1.1.0.6成品逐字节验证，不能把参考工程预览当成官方运行截图。','',
'## 先看旧版界面','',
'网页“更多 → 1.1.0.6 旧版对照”，或地址参数 `?pack=jyx&view=late-reference`。提供地图、人物与战斗三个只读布局预览，来自原场景坐标和58张逐字节核对的原图；可切换和原尺寸滚动查看。原图归属、README和许可保留在notices目录。','',
'地图的原菜单为右下方四个图标，人物/难度在左上，位置、时刻与钱币在顶栏。人物面板是纸色底图、头像、属性/装备/技能/天赋/列传分区，和此前早期0.6图标加深色框的参考皮肤有明显区别。','',
'这批复原的是界面层预览，原场景中的名字、数值与技能文字是预设示例；没有把它们当作当前玩家数据。字体、裁剪、动态角色/地点填充和所有旧面板交互仍需继续接线。现有可玩“原版风格”尚未改成完整1.1布局，现代可玩界面继续保留。','',
'## 数据量与实际差异','',
'此前只比过后期MOD模板，不能覆盖该版本全部内容。本次新增打包数据和编辑器数据对照，三者分别保留。打包XML来自 `Assets/StreamingAssets/xml`，共23份TextAsset，包SHA-256：`'+d['bundleSource']['sha256']+'`。','',
'已知异名和数字写法在比较时统一；属性顺序不算差异，子项顺序单列。结构差异不是缺少多少玩法，也不是平衡变化数。','',
'| 项目 | 当前迁移基线 | 后期工程打包数据 | 有差异的记录 | 其中仅子项排序 |','| --- | ---: | ---: | ---: | ---: |']
for c in d['categories']:
 r=c['references']['bundle'];lines.append(f"| {c['name']} | {c['baselineRecords']} | {r['records']} | {r['changedCount']} | {r['orderOnlyCount']} |")
lines+=['','主剧情表不含CG、PY、鹿鼎记等其他文件，不能与全量剧情1887段直接相减。','',
'人物表同为513条，没有凭此发现一大批额外伙伴。排除异名、数字写法后，打包人物表的4处差异为：木头人模型mutouren→muren、小混混3/4的显示名均写成小混混2、女主显示名铃兰→玲兰。没有把显示名差异改成新人物。','',
'后期打包数据包含78段鹿鼎记，与用户上传版该文件字节相同；39段基线外补充的入口问题仍保留，双儿仍无正式定义。三份后期表的完整字段差异可下载 `late-version-details.json`；不是整表盲目覆盖现有数据。','',
'## 五项天赋疑点','',
'本次检索了后期工程全部C#和Lua中的同名执行引用，也追溯了打包数据的授予引用；没有把描述等同于执行公式。','',
'| 天赋 | 点数 | 后期数据中的来源 | 当前结论 |','| --- | ---: | --- | --- |']
for t in d['talents']:
 grants='；'.join(r['owner']+' '+r['attributes'].get('lv',r['attributes'].get('level',''))+'级' for r in t['lateGrantReferences']) or '仅有资源说明，未定位授予引用'
 lines.append(f"| {t['id']} | {t['points']} | {grants} | {t['status']} |")
lines+=['','第三方重制有“伤口撕裂”的10%伤害加深实现、“御剑”按对方等级/500增加暴击概率的实现；它们与原描述并非完全一致，不能直接当成1.1原规则。该重制把情花奇毒注明“不喜欢砍掉”、摧筋破骨和软猬宝甲注明“弃用”；这只是重制作者的选择，不证明官方删除。','',
'其余四项在当前后期打包表尚未定位授予/角色/装备引用，不宜以这四个名称认定主线一定玩不完整。御剑则确实可由天山剑法12级授予，必须保留“可获得但未定位执行效果”的区别。','']
for g in d['partialTalentGroups']:
 lines+=['## '+g['title']+f"（{len(g['entries'])}项）",'']
 for t in g['entries']:lines.append('- **'+t['id']+'**：'+t['remainingSummary'])
 lines.append('')
lines+=['## 奥义：两处触发问题与107条额外威力差异','',
'137条记录、223个条件与同名变体均保留，不等于137条效果全部验收。下列两处是已知明确的起手/条件疑点：','']
for l in d['legends']:
 if l['knownIssue']:lines.append('- **'+l['name']+'**：'+l['knownIssue'])
lines+=['','本次新发现：后期工程打包XML的137条都未声明addPower；C#的Aoyi有该float字段，缺省为0，AoyiInstance.Power实际读取它。现版基线中107条为非零；其余30条虽有字段结构差异，数值仍为0。这是版本数值差异，**不是107个奥义没做**。','',
'例如“小人物的愤怒”4种起手，现基线各有+15额外威力，后期工程打包数据缺省0。MOD模板反而保留现基线的额外威力，说明此前模板对照不能替代打包数据。暂保留两套数据并列，不在这一批悄悄改动所有存档角色的战斗数值。','',
'原触发抽签顺序、基本悟性、天赋和名称词条已有实现；全部威力、范围、连锁、装备叠加和死亡/回调顺序仍需继续核对。','',
'### 107条具名额外威力差异','',
'| 原表序号 | 奥义 | 起手 | 现基线额外威力 | 后期工程打包缺省 |','| ---: | --- | --- | ---: | ---: |']
for row in d['legendPowerDifferences']:lines.append(f"| {row['occurrence']} | {row['name']} | {row['start']} | {row['baselineExtra']} | {row['bundleExtra']} |")
lines+=['','### 全部137条起手、等级与条件','',
'| 序号 | 奥义／起手 | 起手等级 | 基础概率 | 附加条件 |','| ---: | --- | ---: | ---: | --- |']
for i,l in enumerate(d['legends'],1):
 conditions='；'.join(c['targetId']+('（天赋，不检查等级）' if c['type']=='talent' else ('≥'+str(c['level'])+'级') if c.get('level') else '') for c in l['conditions']) or '无附加条件'
 lines.append(f"| {i} | {cell(l['name'])}／{cell(l['startSkill'])} | {l['requiredLevel']} | {l['probability']*100:g}% | {cell(conditions)} |")
lines+=['','## 多周目实际改变什么','',
'多周目主要复用同一套江湖，重新生成人物和队伍、继承仓库及玩家档案、改变开局随机奖励与成长边界，另有少量周目条件事件。不是每周目一套新世界。','',
'| 周目 | 敌攻／防基础系数 | 技能上限加成 | 血内上限 | 仓库容量 | 开局伙伴候选 |','| ---: | --- | ---: | ---: | ---: | --- |']
for r in d['rounds']:lines.append(f"| {r['round']} | {r['enemyAttackMultiplier']}／{r['enemyDefenceMultiplier']} | +{r['skillCapBonus']} | {r['hpMpCap']} | {r['chestCapacity']} | {str(r['bonusPoolCount'])+'选1' if r['bonusPoolCount'] else '无'} |")
lines+=['','基础系数不等于最终伤害倍率，难度、天赋、武学、阵法和特殊战斗另行参与。','']
for r in d['roundNotes']:lines+=['### '+r['title'],'','- 后期依据：'+r['late'],'- 当前网页：'+r['current'],'- 位置：'+r['source'],'']
lines+=['### 直接使用周目条件的地图事件（8个）','']
for r in d['roundEvents']:lines.append('- '+r['map']+'／'+r['location']+' → '+r['target']+'：'+'；'.join(c['type']+' '+c['value'] for c in r['conditions']))
lines+=['','这个数量只统计地图里显式的周目条件，不覆盖全部间接剧情条件。正常结局、华山、后续周目的连续通关仍由玩家/后续验收确认；本批未跑通关，也没有提供跳过剧情或强制通关入口。','',
'## 可复现入口','',
'- `npm run audit:late-reference`核对23份打包XML摘要、137条变体/223个条件、107条额外威力、授予引用、58张原图与坐标。','- `npm run test:late-reference`检查预览与清单、查找、手机缩放，以及查看前后完整会话状态不变。','- 刷新来源使用 `scripts/extract-late-runtime.py`、`scripts/refresh-late-ui.py`和`scripts/build-late-comparison.py`。常规构建直接读取已保存快照，不要求另外几个参考库仍在本机。','']
text='\n'.join(lines)
(web/'X1106_COMPARISON.md').write_text(text);(web/'public/late-version-comparison.md').write_text(text)
print('Wrote complete named comparison:5 talent questions,71 partial talents,137 legends,107 power variants and multi-round evidence')
