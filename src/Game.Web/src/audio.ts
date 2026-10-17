import type {GameState, ContentPack} from './bridge';
import type {Settings} from './settings';
import {assetUrl} from './content';

export interface AudioBank {resources: Record<string, string>; titleMusic: string; battleMusic: string; eventSounds: Record<string, string>;}
export class GameAudio {
  private unlocked = false;
  private lastState?: GameState;
  private music?: HTMLAudioElement;
  private track = '';
  private pack = '';
  private sequence = 0;
  private effects = new Set<HTMLAudioElement>();
  constructor(private settings: Settings) {
    const unlock = () => {this.unlocked = true; if (this.lastState) this.sync(this.lastState);};
    document.addEventListener('pointerdown', unlock, {once: true});
    document.addEventListener('keydown', unlock, {once: true});
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {this.music?.pause(); for (const effect of this.effects) effect.pause();}
      else if (this.lastState) this.sync(this.lastState);
    });
  }
  sync(state: GameState) {
    this.lastState = state;
    const bank = (state.pack as ContentPack & {audio?: AudioBank}).audio;
    if (this.pack !== state.pack.id) {
      this.pack = state.pack.id; this.sequence = 0; this.stopMusic();
      for (const effect of this.effects) effect.pause(); this.effects.clear();
    }
    const battle = state.phase === 'battle' ? state.battle : undefined;
    const musicId = state.phase === 'title' ? bank?.titleMusic : battle
      ? (battle as typeof battle & {music?: string | null}).music || bank?.battleMusic
      : (state.phase === 'dialogue' || state.phase === 'choice' ? state.musicId : undefined) || (state.map as typeof state.map & {music?: string | null})?.music;
    const wanted = musicId && bank?.resources[musicId] || '';
    if (wanted !== this.track) {this.stopMusic(); this.track = wanted;}
    if (this.unlocked && !document.hidden && this.settings.musicVolume > 0 && wanted) {
      if (!this.music) {this.music = new Audio(assetUrl(wanted)); this.music.loop = true; this.music.preload = 'none';}
      this.music.volume = this.settings.musicVolume;
      if (this.music.paused) void this.music.play().catch(() => { /* gesture/temporary network: retry on the next interaction */ });
    } else this.music?.pause();
    for (const effect of this.effects) effect.volume = this.settings.effectsVolume;
    for (const event of battle?.events || []) {
      if (event.sequence <= this.sequence) continue;
      this.sequence = event.sequence;
      const key = event.audioId || bank?.eventSounds[event.kind];
      if (key && bank?.resources[key]) this.playEffect(bank.resources[key]);
    }
  }
  private stopMusic() {if (this.music) {this.music.pause(); this.music.removeAttribute('src'); this.music.load();} this.music = undefined; this.track = '';}
  private playEffect(path: string) {
    if (!this.unlocked || document.hidden || this.settings.effectsVolume <= 0) return;
    if (this.effects.size >= 6) {const oldest = this.effects.values().next().value!; oldest.pause(); this.effects.delete(oldest);}
    const effect = new Audio(assetUrl(path)); effect.volume = this.settings.effectsVolume;
    const release = () => this.effects.delete(effect);
    effect.addEventListener('ended', release, {once: true}); effect.addEventListener('error', release, {once: true});
    this.effects.add(effect); void effect.play().catch(release);
  }
}
