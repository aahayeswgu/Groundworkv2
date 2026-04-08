"use client";

import { useState, useMemo } from "react";
import { useStore } from "@/app/store";
import type { PinStatus } from "@/app/features/pins/model/pin.types";
import { useIsMobile } from "@/app/shared/lib/use-is-mobile";
import { Button } from "@/app/shared/ui/button";
import {
  computePinListStats,
  filterPinsByQueryAndStatus,
  STATUS_CHIPS,
  toggleStatusFilter,
} from "../model/pin-list.model";
import { PinListEmptyState } from "./PinListEmptyState";
import { PinListItem } from "./PinListItem";
import PinSearchInput from "./PinSearchInput";

interface PinListProps {
  onEditPin: (pinId: string) => void;
  mobileSheetSnapIndex?: number | null;
  onRequestExpand?: () => void;
}

export function PinList({
  onEditPin,
  mobileSheetSnapIndex = null,
  onRequestExpand,
}: PinListProps) {
  const isMobile = useIsMobile();
  const pins = useStore((s) => s.pins);
  const activeStatusFilter = useStore((s) => s.activeStatusFilter);
  const setActiveStatusFilter = useStore((s) => s.setActiveStatusFilter);
  const isCompactMobileSheet = isMobile && mobileSheetSnapIndex !== null && mobileSheetSnapIndex <= 1;

  const [searchText, setSearchText] = useState("");

  const filtered = useMemo(() => {
    return filterPinsByQueryAndStatus(pins, searchText, activeStatusFilter);
  }, [pins, searchText, activeStatusFilter]);

  const stats = useMemo(() => computePinListStats(pins), [pins]);

  function toggleStatus(status: PinStatus) {
    setActiveStatusFilter(toggleStatusFilter(activeStatusFilter, status));
  }

  if (isCompactMobileSheet) {
    const hasFilter = searchText.trim().length > 0 || activeStatusFilter.size !== STATUS_CHIPS.length;
    const previewPin = filtered[0];

    return (
      <div className="flex h-full flex-col">
        <div className="shrink-0 border-b border-border bg-bg-card px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-sm font-bold text-text-primary">
                {filtered.length} / {pins.length} pins
              </div>
              <div className="text-xs text-text-muted">
                Active {stats.activeCount} · Overdue {stats.overdueCount}
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => onRequestExpand?.()}
              className="h-8 border border-white/12 bg-white/5 px-3 text-[11px] font-semibold text-text-secondary hover:bg-white/10 hover:text-white"
            >
              Expand
            </Button>
          </div>

          {hasFilter ? (
            <div className="mt-2 rounded-md border border-orange/30 bg-orange-dim px-3 py-2 text-xs font-semibold text-orange">
              Filters active
            </div>
          ) : null}

          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-2">
              <div className="text-lg font-extrabold leading-none text-orange">{stats.totalPins}</div>
              <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-text-muted">Total Pins</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-2">
              <div className="text-lg font-extrabold leading-none text-orange">{stats.thisWeekCount}</div>
              <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-text-muted">This Week</div>
            </div>
          </div>

          {previewPin ? (
            <div className="mt-3 overflow-hidden rounded-xl border border-white/10 bg-white/5 px-3 py-2">
              <div className="text-[11px] font-semibold text-text-secondary">Drag up for full list</div>
              <div className="mt-1 truncate text-[13px] font-bold text-text-primary">{previewPin.title || "Unnamed Pin"}</div>
              <div className="truncate text-[11px] text-text-muted">{previewPin.address}</div>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search input with Google Places autocomplete */}
      <div className="px-4 py-3 border-b border-border bg-bg-card relative">
        <PinSearchInput value={searchText} onChange={setSearchText} />
      </div>

      {/* Pin count row */}
      <div className="flex items-center justify-between px-4 py-2 text-xs text-text-muted border-b border-border font-medium">
        <span>
          {filtered.length} pin{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Status filter chips */}
      <div className="px-3 py-2 border-b border-border bg-bg-card">
        <div className="pin-status-chips flex flex-wrap gap-[5px]">
          {STATUS_CHIPS.map(({ status, label, dotClassName }) => {
            const count = pins.filter((p) => p.status === status).length;
            const isActive = activeStatusFilter.has(status);
            return (
              <button
                key={status}
                onClick={() => toggleStatus(status)}
                className={`pin-status-chip flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold cursor-pointer transition-all duration-150 ${
                  isActive
                    ? "pin-status-chip-active"
                    : "pin-status-chip-inactive"
                }`}
              >
                <span className={`h-[7px] w-[7px] rounded-full ${dotClassName}`} />
                {label} <span className="font-normal opacity-70">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Pin list */}
      <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
        {filtered.length === 0 ? (
          <PinListEmptyState searchText={searchText} />
        ) : (
          filtered.map((pin) => (
            <PinListItem key={pin.id} pin={pin} onEditPin={onEditPin} />
          ))
        )}
      </div>

      {/* Stats footer */}
      <div className="flex shrink-0 px-4 py-2.5 border-t border-border bg-bg-card">
        {[
          { num: String(stats.totalPins), label: "Pins" },
          { num: String(stats.activeCount), label: "Active" },
          { num: String(stats.thisWeekCount), label: "This Week" },
          { num: String(stats.overdueCount), label: "Overdue" },
        ].map((stat, i, arr) => (
          <div
            key={stat.label}
            className={`flex-1 text-center py-1.5 px-1 rounded-md transition-colors duration-150 hover:bg-orange-dim ${
              i < arr.length - 1 ? "border-r border-border" : ""
            }`}
          >
            <div className="text-lg font-extrabold text-orange leading-tight tabular-nums">
              {stat.num}
            </div>
            <div className="text-[9px] font-bold uppercase tracking-wide text-text-muted mt-0.5">
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PinList;
