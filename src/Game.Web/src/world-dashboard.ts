import type {GameState} from './bridge';
import {assetUrl} from './content';
import {worldAtlasView} from './world-atlas';
import {openingChapterStep} from './opening-chapter';
import {academyStep} from './academy-guide';
import {nextStepAction} from './journey-panel';
import {copy} from './ui-language';
import {e,icon} from './ui/format';
import './guided-interface.css';
import {worldStatus} from './world-status';
/** One compact home for the live map, current goal and ordinary map actions. */
export function worldDashboard(state:GameState){
  const h=state.managedCharacter||state.hero,step=openingChapterStep(state),academy=academyStep(state),atlas=state.map.kind==='large'&&state.pack.worldAtlas;
  const equipped=h.equipment?.filter(x=>x.item).length||0;
  const status=worldStatus(state,document.documentElement.lang);
  return `<main class="world-screen guided-world" data-guided-world>
<header class="gw-location">
<div>
<span class="eyebrow">${copy('Adventure journal','冒险手册')}</span>
<h1>${e(state.map.name)}</h1>
</div>
<span class="gw-clock" data-world-clock><strong>${copy('Day','第')} ${status.day}${copy('','天')}</strong><small>${status.night?'☾ ':''}${e(status.time)}</small></span>
</header>
<div class="gw-affiliation" data-world-affiliation title="${e(status.organizationFullName)}"><span>${copy('Organization','所属组织')}</span><strong>${e(status.organizationName)}</strong></div>
<section class="gw-status" aria-label="${copy('Party status','队伍状态')}">
<button data-action="loadout">
<img src="${e(assetUrl(h.portrait))}" alt="">
<span>
<strong data-player-name>${e(h.name)}</strong>
<small>${copy('Level','等级')} ${h.level} · ${state.silver.toLocaleString()} ${e(state.pack.currencyUnit||'')}</small>
</span>${icon('arrow')}</button>
<div>
<span>${copy('Health','生命')} <b>${h.hp}/${h.maxHp}</b>
</span>
<meter min="0" max="${h.maxHp}" value="${h.hp}">
</meter>
<span>${copy('Energy','能量')} <b>${h.mp}/${h.maxMp}</b>
</span>
</div>
</section>
<section class="gw-next paper" data-guidance ${step?.storyStage?`data-story-stage="${e(step.storyStage)}"`:''}>
<header>
<span class="eyebrow">${e(copy('Next step','下一步'))}</span>
<button data-action="quests">${copy('All goals','全部目标')} →</button>
</header>
<h2>${e(step?.title||copy('Choose your next adventure','选择下一段冒险'))}</h2>${step?.detail?`<p>${e(step.detail)}</p>`:''}${academy&&!academy.graduated?`<div class="gw-school-progress">
<span>${copy('Adventure days elapsed','已度过冒险天数')} <b>${state.adventure?.days||0} / ${academy.academy.graduationAfterDay+1}</b>
</span>
<progress max="${academy.academy.graduationAfterDay+1}" value="${Math.min(state.adventure?.days||0,academy.academy.graduationAfterDay+1)}">
</progress>
<small>${copy('Finish a training session after the threshold to graduate.','达到天数后完成一次训练，触发出师。')}</small>
</div>`:''}<div class="gw-next-actions">${nextStepAction(state)}<button class="button outline" data-action="loadout">${icon('sword')}${copy('Gear & study','装备与研习')}</button>
</div>
</section>
<nav class="gw-preparation" aria-label="${copy('Preparation shortcuts','整备快捷操作')}">
<button data-action="loadout">
<span>${copy('Gear','装备')}</span>
<strong>${equipped}/3</strong>
</button>
<button data-action="loadout" data-sheet-anchor="as-mastery">
<span>${copy('Mastery','主专精')}</span>
<strong>${e(h.internalSkills?.find(s=>s.id===h.equippedInternalSkillId)?.name||copy('None equipped','尚未装备'))}</strong>
</button>
<button data-action="loadout" data-sheet-anchor="as-study">
<span>${copy('Study','研习')}</span>
<strong>${e(h.cultivation?.skillName||copy('Choose a guide','选择教材'))}</strong>
</button>
</nav>
<section class="gw-destinations" data-world-destinations tabindex="-1">
<header>
<h2>${copy(atlas?'World map':'People & places',atlas?'世界地图':'人物与地点')}</h2>
<small>${copy('Available actions first','当前可用操作优先')}</small>
</header>${atlas?worldAtlasView(state,state.pack.worldAtlas!):`<div class="gw-places">${[...state.map.locations].sort((a,b)=>Number(!!b.action)-Number(!!a.action)).map(p=>`<button class="gw-place" data-action="interact" data-id="${e(p.id)}" ${p.action?'':'disabled'}>${p.image?`<img src="${e(assetUrl(p.image))}" alt="">`:icon(p.action==='map'?'leaf':'person')}<span>
<strong>${e(p.name)}</strong>
<small>${e(p.action?p.description:copy('No new event','暂无新事件'))}</small>
</span>${icon('arrow')}</button>`).join('')}</div>`}</section>
<details class="gw-notes">
<summary>${copy('Location notes & recent activity','地点说明与近期记录')}</summary>
<p>${e(state.map.description)}</p>${(state.logs||[]).slice(-3).reverse().map(l=>`<p>${e(l)}</p>`).join('')}<button data-action="history">${copy('Full activity log','完整操作记录')} →</button>
</details>
</main>`;
}
