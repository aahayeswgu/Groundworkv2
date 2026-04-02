import type { DiscoverResult } from '@/app/features/discover/model/discover.types';
import type { Pin } from '@/app/features/pins/model/pin.types';
import { classifyGooglePlace } from '@/app/features/discover/discover-filters';
import { fetchAiBrief } from '@/app/lib/ask-ai';

export interface DiscoverInfoOptions {
  result: DiscoverResult;
  alreadySaved: boolean;
  onSave: () => void; // Called when "Save as Pin" button is clicked
  onAddToRoute: () => void; // Called when "Add to Route" is clicked
}

export function buildDiscoverInfoContent({ result, alreadySaved, onSave, onAddToRoute }: DiscoverInfoOptions): HTMLElement {
  const container = document.createElement('div');
  container.style.cssText = 'width:300px;font-family:inherit';

  // Photo (if available)
  if (result.photoUri) {
    const photo = document.createElement('div');
    photo.style.cssText = `height:140px;background:url('${result.photoUri}') center/cover no-repeat;border-radius:12px 12px 0 0`;
    container.appendChild(photo);
  }

  // Content padding wrapper
  const body = document.createElement('div');
  body.style.cssText = `padding:${result.photoUri ? '12px 16px 14px' : '14px 16px'}`;

  // Business name
  const nameEl = document.createElement('div');
  nameEl.style.cssText = 'color:var(--text-primary,#1A1A1A);font-size:15px;font-weight:700;line-height:1.3;padding-right:16px';
  nameEl.textContent = result.displayName;
  body.appendChild(nameEl);

  // Type classification
  const type = classifyGooglePlace(result.types, result.displayName);
  const typeEl = document.createElement('div');
  typeEl.style.cssText = 'color:#D4712A;font-size:12px;font-weight:600;margin-top:3px';
  typeEl.textContent = type;
  body.appendChild(typeEl);

  // Rating
  if (result.rating) {
    const ratingEl = document.createElement('div');
    ratingEl.style.cssText = 'margin-top:4px;font-size:12px';
    const stars = '★'.repeat(Math.round(result.rating)) + '☆'.repeat(5 - Math.round(result.rating));
    const starsSpan = document.createElement('span');
    starsSpan.style.cssText = 'color:#F59E0B;letter-spacing:1px';
    starsSpan.textContent = stars;
    ratingEl.appendChild(starsSpan);
    ratingEl.appendChild(document.createTextNode(` ${result.rating}`));
    body.appendChild(ratingEl);
  }

  // Address
  if (result.address) {
    const addrEl = document.createElement('div');
    addrEl.style.cssText = 'font-size:11px;color:#777;margin-top:3px;line-height:1.3';
    addrEl.textContent = result.address;
    body.appendChild(addrEl);
  }

  // Action row: Google Maps link + Save button
  const actionRow = document.createElement('div');
  actionRow.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-top:10px;gap:8px';

  // Google Maps link
  const gmapsLink = document.createElement('a');
  gmapsLink.href = `https://www.google.com/maps/place/?q=place_id:${result.placeId}`;
  gmapsLink.target = '_blank';
  gmapsLink.rel = 'noopener';
  gmapsLink.style.cssText = 'display:inline-flex;align-items:center;gap:4px;font-size:12px;color:#4285F4;font-weight:600;text-decoration:none';
  gmapsLink.textContent = 'Google Maps';
  actionRow.appendChild(gmapsLink);

  // Save as Pin button (per D-11: update in-place, do NOT rebuild InfoWindow)
  const saveBtn = document.createElement('button');
  if (alreadySaved) {
    saveBtn.textContent = '✓ Pinned';
    saveBtn.disabled = true;
    saveBtn.style.cssText = 'display:inline-flex;align-items:center;gap:4px;font-size:12px;color:#22C55E;font-weight:600;background:none;border:none;cursor:default';
  } else {
    saveBtn.textContent = 'Save as Pin';
    saveBtn.style.cssText = 'display:inline-flex;align-items:center;gap:5px;padding:6px 14px;border-radius:6px;border:none;background:#D4712A;color:#fff;font-size:12px;font-weight:700;cursor:pointer';
    saveBtn.addEventListener('click', () => {
      onSave();
      // In-place update — never call infoWindow.setContent() (per D-11, prevents Pitfall 5 re-render loop)
      saveBtn.textContent = '✓ Pinned';
      saveBtn.disabled = true;
      saveBtn.style.cssText = 'display:inline-flex;align-items:center;gap:4px;font-size:12px;color:#22C55E;font-weight:600;background:none;border:none;cursor:default';
    });
  }
  actionRow.appendChild(saveBtn);
  body.appendChild(actionRow);

  // Add to Route button (wired in Phase 5)
  const routeBtn = document.createElement('button');
  routeBtn.style.cssText = 'display:flex;align-items:center;justify-content:center;gap:4px;width:100%;padding:7px;border-radius:6px;border:1px solid #D4712A;background:none;color:#D4712A;font-size:12px;font-weight:700;cursor:pointer;margin-top:8px';
  routeBtn.textContent = '+ Add to Route';
  routeBtn.addEventListener('click', () => {
    onAddToRoute();
    routeBtn.textContent = '✓ Added to Route';
    routeBtn.disabled = true;
    routeBtn.style.cssText = routeBtn.style.cssText + ';cursor:default;opacity:0.7';
  });
  body.appendChild(routeBtn);

  // Ask AI button
  const aiBtn = document.createElement('button');
  aiBtn.style.cssText = 'display:flex;align-items:center;justify-content:center;gap:6px;width:100%;padding:8px;border-radius:6px;border:1.5px solid #4285F4;background:transparent;color:#4285F4;font-size:13px;font-weight:700;cursor:pointer;margin-top:6px';
  aiBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> Ask AI';

  const aiContainer = document.createElement('div');
  aiContainer.style.cssText = 'display:none;margin-top:8px;padding:12px;border-radius:8px;background:#f8f9fa;border:1px solid #e0e0e0;font-size:13px;line-height:1.6;color:#1A1A1A;max-height:300px;overflow-y:auto';

  const aiType = classifyGooglePlace(result.types, result.displayName);
  let briefText = '';
  let briefLoaded = false;
  let detailedLoaded = false;

  function renderMarkdown(text: string): string {
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/^(\s*)\*\s+/gm, '$1• ')
      .replace(/^(\s*)[-–]\s+/gm, '$1• ')
      .replace(/\n{2,}/g, '<br><br>')
      .replace(/\n/g, '<br>');
  }

  aiBtn.addEventListener('click', async () => {
    // If detailed already loaded, just toggle
    if (detailedLoaded) {
      aiContainer.style.display = aiContainer.style.display === 'none' ? 'block' : 'none';
      aiBtn.textContent = aiContainer.style.display === 'none' ? 'Show AI Brief' : 'Hide AI Brief';
      return;
    }

    // If brief loaded, fetch detailed
    if (briefLoaded) {
      aiBtn.innerHTML = 'Digging deeper...';
      aiBtn.style.opacity = '0.7';
      try {
        const detailed = await fetchAiBrief(result.placeId, result.displayName, result.address, aiType, 'detailed', briefText);
        aiContainer.innerHTML = renderMarkdown(briefText + '\n\n---\n\n' + detailed);
        detailedLoaded = true;
        aiBtn.textContent = 'Hide AI Brief';
        aiBtn.style.cssText = 'display:flex;align-items:center;justify-content:center;gap:6px;width:100%;padding:8px;border-radius:6px;border:1.5px solid #4285F4;background:#4285F4;color:#fff;font-size:13px;font-weight:700;cursor:pointer;margin-top:6px';
        aiBtn.style.opacity = '1';
      } catch {
        aiBtn.innerHTML = 'Learn More (retry)';
        aiBtn.style.opacity = '1';
      }
      return;
    }

    // First click — fetch brief
    aiBtn.innerHTML = 'Generating...';
    aiBtn.style.opacity = '0.7';
    try {
      briefText = await fetchAiBrief(result.placeId, result.displayName, result.address, aiType, 'brief');
      aiContainer.style.display = 'block';
      aiContainer.innerHTML = renderMarkdown(briefText);
      briefLoaded = true;
      aiBtn.innerHTML = 'Learn More';
      aiBtn.style.cssText = 'display:flex;align-items:center;justify-content:center;gap:6px;width:100%;padding:8px;border-radius:6px;border:1.5px solid #4285F4;background:#4285F4;color:#fff;font-size:13px;font-weight:700;cursor:pointer;margin-top:6px';
      aiBtn.style.opacity = '1';
    } catch (err) {
      aiBtn.innerHTML = 'Ask AI (retry)';
      aiBtn.style.opacity = '1';
      aiContainer.style.display = 'block';
      aiContainer.textContent = err instanceof Error ? err.message : 'Failed to generate brief';
      aiContainer.style.color = '#EF4444';
    }
  });

  body.appendChild(aiBtn);
  body.appendChild(aiContainer);

  container.appendChild(body);
  return container;
}

/**
 * Build a Pin object from a DiscoverResult for quick-save.
 * Dedup check (by name/coords) is done in DiscoverLayer before calling addPin.
 */
export function buildQuickSavePin(result: DiscoverResult): Pin {
  const type = classifyGooglePlace(result.types, result.displayName);
  return {
    id: `pin_${Date.now()}_${result.placeId.slice(-6)}`,
    title: result.displayName,
    address: result.address,
    lat: result.lat,
    lng: result.lng,
    status: 'prospect',
    contact: '',
    phone: '',
    followUpDate: '',
    notes: [{ text: `Discovered via Groundwork — ${type}`, date: new Date().toISOString() }],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    placeId: result.placeId,
    photoUrl: result.photoUri ?? undefined,
    rating: result.rating ?? undefined,
    ratingCount: result.ratingCount ?? undefined,
  };
}
