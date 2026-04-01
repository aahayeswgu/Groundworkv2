"use client";

import { useStore } from "@/app/store/index";
import { buildQuickSavePin } from "@/app/features/discover/discover-info";
import { DiscoverResultItem } from "@/app/features/discover/DiscoverResultItem";
import { cancelDiscoverSearch } from "@/app/features/discover/discover-search";

export default function DiscoverPanel() {
  const discoverResults = useStore((s) => s.discoverResults);
  const selectedDiscoverIds = useStore((s) => s.selectedDiscoverIds);
  const hoveredDiscoverId = useStore((s) => s.hoveredDiscoverId);
  const searchProgress = useStore((s) => s.searchProgress);
  const toggleDiscoverSelected = useStore((s) => s.toggleDiscoverSelected);
  const selectAllDiscover = useStore((s) => s.selectAllDiscover);
  const setHoveredDiscoverId = useStore((s) => s.setHoveredDiscoverId);
  const clearDiscover = useStore((s) => s.clearDiscover);
  const setDiscoverMode = useStore((s) => s.setDiscoverMode);
  const addPin = useStore((s) => s.addPin);
  const deletePin = useStore((s) => s.deletePin);
  const pins = useStore((s) => s.pins);

  // Determine which step to show
  const step = discoverResults.length > 0 ? 3 : searchProgress ? 2 : 1;

  const selectableCount = Math.min(discoverResults.length, 20);
  const allSelected = selectedDiscoverIds.size === selectableCount && selectableCount > 0;

  return (
    <div className="flex flex-col h-full">
      {/* Step 1: Draw area prompt */}
      {step === 1 && (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6 gap-4">
          <div className="text-4xl">🗺️</div>
          <div className="text-text-primary font-bold text-base">Draw a search area</div>
          <div className="text-text-secondary text-sm">
            Click and drag on the map to draw a rectangle around the area you want to search.
          </div>
        </div>
      )}

      {/* Step 2: Searching progress */}
      {step === 2 && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-4">
          <div className="text-text-primary text-sm font-semibold text-center">{searchProgress}</div>
          <div className="text-text-muted text-xs">This may take a moment...</div>
          <button
            onClick={() => {
              cancelDiscoverSearch();
              setDiscoverMode(false);
              clearDiscover();
            }}
            className="mt-2 px-4 py-1.5 rounded-lg border border-red-400 text-red-400 text-xs font-bold hover:bg-red-400/10 transition-colors"
          >
            Stop Search
          </button>
        </div>
      )}

      {/* Step 3: Results list */}
      {step === 3 && (
        <>
          {/* Results header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-bg-card shrink-0">
            <div className="text-sm font-bold text-text-primary">
              {discoverResults.length} businesses found
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={selectAllDiscover}
                className="text-xs text-orange font-semibold hover:underline"
              >
                {allSelected ? "Deselect All" : "Select All"}
              </button>
              <button
                onClick={() => {
                  clearDiscover();
                  setDiscoverMode(false);
                }}
                className="text-xs text-text-muted hover:text-red-400"
              >
                Close
              </button>
            </div>
          </div>

          {/* Scrollable results list */}
          <div className="flex-1 overflow-y-auto">
            {discoverResults.map((result) => {
              const alreadySaved = pins.some(
                (p) =>
                  p.title.toLowerCase() === result.displayName.toLowerCase() ||
                  (Math.abs(p.lat - result.lat) < 0.001 && Math.abs(p.lng - result.lng) < 0.001),
              );
              return (
                <DiscoverResultItem
                  key={result.placeId}
                  result={result}
                  isSelected={selectedDiscoverIds.has(result.placeId)}
                  isHovered={hoveredDiscoverId === result.placeId}
                  onToggleSelect={toggleDiscoverSelected}
                  onHoverEnter={setHoveredDiscoverId}
                  onHoverLeave={() => setHoveredDiscoverId(null)}
                  onQuickSave={(r) => {
                    const currentPins = useStore.getState().pins;
                    const dup = currentPins.some(
                      (p) =>
                        p.title.toLowerCase() === r.displayName.toLowerCase() ||
                        (Math.abs(p.lat - r.lat) < 0.001 && Math.abs(p.lng - r.lng) < 0.001),
                    );
                    if (!dup) addPin(buildQuickSavePin(r));
                  }}
                  onUnsave={(r) => {
                    const match = useStore.getState().pins.find(
                      (p) =>
                        p.title.toLowerCase() === r.displayName.toLowerCase() ||
                        (Math.abs(p.lat - r.lat) < 0.001 && Math.abs(p.lng - r.lng) < 0.001),
                    );
                    if (match) deletePin(match.id);
                  }}
                  alreadySaved={alreadySaved}
                />
              );
            })}
          </div>

          {/* Sticky bottom bar — shown when items are selected */}
          {selectedDiscoverIds.size > 0 && (
            <div className="shrink-0 border-t border-border bg-bg-card px-4 py-3 flex items-center justify-between">
              <span className="text-sm text-text-secondary">
                {selectedDiscoverIds.size} selected
              </span>
              <button
                disabled
                title="Coming in Phase 5"
                className="px-4 py-1.5 rounded-lg bg-orange text-white text-sm font-bold opacity-50 cursor-not-allowed"
              >
                Route {selectedDiscoverIds.size} Stop{selectedDiscoverIds.size !== 1 ? "s" : ""}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
