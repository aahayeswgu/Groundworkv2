"use client";

import { useState, useMemo } from "react";
import { useStore } from "@/app/store";
import type { PinStatus } from "@/app/features/pins/model/pin.types";
import {
  computePinListStats,
  filterPinsByQueryAndStatus,
  STATUS_CHIPS,
  toggleStatusFilter,
} from "../model/pin-list.model";
import { PinListEmptyState } from "./PinListEmptyState";
import { PinListItem } from "./PinListItem";

interface PinListProps {
  onEditPin: (pinId: string) => void;
}

export function PinList({ onEditPin }: PinListProps) {
  const pins = useStore((s) => s.pins);
  const activeStatusFilter = useStore((s) => s.activeStatusFilter);
  const setActiveStatusFilter = useStore((s) => s.setActiveStatusFilter);

  const [searchText, setSearchText] = useState("");

  const filtered = useMemo(() => {
    return filterPinsByQueryAndStatus(pins, searchText, activeStatusFilter);
  }, [pins, searchText, activeStatusFilter]);

  const stats = useMemo(() => computePinListStats(pins), [pins]);

  function toggleStatus(status: PinStatus) {
    setActiveStatusFilter(toggleStatusFilter(activeStatusFilter, status));
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search input */}
      <div className="px-4 py-3 border-b border-border bg-bg-card relative">
        <div className="flex items-center bg-bg-input border-[1.5px] border-border rounded-lg px-3 transition-colors duration-200 focus-within:border-orange">
          <svg
            className="text-text-muted shrink-0"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            className="flex-1 border-none bg-transparent py-2.5 px-2 text-sm text-text-primary outline-none placeholder:text-text-muted"
            placeholder="Search pins or enter address..."
            autoComplete="off"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
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
