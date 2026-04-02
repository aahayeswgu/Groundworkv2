import { PIN_STATUS_META } from "@/app/entities/pin/model/pin-status";
import type { PinStatus } from "@/app/types/pins.types";

export const STATUS_COLORS: Record<PinStatus, string> = {
  prospect: PIN_STATUS_META.prospect.color,
  active: PIN_STATUS_META.active.color,
  "follow-up": PIN_STATUS_META["follow-up"].color,
  lost: PIN_STATUS_META.lost.color,
};

function lightenColor(hex: string, amount: number): string {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.min(255, (num >> 16) + amount);
  const g = Math.min(255, ((num >> 8) & 0x00ff) + amount);
  const b = Math.min(255, (num & 0x0000ff) + amount);
  return `rgb(${r},${g},${b})`;
}

function darkenColor(hex: string, amount: number): string {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.max(0, (num >> 16) - amount);
  const g = Math.max(0, ((num >> 8) & 0x00ff) - amount);
  const b = Math.max(0, (num & 0x0000ff) - amount);
  return `rgb(${r},${g},${b})`;
}

export function createPinMarkerElement(status: PinStatus): HTMLElement {
  const color = STATUS_COLORS[status];
  const s = status; // short alias for unique IDs

  const svg = `<svg width="24" height="36" viewBox="0 0 24 36" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="hg-${s}" cx="35%" cy="35%" r="60%" fx="25%" fy="25%">
        <stop offset="0%" stop-color="${lightenColor(color, 60)}"/>
        <stop offset="50%" stop-color="${color}"/>
        <stop offset="100%" stop-color="${darkenColor(color, 50)}"/>
      </radialGradient>
      <linearGradient id="shaft-${s}" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="${darkenColor(color, 30)}"/>
        <stop offset="100%" stop-color="${darkenColor(color, 60)}"/>
      </linearGradient>
      <filter id="sh-${s}" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="0" dy="2" stdDeviation="1.5" flood-color="rgba(0,0,0,0.35)"/>
      </filter>
    </defs>
    <ellipse cx="12" cy="34" rx="3" ry="1.2" fill="rgba(0,0,0,0.2)"/>
    <polygon points="10.5,13 13.5,13 12.5,33 11.5,33" fill="url(#shaft-${s})"/>
    <circle cx="12" cy="10" r="9" fill="url(#hg-${s})" stroke="rgba(255,255,255,0.4)" stroke-width="1" filter="url(#sh-${s})"/>
    <ellipse cx="9.5" cy="7.5" rx="2.5" ry="1.8" fill="rgba(255,255,255,0.25)" transform="rotate(-15,12,10)"/>
  </svg>`;

  // AdvancedMarkerElement content must be an HTMLElement; this node is the map bridge container.
  const el = document.createElement("div");
  el.innerHTML = svg;
  el.className = "pin-marker-bridge";
  return el;
}
