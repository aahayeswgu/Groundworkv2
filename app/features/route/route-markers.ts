/**
 * Creates the HTML content for a numbered route stop marker.
 * Orange circle (#D4712A) with white number text, matching brand palette.
 * Home start uses label 'H' with dark background (#1A1A1A) per old app lines 6765-6770.
 *
 * Returns HTMLElement only — caller wraps in AdvancedMarkerElement:
 *   new google.maps.marker.AdvancedMarkerElement({ content: createNumberedMarkerElement(...) })
 *
 * pointer-events: none prevents marker from intercepting map clicks.
 */
export function createNumberedMarkerElement(
  label: string,
  color = '#D4712A',
): HTMLElement {
  const el = document.createElement('div');
  el.style.cssText = [
    'width:28px;height:28px;border-radius:50%',
    `background:${color};color:#fff`,
    'font-size:13px;font-weight:800',
    'display:flex;align-items:center;justify-content:center',
    'border:2px solid rgba(255,255,255,0.85)',
    'box-shadow:0 2px 6px rgba(0,0,0,0.35)',
    'pointer-events:none',
    'user-select:none',
  ].join(';');
  el.textContent = label;
  return el;
}
