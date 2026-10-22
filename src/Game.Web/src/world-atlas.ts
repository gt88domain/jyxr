import type {GameState} from './bridge';
import type {WorldAtlas, AtlasFilter} from './world-atlas-model';
import {matchesAtlasFilter} from './world-atlas-model';
import {assetUrl} from './content';
import {e} from './ui/format';
import './world-atlas.css';

export function worldAtlasView(state: GameState, atlas: WorldAtlas): string {
  const places = state.map.locations;
  const regionOf = (id: string) => atlas.regions.find(r => r.locations.includes(id));
  const available = places.filter(p => p.action).length;
  const regionButton = (region: WorldAtlas['regions'][number], pin: boolean) => {
    const count = places.filter(p => p.action && region.locations.includes(p.id)).length;
    return `<button type="button" class="${pin ? 'atlas-pin' : 'atlas-tab'}" data-atlas-region="${e(region.id)}" aria-pressed="false" ${pin ? `style="left:${region.x}%;top:${region.y}%"` : ''}><span>${e(region.name)}</span><small>${count}</small></button>`;
  };
  return `<section class="world-atlas" aria-label="${e(atlas.title)}" data-world-atlas data-region="">
    <header class="atlas-heading"><div><h2>${e(atlas.title)}</h2><p>${e(atlas.description)}</p></div><span>${e(atlas.available)} <strong>${available}/${places.length}</strong></span></header>
    <div class="atlas-chart"><img class="atlas-art" src="${e(assetUrl(atlas.image))}" alt="${e(atlas.title)}" width="1536" height="1024" fetchpriority="high">${atlas.regions.map(r => regionButton(r,true)).join('')}</div>
    <div class="atlas-tabs" role="group" aria-label="${e(atlas.title)}"><button type="button" class="atlas-tab" data-atlas-region="" aria-pressed="true">${e(atlas.all)}</button>${atlas.regions.map(r => regionButton(r,false)).join('')}</div>
    <div class="atlas-tools"><label class="destination-search">${e(atlas.search)}<input type="search" id="destination-search" placeholder="${e(atlas.placeholder)}" autocomplete="off"></label><label class="atlas-unavailable"><input type="checkbox" data-atlas-unavailable>${e(atlas.showUnavailable)}</label><output data-atlas-count aria-live="polite">${available} / ${places.length}</output></div>
    <div class="map-spots chapter-locations atlas-destinations" aria-label="${e(atlas.all)}">${[...places].sort((a,b)=>Number(!!b.action)-Number(!!a.action) || atlas.regions.findIndex(r=>r.locations.includes(a.id))-atlas.regions.findIndex(r=>r.locations.includes(b.id))).map(place => {
      const region = regionOf(place.id);
      return `<button class="map-spot" data-action="interact" data-id="${e(place.id)}" data-atlas-place data-region="${e(region?.id || '')}" ${place.action ? '' : 'disabled hidden'}><span class="atlas-location-mark" aria-hidden="true">${place.action ? '◆' : '◇'}</span><span><strong>${e(place.name)}</strong><small>${e(region?.name)} · ${e(place.action ? place.description || atlas.visit : atlas.unavailable)}</small>${place.action ? `<small class="atlas-travel">${e(atlas.travel)} · ${place.timeSlots || 1} ${e(atlas.timeUnit)}</small>` : ''}</span><i aria-hidden="true">→</i></button>`;
    }).join('')}</div><p class="atlas-empty" data-atlas-empty hidden role="status">${e(atlas.empty)}</p>
  </section>`;
}

/** Filters only existing DOM destinations; never dispatches a game command. */
export function filterWorldAtlas(root: HTMLElement): void {
  const filter: AtlasFilter = {
    region: root.dataset.region || '',
    query: root.querySelector<HTMLInputElement>('#destination-search')?.value || '',
    showUnavailable: root.querySelector<HTMLInputElement>('[data-atlas-unavailable]')?.checked || false,
  };
  let visible = 0;
  const places = root.querySelectorAll<HTMLButtonElement>('[data-atlas-place]');
  places.forEach(button => {
    button.hidden = !matchesAtlasFilter({region: button.dataset.region || '', text: button.textContent || '', available: !button.disabled}, filter);
    if (!button.hidden) visible++;
  });
  root.querySelectorAll<HTMLElement>('[data-atlas-region]').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.atlasRegion === filter.region));
  });
  const count = root.querySelector<HTMLOutputElement>('[data-atlas-count]');
  if (count) count.value = `${visible} / ${places.length}`;
  const empty = root.querySelector<HTMLElement>('[data-atlas-empty]');
  if (empty) empty.hidden = visible > 0;
}
