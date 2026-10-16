export interface Settings {
  battleMode: 'manual' | 'auto';
  battleSpeed: 1 | 2 | 4;
  showGrid: boolean;
  showDamage: boolean;
  battleLighting: boolean;
  reducedMotion: boolean;
  largeText: boolean;
}

const key = 'jyxr.preferences.v1';
const defaults: Settings = {
  battleMode: 'manual', battleSpeed: 1, showGrid: true, showDamage: true,
  battleLighting: true, reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
  largeText: false,
};

function normalize(value: Partial<Settings>): Settings {
  return {
    battleMode: value.battleMode === 'auto' ? 'auto' : 'manual',
    battleSpeed: value.battleSpeed === 2 || value.battleSpeed === 4 ? value.battleSpeed : 1,
    showGrid: typeof value.showGrid === 'boolean' ? value.showGrid : defaults.showGrid,
    showDamage: typeof value.showDamage === 'boolean' ? value.showDamage : defaults.showDamage,
    battleLighting: typeof value.battleLighting === 'boolean' ? value.battleLighting : defaults.battleLighting,
    reducedMotion: typeof value.reducedMotion === 'boolean' ? value.reducedMotion : defaults.reducedMotion,
    largeText: typeof value.largeText === 'boolean' ? value.largeText : defaults.largeText,
  };
}

export function readSettings(): Settings {
  try {return normalize(JSON.parse(localStorage.getItem(key) || '{}'));}
  catch {return {...defaults};}
}

export function writeSettings(value: Settings): boolean {
  applySettings(value);
  try {localStorage.setItem(key, JSON.stringify(value)); return true;}
  catch {return false;}
}

export function applySettings(value: Settings) {
  document.documentElement.classList.toggle('large-text', value.largeText);
  document.documentElement.classList.toggle('reduce-motion', value.reducedMotion);
}
