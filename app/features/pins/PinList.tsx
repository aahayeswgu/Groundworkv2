"use client";

import { useState, useMemo } from "react";
import { useStore } from "@/app/store";
import type { PinStatus } from "@/app/types/pins.types";
import { PinListItem } from "./PinListItem";

const STATUS_CHIPS: { status: PinStatus; label: string; color: string }[] = [
  { status: "prospect", label: "Prospect", color: "#3B82F6" },
  { status: "active", label: "Active", color: "#22C55E" },
  { status: "follow-up", label: "Follow-Up", color: "#F59E0B" },
  { status: "lost", label: "Lost", color: "#EF4444" },
];

interface EmptyStateProps {
  searchText: string;
}

function EmptyState({ searchText }: EmptyStateProps) {
  if (searchText.trim()) {
    return (
      <div className="py-10 px-5 text-center text-text-muted">
        <div className="mb-3">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="mx-auto text-text-muted"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
        </div>
        <div className="text-sm leading-relaxed">No pins match your search.</div>
      </div>
    );
  }

  return (
    <div className="py-10 px-5 text-center text-text-muted">
      <div className="mb-3">
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="mx-auto text-text-muted"
        >
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      </div>
      <div className="text-sm leading-relaxed">
        No pins yet.
        <br />
        Click the + button on the map to start dropping pins.
      </div>
      <div className="text-xs mt-2 text-text-muted italic">Even the boss takes a day off sometimes.</div>
    </div>
  );
}

interface PinListProps {
  onEditPin: (pinId: string) => void;
}

export function PinList({ onEditPin }: PinListProps) {
  const pins = useStore((s) => s.pins);
  const activeStatusFilter = useStore((s) => s.activeStatusFilter);
  const setActiveStatusFilter = useStore((s) => s.setActiveStatusFilter);

  const [searchText, setSearchText] = useState("");

  const filtered = useMemo(() => {
    const q = searchText.toLowerCase().trim();
    return pins.filter((p) => {
      const matchesSearch =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.address.toLowerCase().includes(q) ||
        p.contact.toLowerCase().includes(q);
      const matchesStatus = activeStatusFilter.has(p.status);
      return matchesSearch && matchesStatus;
    });
  }, [pins, searchText, activeStatusFilter]);

  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    const totalPins = pins.length;
    const activeCount = pins.filter((p) => p.status === "active").length;
    const thisWeekCount = pins.filter((p) => {
      if (!p.followUpDate) return false;
      const d = new Date(p.followUpDate);
      return d >= today && d <= nextWeek;
    }).length;
    const overdueCount = pins.filter((p) => {
      if (!p.followUpDate) return false;
      const d = new Date(p.followUpDate);
      return d < today;
    }).length;

    return { totalPins, activeCount, thisWeekCount, overdueCount };
  }, [pins]);

  function toggleStatus(status: PinStatus) {
    const next = new Set(activeStatusFilter);
    if (next.has(status)) {
      next.delete(status);
    } else {
      next.add(status);
    }
    setActiveStatusFilter(next);
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
        <div className="flex flex-wrap gap-[5px]">
          {STATUS_CHIPS.map(({ status, label, color }) => {
            const count = pins.filter((p) => p.status === status).length;
            const isActive = activeStatusFilter.has(status);
            return (
              <button
                key={status}
                onClick={() => toggleStatus(status)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold cursor-pointer transition-all duration-150 border-[1.5px] ${
                  isActive
                    ? "border-orange bg-orange-dim text-text-primary"
                    : "border-border text-text-secondary bg-bg-input hover:border-text-muted"
                }`}
              >
                <span className="w-[7px] h-[7px] rounded-full" style={{ background: color }} />
                {label} <span className="font-normal opacity-70">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Pin list */}
      <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
        {filtered.length === 0 ? (
          <EmptyState searchText={searchText} />
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
