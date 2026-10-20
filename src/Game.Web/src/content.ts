export interface PackListing {id: string; title: string; subtitle?: string; description?: string; url: string; localeUrls?:Record<string,string>;}
interface PackIndex {schemaVersion: number; defaultPackId: string; packs: PackListing[];}
let catalog: PackIndex | undefined;

async function readText(url: URL, label: string): Promise<string> {
  for (let attempt = 0; ; attempt++) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        if (attempt === 0 && [502, 503, 504].includes(response.status)) {
          await new Promise(resolve => setTimeout(resolve, 350)); continue;
        }
        throw new Error(`${label}未能载入（${response.status}）。`);
      }
      return await response.text();
    } catch (error) {
      if (attempt === 0 && error instanceof TypeError) {
        await new Promise(resolve => setTimeout(resolve, 350)); continue;
      }
      throw error;
    }
  }
}
export function assetUrl(path?: string | null): string {
  return path ? new URL(`${import.meta.env.BASE_URL}${path}`, document.baseURI).href : '';
}
export async function packIndex(): Promise<PackIndex> {
  if (catalog) return catalog;
  const url = new URL(assetUrl('data/packs/index.json'));
  url.searchParams.set('v', import.meta.env.VITE_GAME_VERSION);
  const candidate = JSON.parse(await readText(url, '内容目录')) as PackIndex;
  if (candidate.schemaVersion !== 1 || !Array.isArray(candidate.packs) || !candidate.packs.length)
    throw new Error('内容目录格式不受支持。');
  const ids = new Set<string>();
  for (const pack of candidate.packs) {
    if (!/^[a-z0-9-]+$/.test(pack.id) || ids.has(pack.id) || !pack.url.startsWith('packs/') || pack.url.includes('..'))
      throw new Error('内容目录含有无效或重复的内容包。');
    if(Object.values(pack.localeUrls||{}).some(url=>!url.startsWith('packs/')||url.includes('..')||url.includes('\\')))
      throw new Error('内容目录含有无效的语言路径。');
    ids.add(pack.id);
  }
  if (!ids.has(candidate.defaultPackId)) throw new Error('内容目录缺少默认世界。');
  catalog = candidate;
  return catalog;
}
export async function readPack(id: string): Promise<string> {
  const index = await packIndex();
  const entry = index.packs.find(pack => pack.id === id);
  if (!entry) throw new Error('未找到这个世界。');
  const locale=new URL(location.href).searchParams.get('lang')==='zh-CN'?'zh-CN':'en';
  if(entry.localeUrls)document.documentElement.lang=locale;
  const url = new URL(assetUrl(`data/${entry.localeUrls?.[locale]||entry.url}`));
  url.searchParams.set('v', import.meta.env.VITE_GAME_VERSION);
  return readText(url, '世界内容');
}
