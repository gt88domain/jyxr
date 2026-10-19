export interface Skill { id: string; name: string; level: number; mpCost: number; rageCost?: number; cooldown?: number; remainingCooldown?: number; available?: boolean; reason?: string | null; description?: string; exp?: number; nextExp?: number; maxLevel?: number; active?: boolean; equipped?: boolean; kind?: string; castSize?: number; impactSize?: number; }
export interface EquipmentSlot { slot: string; slotName: string; item: {id: string; name: string; instanceId: string; description: string; affixes?: string[]; icon?: string | null} | null; }
export interface Cultivation { entryNumber: number; itemId: string; itemName: string; skillId: string; skillName: string; kind: string; level: number; exp: number; nextExp: number; maxLevel: number; }
export interface ItemRequirement {label: string; current: string; required: string; met: boolean; failureReason: string;}
export interface EquipmentPreview {characterId: string; characterName: string; entryNumber: number; itemId: string; itemName: string; slot: string; replacedItemName: string | null; canEquip: boolean; reason: string; attributes: {id: string; label: string; before: number; after: number}[]; addedTalents: {id: string; name: string}[]; removedTalents: {id: string; name: string}[];}
export interface InventoryItem { icon?: string | null; id: string; entryNumber: number; name: string; count: number; quantity: number; description: string; affixes?: string[]; requirements?: ItemRequirement[]; training?: {skillId: string; copies: number; assignedTo: {id: string; name: string}[]} | null; battleTargets?: {id: string; name: string; hp: number; maxHp: number; canUse: boolean; reason: string}[] | null; kind: string; itemType: string; slot: string | null; canEquip: boolean; canUse: boolean; canCultivate: boolean; reason: string; }
export interface BattleEffectVisual {style: 'slash' | 'strike' | 'flame' | 'ring' | 'vortex' | 'burst' | 'petal' | 'orb'; color: number; duration: number;}
export interface BattleEvent { sequence: number; kind: string; unitId: string; amount: number | null; critical: boolean; sourceUnitId: string | null; skillId: string | null; skillName: string | null; text: string | null; audioId?: string | null; animationId?: string | null; isLegend?: boolean; visual?: BattleEffectVisual | null; targetPosition?: {x: number; y: number} | null; impactedPositions?: {x: number; y: number}[] | null; }
export interface CharacterAnimation {id: string; texture: string; atlas: string; poster: string; baseHeight: number; clips: Record<string, {frames: string[]; frameRate: number}>;}
export interface Unit { animation?: CharacterAnimation | null; facing?: string; id: string; definitionId?: string; sprite?: string | null; portrait?: string | null; name: string; team: number; x: number; y: number; hp: number; maxHp: number; mp: number; maxMp: number; rage?: number; alive: boolean; buffs?: {id: string; name: string; description: string; level: number; remainingTurns: number; isDebuff: boolean}[]; }
export interface PackMedia { titleBackground?: string; worldBackground?: string; battleBackground?: string; defaultFriendly?: string; defaultEnemy?: string; characters?: Record<string, string>; portraits?: Record<string, string>; maps?: Record<string, string>; battles?: Record<string, string>; }
export interface Objective { id: string; title: string; description?: string | null; kind: 'story' | 'party' | 'equipment' | 'cultivation' | 'purchase' | 'battle' | 'save'; target?: string; completed: boolean; }
export interface ContentPack { id: string; title: string; artSource?: {kind: string; versionLabel?: string}; subtitle?: string; chapterTitle?: string; description?: string; defaultName?: string; currencyName?: string; currencyUnit?: string; terms?: Record<string, string>; statLabels?: Record<string,string>; contentVersion?: string; heroDefinitionId: string; initialMapId: string; initialStoryId?: string; trainingStoryId?: string; trainingMapId?: string; completionStoryId?: string; media?: PackMedia; objectives?: Omit<Objective, 'completed'>[]; }
export interface PartyMember { id: string; definitionId: string; name: string; level: number; hp: number; maxHp: number; mp: number; maxMp: number; skills: Skill[]; equipment: EquipmentSlot[]; isHero: boolean; sprite?: string | null; portrait?: string | null; }
export interface Shop { id: string; name: string; products: { id: string; itemId: string | null; name: string; description: string; icon?: string | null; price: number | null; premiumPrice: number | null; remaining: number | null; purchased: number; canBuy: boolean }[]; sellable: { entryNumber: number; id: string; name: string; icon?: string | null; quantity: number; price: number }[]; }
export interface Battle {
  name: string; width: number; height: number; activeUnitId: string | null; outcome: string | null;
  tick: number; tickLimit?: number | null; timedOut?: boolean;
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
  startingCompanionCandidates?: {id: string; name: string; weight: number}[];
  preview: {portrait: string; sprite: string; silver: number; randomBonus: Record<string, number>; attributes: {id: string; label: string; value: number}[]; talents: {id: string; name: string}[]; internalSkills: {id: string; name: string; level: number}[]; items: {id: string; name: string; quantity: number; icon?: string}[]} | null;
}
export interface GameState {
  journeyId?:string;
  activity?:import('./activity').ActivityEntry[];
  musicId?: string | null;
  companionJournal?: {completedRecruitmentStories: string[]; conditions?: Record<string, boolean | null>};
  milestones?: {id: string; title: string; requirements: string[]; completed: boolean}[];
  journal?: {id: number; date: string; text: string}[] | null;
  achievements?: {id: string; name: string; description: string}[];
  ending?: {kind: 'restart' | 'next' | 'complete' | 'gameover' | 'title'; completedRound: number; targetRound: number | null} | null;
  profile?: {completionCount: number; highestRound: number; deathCount: number} | null;
  miniGame?: MiniGameConfig | null;
  combatantSelection?: {battleId: string; title: string; capacity: number; candidates: {id: string; name: string; level: number; portrait?: string; required: boolean; forbidden: boolean}[]} | null;
  rename?: {defaultName: string} | null;
  gameOver?: boolean;
  managedCharacter?: GameState['hero'] | null;
  roster?: (PartyMember & {placement: 'member' | 'follower' | 'reserve'; formationStatus: 'active' | 'reserve' | 'following' | 'story-away'; unspentStatPoints: number; canBench: boolean; canRejoin: boolean; cultivation: Cultivation | null; runningInternalName: string | null})[];
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
export interface Result { protocolVersion?:number; ok: boolean; error?: string; warning?: string; state: GameState; }
export interface ChestItem {id: string; entryNumber: number; name: string; icon?: string | null; quantity: number; canDeposit: boolean;}
interface Exports {
  MiniGameInput: (input: string) => string | Promise<string>;
  Initialize: (content: string) => string | Promise<string>;
  Dispatch: (command: string) => string | Promise<string>;
  ExportSave: () => string | Promise<string>;
  ImportSave: (save: string) => string | Promise<string>;
  ImportStoredSave: (save: string) => string | Promise<string>;
  ExportProfile: () => string | Promise<string>;
  InitializeProfile: (profile: string) => string | Promise<string>;
  InspectCompanionConditions: () => string | Promise<string>;
  InspectEquipment: (request: string) => string | Promise<string>;
}
let api: Exports;
let sessionEpoch=0;
function current(epoch:number){if(epoch!==sessionEpoch)throw new Error('会话已切换，旧操作结果已忽略。');}
export async function inspectEquipment(characterId: string, entryNumber: number): Promise<EquipmentPreview> {
  const epoch=sessionEpoch;
  const result = JSON.parse(await api.InspectEquipment(JSON.stringify({characterId, entryNumber}))) as {ok: boolean; error?: string; preview?: EquipmentPreview};
  current(epoch);
  if (!result.ok || !result.preview) throw new Error(result.error || '装备对比暂不可用。');
  return result.preview;
}
export async function inspectCompanionConditions(): Promise<Record<string, boolean | null>> {
  const epoch=sessionEpoch;
  const result=JSON.parse(await api.InspectCompanionConditions());current(epoch);return result;
}
const profileCache = new Map<string, string>();
const blockedProfiles = new Set<string>();
declare global { interface Window { loadJyxrRuntime: () => Promise<{getConfig: () => {mainAssemblyName: string}; getAssemblyExports: (name: string) => Promise<any>}>; } }
function decode(value: string): Result {
  const result = JSON.parse(value) as Result;
  if(!result||typeof result.ok!=='boolean'||!result.state||typeof result.state.pack?.id!=='string'||typeof result.state.phase!=='string'||(result.state.phase!=='title'&&!Array.isArray(result.state.map?.locations)))throw new Error('游戏返回的数据结构无效。');
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
  const [runtime, content] = await Promise.all([window.loadJyxrRuntime(), readPack(packId)]);
  const config = runtime.getConfig();
  const assemblies = await runtime.getAssemblyExports(config.mainAssemblyName);
  api = assemblies.Game.Web.Runtime.BrowserBridge;
  progress('正在装载人物、技能与剧情……');
  return initializePack(packId, content);
}
export async function initializePack(packId: string, prepared?: string): Promise<Result> {
  const epoch=++sessionEpoch;
  const result=await initializePackCore(packId,prepared,epoch);current(epoch);return result;
}
async function initializePackCore(packId:string,prepared:string|undefined,epoch:number):Promise<Result>{
  const content=prepared??await readPack(packId);current(epoch);
  const result = decode(await api.Initialize(content));current(epoch);
  if (!result.ok) return result;
  try {
    const stored = await readProfile(packId);
    current(epoch);
    profileCache.delete(packId); blockedProfiles.delete(packId);
    if (stored) {
      const loaded = decode(await api.InitializeProfile(stored));
      current(epoch);
      if (!loaded.ok) {
        blockedProfiles.add(packId);
        result.warning = '设备档案未能读取，原记录已保留，本次不会自动覆盖；可导入导出的完整存档恢复档案。';
      } else {profileCache.set(packId, stored); blockedProfiles.delete(packId); return loaded;}
    } else {
      // Before independent profiles existed, the only copy lived in the journey
      // slot. Migrate it before allowing a new character, not just on Continue.
      const legacy = await readSlot(packId);
      current(epoch);
      if (legacy) {
        const backup = JSON.parse(legacy.data);
        if (backup.browserSaveVersion === 1 || backup.browserSaveVersion === 2) {
          const owner = backup.browserSaveVersion === 2 ? backup.packId : 'jyx';
          if (owner !== packId || !backup.profile) throw new Error('Invalid legacy profile owner');
          const migrated = decode(await api.InitializeProfile(JSON.stringify({schemaVersion: 1, packId, profile: backup.profile})));
          current(epoch);
          if (!migrated.ok) {
            blockedProfiles.add(packId);
            result.warning = '旧旅程档案未能迁移，原存档已保留且不会被自动覆盖；请导入有效完整备份恢复。';
            return result;
          }
          try {
            const normalized = await api.ExportProfile();
            current(epoch);
            await writeProfile(packId, normalized); current(epoch);profileCache.set(packId, normalized);
          } catch {current(epoch);migrated.warning = '旧旅程档案已载入，但设备暂不能写入；请保留完整备份。';}
          return migrated;
        }
      }
    }
  } catch {current(epoch);blockedProfiles.add(packId); result.warning = '此浏览器暂不能读取设备档案，原记录不会被覆盖；请保留导出的完整存档。';}
  return result;
}
export async function dispatch(command: GameCommand): Promise<Result> {
  assertCommand(command);const epoch=sessionEpoch;
  const result=decode(await api.Dispatch(JSON.stringify(command)));current(epoch);
  return persistProfile(result,epoch);
}
async function persistProfile(result: Result,epoch=sessionEpoch): Promise<Result> {
  current(epoch);
  if (!result.ok || blockedProfiles.has(result.state.pack.id)) return result;
  try {
    const profile = await api.ExportProfile();
    current(epoch);
    if (JSON.parse(profile) === null) return result;
    if (profileCache.get(result.state.pack.id) !== profile) {
      await writeProfile(result.state.pack.id, profile); current(epoch);profileCache.set(result.state.pack.id, profile);
    }
  } catch {current(epoch);result.warning = '行动已完成，但设备档案暂不能写入；请导出完整存档备份。';}
  return result;
}
export async function exportSave(): Promise<string> {
  const epoch=sessionEpoch;
  const data = await api.ExportSave();
  current(epoch);
  if (!JSON.parse(data).error) await persistProfile(decode(await api.Dispatch('{"type":"state"}')),epoch);
  return data;
}
export async function importSave(data: string, stored = false): Promise<Result> {
  const epoch=++sessionEpoch;
  const result = decode(await (stored ? api.ImportStoredSave(data) : api.ImportSave(data)));
  current(epoch);
  if (result.ok && !stored) {blockedProfiles.delete(result.state.pack.id); profileCache.delete(result.state.pack.id);}
  return persistProfile(result,epoch);
}
export interface MiniGameConfig {id: string; title: string; heroPortrait?: string; portraits: Record<string, string>; itemIcons: Record<string, string>; background?: string | null; pointIcons?: Record<string, string | null>;}
export interface MiniGameFrame {
  id: string; width: number; height: number; targetSize: number; elapsed: number; remaining: number; score: number;
  started: boolean; finished: boolean; paused: boolean; hero: {x: number; y: number} | null;
  round?: number; totalRounds?: number;
  targets: {id: string; x: number; y: number; visible: boolean; points: number; itemId: string | null; generation: number; age?: number | null; rating?: string | null}[];
}
export async function miniGameInput(input: Record<string, unknown>): Promise<MiniGameFrame> {
  const epoch=sessionEpoch;
  const result = JSON.parse(await api.MiniGameInput(JSON.stringify(input)));
  current(epoch);
  if (!result.ok) throw new Error(result.error || '修炼暂未完成。');
  return result.frame;
}
import {readPack} from './content';
import {assertCommand} from './command-contract';
import type {GameCommand} from './command-contract';
import {readProfile, writeProfile, readSlot} from './storage';
