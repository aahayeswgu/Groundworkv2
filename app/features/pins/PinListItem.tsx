"use client";

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
  const addStop = useStore((s) => s.addStop);
  const removeStop = useStore((s) => s.removeStop);
  const routeStops = useStore((s) => s.routeStops);
  const isInRoute = routeStops.some((s) => s.id === pin.id);
  const addPlannerStop = useStore((s) => s.addPlannerStop);
  const removePlannerStop = useStore((s) => s.removePlannerStop);
  const setActivePlannerDate = useStore((s) => s.setActivePlannerDate);
  const plannerDays = useStore((s) => s.plannerDays);
  const today = new Date().toISOString().slice(0, 10);
  const todayStops = plannerDays[today]?.stops ?? [];
  const isPlanned = todayStops.some((s) => s.pinId === pin.id);

  function handleClick() {
    // Dispatch custom event — MarkerLayer handles pan, bounce, and InfoWindow
    window.dispatchEvent(new CustomEvent("open-pin-info", { detail: { pinId: pin.id } }));
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
      {/* Compact icon buttons — show on hover */}
      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 shrink-0">
        {/* Route toggle */}
        <button
          style={isInRoute
            ? { backgroundColor: "#22C55E", color: "#fff" }
            : { backgroundColor: "#C4692A", color: "#fff" }
          }
          className="w-7 h-7 rounded flex items-center justify-center transition-all hover:brightness-110"
          onClick={(e) => {
            e.stopPropagation();
            if (isInRoute) {
              removeStop(pin.id);
            } else {
              addStop({
                id: pin.id,
                label: pin.title,
                address: pin.address ?? "",
                lat: pin.lat,
                lng: pin.lng,
              });
            }
          }}
          title={isInRoute ? "Remove from Route" : "Add to Route"}
        >
          {isInRoute ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="3 11 22 2 13 21 11 13 3 11" /></svg>
          )}
        </button>
        {/* Planner toggle */}
        <button
          style={isPlanned
            ? { backgroundColor: "#22C55E", color: "#fff" }
            : { backgroundColor: "#3B8CB5", color: "#fff" }
          }
          className="w-7 h-7 rounded flex items-center justify-center transition-all hover:brightness-110"
          onClick={(e) => {
            e.stopPropagation();
            if (isPlanned) {
              const match = todayStops.find((s) => s.pinId === pin.id);
              if (match) removePlannerStop(match.id);
            } else {
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
            }
          }}
          title={isPlanned ? "Remove from Planner" : "Add to Planner"}
        >
          {isPlanned ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
          )}
        </button>
        {/* Edit */}
        <button
          className="w-7 h-7 rounded flex items-center justify-center text-text-muted hover:text-orange transition-colors"
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
    </div>
  );
}
