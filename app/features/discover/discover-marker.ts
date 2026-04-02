export type DiscoverMarkerState = 'default' | 'selected' | 'hover';

export const MARKER_Z_INDEX: Record<DiscoverMarkerState, number> = {
  default: 600,
  selected: 800,
  hover: 900,
};

const SVGS: Record<DiscoverMarkerState, string> = {
  default: `<svg width="22" height="22" viewBox="0 0 22 22" xmlns="http://www.w3.org/2000/svg"><circle cx="11" cy="11" r="9" fill="#D4712A" opacity="0.7" stroke="#fff" stroke-width="2"/><circle cx="11" cy="11" r="3" fill="#fff"/></svg>`,
  selected: `<svg width="30" height="30" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg"><circle cx="15" cy="15" r="13" fill="#22C55E" stroke="#fff" stroke-width="2.5"/><path d="M10 15l4 4 6-7" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  hover: `<svg width="30" height="30" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg"><circle cx="15" cy="15" r="13" fill="#F59E0B" stroke="#fff" stroke-width="2.5"/><circle cx="15" cy="15" r="4" fill="#fff"/></svg>`,
};

export function createDiscoverMarkerElement(state: DiscoverMarkerState): HTMLElement {
  const el = document.createElement('div');
  el.innerHTML = SVGS[state];
  el.style.cursor = 'pointer';
  el.style.lineHeight = '0';
  el.dataset.discoverState = state;
  return el;
}
