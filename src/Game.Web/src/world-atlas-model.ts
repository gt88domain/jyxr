export interface WorldAtlas {
  mapId: string; image: string; title: string; description: string;
  all: string; search: string; placeholder: string; showUnavailable: string;
  available: string; empty: string; unavailable: string; travel: string;
  timeUnit: string; visit: string;
  regions: {id: string; name: string; x: number; y: number; locations: string[]}[];
}
export interface AtlasFilter {region: string; query: string; showUnavailable: boolean;}
export function matchesAtlasFilter(place: {region: string; text: string; available: boolean}, filter: AtlasFilter): boolean {
  return (filter.showUnavailable || place.available) &&
    (!filter.region || filter.region === place.region) &&
    place.text.toLocaleLowerCase().includes(filter.query.trim().toLocaleLowerCase());
}
