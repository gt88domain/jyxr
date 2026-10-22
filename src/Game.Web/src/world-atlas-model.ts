export interface WorldAtlas {
  mapId: string; image: string; title: string; description: string;
  all: string; search: string; placeholder: string; showUnavailable: string;
  destinations: string; browse: string; mapToggle: string; nextStop: string;
  available: string; empty: string; unavailable: string; travel: string;
  timeUnit: string; visit: string;
  regions: {id: string; name: string; x: number; y: number; locations: string[]}[];
}
export interface AtlasFilter {region: string; query: string; showUnavailable: boolean;}
function searchText(value: string): string {
  return value.normalize('NFKD').replace(/\p{M}/gu,'').replace(/['‘’]/g,'').toLocaleLowerCase().trim();
}
export function matchesAtlasFilter(place: {region: string; text: string; available: boolean}, filter: AtlasFilter): boolean {
  return (filter.showUnavailable || place.available) &&
    (!filter.region || filter.region === place.region) &&
    searchText(filter.query).split(/\s+/).every(term=>searchText(place.text).includes(term));
}

/** An actionable task destination comes first; never changes event availability. */
export function orderAtlasPlaces<T extends {id: string; action?: string | null}>(places: readonly T[], atlas: Pick<WorldAtlas,'regions'>, nextStop?: string): T[] {
  const rank = new Map(atlas.regions.flatMap((r,i)=>r.locations.map(id=>[id,i] as const)));
  return [...places].sort((a,b)=>Number(!!b.action)-Number(!!a.action) ||
    Number(b.id===nextStop)-Number(a.id===nextStop) || (rank.get(a.id)??Infinity)-(rank.get(b.id)??Infinity));
}
