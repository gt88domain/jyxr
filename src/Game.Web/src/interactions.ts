import {assetUrl} from './content';
import type {GameState} from './bridge';
import {chestPanel} from './panels';
const e=(v:unknown)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));

export function interactionView(state: GameState): string {
  let content='';
  if(state.phase==='chest') content=`<h2>储物箱</h2>${chestPanel(state,false)}<button class="button primary full-width" data-action="close-chest">收好行囊，继续旅途</button>`;
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
