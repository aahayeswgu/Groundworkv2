"use client";

import { useState } from "react";
import type { ActivityEntry } from "@/app/types/planner.types";

interface PlannerActivityLogProps {
  entries: ActivityEntry[];
  trackingEnabled: boolean;
  onToggleTracking: (enabled: boolean) => void;
}

export default function PlannerActivityLog({
  entries,
  trackingEnabled,
  onToggleTracking,
}: PlannerActivityLogProps) {
  const [expanded, setExpanded] = useState(false);

  const reversedEntries = [...entries].reverse();

  return (
    <div className="border-b border-border">
      {/* Header row — always visible, clickable to collapse/expand */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full px-4 py-2 flex items-center justify-between bg-bg-secondary hover:bg-bg-card transition-colors"
      >
        <div className="flex items-center gap-2">
          {/* Chevron icon — rotates when expanded */}
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={`transition-transform duration-200 ${expanded ? "rotate-90" : ""} text-text-muted`}
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
          <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
            Activity Log
          </span>
        </div>

        {/* Privacy toggle — stops propagation to avoid triggering collapse */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleTracking(!trackingEnabled);
          }}
          className="p-1 rounded text-text-muted hover:text-orange transition-colors"
          aria-label={trackingEnabled ? "Disable activity tracking" : "Enable activity tracking"}
          title={trackingEnabled ? "Tracking on — click to pause" : "Tracking paused — click to resume"}
        >
          {trackingEnabled ? (
            // Eye open
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          ) : (
            // Eye off
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
              <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
          )}
        </button>
      </button>

      {/* Collapsible body — CSS max-height transition */}
      <div
        className={`transition-all duration-200 overflow-hidden ${
          expanded ? "max-h-[200px]" : "max-h-0"
        }`}
      >
        <div className="overflow-y-auto max-h-[200px]">
          {!trackingEnabled && (
            <div className="px-4 py-2 text-[11px] text-text-muted italic border-b border-border">
              Tracking paused — activity not recorded
            </div>
          )}

          {trackingEnabled && reversedEntries.length === 0 && (
            <div className="px-4 py-4 text-sm text-text-muted text-center">
              No activity yet today
            </div>
          )}

          {reversedEntries.length > 0 && (
            <ul className="divide-y divide-border">
              {reversedEntries.map((entry, i) => (
                <li key={i} className="flex items-start gap-2 px-4 py-2">
                  <span className="text-[11px] text-text-muted shrink-0 w-16 pt-0.5">{entry.time}</span>
                  <span className="text-sm text-text-secondary">{entry.text}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
