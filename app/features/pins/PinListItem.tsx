"use client";

import { useContext } from "react";
import { MapContext } from "@/app/features/map/MapContext";
import { useStore } from "@/app/store";
import type { Pin } from "@/app/types/pins.types";
import type { RouteStop } from "@/app/types/route.types";

const STATUS_COLORS: Record<string, string> = {
  prospect: "#3B82F6",
  active: "#22C55E",
  "follow-up": "#F59E0B",
  lost: "#EF4444",
};

interface PinListItemProps {
  pin: Pin;
  onEditPin: (pinId: string) => void;
}

export function PinListItem({ pin, onEditPin }: PinListItemProps) {
  const map = useContext(MapContext);
  const addStop = useStore((s) => s.addStop);
  const addPlannerStop = useStore((s) => s.addPlannerStop);
  const setActivePlannerDate = useStore((s) => s.setActivePlannerDate);

  function handleClick() {
    if (!map) return;
    // Smooth pan — no jarky snap
    map.panTo({ lat: pin.lat, lng: pin.lng });
    const currentZoom = map.getZoom() ?? 12;
    if (currentZoom < 14) {
      map.setZoom(14);
    }
    // Find marker element by data-pin-id attribute and bounce it
    const markerEl = document.querySelector<HTMLElement>(`[data-pin-id="${pin.id}"]`);
    if (markerEl) {
      markerEl.classList.add("marker-bounce");
      setTimeout(() => markerEl.classList.remove("marker-bounce"), 700);
    }
  }

  return (
    <div
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors duration-150 hover:bg-orange-dim group"
      onClick={handleClick}
    >
      <span
        className="w-2.5 h-2.5 rounded-full shrink-0"
        style={{ background: STATUS_COLORS[pin.status] }}
      />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-text-primary truncate">
          {pin.title || "Unnamed Pin"}
        </div>
        <div className="text-[11px] text-text-secondary truncate mt-0.5">{pin.address}</div>
      </div>
      <button
        className="opacity-0 group-hover:opacity-100 shrink-0 text-[#D4712A] hover:text-[#D4712A]/80 text-xs font-bold px-2 py-1 rounded border border-[#D4712A]/30 hover:border-[#D4712A] transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          const stop: RouteStop = {
            id: pin.id,
            label: pin.title,
            address: pin.address ?? "",
            lat: pin.lat,
            lng: pin.lng,
          };
          addStop(stop);
        }}
        title="Add to Route"
      >
        + Route
      </button>
      <button
        className="opacity-0 group-hover:opacity-100 shrink-0 text-[#3B8CB5] hover:text-[#3B8CB5]/80 text-xs font-bold px-2 py-1 rounded border border-[#3B8CB5]/30 hover:border-[#3B8CB5] transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          const today = new Date().toISOString().slice(0, 10);
          setActivePlannerDate(today);
          addPlannerStop({
            id: crypto.randomUUID(),
            pinId: pin.id,
            label: pin.title,
            address: pin.address ?? "",
            lat: pin.lat,
            lng: pin.lng,
            status: "planned",
            addedAt: new Date().toISOString(),
            visitedAt: null,
          });
        }}
        title="Add to Planner"
      >
        + Plan
      </button>
      <button
        className="opacity-0 group-hover:opacity-100 shrink-0 text-text-muted hover:text-orange transition-opacity"
        onClick={(e) => {
          e.stopPropagation();
          onEditPin(pin.id);
        }}
        title="Edit pin"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      </button>
    </div>
  );
}
