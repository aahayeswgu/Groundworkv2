"use client";

import { AdvancedMarker, Polyline, useMap } from "@vis.gl/react-google-maps";
import { useEffect, useMemo, useState } from "react";
import { useIsMobile } from "@/app/shared/lib/use-is-mobile";
import { MobileBottomSheet } from "@/app/shared/ui/mobile-bottom-sheet";
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
} from "@/app/features/route/model/route.hooks";
import { MapPopup } from "@/app/shared/ui/map-popup";

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
        <MapPopup position={{ lat: openStop.lat, lng: openStop.lng }}>
          <RouteStopInfoWindowCard stop={openStop} order={openStopOrder} onClose={() => setOpenStopId(null)} />
        </MapPopup>
      ) : null}

      {openStop && openStopOrder > 0 && isMobile ? (
        <MobileBottomSheet
          open
          detent="content"
          inset
          onOpenChange={(nextOpen) => {
            if (!nextOpen) {
              setOpenStopId(null);
            }
          }}
        >
          <div className="border-b border-border px-4 py-3">
            <div className="font-heading text-sm text-text-primary">Route Stop</div>
            <div className="text-xs text-text-muted">
              Stop {openStopOrder} details and quick map access.
            </div>
          </div>
          <div className="overflow-y-auto px-3 py-3 pb-[calc(env(safe-area-inset-bottom,0px)+14px)]">
            <RouteStopInfoWindowCard stop={openStop} order={openStopOrder} className="min-w-0" />
          </div>
        </MobileBottomSheet>
      ) : null}
    </>
  );
}
