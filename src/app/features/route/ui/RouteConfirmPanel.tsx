"use client";

import { useState, useCallback, useEffect, useMemo, useRef, type TouchEvent } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useIsMobile } from "@/app/shared/lib/use-is-mobile";
import {
  buildAppleMapsDirectionsUrl,
  getMapsRuntimePlatform,
  resolveMapsProviderForPlatform,
} from "@/app/shared/lib/maps-links";
import { MobileBottomSheet } from "@/app/shared/ui/mobile-bottom-sheet";
import {
  MOBILE_SHEET_SNAP_INDEX,
  MOBILE_SHEET_SNAP_POINTS,
} from "@/app/shared/model/mobile-sheet";
import { useStore } from "@/app/store";
import { computeRoute, RouteComputeError } from "@/app/features/route/api/route-service";
import { buildGoogleMapsUrl, buildGoogleMapsUrlWithoutOrigin } from "@/app/features/route/lib/route-url";
import { forwardGeocode, getCurrentGpsPosition } from "@/app/shared/api/geocoding";
import PlacesAutocomplete from "@/app/features/route/ui/PlacesAutocomplete";
import {
  useCustomStartAddress,
  useOptimizeRoute,
  useRouteActive,
  useRouteActions,
  useRouteResult,
  useRouteStops,
  useStartMode,
} from "@/app/features/route/model/route.hooks";
import {
  useMapsProvider,
  usePlannerActions,
  usePlannerDays,
  useTrackingEnabled,
} from "@/app/features/planner/model/planner.hooks";
import type { RouteStop } from "@/app/features/route/model/route.types";
import { ArrowRight, Calendar, ExternalLink, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface RouteConfirmPanelProps {
  open?: boolean;
  onClose?: () => void;
  inline?: boolean;
  mobileSheetSnapIndex?: number | null;
  onRequestExpand?: () => void;
}

type ResolvedOrigin = {
  address?: string;
  lat?: number;
  lng?: number;
};

type OptimizationSnapshot = {
  key: string;
  origin: ResolvedOrigin;
};

const GPS_ORIGIN_CACHE_TTL_MS = 60_000;

function isSameStopOrder(a: RouteStop[], b: RouteStop[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((stop, index) => stop.id === b[index]?.id);
}

// ---- SortableStopRow (inline sub-component) ----
function SortableStopRow({
  stop,
  index,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  onRemove,
  reorderingDisabled,
  enableSwipeRemove,
}: {
  stop: RouteStop;
  index: number;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onRemove: (id: string) => void;
  reorderingDisabled: boolean;
  enableSwipeRemove: boolean;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: stop.id, disabled: reorderingDisabled });
  const dragHandleProps = reorderingDisabled ? {} : { ...attributes, ...listeners };
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : reorderingDisabled ? 0.7 : 1,
  };

  function handleTouchStart(event: TouchEvent<HTMLDivElement>) {
    if (!enableSwipeRemove) return;
    const touch = event.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  }

  function handleTouchEnd(event: TouchEvent<HTMLDivElement>) {
    if (!enableSwipeRemove) return;
    if (!touchStartRef.current) return;
    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    touchStartRef.current = null;
    const removeGesture =
      deltaX <= -68 &&
      Math.abs(deltaX) > Math.abs(deltaY) * 1.3 &&
      Math.abs(deltaY) <= 44;
    if (removeGesture) {
      onRemove(stop.id);
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 border-b border-border px-4 py-3 touch-pan-y"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        {...dragHandleProps}
        disabled={reorderingDisabled}
        aria-label={`Drag to reorder ${stop.label}`}
        className={`w-7 h-7 rounded-full bg-orange text-white text-xs font-bold flex items-center justify-center shrink-0 select-none ${
          reorderingDisabled
            ? "cursor-not-allowed opacity-70"
            : "cursor-grab active:cursor-grabbing touch-none"
        }`}
        title={reorderingDisabled ? "Turn off optimization to reorder manually." : "Drag to reorder"}
      >
        {index + 1}
      </button>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-text-primary truncate">{stop.label}</div>
        {stop.address && (
          <div className="text-xs text-text-muted truncate">{stop.address}</div>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => onMoveUp(stop.id)}
          disabled={reorderingDisabled || !canMoveUp}
          aria-label={`Move ${stop.label} up`}
          className="rounded p-1 text-text-muted transition-colors hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-30"
          title={reorderingDisabled ? "Turn off optimization to reorder manually." : "Move up"}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="18 15 12 9 6 15" />
          </svg>
        </button>
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => onMoveDown(stop.id)}
          disabled={reorderingDisabled || !canMoveDown}
          aria-label={`Move ${stop.label} down`}
          className="rounded p-1 text-text-muted transition-colors hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-30"
          title={reorderingDisabled ? "Turn off optimization to reorder manually." : "Move down"}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()} // prevent drag from stealing remove click
          onClick={() => onRemove(stop.id)}
          aria-label={`Remove ${stop.label}`}
          className="rounded p-1 text-text-muted transition-colors hover:text-red-400"
          title="Remove stop"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ---- RouteConfirmPanel ----
export default function RouteConfirmPanel({
  open = false,
  onClose,
  inline = false,
  mobileSheetSnapIndex = null,
  onRequestExpand,
}: RouteConfirmPanelProps) {
  const isMobile = useIsMobile();
  const routeStops = useRouteStops();
  const routeResult = useRouteResult();
  const routeActive = useRouteActive();
  const optimizeRoute = useOptimizeRoute();
  const startMode = useStartMode();
  const customStartAddress = useCustomStartAddress();
  const profile = useStore((s) => s.profile);
  const {
    reorderStops,
    removeStop,
    setRouteResult,
    setRouteActive,
    setStartMode,
    setCustomStartAddress,
    setShareableUrl,
    setOptimizeRoute,
    clearRoute,
  } = useRouteActions();
  const plannerDays = usePlannerDays();
  const mapsProvider = useMapsProvider();
  const { addPlannerStop, setActivePlannerDate, addActivityEntry } = usePlannerActions();
  const trackingEnabled = useTrackingEnabled();

  const [isBuilding, setIsBuilding] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [showMoreActions, setShowMoreActions] = useState(false);
  const [localMobileSnapIndex, setLocalMobileSnapIndex] = useState<number>(MOBILE_SHEET_SNAP_INDEX.low);
  const [buildError, setBuildError] = useState<string | null>(null);
  const startAddressInputRef = useRef<HTMLInputElement | null>(null);
  const openMapsButtonRef = useRef<HTMLButtonElement | null>(null);
  const didAutoFocusRef = useRef(false);
  const gpsOriginCacheRef = useRef<{ origin: ResolvedOrigin; fetchedAt: number } | null>(null);
  const gpsOriginRequestRef = useRef<Promise<ResolvedOrigin | null> | null>(null);
  const optimizationRequestIdRef = useRef(0);
  const optimizationSnapshotRef = useRef<OptimizationSnapshot | null>(null);
  const mapsRuntimePlatform = useMemo(() => getMapsRuntimePlatform(), []);
  const effectiveMapsProvider = resolveMapsProviderForPlatform(mapsProvider, mapsRuntimePlatform);
  const isPanelVisible = inline || open;
  const fallbackMobileSnapIndex = MOBILE_SHEET_SNAP_INDEX.low;
  const effectiveMobileSnapIndex =
    mobileSheetSnapIndex !== null ? mobileSheetSnapIndex : (localMobileSnapIndex ?? fallbackMobileSnapIndex);
  const isCompactMobileSheet = isMobile && effectiveMobileSnapIndex <= 1;

  const sensors = useSensors(useSensor(PointerSensor));

  const startAddressInput = customStartAddress.trim();
  const homeAddress = profile?.homebase?.trim() ?? "";
  const missingStartRequirement =
    startMode === "home"
      ? !(homeAddress || startAddressInput)
      : startMode === "custom"
      ? !startAddressInput
      : false;
  const startValidationMessage = startMode === "home"
    ? "Set a home base address in Settings > Profile, or enter one here."
    : "Enter a starting address.";
  const isBusy = isBuilding || isOptimizing;
  const reorderingDisabled = optimizeRoute || isBusy;
  const disableOpenMapsAction =
    isBusy || routeStops.length === 0 || (optimizeRoute && missingStartRequirement);

  useEffect(() => {
    if (!inline && !open) {
      didAutoFocusRef.current = false;
      return;
    }
    if (routeStops.length === 0) {
      didAutoFocusRef.current = false;
      return;
    }
    if (didAutoFocusRef.current) return;

    didAutoFocusRef.current = true;
    const focusTarget = () => {
      if ((startMode === "home" || startMode === "custom") && missingStartRequirement) {
        startAddressInputRef.current?.focus();
        startAddressInputRef.current?.select();
        return;
      }
      openMapsButtonRef.current?.focus();
    };

    const timeoutId = window.setTimeout(focusTarget, 80);
    return () => window.clearTimeout(timeoutId);
  }, [inline, open, routeStops.length, startMode, missingStartRequirement]);

  useEffect(() => {
    if (routeStops.length === 0) {
      setShowMoreActions(false);
    }
  }, [routeStops.length]);

  useEffect(() => {
    if (!showMoreActions) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowMoreActions(false);
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [showMoreActions]);

  const resolveGpsOrigin = useCallback(
    async ({ showError }: { showError: boolean }): Promise<ResolvedOrigin | null> => {
      const cached = gpsOriginCacheRef.current;
      if (cached && Date.now() - cached.fetchedAt <= GPS_ORIGIN_CACHE_TTL_MS) {
        return cached.origin;
      }

      if (gpsOriginRequestRef.current) {
        return await gpsOriginRequestRef.current;
      }

      const request = (async () => {
        try {
          const pos = await getCurrentGpsPosition();
          const origin = { lat: pos.lat, lng: pos.lng };
          gpsOriginCacheRef.current = { origin, fetchedAt: Date.now() };
          return origin;
        } catch (err) {
          if (showError) {
            setBuildError(err instanceof Error ? err.message : "Could not get GPS location.");
          }
          return null;
        } finally {
          gpsOriginRequestRef.current = null;
        }
      })();

      gpsOriginRequestRef.current = request;
      return await request;
    },
    [],
  );

  useEffect(() => {
    if (!isPanelVisible) return;
    if (startMode !== "gps") return;
    void resolveGpsOrigin({ showError: false });
  }, [isPanelVisible, startMode, resolveGpsOrigin]);

  const handleStartModeSelect = useCallback(
    (mode: "home" | "gps" | "custom") => {
      setStartMode(mode);
      if (mode === "gps") {
        void resolveGpsOrigin({ showError: false });
      }
    },
    [setStartMode, resolveGpsOrigin],
  );

  const resolveOrigin = useCallback(async (): Promise<ResolvedOrigin | null> => {
    if (startMode === "home") {
      // Use profile homebase first, fall back to customStartAddress
      const homeAddr = profile?.homebase?.trim() || customStartAddress.trim();
      if (!homeAddr) {
        setBuildError("Set a home base address in Settings > Profile, or switch to Custom start.");
        return null;
      }
      return { address: homeAddr };
    }
    if (startMode === "gps") {
      return await resolveGpsOrigin({ showError: true });
    }
    // custom
    if (!customStartAddress.trim()) {
      setBuildError("Enter a starting address.");
      return null;
    }
    const coords = await forwardGeocode(customStartAddress.trim());
    if (!coords) {
      setBuildError("Could not find that address. Try a more specific address.");
      return null;
    }
    return coords;
  }, [startMode, customStartAddress, profile?.homebase, resolveGpsOrigin]);

  const getOptimizationKey = useCallback((stops: RouteStop[]) => {
    const stopKey = stops.map((stop) => stop.id).join("|");
    const normalizedStartAddress = startMode === "home"
      ? (profile?.homebase?.trim() || customStartAddress.trim())
      : startMode === "custom"
      ? customStartAddress.trim()
      : "gps";
    return `${startMode}:${normalizedStartAddress}|${stopKey}`;
  }, [startMode, profile?.homebase, customStartAddress]);

  const computeRouteResult = useCallback(
    async (origin: ResolvedOrigin, stops: RouteStop[], shouldOptimize: boolean) => {
      try {
        return await computeRoute(origin, stops, { optimizeWaypointOrder: shouldOptimize });
      } catch (err) {
        if (err instanceof RouteComputeError && err.code === "routes-permission-denied") {
          setBuildError(
            "Routes API is blocked for this key/project. Enable Routes API and allow it in API key restrictions, then retry.",
          );
          return null;
        }
        if (err instanceof RouteComputeError && err.code === "routes-library-unavailable") {
          setBuildError("Routes library is unavailable. Reload and try again.");
          return null;
        }
        setBuildError("Could not calculate route. Check your connection and try again.");
        return null;
      }
    },
    [],
  );

  const getOptimizedStops = useCallback((stops: RouteStop[], optimizedOrder: number[]) => {
    if (optimizedOrder.length === 0) return stops;
    const optimized = optimizedOrder.map((idx) => stops[idx]).filter(Boolean);
    if (optimized.length !== stops.length) return stops;
    return optimized;
  }, []);

  const maybeOptimizeStopsForAction = useCallback(async () => {
    if (!optimizeRoute) {
      return { stops: routeStops, result: null as Awaited<ReturnType<typeof computeRoute>> | null, origin: null as ResolvedOrigin | null };
    }
    const optimizationKey = getOptimizationKey(routeStops);
    const cachedSnapshot = optimizationSnapshotRef.current;
    if (cachedSnapshot && cachedSnapshot.key === optimizationKey && routeResult && routeActive) {
      return {
        stops: routeStops,
        result: routeResult,
        origin: cachedSnapshot.origin,
      };
    }
    if (missingStartRequirement) {
      setBuildError(startValidationMessage);
      return null;
    }
    const origin = await resolveOrigin();
    if (!origin) return null;
    const result = await computeRouteResult(origin, routeStops, true);
    if (!result) return null;
    const optimizedStops = getOptimizedStops(routeStops, result.optimizedOrder);
    const finalizedOptimizationKey = getOptimizationKey(optimizedStops);
    optimizationSnapshotRef.current = { key: finalizedOptimizationKey, origin };
    if (!isSameStopOrder(optimizedStops, routeStops)) {
      reorderStops(optimizedStops);
    }
    setRouteResult(result);
    setRouteActive(true);
    return { stops: optimizedStops, result, origin };
  }, [
    optimizeRoute,
    routeStops,
    getOptimizationKey,
    routeResult,
    routeActive,
    missingStartRequirement,
    startValidationMessage,
    resolveOrigin,
    computeRouteResult,
    getOptimizedStops,
    reorderStops,
    setRouteResult,
    setRouteActive,
  ]);

  useEffect(() => {
    if (!optimizeRoute || !isPanelVisible || routeStops.length === 0) {
      setIsOptimizing(false);
      return;
    }
    if (missingStartRequirement) {
      setIsOptimizing(false);
      return;
    }

    const optimizationKey = getOptimizationKey(routeStops);
    const cachedSnapshot = optimizationSnapshotRef.current;
    if (cachedSnapshot && cachedSnapshot.key === optimizationKey && routeResult && routeActive) {
      setIsOptimizing(false);
      return;
    }

    let cancelled = false;
    const requestId = optimizationRequestIdRef.current + 1;
    optimizationRequestIdRef.current = requestId;

    const optimizeOnLoad = async () => {
      setIsOptimizing(true);
      const origin = await resolveOrigin();
      if (cancelled || requestId !== optimizationRequestIdRef.current) return;
      if (!origin) {
        setIsOptimizing(false);
        return;
      }

      const result = await computeRouteResult(origin, routeStops, true);
      if (cancelled || requestId !== optimizationRequestIdRef.current) return;
      if (!result) {
        setIsOptimizing(false);
        return;
      }

      const optimizedStops = getOptimizedStops(routeStops, result.optimizedOrder);
      const finalizedOptimizationKey = getOptimizationKey(optimizedStops);
      optimizationSnapshotRef.current = { key: finalizedOptimizationKey, origin };
      if (!isSameStopOrder(optimizedStops, routeStops)) {
        reorderStops(optimizedStops);
      }
      setRouteResult(result);
      setRouteActive(true);
      setIsOptimizing(false);
    };

    void optimizeOnLoad();
    return () => {
      cancelled = true;
    };
  }, [
    optimizeRoute,
    isPanelVisible,
    routeStops,
    missingStartRequirement,
    getOptimizationKey,
    routeResult,
    routeActive,
    resolveOrigin,
    computeRouteResult,
    getOptimizedStops,
    reorderStops,
    setRouteResult,
    setRouteActive,
  ]);

  const handleSendToPlanner = useCallback(async () => {
    if (routeStops.length === 0) return;
    setBuildError(null);
    let actionData: Awaited<ReturnType<typeof maybeOptimizeStopsForAction>> | null = null;
    const optimizationKey = getOptimizationKey(routeStops);
    const hasReadyOptimization = Boolean(
      optimizationSnapshotRef.current
      && optimizationSnapshotRef.current.key === optimizationKey
      && routeResult
      && routeActive,
    );
    if (optimizeRoute && !hasReadyOptimization) {
      setIsBuilding(true);
    }
    try {
      actionData = await maybeOptimizeStopsForAction();
    } finally {
      if (optimizeRoute && !hasReadyOptimization) {
        setIsBuilding(false);
      }
    }
    if (!actionData) return;
    const stopsToSend = actionData.stops;

    const today = new Date().toLocaleDateString("en-CA");
    const todayStops = plannerDays[today]?.stops ?? [];
    const existingPinIds = new Set(
      todayStops
        .map((stop) => stop.pinId)
        .filter((pinId): pinId is string => Boolean(pinId)),
    );
    let addedCount = 0;

    setActivePlannerDate(today);
    stopsToSend.forEach((rs) => {
      if (existingPinIds.has(rs.id)) return;
      existingPinIds.add(rs.id);
      addedCount += 1;

      addPlannerStop({
        id: crypto.randomUUID(),
        pinId: rs.id,
        label: rs.label,
        address: rs.address,
        lat: rs.lat,
        lng: rs.lng,
        status: "planned",
        addedAt: new Date().toISOString(),
        visitedAt: null,
      });
    });

    if (trackingEnabled && addedCount > 0) {
      const time = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
      addActivityEntry({ time, text: `Added ${addedCount} stops from route` });
    }

    if (addedCount > 0) {
      toast.success(`Sent ${addedCount} stop${addedCount === 1 ? "" : "s"} to planner`);
      return;
    }

    toast("All route stops are already in planner");
  }, [
    routeStops,
    optimizeRoute,
    getOptimizationKey,
    routeResult,
    routeActive,
    maybeOptimizeStopsForAction,
    plannerDays,
    setActivePlannerDate,
    addPlannerStop,
    trackingEnabled,
    addActivityEntry,
  ]);

  const clearRoutePreview = useCallback(() => {
    // Any manual reordering invalidates a previously computed optimized path.
    optimizationRequestIdRef.current += 1;
    optimizationSnapshotRef.current = null;
    setRouteResult(null);
    setRouteActive(false);
  }, [setRouteResult, setRouteActive]);

  const handleOptimizeRouteToggle = useCallback((enabled: boolean) => {
    setOptimizeRoute(enabled);
    if (!enabled) {
      setIsOptimizing(false);
    }
    setBuildError(null);
    clearRoutePreview();
  }, [setOptimizeRoute, clearRoutePreview]);

  const applyStopOrder = useCallback((nextOrder: RouteStop[]) => {
    reorderStops(nextOrder);
    clearRoutePreview();
  }, [reorderStops, clearRoutePreview]);

  const moveStop = useCallback((stopId: string, direction: "up" | "down") => {
    if (reorderingDisabled) return;
    const currentIndex = routeStops.findIndex((stop) => stop.id === stopId);
    if (currentIndex < 0) return;

    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= routeStops.length) return;

    applyStopOrder(arrayMove(routeStops, currentIndex, targetIndex));
  }, [routeStops, applyStopOrder, reorderingDisabled]);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      if (reorderingDisabled) return;
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = routeStops.findIndex((s) => s.id === active.id);
      const newIndex = routeStops.findIndex((s) => s.id === over.id);
      const newOrder = arrayMove(routeStops, oldIndex, newIndex);
      applyStopOrder(newOrder);
    },
    [routeStops, applyStopOrder, reorderingDisabled],
  );

  const handleBuildRoute = useCallback(async () => {
    if (routeStops.length < 1) {
      setBuildError("Add at least 1 stop.");
      return;
    }
    if (optimizeRoute) {
      setBuildError(null);
      const optimizationKey = getOptimizationKey(routeStops);
      const hasReadyOptimization = Boolean(
        optimizationSnapshotRef.current
        && optimizationSnapshotRef.current.key === optimizationKey
        && routeResult
        && routeActive,
      );

      if (!hasReadyOptimization) {
        setIsBuilding(true);
      }
      let actionData: Awaited<ReturnType<typeof maybeOptimizeStopsForAction>> | null = null;
      try {
        actionData = await maybeOptimizeStopsForAction();
      } finally {
        if (!hasReadyOptimization) {
          setIsBuilding(false);
        }
      }
      if (!actionData) {
        return;
      }
      if (!inline) {
        onClose?.();
      }
      return;
    }

    if (missingStartRequirement) {
      setBuildError(startValidationMessage);
      return;
    }

    setBuildError(null);
    setIsBuilding(true);
    const origin = await resolveOrigin();
    if (!origin) {
      setIsBuilding(false);
      return;
    }

    const result = await computeRouteResult(origin, routeStops, optimizeRoute);
    if (!result) {
      setIsBuilding(false);
      return;
    }

    setRouteResult(result);
    setRouteActive(true);
    setIsBuilding(false);
    if (!inline) {
      onClose?.();
    }
  }, [
    routeStops,
    optimizeRoute,
    getOptimizationKey,
    routeResult,
    routeActive,
    maybeOptimizeStopsForAction,
    missingStartRequirement,
    startValidationMessage,
    resolveOrigin,
    computeRouteResult,
    setRouteResult,
    setRouteActive,
    onClose,
    inline,
  ]);

  const handleOpenMaps = useCallback(async () => {
    if (routeStops.length === 0) return;
    const mapsWindow = window.open("about:blank", "_blank");
    if (!mapsWindow) {
      toast.error("Popup blocked. Please allow pop-ups and try again.");
      return;
    }

    setBuildError(null);
    let stopsForAction = routeStops;
    let origin: ResolvedOrigin | null = null;

    if (optimizeRoute) {
      const optimizationKey = getOptimizationKey(routeStops);
      const hasReadyOptimization = Boolean(
        optimizationSnapshotRef.current
        && optimizationSnapshotRef.current.key === optimizationKey
        && routeResult
        && routeActive,
      );
      if (!hasReadyOptimization) {
        setIsBuilding(true);
      }
      let actionData: Awaited<ReturnType<typeof maybeOptimizeStopsForAction>> | null = null;
      try {
        actionData = await maybeOptimizeStopsForAction();
      } finally {
        if (!hasReadyOptimization) {
          setIsBuilding(false);
        }
      }
      if (!actionData) {
        mapsWindow.close();
        return;
      }
      stopsForAction = actionData.stops;
      origin = actionData.origin;
      if (!origin) {
        mapsWindow.close();
        return;
      }
    } else {
      origin = await resolveOrigin();
    }

    let url: string;
    const destination = stopsForAction[stopsForAction.length - 1];
    const destinationAddress = destination.address?.trim() ? destination.address.trim() : `${destination.lat},${destination.lng}`;
    const originAddress = origin?.address?.trim()
      ? origin.address.trim()
      : origin && Number.isFinite(origin.lat) && Number.isFinite(origin.lng)
        ? `${origin.lat},${origin.lng}`
        : undefined;

    if (mapsProvider === "apple" && effectiveMapsProvider === "google") {
      toast.error("Apple Maps is only available on iOS. Opening Google Maps.");
    }

    if (effectiveMapsProvider === "apple" && stopsForAction.length > 1) {
      toast.error("Apple Maps doesn't support multi-stop from Groundwork links. Opening Google Maps.");
    }

    if (effectiveMapsProvider === "apple" && stopsForAction.length === 1) {
      if (!origin && startMode === "gps") {
        toast.error("Couldn't access GPS. Apple Maps will try to use your current location.");
      }
      url = buildAppleMapsDirectionsUrl({
        destination: destinationAddress,
        origin: originAddress,
      });
      setShareableUrl(url);
      mapsWindow.opener = null;
      mapsWindow.location.replace(url);
      return;
    }

    if (!origin) {
      // Fallback: omit origin so Google Maps can attempt current-location resolution.
      if (startMode === "gps") {
        toast.error("Couldn't access GPS. Google Maps will try to use your current location.");
      }
      url = buildGoogleMapsUrlWithoutOrigin(stopsForAction);
      setShareableUrl(url);
    } else {
      const originStop: RouteStop = {
        id: "origin",
        label: startMode === "home" ? "Home" : startMode === "gps" ? "Current Location" : "Start",
        address: origin.address ?? customStartAddress ?? "",
        lat: origin.lat ?? 0,
        lng: origin.lng ?? 0,
      };
      url = buildGoogleMapsUrl(originStop, stopsForAction);
      setShareableUrl(url);
    }

    mapsWindow.opener = null;
    mapsWindow.location.replace(url);
  }, [
    routeStops,
    optimizeRoute,
    getOptimizationKey,
    routeResult,
    routeActive,
    mapsProvider,
    effectiveMapsProvider,
    startMode,
    customStartAddress,
    setShareableUrl,
    maybeOptimizeStopsForAction,
    resolveOrigin,
  ]);

  const handleOpenMapsFromCta = useCallback(() => {
    setShowMoreActions(false);
    void handleOpenMaps();
  }, [handleOpenMaps]);

  const handleSendToPlannerFromMenu = useCallback(() => {
    setShowMoreActions(false);
    void handleSendToPlanner();
  }, [handleSendToPlanner]);

  const handlePreviewFromMenu = useCallback(() => {
    setShowMoreActions(false);
    void handleBuildRoute();
  }, [handleBuildRoute]);

  const handleClearRouteFromMenu = useCallback(() => {
    setShowMoreActions(false);
    clearRoute();
    if (!inline) {
      onClose?.();
    }
  }, [clearRoute, inline, onClose]);

  const moreActionsActionList = (
    <div className="grid grid-cols-1 gap-1.5 rounded-xl border border-white/10 bg-[#202632] p-1.5">
      <button
        type="button"
        onClick={handleSendToPlannerFromMenu}
        disabled={disableOpenMapsAction}
        className="inline-flex h-7 w-full items-center justify-center gap-2 rounded-lg border border-white/12 bg-white/5 px-2.5 text-[11px] font-semibold text-text-secondary transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
      >
        <Calendar className="size-4 text-[#9EC1FF]" />
        Send to Planner
      </button>
      <button
        type="button"
        onClick={handlePreviewFromMenu}
        disabled={isBusy || routeStops.length === 0 || missingStartRequirement}
        className="inline-flex h-7 w-full items-center justify-center gap-2 rounded-lg border border-white/12 bg-white/5 px-2.5 text-[11px] font-semibold text-text-secondary transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
      >
        <ArrowRight className="size-4 text-[#FFC28F]" />
        Preview Route
      </button>
      <button
        type="button"
        onClick={handleClearRouteFromMenu}
        className="inline-flex h-7 w-full items-center justify-center gap-2 rounded-lg border border-red-400/30 bg-red-500/5 px-2.5 text-[11px] font-semibold text-red-300 transition-colors hover:bg-red-500/10 hover:text-red-200"
      >
        <Trash2 className="size-4" />
        Clear Route
      </button>
    </div>
  );

  const distanceMi = routeResult
    ? (routeResult.totalDistanceMeters / 1609.34).toFixed(1)
    : null;
  const durationMin = routeResult
    ? Math.round(routeResult.totalDurationSeconds / 60)
    : null;

  if (!inline && !open) return null;

  const compactPanelContent = (
    <div className="relative flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-border bg-bg-card px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="text-sm font-bold text-text-primary">Route Planner</div>
            {distanceMi && durationMin !== null ? (
              <div className="text-xs text-text-muted">
                {routeStops.length} stop{routeStops.length !== 1 ? "s" : ""} &middot; {distanceMi} mi &middot; ~{durationMin} min
              </div>
            ) : (
              <div className="text-xs text-text-muted">{routeStops.length} / 25 stops</div>
            )}
          </div>
          {onRequestExpand ? (
            <button
              type="button"
              onClick={onRequestExpand}
              className="h-8 rounded-md border border-white/12 bg-white/5 px-3 text-[11px] font-semibold text-text-secondary transition-colors hover:bg-white/10 hover:text-white"
            >
              Expand
            </button>
          ) : null}
        </div>

        {missingStartRequirement ? (
          <div className="mt-2 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-400">
            {startValidationMessage}
          </div>
        ) : null}

        {buildError ? (
          <div role="alert" className="mt-2 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2">
            <div className="text-xs font-semibold text-red-400">{buildError}</div>
          </div>
        ) : null}

        <div className="mt-3">
          <button
            type="button"
            ref={openMapsButtonRef}
            onClick={handleOpenMapsFromCta}
            disabled={disableOpenMapsAction}
            className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-xl border border-orange bg-orange px-3 text-[12px] font-semibold text-white transition-colors hover:bg-orange/90 disabled:opacity-50"
          >
            {isBusy ? <Loader2 className="size-4 animate-spin" /> : <ExternalLink className="size-4" />}
            {isBuilding ? "Working..." : isOptimizing ? "Optimizing..." : "Open Maps"}
          </button>
        </div>

        {routeStops[0] ? (
          <div className="mt-3 overflow-hidden rounded-xl border border-white/10 bg-white/5 px-3 py-2">
            <div className="text-[11px] font-semibold text-text-secondary">Drag up for full route controls</div>
            <div className="mt-1 truncate text-[13px] font-bold text-text-primary">{routeStops[0].label}</div>
            <div className="truncate text-[11px] text-text-muted">{routeStops[0].address || "No address"}</div>
          </div>
        ) : (
          <div className="mt-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
            <div className="text-[11px] font-semibold text-text-secondary">No stops yet</div>
            <div className="mt-1 text-[11px] text-text-muted">
              Add stops from Discover or Pins, then expand to reorder and refine.
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const panelContent = isCompactMobileSheet ? compactPanelContent : (
    <div className="relative flex h-full min-h-0 flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-border bg-bg-card shrink-0">
        <div>
          <div className="text-base font-extrabold text-text-primary">Route Planner</div>
          {distanceMi && durationMin !== null ? (
            <div className="text-xs text-text-muted mt-0.5">
              {routeStops.length} stop{routeStops.length !== 1 ? "s" : ""} &middot; {distanceMi} mi &middot; ~{durationMin} min
            </div>
          ) : (
            <div className="text-xs text-text-muted mt-0.5">
              {routeStops.length} / 25 stops
            </div>
          )}
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close route planner"
            className="text-text-muted hover:text-text-primary p-1"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {/* Start point selector */}
      <div className="px-4 py-3 border-b border-border bg-bg-card shrink-0">
        <div className="text-xs font-semibold text-text-muted mb-2 uppercase tracking-wide">Start From</div>
        <div className="flex gap-1 mb-2">
          {(["home", "gps", "custom"] as const).map((mode) => (
            <button
              type="button"
              key={mode}
              onClick={() => handleStartModeSelect(mode)}
              aria-pressed={startMode === mode}
              className={`flex-1 py-1.5 rounded-md text-xs font-bold capitalize transition-colors ${
                startMode === mode
                  ? "bg-orange text-white"
                  : "bg-bg-secondary text-text-secondary border border-border hover:border-orange hover:text-orange"
              }`}
            >
              {mode === "home" ? "Home" : mode === "gps" ? "Current Location" : "Custom"}
            </button>
          ))}
        </div>
        {(startMode === "home" || startMode === "custom") && (
          <PlacesAutocomplete
            value={customStartAddress}
            onChange={setCustomStartAddress}
            placeholder={startMode === "home" ? "Enter home address" : "Enter start address"}
            className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-bg-secondary text-text-primary placeholder:text-text-muted focus:outline-none focus:border-orange"
            inputRef={startAddressInputRef}
          />
        )}
        {startMode === "gps" && (
          <div className="text-xs text-text-muted">Current location will be used when route is built.</div>
        )}
        {missingStartRequirement && (
          <div className="mt-2 text-xs text-red-500">{startValidationMessage}</div>
        )}
      </div>

      <div className="border-b border-border bg-bg-card px-4 py-2.5 shrink-0">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold text-text-primary">Optimize Route Order</div>
            <div className="text-[11px] text-text-muted">
              {optimizeRoute
                ? "Google will optimize stop order for all route actions."
                : "Route actions follow your manual drag-and-drop order."}
            </div>
            {isOptimizing && (
              <div className="mt-1 text-[11px] font-semibold text-orange">Optimizing route...</div>
            )}
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={optimizeRoute}
            onClick={() => handleOptimizeRouteToggle(!optimizeRoute)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full border transition-colors ${
              optimizeRoute
                ? "border-orange bg-orange"
                : "border-border bg-bg-secondary"
            }`}
            title={optimizeRoute ? "Optimization enabled" : "Optimization disabled"}
          >
            <span
              className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                optimizeRoute ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Mobile truncation warning — removed per user request */}

      {/* Stop list */}
      {routeStops.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6 gap-3">
          <div className="text-3xl">🗺️</div>
          <div className="text-text-primary font-bold text-sm">No stops yet</div>
          <div className="text-text-muted text-xs">
            Tap &quot;+ Route&quot; on a pin or discover result to add stops.
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {routeStops.length > 1 && (
            <div className="border-b border-border bg-bg-card/70 px-4 py-2 text-[11px] text-text-muted">
              {optimizeRoute
                ? "Optimization is on. Turn it off to manually drag and reorder stops."
                : "Use the numbered handle to drag stops, or use the up/down controls on each row."}
              {isMobile ? (
                <div className="mt-1 text-text-muted/90">Swipe a stop left to remove quickly.</div>
              ) : null}
            </div>
          )}
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={routeStops.map((s) => s.id)} strategy={verticalListSortingStrategy}>
              {routeStops.map((stop, i) => (
                <SortableStopRow
                  key={stop.id}
                  stop={stop}
                  index={i}
                  canMoveUp={i > 0}
                  canMoveDown={i < routeStops.length - 1}
                  onMoveUp={(id) => moveStop(id, "up")}
                  onMoveDown={(id) => moveStop(id, "down")}
                  onRemove={removeStop}
                  reorderingDisabled={reorderingDisabled}
                  enableSwipeRemove={isMobile}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      )}

      {/* Error message */}
      {buildError && (
        <div role="alert" className="mx-4 mb-2 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg shrink-0">
          <div className="text-xs text-red-500 font-semibold">{buildError}</div>
        </div>
      )}

      {/* Action buttons */}
      {showMoreActions && !isMobile && (
        <button
          type="button"
          aria-label="Close more actions menu"
          onClick={() => setShowMoreActions(false)}
          className="absolute inset-0 z-20 bg-transparent"
        />
      )}

      <div className="relative z-30 shrink-0 border-t border-border bg-bg-card px-4 py-3 flex flex-col gap-2">
        <button
          type="button"
          ref={openMapsButtonRef}
          onClick={handleOpenMapsFromCta}
          disabled={disableOpenMapsAction}
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-orange bg-orange px-4 text-sm font-bold text-white transition-colors hover:bg-orange/90 disabled:opacity-50"
        >
          {isBusy ? <Loader2 className="size-4 animate-spin" /> : <ExternalLink className="size-4" />}
          {isBuilding ? "Working..." : isOptimizing ? "Optimizing route..." : "Open Maps"}
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowMoreActions((prev) => !prev)}
            disabled={routeStops.length === 0}
            aria-expanded={showMoreActions}
            className="inline-flex h-9 w-full items-center justify-between gap-2 rounded-xl border border-white/12 bg-white/5 px-3 text-[13px] font-semibold text-white transition-colors hover:border-white/20 hover:bg-white/10 disabled:opacity-50"
          >
            <span>More Actions</span>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={`transition-transform ${showMoreActions ? "rotate-180" : ""}`}
              aria-hidden="true"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {!isMobile && showMoreActions && (
            <div className="absolute bottom-[calc(100%+8px)] left-0 right-0 z-40">
              {moreActionsActionList}
            </div>
          )}

          {isMobile && showMoreActions && (
            <div className="mt-2">
              {moreActionsActionList}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (inline) {
    return panelContent;
  }

  if (isMobile) {
    return (
      <MobileBottomSheet
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) onClose?.();
        }}
        detent="default"
        snapPoints={MOBILE_SHEET_SNAP_POINTS}
        initialSnap={MOBILE_SHEET_SNAP_INDEX.low}
        onSnap={setLocalMobileSnapIndex}
      >
        <div className="sr-only">
          <h2>Route Planner</h2>
          <p>Build and manage your route stops before opening directions.</p>
        </div>
        {panelContent}
      </MobileBottomSheet>
    );
  }

  return (
    <div className="absolute right-0 top-0 h-full z-30 flex w-full max-w-sm flex-col overflow-hidden border-l border-border bg-bg-secondary shadow-gw">
      {panelContent}
    </div>
  );
}
