"use client";

import { useCallback, useMemo, useState } from "react";
import { useStore } from "@/app/store";
import { buildQuickSavePin } from "@/app/features/discover/lib/discover-info";
import { DiscoverResultItem } from "@/app/features/discover/ui/DiscoverResultItem";
import { cancelDiscoverSearch } from "@/app/features/discover/api/discover-search";
import { Button } from "@/app/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/app/shared/ui/card";
import { Loader2Icon } from "lucide-react";
import {
  addSelectedDiscoverResultsToRoute,
  getRouteSelectionMessage,
} from "@/app/features/discover/lib/discover-route-selection";
import {
  useDiscoverActions,
  useDiscoverResults,
  useHoveredDiscoverId,
  useMarathonMode,
  useMarathonSearchCount,
  useMarathonZones,
  useSearchProgress,
  useSelectedDiscoverIds,
} from "@/app/features/discover/model/discover.selectors";
import {
  useRouteActions,
  useRouteStops,
} from "@/app/features/route/model/route.selectors";

interface DiscoverPanelProps {
  onOpenRouteBuilder?: () => void;
}

export default function DiscoverPanel({ onOpenRouteBuilder }: DiscoverPanelProps) {
  const discoverResults = useDiscoverResults();
  const selectedDiscoverIds = useSelectedDiscoverIds();
  const hoveredDiscoverId = useHoveredDiscoverId();
  const searchProgress = useSearchProgress();
  const {
    toggleDiscoverSelected,
    selectAllDiscover,
    setHoveredDiscoverId,
    clearDiscover,
    setDiscoverMode,
    setDiscoverResults,
    toggleMarathonMode,
    clearMarathonZone,
  } = useDiscoverActions();
  const addPin = useStore((s) => s.addPin);
  const deletePin = useStore((s) => s.deletePin);
  const pins = useStore((s) => s.pins);
  const routeStops = useRouteStops();
  const { addStop } = useRouteActions();
  const marathonMode = useMarathonMode();
  const marathonZones = useMarathonZones();
  const marathonSearchCount = useMarathonSearchCount();
  const [routeActionMessage, setRouteActionMessage] = useState<string | null>(null);

  // Determine which step to show
  const step = discoverResults.length > 0 ? 3 : searchProgress ? 2 : 1;

  const selectableCount = Math.min(discoverResults.length, 20);
  const allSelected = selectedDiscoverIds.size === selectableCount && selectableCount > 0;
  const progressMatch = searchProgress?.match(/\[(\d+)\/(\d+)\]/);
  const completedSearchSteps = progressMatch ? Number(progressMatch[1]) : 0;
  const totalSearchSteps = progressMatch ? Number(progressMatch[2]) : 0;
  const searchProgressPercent = totalSearchSteps > 0
    ? Math.max(0, Math.min(100, Math.round((completedSearchSteps / totalSearchSteps) * 100)))
    : 0;

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

  const openRouteBuilder = useCallback(() => {
    setDiscoverMode(false);
    onOpenRouteBuilder?.();
  }, [setDiscoverMode, onOpenRouteBuilder]);

  const addSelectedStopsToRoute = useCallback((openBuilderAfterAdd: boolean) => {
    if (selectedDiscoverIds.size === 0) return;

    const addResult = addSelectedDiscoverResultsToRoute({
      selectedDiscoverIds,
      discoverResults,
      existingRouteStops: routeStops,
      addStop,
    });
    setRouteActionMessage(getRouteSelectionMessage(addResult));

    if (openBuilderAfterAdd && (addResult.addedCount > 0 || addResult.alreadyInRouteCount > 0 || routeStops.length > 0)) {
      openRouteBuilder();
    }
  }, [selectedDiscoverIds, routeStops, discoverResults, addStop, openRouteBuilder]);

  return (
    <div className="flex h-full min-h-0 flex-col">
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
        <div className="flex-1 flex items-center justify-center px-4 py-6">
          <Card className="w-full max-w-sm bg-bg-card/95 ring-1 ring-border/70 shadow-gw-lg">
            <CardHeader className="gap-2 border-b border-border/70 pb-3">
              <CardTitle className="flex items-center gap-2 text-text-primary">
                <Loader2Icon className="size-4 animate-spin text-orange" />
                Discovering Businesses
              </CardTitle>
              <CardDescription className="text-xs text-text-secondary">
                Searching your selected area for nearby contractors and trade businesses.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              <div className="rounded-md border border-border/70 bg-bg px-3 py-2 text-center text-sm font-semibold text-text-primary">
                {searchProgress}
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-bg">
                <div
                  className="h-full rounded-full bg-orange transition-[width] duration-300 ease-out"
                  style={{ width: `${searchProgressPercent}%` }}
                />
              </div>
              <div className="text-center text-xs text-text-muted">
                {totalSearchSteps > 0
                  ? `${completedSearchSteps} of ${totalSearchSteps} query groups completed`
                  : "Initializing search..."}
              </div>
            </CardContent>
            <CardFooter className="border-t border-border/70 bg-bg-card/70">
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => {
                  cancelDiscoverSearch();
                  setDiscoverMode(false);
                  clearDiscover();
                }}
              >
                Stop Search
              </Button>
            </CardFooter>
          </Card>
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
                      const remaining = discoverResults.filter(
                        (r) => !zoneIds.has(r.placeId)
                      );
                      setDiscoverResults(remaining);
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
          <div className="min-h-0 flex-1 overflow-y-auto">
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
                    const dup = pins.some(
                      (p) =>
                        p.title.toLowerCase() === r.displayName.toLowerCase() ||
                        (Math.abs(p.lat - r.lat) < 0.001 && Math.abs(p.lng - r.lng) < 0.001),
                    );
                    if (!dup) addPin(buildQuickSavePin(r));
                  }}
                  onUnsave={(r) => {
                    const match = pins.find(
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

          {/* Bottom action bar — always visible so route CTA is discoverable */}
          <div className="sticky bottom-0 z-10 shrink-0 border-t border-border bg-bg-card px-4 py-3">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-sm text-text-secondary">
                <span>{selectedDiscoverIds.size} selected</span>
                <span>{routeStops.length} in route</span>
              </div>
              {routeActionMessage && (
                <div className="rounded-md border border-orange/30 bg-orange-dim px-3 py-2 text-xs font-semibold text-orange">
                  {routeActionMessage}
                </div>
              )}
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Button
                  variant="outline"
                  disabled={selectedDiscoverIds.size === 0}
                  onClick={() => addSelectedStopsToRoute(false)}
                  className="w-full"
                >
                  Add Only
                </Button>
                <Button
                  disabled={selectedDiscoverIds.size === 0}
                  onClick={() => addSelectedStopsToRoute(true)}
                  className="w-full bg-orange text-white hover:bg-orange/90"
                >
                  Add + Open Route Builder
                </Button>
              </div>
              {routeStops.length > 0 && (
                <Button
                  variant="secondary"
                  onClick={openRouteBuilder}
                  className="w-full"
                >
                  Open Route Builder ({routeStops.length})
                </Button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
