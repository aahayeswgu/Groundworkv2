"use client";

import { AdvancedMarker, InfoWindow, Polyline } from "@vis.gl/react-google-maps";
import { useContext, useEffect, useMemo, useState } from "react";
import { MapContext } from "@/app/features/map/MapContext";
import { RouteStopInfoWindowCard } from "@/app/features/route/ui/RouteStopInfoWindowCard";
import {
  ROUTE_BORDER_STYLE,
  ROUTE_FIT_BOUNDS_PADDING,
  ROUTE_LINE_STYLE,
  ROUTE_MARKER_Z_INDEX_BASE,
} from "@/app/features/route/model/route-layer.constants";
import { useStore } from "@/app/store";

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
    <div
      style={{
        width: 28,
        height: 28,
        borderRadius: "50%",
        background: "#D4712A",
        color: "#fff",
        fontSize: 13,
        fontWeight: 800,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: "2px solid rgba(255,255,255,0.85)",
        boxShadow: "0 2px 6px rgba(0,0,0,0.35)",
        pointerEvents: "none",
        userSelect: "none",
        lineHeight: 1,
      }}
    >
      {label}
    </div>
  );
}

export default function RouteLayer() {
  const map = useContext(MapContext);
  const routeResult = useStore((s) => s.routeResult);
  const routeStops = useStore((s) => s.routeStops);
  const routeActive = useStore((s) => s.routeActive);
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

      {openStop && openStopOrder > 0 ? (
        <InfoWindow
          position={{ lat: openStop.lat, lng: openStop.lng }}
          onClose={() => setOpenStopId(null)}
        >
          <RouteStopInfoWindowCard stop={openStop} order={openStopOrder} />
        </InfoWindow>
      ) : null}
    </>
  );
}
