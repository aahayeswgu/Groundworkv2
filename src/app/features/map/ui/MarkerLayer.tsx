"use client";

import { AdvancedMarker, useMap } from "@vis.gl/react-google-maps";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Pin } from "@/app/features/pins/model/pin.types";
import { useIsMobile } from "@/app/shared/lib/use-is-mobile";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/app/shared/ui/sheet";
import { useStore } from "@/app/store";
import {
  usePlannerActions,
  usePlannerDays,
} from "@/app/features/planner/model/planner.hooks";
import {
  useRouteActions,
  useRouteStops,
} from "@/app/features/route/model/route.hooks";
import {
  buildPlannerStopFromPin,
  buildRouteStopFromPin,
  createPlannerPinIdSet,
  createRouteStopIdSet,
  getIsoDate,
} from "../lib/marker-layer";
import { MARKER_BOUNCE_DURATION_MS, MIN_PIN_FOCUS_ZOOM } from "../model/map.constants";
import type { MarkerLayerProps } from "../model/marker-layer.types";
import { MapPopup } from "@/app/shared/ui/map-popup";
import { PinInfoWindowCard } from "./PinInfoWindowCard";
import { PinMarkerVisual } from "./PinMarkerVisual";

export function MarkerLayer({ onEditPin }: MarkerLayerProps) {
  const map = useMap();
  const isMobile = useIsMobile();
  const pins = useStore((s) => s.pins);
  const activeStatusFilter = useStore((s) => s.activeStatusFilter);
  const pinsVisible = useStore((s) => s.pinsVisible);
  const deletePin = useStore((s) => s.deletePin);
  const { addStop } = useRouteActions();
  const routeStops = useRouteStops();
  const { addPlannerStop, setActivePlannerDate } = usePlannerActions();
  const plannerDays = usePlannerDays();
  const selectedPinId = useStore((s) => s.selectedPinId);
  const selectedPinNonce = useStore((s) => s.selectedPinNonce);
  const [openPinId, setOpenPinId] = useState<string | null>(null);
  const [bounceToken, setBounceToken] = useState<string | null>(null);
  const [today, setToday] = useState(() => getIsoDate(new Date()));

  useEffect(() => {
    const refreshToday = () => {
      const nextToday = getIsoDate(new Date());
      setToday((currentToday) => (currentToday === nextToday ? currentToday : nextToday));
    };

    refreshToday();
    const intervalId = window.setInterval(refreshToday, 60_000);
    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const visiblePins = useMemo(
    () => (pinsVisible ? pins.filter((pin) => activeStatusFilter.has(pin.status)) : []),
    [activeStatusFilter, pins, pinsVisible],
  );
  const visiblePinsById = useMemo(
    () => new Map(visiblePins.map((pin) => [pin.id, pin])),
    [visiblePins],
  );
  const todayStops = useMemo(() => plannerDays[today]?.stops ?? [], [plannerDays, today]);
  const routeStopIds = useMemo(() => createRouteStopIdSet(routeStops), [routeStops]);
  const todayPlannerPinIds = useMemo(() => createPlannerPinIdSet(todayStops), [todayStops]);
  const openPin = useMemo(
    () => (openPinId ? visiblePinsById.get(openPinId) ?? null : null),
    [openPinId, visiblePinsById],
  );

  const focusPinOnMap = useCallback(
    (pin: Pick<Pin, "lat" | "lng">) => {
      if (!map) return;
      map.panTo({ lat: pin.lat, lng: pin.lng });
      const currentZoom = map.getZoom() ?? 12;
      if (currentZoom < MIN_PIN_FOCUS_ZOOM) {
        map.setZoom(MIN_PIN_FOCUS_ZOOM);
      }
    },
    [map],
  );

  const closeInfoWindow = useCallback(() => {
    setOpenPinId(null);
  }, []);

  const handleMarkerClick = useCallback(
    (pin: Pin) => {
      focusPinOnMap(pin);
      setOpenPinId((currentOpenId) => (currentOpenId === pin.id ? null : pin.id));
    },
    [focusPinOnMap],
  );

  const handleEditPin = useCallback(
    (pinId: string) => {
      closeInfoWindow();
      onEditPin(pinId);
    },
    [closeInfoWindow, onEditPin],
  );

  const handleDeletePin = useCallback(
    (pinId: string) => {
      closeInfoWindow();
      deletePin(pinId);
    },
    [closeInfoWindow, deletePin],
  );

  const handleAddRouteStop = useCallback(
    (nextPin: Pin) => {
      if (routeStopIds.has(nextPin.id)) {
        return "already";
      }
      return addStop(buildRouteStopFromPin(nextPin)) ? "added" : "full";
    },
    [addStop, routeStopIds],
  );

  const handlePlanPin = useCallback(
    (nextPin: Pin) => {
      if (todayPlannerPinIds.has(nextPin.id)) return;
      const timestamp = new Date().toISOString();
      setActivePlannerDate(today);
      addPlannerStop(buildPlannerStopFromPin(nextPin, timestamp));
    },
    [addPlannerStop, setActivePlannerDate, today, todayPlannerPinIds],
  );

  useEffect(() => {
    if (!openPinId || visiblePinsById.has(openPinId)) return;
    const timeoutId = window.setTimeout(() => {
      closeInfoWindow();
    }, 0);
    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [closeInfoWindow, openPinId, visiblePinsById]);

  useEffect(() => {
    if (!selectedPinId) return;

    const pin = visiblePinsById.get(selectedPinId);
    if (!pin) return;

    focusPinOnMap(pin);

    const timeoutId = window.setTimeout(() => {
      setOpenPinId(pin.id);
      setBounceToken(`${pin.id}:${selectedPinNonce}`);
    }, 0);
    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [focusPinOnMap, selectedPinId, selectedPinNonce, visiblePinsById]);

  useEffect(() => {
    if (!bounceToken) return;
    const timeoutId = window.setTimeout(() => {
      setBounceToken(null);
    }, MARKER_BOUNCE_DURATION_MS);
    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [bounceToken]);

  if (!visiblePins.length && !openPin) {
    return null;
  }

  return (
    <>
      {visiblePins.map((pin) => {
        const isBouncing = bounceToken?.startsWith(`${pin.id}:`) ?? false;
        return (
          <AdvancedMarker
            key={pin.id}
            position={{ lat: pin.lat, lng: pin.lng }}
            title={pin.title}
            clickable
            zIndex={openPinId === pin.id ? 1000 : undefined}
            onClick={() => handleMarkerClick(pin)}
          >
            <PinMarkerVisual
              key={isBouncing ? bounceToken : pin.id}
              pin={pin}
              bouncing={isBouncing}
            />
          </AdvancedMarker>
        );
      })}

      {openPin && !isMobile ? (
        <MapPopup position={{ lat: openPin.lat, lng: openPin.lng }}>
          <PinInfoWindowCard
            pin={openPin}
            isInRoute={routeStopIds.has(openPin.id)}
            isPlanned={todayPlannerPinIds.has(openPin.id)}
            onEditPin={handleEditPin}
            onDeletePin={handleDeletePin}
            onAddRouteStop={handleAddRouteStop}
            onPlanPin={handlePlanPin}
            onClose={closeInfoWindow}
          />
        </MapPopup>
      ) : null}

      {openPin && isMobile ? (
        <Sheet
          open
          onOpenChange={(open) => {
            if (!open) {
              closeInfoWindow();
            }
          }}
        >
          <SheetContent
            side="bottom"
            showCloseButton={false}
            className="bottom-[var(--mobile-bottom-bar-offset)] max-h-[var(--mobile-sheet-max-height)] rounded-t-2xl border-t border-border bg-bg-secondary p-0 pb-[env(safe-area-inset-bottom,0px)]"
          >
            <SheetHeader className="border-b border-border px-4 py-3">
              <SheetTitle className="font-heading text-sm">Pinned Location</SheetTitle>
              <SheetDescription className="text-xs text-text-muted">
                Tap actions to edit, route, plan, or delete this pin.
              </SheetDescription>
            </SheetHeader>
            <div className="overflow-y-auto px-3 py-3">
              <PinInfoWindowCard
                pin={openPin}
                className="min-w-0"
                isInRoute={routeStopIds.has(openPin.id)}
                isPlanned={todayPlannerPinIds.has(openPin.id)}
                onEditPin={handleEditPin}
                onDeletePin={handleDeletePin}
                onAddRouteStop={handleAddRouteStop}
                onPlanPin={handlePlanPin}
              />
            </div>
          </SheetContent>
        </Sheet>
      ) : null}
    </>
  );
}

export default MarkerLayer;
