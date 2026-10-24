/** UI copy only. Content names continue to come from the active display pack. */
export const copy = (en:string,zh:string) => document.documentElement.lang==='zh-CN'?zh:en;
export const modernWorlds = (state:{pack:{chapterGuide?:unknown}}) => !!state.pack.chapterGuide && document.documentElement.dataset.interface!=='classic';
