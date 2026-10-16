export interface Skill { id: string; name: string; level: number; mpCost: number; available?: boolean; reason?: string | null; description?: string; exp?: number; nextExp?: number; maxLevel?: number; active?: boolean; equipped?: boolean; kind?: string; castSize?: number; impactSize?: number; }
export interface EquipmentSlot { slot: string; slotName: string; item: {id: string; name: string; instanceId: string; description: string; affixes?: string[]; icon?: string | null} | null; }
export interface Cultivation { entryNumber: number; itemId: string; itemName: string; skillId: string; skillName: string; kind: string; level: number; exp: number; nextExp: number; maxLevel: number; }
export interface InventoryItem { icon?: string | null; id: string; entryNumber: number; name: string; count: number; quantity: number; description: string; affixes?: string[]; battleTargets?: {id: string; name: string; hp: number; maxHp: number; canUse: boolean; reason: string}[] | null; kind: string; itemType: string; slot: string | null; canEquip: boolean; canUse: boolean; canCultivate: boolean; reason: string; }
export interface BattleEvent { sequence: number; kind: string; unitId: string; amount: number | null; critical: boolean; sourceUnitId: string | null; skillId: string | null; skillName: string | null; text: string | null; }
export interface CharacterAnimation {id: string; texture: string; atlas: string; poster: string; baseHeight: number; clips: Record<string, {frames: string[]; frameRate: number}>;}
export interface Unit { animation?: CharacterAnimation | null; facing?: string; id: string; definitionId?: string; sprite?: string | null; portrait?: string | null; name: string; team: number; x: number; y: number; hp: number; maxHp: number; mp: number; maxMp: number; alive: boolean; }
export interface PackMedia { titleBackground?: string; worldBackground?: string; battleBackground?: string; defaultFriendly?: string; defaultEnemy?: string; characters?: Record<string, string>; portraits?: Record<string, string>; maps?: Record<string, string>; battles?: Record<string, string>; }
export interface Objective { id: string; title: string; description?: string | null; kind: 'story' | 'party' | 'equipment' | 'cultivation' | 'purchase' | 'battle' | 'save'; target?: string; completed: boolean; }
export interface ContentPack { id: string; title: string; artSource?: {kind: string; versionLabel?: string}; subtitle?: string; chapterTitle?: string; description?: string; defaultName?: string; currencyName?: string; currencyUnit?: string; terms?: Record<string, string>; heroDefinitionId: string; initialMapId: string; initialStoryId?: string; trainingStoryId?: string; trainingMapId?: string; completionStoryId?: string; media?: PackMedia; objectives?: Omit<Objective, 'completed'>[]; }
export interface PartyMember { id: string; definitionId: string; name: string; level: number; hp: number; maxHp: number; mp: number; maxMp: number; skills: Skill[]; equipment: EquipmentSlot[]; isHero: boolean; sprite?: string | null; portrait?: string | null; }
export interface Shop { id: string; name: string; products: { id: string; itemId: string | null; name: string; description: string; icon?: string | null; price: number | null; premiumPrice: number | null; remaining: number | null; purchased: number; canBuy: boolean }[]; sellable: { entryNumber: number; id: string; name: string; icon?: string | null; quantity: number; price: number }[]; }
export interface Battle {
  name: string; width: number; height: number; activeUnitId: string | null; outcome: string | null;
  id?: string; background?: string | null;
  units: Unit[]; skills: Skill[]; reachable: {x: number; y: number}[]; logs: string[];
  targets?: {skillId: string; x: number; y: number; targetId: string | null}[];
  events?: BattleEvent[];
  playerCanAct?: boolean;
  action?: {unitId: string; team: number; mainActionCommitted: boolean; canMove: boolean; canRest: boolean; canAttack: boolean} | null;
}
export interface CreationState {
  round?: number;
  name: string; difficulty: string; step: 'question' | 'portrait' | 'preview'; questionIndex: number; total: number; answers: number[]; roll: number;
  question: {title: string; options: {text: string}[]} | null;
  portraits: {id: string; name: string; image: string}[];
  preview: {portrait: string; sprite: string; silver: number; randomBonus: Record<string, number>; attributes: {id: string; label: string; value: number}[]; talents: {id: string; name: string}[]; internalSkills: {id: string; name: string; level: number}[]; items: {id: string; name: string; quantity: number; icon?: string}[]} | null;
}
export interface GameState {
  achievements?: {id: string; name: string; description: string}[];
  ending?: {kind: 'restart' | 'next' | 'complete' | 'gameover' | 'title'; completedRound: number; targetRound: number | null} | null;
  profile?: {completionCount: number; highestRound: number; deathCount: number} | null;
  miniGame?: MiniGameConfig | null;
  combatantSelection?: {battleId: string; title: string; capacity: number; candidates: {id: string; name: string; level: number; portrait?: string; required: boolean; forbidden: boolean}[]} | null;
  rename?: {defaultName: string} | null;
  gameOver?: boolean;
  managedCharacter?: GameState['hero'] | null;
  roster?: (PartyMember & {placement: 'member' | 'follower' | 'reserve'; unspentStatPoints: number; canBench: boolean; canRejoin: boolean})[];
  chest?: {capacity: number; stored: number; canManage: boolean; entries: ChestItem[]; inventory: ChestItem[]} | null;
  creation?: CreationState | null;
  sceneBackground?: string | null;
  phase: 'title' | 'world' | 'battle' | 'dialogue' | 'choice' | 'shop' | 'sect' | 'combatants' | 'rename' | 'gameover' | 'chest' | 'minigame' | 'ending';
  sects?: {id: string; name: string; description: string; focus: string; masters: string[]; skills: string[]; traits: string[]; available: boolean}[];
  tutorial?: {id: string; description: string; locations: string[]} | null;
  adventure?: {round?: number; difficulty?: string; sect?: string | null; morality: number; days: number; timeSlot: string};
  pack: ContentPack;
  party: PartyMember[];
  objectives: Objective[];
  shop: Shop | null;
  hero: {id: string; definitionId?: string; sprite?: string | null; portrait?: string | null; name: string; level: number; unspentStatPoints?: number; hp: number; maxHp: number; mp: number; maxMp: number; skills: Skill[]; experience?: number; nextLevelExperience?: number; attributes?: {id: string; label: string; value: number; baseValue: number; canAllocate?: boolean}[]; talents?: {id: string; name: string; description: string}[]; externalSkills?: Skill[]; internalSkills?: Skill[]; equipment?: EquipmentSlot[]; cultivation?: Cultivation | null; equippedInternalSkillId?: string | null; canManage?: boolean};
  silver: number;
  yuanbao?: number;
  map: {id: string; name: string; description: string; kind?: string; background?: string | null; locations: {id: string; name: string; description: string; action?: string | null; image?: string | null; timeSlots?: number}[]};
  battle: Battle | null;
  dialogue: {speaker: string; text: string; portrait?: string | null} | null;
  choices: (string | {id?: string; text?: string; label?: string; index?: number})[] | null;
  inventory?: InventoryItem[];
  logs: string[];
}
export interface Result { ok: boolean; error?: string; state: GameState; }
export interface ChestItem {id: string; entryNumber: number; name: string; icon?: string | null; quantity: number; canDeposit: boolean;}
interface Exports {
  MiniGameInput: (input: string) => string | Promise<string>;
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
export async function loadRuntime(progress: (message: string) => void, packId = 'jyx'): Promise<Result> {
  progress('正在载入游戏规则……');
  const runtime = await window.loadJyxrRuntime();
  const config = runtime.getConfig();
  const assemblies = await runtime.getAssemblyExports(config.mainAssemblyName);
  api = assemblies.Game.Web.Runtime.BrowserBridge;
  progress('正在装载人物、技能与剧情……');
  return initializePack(packId);
}
export async function initializePack(packId: string): Promise<Result> {
  return decode(await api.Initialize(await readPack(packId)));
}
export async function dispatch(command: Record<string, unknown>): Promise<Result> {
  return decode(await api.Dispatch(JSON.stringify(command)));
}
export async function exportSave(): Promise<string> { return await api.ExportSave(); }
export async function importSave(data: string): Promise<Result> { return decode(await api.ImportSave(data)); }
export interface MiniGameConfig {id: string; title: string; heroPortrait?: string; portraits: Record<string, string>; itemIcons: Record<string, string>;}
export interface MiniGameFrame {
  id: string; width: number; height: number; targetSize: number; elapsed: number; remaining: number; score: number;
  started: boolean; finished: boolean; paused: boolean; hero: {x: number; y: number} | null;
  targets: {id: string; x: number; y: number; visible: boolean; points: number; itemId: string | null; generation: number}[];
}
export async function miniGameInput(input: Record<string, unknown>): Promise<MiniGameFrame> {
  const result = JSON.parse(await api.MiniGameInput(JSON.stringify(input)));
  if (!result.ok) throw new Error(result.error || '修炼暂未完成。');
  return result.frame;
}
import {readPack} from './content';
