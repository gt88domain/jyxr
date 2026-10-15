export interface Skill { id: string; name: string; level: number; mpCost: number; available?: boolean; reason?: string; }
export interface Unit { id: string; name: string; team: number; x: number; y: number; hp: number; maxHp: number; mp: number; maxMp: number; alive: boolean; }
export interface Battle {
  name: string; width: number; height: number; activeUnitId: string | null; outcome: string | null;
  units: Unit[]; skills: Skill[]; reachable: {x: number; y: number}[]; logs: string[];
}
export interface GameState {
  phase: 'title' | 'world' | 'battle' | 'dialogue' | 'choice';
  hero: {id: string; name: string; level: number; hp: number; maxHp: number; mp: number; maxMp: number; skills: Skill[]};
  silver: number;
  map: {id: string; name: string; description: string; locations: {id: string; name: string; description: string}[]};
  battle: Battle | null;
  dialogue: {speaker: string; text: string} | null;
  choices: (string | {id?: string; text?: string; label?: string; index?: number})[] | null;
  inventory?: {id: string; name: string; count: number; description?: string}[];
  logs: string[];
}
export interface Result { ok: boolean; error?: string; state: GameState; }
interface Exports {
  Initialize: (content: string) => string | Promise<string>;
  Dispatch: (command: string) => string | Promise<string>;
  ExportSave: () => string | Promise<string>;
  ImportSave: (save: string) => string | Promise<string>;
}
let api: Exports;
declare global { interface Window { loadJyxrRuntime: () => Promise<{getConfig: () => {mainAssemblyName: string}; getAssemblyExports: (name: string) => Promise<any>}>; } }
function decode(value: string): Result {
  const result = JSON.parse(value) as Result;
  const map = result.state?.map;
  if (map) {
    map.name ||= map.id;
    map.description ||= '';
    map.locations = (map.locations ?? []).map(location => ({...location, name: location.name || location.id, description: location.description || ''}));
  }
  return result;
}
export async function loadRuntime(progress: (message: string) => void): Promise<Result> {
  progress('正在载入江湖规则……');
  const runtime = await window.loadJyxrRuntime();
  const config = runtime.getConfig();
  const assemblies = await runtime.getAssemblyExports(config.mainAssemblyName);
  api = assemblies.Game.Web.Runtime.BrowserBridge;
  progress('正在装载人物、武学与剧情……');
  const response = await fetch(`${import.meta.env.BASE_URL}data/content-package.json`);
  if (!response.ok) throw new Error(`Content request failed: ${response.status}`);
  return decode(await api.Initialize(await response.text()));
}
export async function dispatch(command: Record<string, unknown>): Promise<Result> {
  return decode(await api.Dispatch(JSON.stringify(command)));
}
export async function exportSave(): Promise<string> { return await api.ExportSave(); }
export async function importSave(data: string): Promise<Result> { return decode(await api.ImportSave(data)); }
