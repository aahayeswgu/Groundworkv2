"use client";

import { useState, useCallback, useEffect, useRef } from "react";
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/app/shared/ui/sheet";
import { useStore } from "@/app/store";
import { computeRoute, RouteComputeError } from "@/app/features/route/route-service";
import { buildGoogleMapsUrl } from "@/app/features/route/route-url";
import { forwardGeocode, getCurrentGpsPosition } from "@/app/shared/api/geocoding";
import PlacesAutocomplete from "@/app/features/route/ui/PlacesAutocomplete";
import type { RouteStop } from "@/app/features/route/model/route.types";

interface RouteConfirmPanelProps {
  open?: boolean;
  onClose?: () => void;
  inline?: boolean;
}

// ---- SortableStopRow (inline sub-component) ----
function SortableStopRow({
  stop,
  index,
  onRemove,
}: {
  stop: RouteStop;
  index: number;
  onRemove: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: stop.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="flex items-center gap-3 px-4 py-3 border-b border-border cursor-grab active:cursor-grabbing touch-none"
    >
      <span className="w-7 h-7 rounded-full bg-orange text-white text-xs font-bold flex items-center justify-center shrink-0">
        {index + 1}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-text-primary truncate">{stop.label}</div>
        {stop.address && (
          <div className="text-xs text-text-muted truncate">{stop.address}</div>
        )}
      </div>
      <button
        onPointerDown={(e) => e.stopPropagation()} // prevent drag from stealing remove click
        onClick={() => onRemove(stop.id)}
        className="shrink-0 text-text-muted hover:text-red-400 p-1"
        title="Remove stop"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}

// ---- RouteConfirmPanel ----
export default function RouteConfirmPanel({ open = false, onClose, inline = false }: RouteConfirmPanelProps) {
  const isMobile = useIsMobile();
  const routeStops = useStore((s) => s.routeStops);
  const routeResult = useStore((s) => s.routeResult);
  const startMode = useStore((s) => s.startMode);
  const customStartAddress = useStore((s) => s.customStartAddress);
  const profile = useStore((s) => s.profile);
  const reorderStops = useStore((s) => s.reorderStops);
  const removeStop = useStore((s) => s.removeStop);
  const setRouteResult = useStore((s) => s.setRouteResult);
  const setRouteActive = useStore((s) => s.setRouteActive);
  const setStartMode = useStore((s) => s.setStartMode);
  const setCustomStartAddress = useStore((s) => s.setCustomStartAddress);
  const setShareableUrl = useStore((s) => s.setShareableUrl);
  const clearRoute = useStore((s) => s.clearRoute);
  const addPlannerStop = useStore((s) => s.addPlannerStop);
  const setActivePlannerDate = useStore((s) => s.setActivePlannerDate);
  const addActivityEntry = useStore((s) => s.addActivityEntry);
  const trackingEnabled = useStore((s) => s.trackingEnabled);

  const [isBuilding, setIsBuilding] = useState(false);
  const [buildError, setBuildError] = useState<string | null>(null);
  const startAddressInputRef = useRef<HTMLInputElement | null>(null);
  const previewButtonRef = useRef<HTMLButtonElement | null>(null);
  const didAutoFocusRef = useRef(false);

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
      previewButtonRef.current?.focus();
    };

    const timeoutId = window.setTimeout(focusTarget, 80);
    return () => window.clearTimeout(timeoutId);
  }, [inline, open, routeStops.length, startMode, missingStartRequirement]);

  function handleSendToPlanner() {
    if (routeStops.length === 0) return;
    const today = new Date().toISOString().slice(0, 10);
    setActivePlannerDate(today);
    routeStops.forEach((rs) => {
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
    if (trackingEnabled) {
      const time = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
      addActivityEntry({ time, text: `Added ${routeStops.length} stops from route` });
    }
  }

  const resolveOrigin = useCallback(async (): Promise<{ address?: string; lat?: number; lng?: number } | null> => {
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
      try {
        const pos = await getCurrentGpsPosition();
        return { lat: pos.lat, lng: pos.lng };
      } catch (err) {
        setBuildError(err instanceof Error ? err.message : "Could not get GPS location.");
        return null;
      }
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
  }, [startMode, customStartAddress, profile?.homebase]);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = routeStops.findIndex((s) => s.id === active.id);
      const newIndex = routeStops.findIndex((s) => s.id === over.id);
      const newOrder = arrayMove(routeStops, oldIndex, newIndex);
      reorderStops(newOrder);
      // Clear stale route display — polyline no longer matches stop order
      setRouteResult(null);
      setRouteActive(false);
    },
    [routeStops, reorderStops, setRouteResult, setRouteActive],
  );

  const handleBuildRoute = useCallback(async () => {
    if (routeStops.length < 1) {
      setBuildError("Add at least 1 stop.");
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

    let result: Awaited<ReturnType<typeof computeRoute>>;
    try {
      result = await computeRoute(origin, routeStops);
    } catch (err) {
      setIsBuilding(false);
      if (err instanceof RouteComputeError && err.code === "routes-permission-denied") {
        setBuildError(
          "Routes API is blocked for this key/project. Enable Routes API and allow it in API key restrictions, then retry.",
        );
        return;
      }
      if (err instanceof RouteComputeError && err.code === "routes-library-unavailable") {
        setBuildError("Routes library is unavailable. Reload and try again.");
        return;
      }
      setBuildError("Could not calculate route. Check your connection and try again.");
      return;
    }

    // Reorder the stop list to match Google's optimized order
    if (result.optimizedOrder.length > 0) {
      const optimized = result.optimizedOrder.map((idx) => routeStops[idx]).filter(Boolean);
      if (optimized.length === routeStops.length) {
        reorderStops(optimized);
      }
    }

    setRouteResult(result);
    setRouteActive(true);
    setIsBuilding(false);
    if (!inline) {
      onClose?.();
    }
  }, [
    routeStops,
    missingStartRequirement,
    startValidationMessage,
    resolveOrigin,
    setRouteResult,
    setRouteActive,
    reorderStops,
    onClose,
    inline,
  ]);

  const handleOpenMaps = useCallback(async () => {
    if (routeStops.length === 0) return;
    // Resolve actual origin coordinates for the URL
    const origin = await resolveOrigin();
    if (!origin) {
      // Fallback: just use stops without an origin
      const url = buildGoogleMapsUrl(routeStops[0], routeStops.slice(1));
      setShareableUrl(url);
      window.open(url, "_blank", "noopener,noreferrer");
      return;
    }
    const originStop: RouteStop = {
      id: "origin",
      label: startMode === "home" ? "Home" : startMode === "gps" ? "My Location" : "Start",
      address: origin.address ?? customStartAddress ?? "",
      lat: origin.lat ?? 0,
      lng: origin.lng ?? 0,
    };
    const url = buildGoogleMapsUrl(originStop, routeStops);
    setShareableUrl(url);
    window.open(url, "_blank", "noopener,noreferrer");
  }, [routeStops, startMode, customStartAddress, setShareableUrl, resolveOrigin]);

  const distanceMi = routeResult
    ? (routeResult.totalDistanceMeters / 1609.34).toFixed(1)
    : null;
  const durationMin = routeResult
    ? Math.round(routeResult.totalDurationSeconds / 60)
    : null;

  if (!inline && !open) return null;

  const panelContent = (
    <div className="flex h-full min-h-0 flex-col">
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
          <button onClick={onClose} className="text-text-muted hover:text-text-primary p-1">
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
              key={mode}
              onClick={() => setStartMode(mode)}
              className={`flex-1 py-1.5 rounded-md text-xs font-bold capitalize transition-colors ${
                startMode === mode
                  ? "bg-orange text-white"
                  : "bg-bg-secondary text-text-secondary border border-border hover:border-orange hover:text-orange"
              }`}
            >
              {mode === "home" ? "Home" : mode === "gps" ? "GPS" : "Custom"}
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
          <div className="text-xs text-text-muted">GPS location will be used when route is built.</div>
        )}
        {missingStartRequirement && (
          <div className="mt-2 text-xs text-red-500">{startValidationMessage}</div>
        )}
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
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={routeStops.map((s) => s.id)} strategy={verticalListSortingStrategy}>
              {routeStops.map((stop, i) => (
                <SortableStopRow key={stop.id} stop={stop} index={i} onRemove={removeStop} />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      )}

      {/* Error message */}
      {buildError && (
        <div className="mx-4 mb-2 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg shrink-0">
          <div className="text-xs text-red-500 font-semibold">{buildError}</div>
        </div>
      )}

      {/* Action buttons */}
      <div className="shrink-0 border-t border-border bg-bg-card px-4 py-3 flex flex-col gap-2">
        <button
          ref={previewButtonRef}
          onClick={handleBuildRoute}
          disabled={isBuilding || routeStops.length === 0 || missingStartRequirement}
          className="w-full rounded-xl bg-orange px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-orange/90 disabled:opacity-50"
        >
          {isBuilding ? "Previewing..." : "Preview Route"}
        </button>
        <button
          onClick={handleOpenMaps}
          disabled={routeStops.length === 0}
          className="w-full rounded-xl border border-[#4285F4]/40 bg-[#4285F4]/15 px-4 py-2.5 text-sm font-semibold text-[#7EAFFF] transition-colors hover:bg-[#4285F4]/25 disabled:opacity-50"
        >
          Open Maps
        </button>
        <button
          onClick={handleSendToPlanner}
          disabled={routeStops.length === 0}
          className="w-full py-2.5 rounded-lg border border-border text-sm font-semibold text-text-secondary hover:text-text-primary hover:border-text-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Send to Planner
        </button>
        <button
          onClick={() => {
            clearRoute();
            if (!inline) {
              onClose?.();
            }
          }}
          className="w-full rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-text-muted transition-colors hover:border-red-400 hover:text-red-400"
        >
          Clear
        </button>
      </div>
    </div>
  );

  if (inline) {
    return panelContent;
  }

  if (isMobile) {
    return (
      <Sheet
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) onClose?.();
        }}
      >
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className="bottom-[var(--mobile-bottom-bar-offset)] h-[var(--mobile-sheet-max-height)] max-h-[var(--mobile-sheet-max-height)] rounded-t-2xl border-t border-border bg-bg-secondary p-0 pb-[env(safe-area-inset-bottom,0px)]"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Route Planner</SheetTitle>
            <SheetDescription>
              Build and manage your route stops before opening directions.
            </SheetDescription>
          </SheetHeader>
          {panelContent}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div className="absolute right-0 top-0 h-full z-30 flex w-full max-w-sm flex-col overflow-hidden border-l border-border bg-bg-secondary shadow-gw">
      {panelContent}
    </div>
  );
}
