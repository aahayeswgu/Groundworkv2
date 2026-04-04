import { STATUS_COLORS } from "@/app/features/pins/model/pin-marker";
import { darkenColor, lightenColor, toSafeSvgId } from "../lib/marker-layer";
import type { PinMarkerVisualProps } from "../model/marker-layer.types";

export function PinMarkerVisual({ pin, bouncing }: PinMarkerVisualProps) {
  const color = STATUS_COLORS[pin.status];
  const markerId = toSafeSvgId(`${pin.id}-${pin.status}`);
  const highlightGradientId = `hg-${markerId}`;
  const shaftGradientId = `shaft-${markerId}`;
  const shadowFilterId = `sh-${markerId}`;

  return (
    <div
      className={`${bouncing ? "marker-bounce " : ""}block cursor-pointer leading-none`}
    >
      <svg width="24" height="36" viewBox="0 0 24 36" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id={highlightGradientId} cx="35%" cy="35%" r="60%" fx="25%" fy="25%">
            <stop offset="0%" stopColor={lightenColor(color, 60)} />
            <stop offset="50%" stopColor={color} />
            <stop offset="100%" stopColor={darkenColor(color, 50)} />
          </radialGradient>
          <linearGradient id={shaftGradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={darkenColor(color, 30)} />
            <stop offset="100%" stopColor={darkenColor(color, 60)} />
          </linearGradient>
          <filter id={shadowFilterId} x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="2" stdDeviation="1.5" floodColor="rgba(0,0,0,0.35)" />
          </filter>
        </defs>
        <ellipse cx="12" cy="34" rx="3" ry="1.2" fill="rgba(0,0,0,0.2)" />
        <polygon points="10.5,13 13.5,13 12.5,33 11.5,33" fill={`url(#${shaftGradientId})`} />
        <circle
          cx="12"
          cy="10"
          r="9"
          fill={`url(#${highlightGradientId})`}
          stroke="rgba(255,255,255,0.4)"
          strokeWidth="1"
          filter={`url(#${shadowFilterId})`}
        />
        <ellipse
          cx="9.5"
          cy="7.5"
          rx="2.5"
          ry="1.8"
          fill="rgba(255,255,255,0.25)"
          transform="rotate(-15,12,10)"
        />
      </svg>
    </div>
  );
}

export default PinMarkerVisual;
