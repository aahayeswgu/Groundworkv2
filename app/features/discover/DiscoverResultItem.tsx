"use client";

import type { DiscoverResult } from "@/app/types/discover.types";
import { classifyGooglePlace } from "@/app/features/discover/discover-filters";

interface DiscoverResultItemProps {
  result: DiscoverResult;
  isSelected: boolean;
  isHovered: boolean;
  onToggleSelect: (placeId: string) => void;
  onHoverEnter: (placeId: string) => void;
  onHoverLeave: () => void;
  onQuickSave: (result: DiscoverResult) => void;
  alreadySaved: boolean;
}

export function DiscoverResultItem({
  result,
  isSelected,
  isHovered,
  onToggleSelect,
  onHoverEnter,
  onHoverLeave,
  onQuickSave,
  alreadySaved,
}: DiscoverResultItemProps) {
  const type = classifyGooglePlace(result.types, result.displayName);

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 border-b border-border cursor-default transition-colors duration-100 ${
        isSelected
          ? "bg-orange-dim"
          : isHovered
          ? "bg-bg-secondary"
          : "bg-bg-card hover:bg-bg-secondary"
      }`}
      onMouseEnter={() => onHoverEnter(result.placeId)}
      onMouseLeave={() => onHoverLeave()}
    >
      {/* Checkbox — ONLY code path for selection (never row click) */}
      <input
        type="checkbox"
        checked={isSelected}
        onChange={() => onToggleSelect(result.placeId)}
        onClick={(e) => e.stopPropagation()}
        className="shrink-0 w-4 h-4 accent-orange cursor-pointer"
      />

      {/* Business info */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold text-text-primary truncate">{result.displayName}</div>
        <div className="text-xs text-orange truncate mt-0.5">
          {type}
          {result.rating ? ` · ★ ${result.rating}` : ""}
        </div>
        <div className="text-xs text-text-muted truncate mt-0.5">{result.address}</div>
      </div>

      {/* Quick-save button */}
      {alreadySaved ? (
        <button
          disabled
          className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-green-500 cursor-default"
          title="Already saved"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </button>
      ) : (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onQuickSave(result);
          }}
          className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-orange hover:bg-orange-dim transition-colors duration-150"
          title="Save as pin"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      )}
    </div>
  );
}
