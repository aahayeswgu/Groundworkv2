"use client";

import { useCallback, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
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
import {
  ArrowRight,
  Check,
  ChevronDown,
  Loader2Icon,
  Plus,
  RotateCcw,
} from "lucide-react";
import {
  dispatchMapMobileAction,
  dispatchOpenMobileTab,
  dispatchPanToLocation,
} from "@/app/shared/model/mobile-events";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/shared/ui/dropdown-menu";
import {
  addSelectedDiscoverResultsToRoute,
  getRouteSelectionMessage,
} from "@/app/features/discover/lib/discover-route-selection";
import {
  createSavedDiscoverIdSet,
  getVisibleDiscoverResults,
  isDiscoverResultAlreadyPinned,
} from "@/app/features/discover/lib/discover-panel";
import {
  DISCOVER_SORT_OPTIONS,
  type DiscoverSortKey,
} from "@/app/features/discover/model/discover-panel.model";
import {
  useDiscoverActions,
  useDiscoverResults,
  useHoveredDiscoverId,
  useMarathonMode,
  useMarathonSearchCount,
  useMarathonZones,
  useSearchProgress,
  useSelectedDiscoverIds,
} from "@/app/features/discover/model/discover.hooks";
import {
  useRouteActions,
  useRouteStops,
} from "@/app/features/route/model/route.hooks";
import type { DiscoverResult } from "@/app/features/discover/model/discover.types";

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
  const [sortKey, setSortKey] = useState<DiscoverSortKey>("recommended");
  const [selectedOnly, setSelectedOnly] = useState(false);
  const [savedOnly, setSavedOnly] = useState(false);

  // Determine which step to show
  const step = discoverResults.length > 0 ? 3 : searchProgress ? 2 : 1;

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

  const savedDiscoverIds = useMemo(
    () => createSavedDiscoverIdSet(discoverResults, pins),
    [discoverResults, pins],
  );

  const visibleResults = useMemo(
    () =>
      getVisibleDiscoverResults({
        discoverResults,
        selectedDiscoverIds,
        savedDiscoverIds,
        selectedOnly,
        savedOnly,
        sortKey,
      }),
    [discoverResults, selectedDiscoverIds, savedDiscoverIds, selectedOnly, savedOnly, sortKey],
  );

  const selectableVisibleResults = useMemo(
    () => visibleResults.slice(0, 20),
    [visibleResults],
  );

  const allVisibleSelected = useMemo(
    () =>
      selectableVisibleResults.length > 0 &&
      selectableVisibleResults.every((result) => selectedDiscoverIds.has(result.placeId)),
    [selectableVisibleResults, selectedDiscoverIds],
  );

  const activeSortLabel = useMemo(
    () => DISCOVER_SORT_OPTIONS.find((option) => option.key === sortKey)?.label ?? "Recommended",
    [sortKey],
  );

  const openRouteBuilder = useCallback(() => {
    setDiscoverMode(false);
    onOpenRouteBuilder?.();
  }, [setDiscoverMode, onOpenRouteBuilder]);

  const startDiscoverDraw = useCallback(() => {
    cancelDiscoverSearch();
    clearDiscover();
    setRouteActionMessage(null);

    const isMobileViewport = window.matchMedia("(max-width: 1024px)").matches;
    if (isMobileViewport) {
      dispatchOpenMobileTab("map");
      window.setTimeout(() => {
        dispatchMapMobileAction("restart-discover");
      }, 0);
      return;
    }

    dispatchMapMobileAction("restart-discover");
  }, [clearDiscover]);

  const toggleSelectVisible = useCallback(() => {
    if (!selectableVisibleResults.length) return;
    const shouldSelectAll = !allVisibleSelected;
    for (const result of selectableVisibleResults) {
      const isSelected = selectedDiscoverIds.has(result.placeId);
      if (shouldSelectAll && !isSelected) {
        toggleDiscoverSelected(result.placeId);
      } else if (!shouldSelectAll && isSelected) {
        toggleDiscoverSelected(result.placeId);
      }
    }
  }, [allVisibleSelected, selectableVisibleResults, selectedDiscoverIds, toggleDiscoverSelected]);

  const clearViewFilters = useCallback(() => {
    setSelectedOnly(false);
    setSavedOnly(false);
    setSortKey("recommended");
  }, []);

  const jumpToResultOnMap = useCallback((result: DiscoverResult) => {
    setHoveredDiscoverId(result.placeId);
    const isMobileViewport = window.matchMedia("(max-width: 1024px)").matches;
    if (isMobileViewport) {
      dispatchOpenMobileTab("map");
      window.setTimeout(() => {
        dispatchPanToLocation(result.lat, result.lng, 16, result.displayName);
      }, 0);
      return;
    }
    dispatchPanToLocation(result.lat, result.lng, 16, result.displayName);
  }, [setHoveredDiscoverId]);

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
          <Button
            type="button"
            onClick={startDiscoverDraw}
            className="h-10 min-w-[170px] rounded-xl border border-orange bg-orange text-white hover:bg-orange/90 hover:text-white"
          >
            Draw Area
          </Button>
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
          <div className="shrink-0 border-b border-border bg-bg-card px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-bold text-text-primary">
                  {visibleResults.length} visible
                  <span className="ml-1 text-text-muted/80">/ {discoverResults.length} businesses</span>
                </div>
                {marathonMode && marathonSearchCount > 0 ? (
                  <div className="mt-0.5 text-xs text-text-secondary">
                    Marathon: {marathonSearchCount} area{marathonSearchCount !== 1 ? "s" : ""} searched
                  </div>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleSelectVisible}
                  className="text-xs font-semibold text-orange transition-colors hover:text-orange/85 hover:underline"
                >
                  {allVisibleSelected ? "Deselect Visible" : "Select Visible"}
                </button>
                <button
                  onClick={() => {
                    clearDiscover();
                    setDiscoverMode(false);
                  }}
                  className="text-xs text-text-muted transition-colors hover:text-red-400"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setSelectedOnly((prev) => !prev)}
                className={
                  selectedOnly
                    ? "border border-orange/45 bg-orange/15 text-orange hover:bg-orange/20"
                    : "border border-white/12 bg-white/5 text-text-secondary hover:bg-white/10 hover:text-white"
                }
              >
                {selectedOnly ? <Check className="size-3.5 text-orange" /> : null}
                Selected
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setSavedOnly((prev) => !prev)}
                className={
                  savedOnly
                    ? "border border-emerald-400/40 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/20"
                    : "border border-white/12 bg-white/5 text-text-secondary hover:bg-white/10 hover:text-white"
                }
              >
                {savedOnly ? <Check className="size-3.5 text-emerald-300" /> : null}
                Saved
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="border border-white/12 bg-white/5 text-text-secondary hover:bg-white/10 hover:text-white"
                  >
                    {activeSortLabel}
                    <ChevronDown className="size-3.5 text-text-muted" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="min-w-[220px] rounded-xl border border-white/10 bg-[#202632] p-1.5 text-white shadow-[0_18px_45px_rgba(0,0,0,0.45)] [--accent:rgba(255,255,255,0.12)] [--accent-foreground:#ffffff]"
                >
                  {DISCOVER_SORT_OPTIONS.map((option) => (
                    <DropdownMenuItem
                      key={option.key}
                      onSelect={() => setSortKey(option.key)}
                      className="gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-semibold text-white focus:bg-white/10 focus:text-white"
                    >
                      {sortKey === option.key ? <Check className="size-3.5 text-[#7FB0FF]" /> : <span className="size-3.5" />}
                      {option.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              {(selectedOnly || savedOnly || sortKey !== "recommended") ? (
                <button
                  type="button"
                  onClick={clearViewFilters}
                  className="text-[11px] font-semibold text-text-muted transition-colors hover:text-white"
                >
                  Clear Filters
                </button>
              ) : null}
            </div>
          </div>

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
          <div className="min-h-0 flex-1 overflow-y-auto px-2.5 py-2.5">
            {visibleResults.length === 0 ? (
              <div className="flex h-full min-h-[180px] items-center justify-center">
                <div className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-5 text-center">
                  <div className="text-sm font-semibold text-text-primary">No results match these filters</div>
                  <div className="mt-1 text-xs text-text-muted">
                    Try clearing filters or adjust your sort and selection view.
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={clearViewFilters}
                    className="mt-3 border border-white/12 bg-white/5 text-text-secondary hover:bg-white/10 hover:text-white"
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <AnimatePresence initial={false}>
                  {visibleResults.map((result, index) => {
                    const alreadySaved = savedDiscoverIds.has(result.placeId);
                    return (
                      <motion.div
                        key={result.placeId}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.16, delay: index < 6 ? index * 0.02 : 0 }}
                      >
                        <DiscoverResultItem
                          result={result}
                          isSelected={selectedDiscoverIds.has(result.placeId)}
                          isHovered={hoveredDiscoverId === result.placeId}
                          onToggleSelect={toggleDiscoverSelected}
                          onHoverEnter={setHoveredDiscoverId}
                          onHoverLeave={() => setHoveredDiscoverId(null)}
                          onQuickSave={(nextResult) => {
                            if (!isDiscoverResultAlreadyPinned(nextResult, pins)) {
                              addPin(buildQuickSavePin(nextResult));
                            }
                          }}
                          onLocateOnMap={jumpToResultOnMap}
                          onUnsave={(nextResult) => {
                            const match = pins.find(
                              (pin) =>
                                pin.title.toLowerCase() === nextResult.displayName.toLowerCase() ||
                                (
                                  Math.abs(pin.lat - nextResult.lat) < 0.001 &&
                                  Math.abs(pin.lng - nextResult.lng) < 0.001
                                ),
                            );
                            if (match) {
                              deletePin(match.id);
                            }
                          }}
                          alreadySaved={alreadySaved}
                          zoneLabel={placeZoneLabel[result.placeId]}
                        />
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
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
                  className="h-9 w-full justify-center gap-2 rounded-xl border-white/12 bg-white/5 text-white hover:border-white/20 hover:bg-white/10 hover:text-white"
                >
                  <Plus className="size-4 text-orange" />
                  Add Only
                </Button>
                <Button
                  variant="secondary"
                  onClick={startDiscoverDraw}
                  className="h-9 w-full justify-center gap-2 rounded-xl border border-white/12 bg-white/5 text-[#C4CCDA] hover:border-white/20 hover:bg-white/10 hover:text-white"
                >
                  <RotateCcw className="size-4 text-[#9EC1FF]" />
                  Redraw
                </Button>
              </div>
              <Button
                disabled={selectedDiscoverIds.size === 0}
                onClick={() => addSelectedStopsToRoute(true)}
                className="h-10 w-full justify-center gap-2 rounded-xl border border-orange bg-orange text-white hover:bg-orange/90 hover:text-white"
              >
                <ArrowRight className="size-4" />
                Add + Route
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
