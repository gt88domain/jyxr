import {assetUrl} from './content';
import type {GameState} from './bridge';
import {chestPanel} from './panels';
const e=(v:unknown)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));

export function interactionView(state: GameState): string {
  let content='';
  if(state.ending && (state.phase==='ending'||state.phase==='gameover')){
    const s=state.ending,round=s.targetRound;
    const title=s.kind==='complete'?'此程圆满，江湖长存':s.kind==='gameover'?'胜败有时，江湖未远':s.kind==='title'?'暂别江湖':s.kind==='restart'?'重走此程，另寻结局':`再赴江湖 · 第 ${round} 周目`;
    content=`<div class="eyebrow">第 ${s.completedRound} 周目 · ${s.kind==='gameover'?'此程落幕':'旅程回顾'}</div><h2>${title}</h2><p class="panel-intro">${round?'确认人物后重新开始剧情。仓库、元宝和玩家档案保留，队伍、行囊、剧情和修炼重新开始；新角色按对应周目与试炼记录领取开局奖励。':s.kind==='gameover'?'此次遭遇结束了这一程，可读取此前保存的进度。':s.kind==='complete'?'原版结局已完成。可保存结局与武学解锁记录，或导出备份后返回标题。':'返回标题后可继续此前保存的旅程。'}</p>${round?'<button class="button primary full-width" data-action="begin-round-creation">生成人物，开始下一程</button>':''}${s.kind!=='gameover'&&s.kind!=='title'?'<button class="button outline full-width" data-action="save-ending">保存结局与继承记录</button><button class="button outline full-width" data-action="download-save">导出结局备份</button>':''}${s.kind==='gameover'?'<button class="button primary full-width" data-action="load">读取上次存档</button>':''}<button class="button outline full-width" data-action="return-title">返回标题</button>`;
  }
  else if(state.phase==='chest') content=`<h2>储物箱</h2>${chestPanel(state,false)}<button class="button primary full-width" data-action="close-chest">收好行囊，继续旅途</button>`;
  else if(state.combatantSelection){
    const s=state.combatantSelection;
    content=`<h2>${e(s.title)}</h2><p class="panel-intro">选择 1～${s.capacity} 名参战队员。带有“必选”的队员必须上场；本轮已出场的禁选队员不能再次出场。</p><form id="combatants-form"><div class="combatant-cards">${s.candidates.map(c=>`<label class="combatant-card ${c.forbidden?'unavailable':''}"><img src="${e(assetUrl(c.portrait))}" alt=""><span><strong>${e(c.name)}</strong><small>第 ${c.level} 级${c.required?' · 必选':c.forbidden?' · 本轮禁选':''}</small></span><input type="checkbox" name="character" value="${e(c.id)}" ${c.required?'checked':''} ${c.forbidden?'disabled':''}></label>`).join('')}</div><button class="button primary full-width" type="submit">确认参战</button></form>`;
  }else if(state.rename){
    content=`<h2>为同行之人命名</h2><form id="heroine-name-form"><label class="form-label" for="heroine-name">姓名</label><input id="heroine-name" name="name" value="${e(state.rename.defaultName)}" minlength="1" maxlength="12" required autocomplete="off"><button class="button primary full-width" type="submit">确认姓名</button></form>`;
  }else if(state.gameOver){
    content='<div class="eyebrow">此程落幕</div><h2>胜败有时，江湖未远</h2><p class="panel-intro">此次遭遇结束了这一程。可以读取之前保存的进度，或返回标题重新开始。</p><button class="button primary full-width" data-action="load">读取上次存档</button><button class="button outline full-width" data-action="return-title">返回标题</button>';
  }
  return content?`<div class="shop-scrim"><section class="shop-window paper special-interaction" role="dialog" aria-modal="true">${content}</section></div>`:'';
}
