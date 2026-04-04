"use client";

import type { PlannerStop, PlannerStopStatus } from "@/app/features/planner/model/planner.types";

interface PlannerStopItemProps {
  stop: PlannerStop;
  index: number;
  onStatusChange: (stopId: string, status: PlannerStopStatus) => void;
  onRemove: (stopId: string) => void;
}

const STATUS_CYCLE: Record<PlannerStopStatus, PlannerStopStatus> = {
  planned: "visited",
  visited: "skipped",
  skipped: "planned",
};

const STATUS_LABEL: Record<PlannerStopStatus, string> = {
  planned: "Planned",
  visited: "Visited",
  skipped: "Skipped",
};

const STATUS_STYLES: Record<PlannerStopStatus, string> = {
  planned: "bg-blue-500/10 text-blue-400 border border-blue-500/30",
  visited: "bg-green-500/10 text-green-400 border border-green-500/30",
  skipped: "bg-amber-500/10 text-amber-400 border border-amber-500/30",
};

export function PlannerStopItem({ stop, index, onStatusChange, onRemove }: PlannerStopItemProps) {
  function handleStatusClick(e: React.MouseEvent) {
    e.stopPropagation();
    onStatusChange(stop.id, STATUS_CYCLE[stop.status]);
  }

  return (
    <div className="flex items-center gap-2.5 px-3 py-2.5 border-b border-border last:border-b-0 group">
      {/* Index number */}
      <span className="w-5 h-5 rounded-full bg-orange/15 text-orange text-[10px] font-bold flex items-center justify-center shrink-0">
        {index + 1}
      </span>
      {/* Status badge */}
      <button
        onClick={handleStatusClick}
        className={`shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${STATUS_STYLES[stop.status]}`}
      >
        {STATUS_LABEL[stop.status]}
      </button>
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-text-primary truncate">{stop.label}</div>
        {stop.address && (
          <div className="text-[11px] text-text-muted truncate mt-0.5">{stop.address}</div>
        )}
      </div>
      {/* Remove */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove(stop.id);
        }}
        className="opacity-0 group-hover:opacity-100 shrink-0 text-text-muted hover:text-red-400 p-1 transition-opacity"
        title="Remove stop"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}
