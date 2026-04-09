"use client";

import { useStore } from "@/app/store";
import { PIN_STATUS_BADGE_CLASSNAMES } from "@/app/features/pins/model/pin-status-palette";
import {
  usePlannerActions,
  usePlannerDays,
} from "@/app/features/planner/model/planner.hooks";
import {
  useRouteActions,
  useRouteStops,
} from "@/app/features/route/model/route.hooks";
import type { Pin } from "@/app/features/pins/model/pin.types";

interface PinListItemProps {
  pin: Pin;
  onEditPin: (pinId: string) => void;
}

export function PinListItem({ pin, onEditPin }: PinListItemProps) {
  const focusPin = useStore((s) => s.focusPin);
  const { addStop, removeStop } = useRouteActions();
  const routeStops = useRouteStops();
  const isInRoute = routeStops.some((s) => s.id === pin.id);
  const { addPlannerStop, removePlannerStop, setActivePlannerDate } = usePlannerActions();
  const plannerDays = usePlannerDays();
  const today = new Date().toLocaleDateString("en-CA");
  const todayStops = plannerDays[today]?.stops ?? [];
  const isPlanned = todayStops.some((s) => s.pinId === pin.id);
  const routeButtonClass = isInRoute
    ? "bg-gw-green text-white"
    : "bg-orange text-white";
  const plannerButtonClass = isPlanned
    ? "bg-gw-green text-white"
    : "bg-[#3B8CB5] text-white";

  function handleClick() {
    focusPin(pin.id);
  }

  return (
    <div
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors duration-150 hover:bg-orange-dim group"
      onClick={handleClick}
    >
      <span
        className={`h-2.5 w-2.5 shrink-0 rounded-full ${PIN_STATUS_BADGE_CLASSNAMES[pin.status]}`}
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
          className={`flex h-7 w-7 items-center justify-center rounded transition-all hover:brightness-110 ${routeButtonClass}`}
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
          className={`flex h-7 w-7 items-center justify-center rounded transition-all hover:brightness-110 ${plannerButtonClass}`}
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
