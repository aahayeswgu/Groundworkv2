"use client";

import { useMemo } from "react";
import { useStore } from "@/app/store/index";
import { buildQuickSavePin } from "@/app/features/discover/discover-info";
import { DiscoverResultItem } from "@/app/features/discover/DiscoverResultItem";
import { cancelDiscoverSearch } from "@/app/features/discover/discover-search";
import type { RouteStop } from "@/app/types/route.types";

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
  const addStop = useStore((s) => s.addStop);
  const marathonMode = useStore((s) => s.marathonMode);
  const marathonZones = useStore((s) => s.marathonZones);
  const marathonSearchCount = useStore((s) => s.marathonSearchCount);
  const toggleMarathonMode = useStore((s) => s.toggleMarathonMode);
  const clearMarathonZone = useStore((s) => s.clearMarathonZone);

  // Determine which step to show
  const step = discoverResults.length > 0 ? 3 : searchProgress ? 2 : 1;

  const selectableCount = Math.min(discoverResults.length, 20);
  const allSelected = selectedDiscoverIds.size === selectableCount && selectableCount > 0;

  // Derived: which zone does each placeId belong to?
  const placeZoneLabel = useMemo<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const zone of marathonZones) {
      for (const r of zone.results) {
        if (!map[r.placeId]) map[r.placeId] = zone.label;
      }
    }
    return map;
  }, [marathonZones]);

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
          <button
            onClick={toggleMarathonMode}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-semibold transition-colors ${
              marathonMode
                ? "border-orange bg-orange/10 text-orange"
                : "border-border text-text-secondary hover:border-orange/60"
            }`}
          >
            <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${marathonMode ? "bg-orange border-orange" : "border-text-muted"}`} />
            Marathon Mode {marathonMode ? "ON" : "OFF"}
          </button>
          {marathonMode && (
            <p className="text-xs text-text-muted text-center">
              Draw multiple areas — results accumulate without clearing.
            </p>
          )}
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
          {/* Results header — marathon session or normal */}
          {marathonMode && marathonSearchCount > 0 ? (
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-bg-card shrink-0">
              <div>
                <div className="text-sm font-bold text-orange">Marathon</div>
                <div className="text-xs text-text-secondary">
                  {marathonSearchCount} area{marathonSearchCount !== 1 ? "s" : ""} searched · {discoverResults.length} businesses found
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={selectAllDiscover} className="text-xs text-orange font-semibold hover:underline">
                  {allSelected ? "Deselect All" : "Select All"}
                </button>
                <button
                  onClick={() => { clearDiscover(); }}
                  className="text-xs text-red-400 font-semibold hover:underline"
                >
                  Clear All
                </button>
              </div>
            </div>
          ) : (
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
          )}

          {/* Per-zone summary bar — shown in marathon mode */}
          {marathonMode && marathonZones.length > 0 && (
            <div className="shrink-0 border-b border-border bg-bg-card/60 px-4 py-2 flex flex-col gap-1">
              {marathonZones.map((zone) => (
                <div key={zone.id} className="flex items-center justify-between text-xs">
                  <span className="text-text-secondary font-medium">
                    {zone.label} — {zone.resultCount} result{zone.resultCount !== 1 ? "s" : ""}
                  </span>
                  <button
                    onClick={() => {
                      const zoneIds = new Set(zone.results.map((r) => r.placeId));
                      const remaining = useStore.getState().discoverResults.filter(
                        (r) => !zoneIds.has(r.placeId)
                      );
                      useStore.getState().setDiscoverResults(remaining);
                      clearMarathonZone(zone.id);
                    }}
                    className="text-red-400 hover:underline ml-3"
                  >
                    Clear
                  </button>
                </div>
              ))}
            </div>
          )}

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
                  zoneLabel={placeZoneLabel[result.placeId]}
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
                onClick={() => {
                  for (const id of selectedDiscoverIds) {
                    const result = discoverResults.find((r) => r.placeId === id);
                    if (!result) continue;
                    const stop: RouteStop = {
                      id: `discover_${result.placeId}`,
                      label: result.displayName,
                      address: result.address ?? "",
                      lat: result.lat,
                      lng: result.lng,
                    };
                    const added = addStop(stop);
                    if (!added) break; // cap reached — stop adding
                  }
                }}
                className="px-4 py-1.5 rounded-lg bg-orange text-white text-sm font-bold hover:bg-orange/90 transition-colors"
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
