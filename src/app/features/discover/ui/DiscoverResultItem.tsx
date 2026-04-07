"use client";

import { Check, MapPin, Navigation, Plus, Star } from "lucide-react";
import type { DiscoverResult } from "@/app/features/discover/model/discover.types";
import { classifyGooglePlace } from "@/app/features/discover/lib/discover-filters";
import { cn } from "@/app/shared/lib/utils";

interface DiscoverResultItemProps {
  result: DiscoverResult;
  isSelected: boolean;
  isHovered: boolean;
  onToggleSelect: (placeId: string) => void;
  onHoverEnter: (placeId: string) => void;
  onHoverLeave: () => void;
  onQuickSave: (result: DiscoverResult) => void;
  onUnsave: (result: DiscoverResult) => void;
  onLocateOnMap: (result: DiscoverResult) => void;
  alreadySaved: boolean;
  zoneLabel?: string;
}

export function DiscoverResultItem({
  result,
  isSelected,
  isHovered,
  onToggleSelect,
  onHoverEnter,
  onHoverLeave,
  onQuickSave,
  onUnsave,
  onLocateOnMap,
  alreadySaved,
  zoneLabel,
}: DiscoverResultItemProps) {
  const type = classifyGooglePlace(
    result.types,
    result.displayName,
    result.primaryType,
    result.matchedCategory,
  );
  const hasRating = typeof result.rating === "number" && result.rating > 0;

  return (
    <div
      className={cn(
        "group cursor-pointer rounded-xl border p-2 transition-colors duration-150",
        isSelected
          ? "border-orange/45 bg-orange/10"
          : isHovered
            ? "border-white/15 bg-white/5"
            : "border-border/70 bg-bg-card hover:border-white/15 hover:bg-white/5",
      )}
      onClick={() => onToggleSelect(result.placeId)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onToggleSelect(result.placeId);
        }
      }}
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      onMouseEnter={() => onHoverEnter(result.placeId)}
      onMouseLeave={() => onHoverLeave()}
    >
      <div className="flex items-start gap-2.5">
        <div className="relative h-[68px] w-[68px] shrink-0 overflow-hidden rounded-lg border border-white/10 bg-bg-input">
          {result.photoUri ? (
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url('${result.photoUri}')` }}
              aria-label={result.displayName}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-[9px] font-semibold tracking-[0.08em] text-text-muted uppercase">
              No Photo
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="truncate text-[13px] font-bold text-text-primary">
                {result.displayName}
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-1">
                <span className="rounded-md border border-orange/35 bg-orange/10 px-1.5 py-0 text-[10px] font-semibold text-orange uppercase tracking-[0.05em]">
                  {type}
                </span>
                {hasRating ? (
                  <span className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-1.5 py-0 text-[10px] font-semibold text-[#FFD28A]">
                    <Star className="size-3 fill-current" />
                    {result.rating}
                  </span>
                ) : null}
                {zoneLabel ? (
                  <span className="rounded-md border border-[#7EAFFF]/25 bg-[#7EAFFF]/10 px-1.5 py-0 text-[10px] font-semibold text-[#9EC1FF] uppercase tracking-[0.05em]">
                    {zoneLabel}
                  </span>
                ) : null}
              </div>
            </div>

            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleSelect(result.placeId)}
              onClick={(event) => event.stopPropagation()}
              className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-orange"
              aria-label={`Select ${result.displayName}`}
            />
          </div>

          <div className="mt-1.5 flex items-start gap-1.5 text-[11px] text-text-muted">
            <MapPin className="mt-0.5 size-3.5 shrink-0 text-text-muted" />
            <span className="line-clamp-2">{result.address}</span>
          </div>

          <div className="mt-2 flex items-center justify-between">
            <div className={cn(
              "text-[11px] font-semibold",
              isSelected ? "text-orange" : "text-text-muted",
            )}
            >
              {isSelected ? "Selected" : "Tap to Select"}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  onLocateOnMap(result);
                }}
                className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[#7EAFFF]/35 bg-[#7EAFFF]/10 text-[#9EC1FF] transition-colors hover:bg-[#7EAFFF]/20"
                title="Show on map"
                aria-label={`Show ${result.displayName} on map`}
              >
                <Navigation className="size-3.5" />
              </button>

              {alreadySaved ? (
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    onUnsave(result);
                  }}
                  className="inline-flex h-7 items-center gap-1.5 rounded-md border border-emerald-400/35 bg-emerald-500/10 px-2 text-[11px] font-semibold text-emerald-300 transition-colors hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-300"
                  title="Remove pinned location"
                >
                  <Check className="size-3.5" />
                  Saved
                </button>
              ) : (
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    onQuickSave(result);
                  }}
                  className="inline-flex h-7 items-center gap-1.5 rounded-md border border-orange/40 bg-orange/10 px-2 text-[11px] font-semibold text-orange transition-colors hover:bg-orange/20"
                  title="Save as pin"
                >
                  <Plus className="size-3.5" />
                  Pin
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
