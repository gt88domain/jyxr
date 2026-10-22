import english from './ui-en.json' with {type:'json'};

const dictionary:Record<string,string>=english;
const cjk=/[\u3400-\u9fff]/;
let contentLabels:Record<string,string>={};
let activeLanguage='en';
const fantasyChinese:Record<string,string>={'已切换当前运行内功。':'已切换当前主专精。','停止主运内功':'卸下主专精','切换主运内功':'更换主专精','同时主运一门':'同时装备一个主专精','设为主运':'装备为主专精','停止主运':'卸下主专精','当前运行心法':'当前主专精','主运功法':'主专精','外功招式':'主动技能','武功':'技艺','武学':'技艺','功法':'技艺','内功':'被动专精','心法':'专精','主运':'装备主专精','内力':'能量','秘籍':'卷轴','修炼':'研习','拳掌':'拳套','奇门':'法术','刀法':'刃术','门派':'学派','江湖':'故事世界','师父':'导师'};
let contentTerms:Array<[string,string]>=[];
export function setUiDisplayLabels(labels:Record<string,string>={}){
  contentLabels=labels;
  contentTerms=Object.entries(labels).filter(([source])=>cjk.test(source)&&source.length<48).sort((a,b)=>b[0].length-a[0].length);
}
const patterns:Array<[RegExp,(...parts:string[])=>string]>=[
  [/^天赋「([^」]+)」(?:\n([\s\S]*))?$/,(name,description)=>`Talent: ${translateUiText(name)}${description?`\n${translateUiText(description)}`:''}`],
  [/^(拳掌|剑|刀|奇门)系技能加成\s*([+−-][\d.]+%?)$/,(kind,amount)=>`${({'拳掌':'Gauntlets','剑':'Swordsmanship','刀':'Bladework','奇门':'Spellcasting'} as Record<string,string>)[kind]} technique bonus ${amount}`],
  [/^奥义「([^」]+)」触发率\s*([+−-][\d.]+%?)$/,(name,amount)=>`Combo ${translateUiText(name)} trigger chance ${amount}`],
  [/^使用「([^」]+)」时奥义触发倍率增加([\d.]+)$/,(name,amount)=>`${translateUiText(name)} combo chance multiplier +${amount}`],
  [/^技能「(.*?)」威力\s*([+−-][\d.]+%?)$/,(name,amount)=>`${translateUiText(name)} power ${amount}`],
  [/^(.*?)\s*→$/,(label)=>`${translateUiText(label.trim())} →`],
  [/^(\d+)轮$/,(n)=>`${n} turns`],
  [/^(自动交手|手动出招)\s*·\s*(.*)$/,(mode,speed)=>`${mode==='自动交手'?'Auto':'Manual'} · ${speed}`],
  [/^秘籍修炼「(.*?)」经验\s*\+(\d+)(?:，提升至\s*(\d+)\s*级)?。$/,(name,xp,level)=>`Scroll study: ${translateUiText(name)} · XP +${xp}${level?` · Rank ${level}`:''}.`],
  [/^随身(.*?)$/,(currency)=>`Carried ${translateUiText(currency)}`],
  [/^【(.*?)】装备【(.*?)】$/,(name,item)=>`${translateUiText(name)} equipped ${translateUiText(item)}.`],
  [/^【(.*?)】使用【(.*?)】$/,(name,item)=>`${translateUiText(name)} used ${translateUiText(item)}.`],
  [/^恢复气血与(?:内力|Energy)$/ ,()=>`Recover Health and Energy`],
  [/^为(.*?)换上「(.*?)」，替换(.*?)。确认前不会穿戴或消耗物品。$/,(name,item,old)=>`Equip ${translateUiText(item)} on ${name}, replacing ${translateUiText(old)}. Nothing changes before confirmation.`],
  [/^确认装备到(.*)$/,(name)=>`Equip on ${name}`],
  [/^新增天赋：\s*(.*)$/,(names)=>`Added talents: ${translateUiText(names)}`],
  [/^失去天赋：\s*(.*)$/,(names)=>`Removed talents: ${translateUiText(names)}`],
  [/^当前旅程最近\s*(\d+)\s*条记录，最多保留300条，随手动／自动存档保存。旧存档从本版开始记录，不能补回此前未记录的操作。$/,(n)=>`The last ${n} records of this journey, up to 300, are included in saves. Older saves begin recording from this version.`],
  [/^本次浏览器提示\s*·\s*(\d+)\s*条$/,(n)=>`Browser feedback · ${n}`],
  [/^(.*?)受到\s*(\d+)\s*点伤害（暴击）。$/,(name,n)=>`${translateUiText(name)} takes ${n} damage (critical).`],
  [/^(.*?)受到\s*(\d+)\s*点伤害。$/,(name,n)=>`${translateUiText(name)} takes ${n} damage.`],
  [/^(.*?)施展「(.*?)」。$/,(name,skill)=>`${translateUiText(name)} uses ${translateUiText(skill)}.`],
  [/^(.*?)从(\d+)级升至(\d+)级。$/,(name,a,b)=>`${translateUiText(name)} levels up: ${a} → ${b}.`],
  [/^(.*?)加入队伍（(.*?)）。$/,(name,placement)=>`${translateUiText(name)} joins the party (${translateUiText(placement)}).`],
  [/^(.*?)离开队伍。$/,(name)=>`${translateUiText(name)} leaves the party.`],
  [/^已选择修炼秘籍「(.*?)」。秘籍保留在背包，战斗结算经验将用于此项修炼。$/,(name)=>`Studying ${translateUiText(name)}. The scroll remains in inventory; combat settlement awards study XP.`],
  [/^(.*?)\s*·\s*路程与交互\s*(\d+)\s*时辰$/,(description,n)=>`${translateUiText(description)} · Travel and interaction: ${n} time slots`],
  [/^第\s*(\d+)\s*级\s*·\s*(.*)$/,(n,role)=>`Level ${n} · ${translateUiText(role)}`],
  [/^(.*?)\s*·\s*第\s*(\d+)\s*级$/,(role,n)=>`${translateUiText(role)} · Level ${n}`],
  [/^人物经验\s*(.*)$/,(n)=>`Character XP ${n}`],
  [/^伙伴修炼总览\s*·\s*(\d+)\s*人已选秘籍$/,(n)=>`Party training overview · ${n} assigned`],
  [/^秘籍：\s*(.*)$/,(n)=>`Scroll: ${translateUiText(n)}`],
  [/^(修炼|穿戴)门槛\s*·\s*(\d+)\/(\d+)\s*已满足$/,(kind,a,b)=>`${kind==='修炼'?'Training':'Equipment'} requirements · ${a}/${b} met`],
  [/^([✓○])\s*(.*?)（面板）$/,(mark,stat)=>`${mark} ${translateUiText(stat)} (character sheet)`],
  [/^当前\s*(.*?)\s*\/\s*需要\s*(.*)$/,(a,b)=>`Current ${a} / Required ${b}`],
  [/^秘籍共\s*(\d+)\s*本\s*·\s*空闲\s*(\d+)\s*本$/,(a,b)=>`Scrolls: ${a} · Available: ${b}`],
  [/^第\s*(\d+)\s*重\s*\/\s*(\d+)\s*重(.*)$/,(a,b,tail)=>`Rank ${a}/${b}${translateUiText(tail)}`],
  [/^第\s*(\d+)\s*重\s*·\s*耗(.*?)\s+(\d+)$/,(n,energy,cost)=>`Rank ${n} · ${translateUiText(energy)} ${cost}`],
  [/^第\s*(\d+)\s*重$/,(n)=>`Rank ${n}`],
  [/^(.*?)\s*·\s*(\d+)重$/,(name,n)=>`${translateUiText(name)} · Rank ${n}`],
  [/^基础内力消耗\s*(\d+)$/,(n)=>`Base Energy cost ${n}`],
  [/^基础距离\s*(\d+)$/,(n)=>`Base range ${n}`],
  [/^基础范围\s*(\d+)$/,(n)=>`Base area ${n}`],
  [/^(\d+)\s*人$/,(n)=>`${n} members`],
  [/^装备：\s*(.*)$/,(gear)=>`Equipment: ${translateUiText(gear)}`],
  [/^(.*?)\s*·\s*完成\s*(\d+)\s*\/\s*(\d+)\s*项。本章以完整游玩流程为目标，阅读与手动战斗时间因人而异。$/,(title,a,b)=>`${title} · ${a}/${b} goals complete. Reading and manual combat affect play time.`],
  [/^(.*?)\s*·\s*尚未发生$/,(title)=>`${translateUiText(title)} · Not yet received`],
  [/^主角达到\s*(\d+)\s*级；参战队伍至少\s*(\d+)\s*人（含主角）(.*)$/,(level,size,tail)=>`Reach level ${level}; have ${size} active party members, including yourself${tail?`; ${translateUiText(tail.replace(/^；/,''))}`:''}`],
  [/^经历「(.*?)」$/,(title)=>`complete ${translateUiText(title)}`],
  [/^旅途记事\s*·\s*最近\s*(\d+)\s*条$/,(n)=>`Journey journal · Last ${n}`],
  [/^(\d+)年(\d+)月(\d+)日\s*(.*?)时$/,(year,month,day,time)=>`Year ${year}, month ${month}, day ${day} · ${translateUiText(time)}`],
  [/^获得「(.*?)」×(\d+)$/,(item,n)=>`Received ${translateUiText(item)} ×${n}`],
  [/^(.*?)\s*获得天赋【(.*?)】$/,(name,talent)=>`${name} gained the talent ${translateUiText(talent)}.`],
  [/^买入【(.*?)】$/,(item)=>`Bought ${translateUiText(item)}`],
  [/^(.*?)开始冒险。$/,(name)=>`${name} began the journey.`],
  [/^(.*?)休息调息。$/,(name)=>`${translateUiText(name)} rests and recovers.`],
  [/^进入战斗：(.*?)。$/,(name)=>`Battle begins: ${translateUiText(name)}.`],
  [/^(.*?)\s*·\s*战场$/,(name)=>`${translateUiText(name)} · Battlefield`],
  [/^战斗时间\s*(.*)$/,(time)=>`Battle time ${time}`],
  [/^施展距离\s*(\d+)\s*格\s*·\s*作用范围\s*(\d+)$/,(range,area)=>`Range ${range} tiles · Area ${area}`],
  [/^师父：\s*(.*)$/,(masters)=>`Tutors: ${masters.split('、').map(translateUiText).join(', ')}`],
  [/^武学：\s*(.*)$/,(skills)=>`Techniques: ${skills.split('、').map(translateUiText).join(', ')}`],
  [/^(.*?)的故事，从你的名字开始。$/,(title)=>`${title}: every journey begins with a name.`],
  [/^入江湖\s*·\s*(\d+)\s*\/\s*(\d+)$/,(a,b)=>`Your background · ${a}/${b}`],
  [/^(.*?)，以怎样的面貌踏入江湖？$/,(name)=>`${name}, choose your appearance.`],
  [/^随机\s*\+(\d+)$/,(n)=>`Random +${n}`],
  [/^(.+?)([+−-][\d.]+%?)$/,(stat,amount)=>`${translateUiText(stat.trim())} ${amount}`],
  [/^第\s*(\d+)\s*次生成。重摇重新分配随机属性，保留问答、头像和由问答决定的奖励。$/,(n)=>`Roll ${n}. Reroll random attributes while keeping your answers, portrait and background rewards.`],
  [/^天赋[：:]\s*(.*)$/,(names)=>`Talents: ${translateUiText(names)}`],
  [/^心法[：:]\s*(.*)$/,(names)=>`Masteries: ${translateUiText(names)}`],
  [/^获得「(.*?)」×(\d+)；获得「(.*?)」×(\d+)，另有(\d+)条，见通知。$/,(a,n,b,m,k)=>`Received ${translateUiText(a)} ×${n}; ${translateUiText(b)} ×${m}. ${k} more in Notifications.`],
  [/^(.*?)的头像$/,(name)=>`${name}'s portrait`],
  [/^历练\s*·\s*第\s*(\d+)\s*级$/,(n)=>`Level ${n}`],
  [/^第\s*(\d+)\s*级$/,(n)=>`Level ${n}`],
  [/^(.+?)\s+(\d+)\s*级$/,(name,n)=>`${translateUiText(name)} · Level ${n}`],
  [/^(?:旅程|Journey)第\s*(\d+)\s*天\s*·\s*(.*?)时\s*·\s*(.*)$/,(day,time,sect)=>`Day ${day} · ${translateUiText(time)} · ${translateUiText(sect)}`],
  [/^当前章节\s*·\s*(\d+)\s*\/\s*(\d+)$/,(a,b)=>`Chapter goals · ${a}/${b}`],
  [/^当前任务\s*·\s*(.*)$/,(task)=>`Current task · ${translateUiText(task)}`],
  [/^前往：\s*(.*)$/,(place)=>`Go to: ${translateUiText(place)}`],
  [/^同行队伍\s*·\s*(\d+)\s*人$/,(n)=>`Party · ${n}`],
  [/^路程与交互\s*(\d+)\s*时辰$/,(n)=>`Travel and interaction: ${n} time slots`],
  [/^剩余\s*(\d+)\s*件$/,(n)=>`${n} remaining`],
  [/^持有\s*(\d+)\s*件\s*·\s*每件\s*(.*)$/,(n,price)=>`Owned: ${n} · Each: ${translateUiText(price)}`],
  [/^消耗银两：\s*(.*)$/,(n)=>`Silver required: ${n}`],
  [/^消耗物品：\s*(.*)$/,(name)=>`Item required: ${translateUiText(name)}`],
  [/^获得物品[：:]\s*(.*)$/,(name)=>`Received: ${translateUiText(name)}`],
  [/^获得\s*(\d+)\s*银两[。]?$/,(n)=>`Received ${n} silver.`],
];
// Only short UI terms are composable. Narrative paragraphs are never rebuilt
// out of word replacements; they must have an authored content translation.
const terms=['银两','元宝','气血','内力','伤害','命中','暴击','防御','攻击','剑法','刀法','拳掌','奇门','身法','根骨','悟性','福缘','定力','臂力','武学','等级','经验','回合','冷却','怒气','未装备','修炼经验','已学招式','可分配属性点','已学武艺','修炼秘籍','未选择','主运','数量','当前章节','随身','无门派','自由冒险者']
  .filter(key=>dictionary[key]).sort((a,b)=>b.length-a.length);

export function translateUiText(value:string):string {
  if(activeLanguage==='zh-CN'){
    let result=contentLabels[value.trim()]??value;
    result=result.replace(/([「【])([^」】]+)([」】])/g,(_,left,name,right)=>left+(contentLabels[name]??name)+right);
    result=result.replace(/^([^：]+)：/,(_,name)=>(contentLabels[name]??name)+'：');
    result=result.replace(/^(.*?)(休息调息。|施展「.*|受到 .+|加入队伍.*|离开队伍.*|从\d+级.*)$/,(_,name,action)=>(contentLabels[name]??name)+action);
    for(const [source,target] of contentTerms){
      const escaped=source.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
      result=result.replace(new RegExp(`(?<![\\u3400-\\u9fff])${escaped}(?![\\u3400-\\u9fff])`,'g'),()=>target);
    }
    for(const [source,target] of Object.entries(fantasyChinese))result=result.split(source).join(target);
    return result;
  }
  const text=value.trim();
  if(!cjk.test(text))return value;
  let translated=dictionary[text]??contentLabels[text];
  if(translated===undefined&&text.includes('，')){
    const parts=text.split('，');
    if(parts.every(part=>/^[^，]+[+−-][\d.]+%?$/.test(part.trim())))translated=parts.map(part=>translateUiText(part.trim())).join('; ');
  }
  if(translated===undefined){
    for(const [pattern,format] of patterns){
      const match=text.match(pattern);
      if(match){translated=format(...match.slice(1));break;}
    }
  }
  if(translated===undefined){
    const colon=text.indexOf('：');
    const heading=colon>=0?text.slice(0,colon):'';
    const label=dictionary[heading]??contentLabels[heading];
    if(label)translated=`${label}: ${translateUiText(text.slice(colon+1))}`;
    else if(text.includes('，')){
      const parts=text.split('，');
      if(parts.every(part=>/^(人物|物品编号|武功|地点|数量|编排|位置|属性|选项|地图|姓名|[a-zA-Z][a-zA-Z0-9]*) /.test(part)))translated=parts.map(translateUiText).join(', ');
    }
    if(translated===undefined){
      const detail=text.match(/^(人物|物品编号|武功|地点|数量|编排|位置|属性|选项|地图|姓名) (.*)$/);
      if(detail)translated=`${dictionary[detail[1]]??detail[1]} ${translateUiText(detail[2])}`;
    }
  }
  if(translated===undefined){
    translated=text;
    for(const [source,target] of contentTerms){
      const escaped=source.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
      translated=translated.replace(new RegExp(`(?<![\\u3400-\\u9fff])${escaped}(?![\\u3400-\\u9fff])`,'g'),()=>target);
    }
    for(const term of terms){
      translated=translated.replace(new RegExp(`(?<![\\u3400-\\u9fff])${term}(?![\\u3400-\\u9fff])`,'g'),()=>dictionary[term]);
    }
  }
  return value.slice(0,value.indexOf(text))+translated+value.slice(value.indexOf(text)+text.length);
}

export function startUiLocale(appId:string):void {
  const language=new URL(location.href).searchParams.get('lang')||'en';
  if(appId!=='jyxr-fantasy-worlds')return;
  activeLanguage=language==='zh-CN'?'zh-CN':'en';
  const excluded='script,style,code,pre,textarea,[data-testid="dialogue-text"],.story-choices,.hero-heading h2,.dialogue-content h2';
  const attributes=['aria-label','title','placeholder','alt'];
  let observer:MutationObserver;
  function translate(){
    observer?.disconnect();
    // These are appearance choices, not a promise that the player becomes
    // the source portrait's named character. Keep the asset IDs untouched.
    document.querySelectorAll<HTMLElement>('.creation-portraits button').forEach((button,index)=>{
      button.setAttribute('aria-label',activeLanguage==='en'?`Choose portrait ${index+1}`:`选择外貌 ${index+1}`);
      const label=button.querySelector('span');if(label)label.textContent=activeLanguage==='en'?`Portrait ${index+1}`:`外貌 ${index+1}`;
    });
    const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
    while(walker.nextNode()){
      const node=walker.currentNode as Text;
      if(!node.parentElement?.closest(excluded)){
        const next=translateUiText(node.data);
        if(next!==node.data)node.data=next;
      }
    }
    for(const element of document.body.querySelectorAll<HTMLElement>('[aria-label],[title],[placeholder],[alt]')){
      if(element.closest(excluded))continue;
      for(const attribute of attributes){
        const value=element.getAttribute(attribute);
        if(value){const next=translateUiText(value);if(next!==value)element.setAttribute(attribute,next);}
      }
    }
    observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:attributes});
  }
  observer=new MutationObserver(translate);translate();
}
