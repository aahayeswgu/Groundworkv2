"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { PlannerStop, PlannerStopStatus } from "@/app/features/planner/model/planner.types";

interface PlannerStopItemProps {
  stop: PlannerStop;
  index: number;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: (stopId: string) => void;
  onMoveDown: (stopId: string) => void;
  onStatusChange: (stopId: string, status: PlannerStopStatus) => void;
  onRemove: (stopId: string) => void;
  dragDisabled?: boolean;
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

export function PlannerStopItem({ stop, index, canMoveUp, canMoveDown, onMoveUp, onMoveDown, onStatusChange, onRemove, dragDisabled = false }: PlannerStopItemProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: stop.id, disabled: dragDisabled });

  const dragHandleProps = dragDisabled ? {} : { ...attributes, ...listeners };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  function handleStatusClick(e: React.MouseEvent) {
    e.stopPropagation();
    onStatusChange(stop.id, STATUS_CYCLE[stop.status]);
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2.5 px-3 py-2.5 border-b border-border last:border-b-0 group touch-pan-y"
    >
      {/* Index number — drag handle */}
      <button
        type="button"
        ref={setActivatorNodeRef}
        {...dragHandleProps}
        aria-label={`Drag to reorder ${stop.label}`}
        className={`w-5 h-5 rounded-full bg-orange/15 text-orange text-[10px] font-bold flex items-center justify-center shrink-0 select-none ${
          dragDisabled ? "" : "cursor-grab active:cursor-grabbing touch-none"
        }`}
      >
        {index + 1}
      </button>
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
      {/* Reorder + Remove */}
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => onMoveUp(stop.id)}
          disabled={!canMoveUp}
          aria-label={`Move ${stop.label} up`}
          className="rounded p-1 text-text-muted transition-colors hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-30"
          title="Move up"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="18 15 12 9 6 15" />
          </svg>
        </button>
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => onMoveDown(stop.id)}
          disabled={!canMoveDown}
          aria-label={`Move ${stop.label} down`}
          className="rounded p-1 text-text-muted transition-colors hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-30"
          title="Move down"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => onRemove(stop.id)}
          aria-label={`Remove ${stop.label}`}
          className="rounded p-1 text-text-muted transition-colors hover:text-red-400"
          title="Remove stop"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  );
}
