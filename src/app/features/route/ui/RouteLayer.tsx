"use client";

import { AdvancedMarker, InfoWindow, Polyline, useMap } from "@vis.gl/react-google-maps";
import { useEffect, useMemo, useState } from "react";
import { useIsMobile } from "@/app/shared/lib/use-is-mobile";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/app/shared/ui/sheet";
import { RouteStopInfoWindowCard } from "@/app/features/route/ui/RouteStopInfoWindowCard";
import {
  ROUTE_BORDER_STYLE,
  ROUTE_FIT_BOUNDS_PADDING,
  ROUTE_LINE_STYLE,
  ROUTE_MARKER_Z_INDEX_BASE,
} from "@/app/features/route/model/route-layer.constants";
import {
  useRouteActive,
  useRouteResult,
  useRouteStops,
} from "@/app/features/route/model/route.selectors";

function isRouteRenderable(routeStopCount: number, polylinePointCount: number): boolean {
  return routeStopCount > 0 && polylinePointCount >= 2;
}

function buildRouteBounds(path: Array<{ lat: number; lng: number }>): google.maps.LatLngBounds {
  const bounds = new google.maps.LatLngBounds();
  path.forEach((point) => bounds.extend(point));
  return bounds;
}

function RouteStopMarkerVisual({ label }: { label: string }) {
  return (
    <div className="pointer-events-none select-none flex h-7 w-7 items-center justify-center rounded-full border-2 border-white/85 bg-[#D4712A] text-[13px] font-extrabold leading-none text-white shadow-[0_2px_6px_rgba(0,0,0,0.35)]">
      {label}
    </div>
  );
}

export default function RouteLayer() {
  const map = useMap();
  const isMobile = useIsMobile();
  const routeResult = useRouteResult();
  const routeStops = useRouteStops();
  const routeActive = useRouteActive();
  const [openStopId, setOpenStopId] = useState<string | null>(null);

  const canRenderRoute = useMemo(
    () => Boolean(routeActive && routeResult && isRouteRenderable(routeStops.length, routeResult.polylinePath.length)),
    [routeActive, routeResult, routeStops.length],
  );
  const routePath = useMemo(
    () => routeResult?.polylinePath ?? [],
    [routeResult],
  );
  const openStop = useMemo(
    () => (openStopId ? routeStops.find((stop) => stop.id === openStopId) ?? null : null),
    [openStopId, routeStops],
  );
  const openStopOrder = useMemo(
    () => (openStop ? routeStops.findIndex((stop) => stop.id === openStop.id) + 1 : -1),
    [openStop, routeStops],
  );

  useEffect(() => {
    if (!map || !canRenderRoute) return;
    map.fitBounds(buildRouteBounds(routePath), ROUTE_FIT_BOUNDS_PADDING);
  }, [canRenderRoute, map, routePath]);

  if (!canRenderRoute) {
    return null;
  }

  return (
    <>
      <Polyline
        path={routePath}
        strokeColor={ROUTE_BORDER_STYLE.strokeColor}
        strokeWeight={ROUTE_BORDER_STYLE.strokeWeight}
        strokeOpacity={ROUTE_BORDER_STYLE.strokeOpacity}
        zIndex={ROUTE_BORDER_STYLE.zIndex}
      />
      <Polyline
        path={routePath}
        strokeColor={ROUTE_LINE_STYLE.strokeColor}
        strokeWeight={ROUTE_LINE_STYLE.strokeWeight}
        strokeOpacity={ROUTE_LINE_STYLE.strokeOpacity}
        zIndex={ROUTE_LINE_STYLE.zIndex}
      />

      {routeStops.map((stop, index) => (
        <AdvancedMarker
          key={stop.id}
          position={{ lat: stop.lat, lng: stop.lng }}
          zIndex={ROUTE_MARKER_Z_INDEX_BASE + index}
          clickable
          onClick={() => setOpenStopId((currentId) => (currentId === stop.id ? null : stop.id))}
        >
          <RouteStopMarkerVisual label={String(index + 1)} />
        </AdvancedMarker>
      ))}

      {openStop && openStopOrder > 0 && !isMobile ? (
        <InfoWindow
          position={{ lat: openStop.lat, lng: openStop.lng }}
          onClose={() => setOpenStopId(null)}
        >
          <RouteStopInfoWindowCard stop={openStop} order={openStopOrder} />
        </InfoWindow>
      ) : null}

      {openStop && openStopOrder > 0 && isMobile ? (
        <Sheet
          open
          onOpenChange={(open) => {
            if (!open) {
              setOpenStopId(null);
            }
          }}
        >
          <SheetContent
            side="bottom"
            showCloseButton={false}
            className="bottom-[var(--mobile-bottom-bar-offset)] max-h-[var(--mobile-sheet-max-height)] rounded-t-2xl border-t border-border bg-bg-secondary p-0 pb-[env(safe-area-inset-bottom,0px)]"
          >
            <SheetHeader className="border-b border-border px-4 py-3">
              <SheetTitle className="font-heading text-sm">Route Stop</SheetTitle>
              <SheetDescription className="text-xs text-text-muted">
                Stop {openStopOrder} details and quick map access.
              </SheetDescription>
            </SheetHeader>
            <div className="overflow-y-auto px-3 py-3">
              <RouteStopInfoWindowCard stop={openStop} order={openStopOrder} className="min-w-0" />
            </div>
          </SheetContent>
        </Sheet>
      ) : null}
    </>
  );
}
