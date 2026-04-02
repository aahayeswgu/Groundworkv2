"use client";

import { useCallback, useContext, useEffect, useRef } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MapContext } from "@/app/features/map/MapContext";
import { useStore } from "@/app/store";
import { createNumberedMarkerElement } from "@/app/features/route/route-markers";
import { RouteStopInfoWindowCard } from "@/app/features/route/ui/RouteStopInfoWindowCard";

export default function RouteLayer() {
  const map = useContext(MapContext);
  const routeResult = useStore((s) => s.routeResult);
  const routeStops = useStore((s) => s.routeStops);
  const routeActive = useStore((s) => s.routeActive);

  const routeBorderRef = useRef<google.maps.Polyline | null>(null);
  const routeLineRef = useRef<google.maps.Polyline | null>(null);
  const routeMarkerPoolRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const infoWindowRootRef = useRef<Root | null>(null);

  const unmountInfoWindowContent = useCallback(() => {
    if (!infoWindowRootRef.current) return;
    infoWindowRootRef.current.unmount();
    infoWindowRootRef.current = null;
  }, []);

  const closeInfoWindow = useCallback(() => {
    infoWindowRef.current?.close();
    unmountInfoWindowContent();
  }, [unmountInfoWindowContent]);

  const clearOverlays = useCallback(() => {
    if (routeBorderRef.current) {
      routeBorderRef.current.setMap(null);
      routeBorderRef.current = null;
    }
    if (routeLineRef.current) {
      routeLineRef.current.setMap(null);
      routeLineRef.current = null;
    }
    routeMarkerPoolRef.current.forEach((marker) => {
      marker.map = null;
    });
    routeMarkerPoolRef.current = [];
    closeInfoWindow();
  }, [closeInfoWindow]);

  useEffect(() => {
    if (!map) return;
    clearOverlays();

    if (!routeActive || !routeResult || routeStops.length === 0) return;

    const { polylinePath } = routeResult;
    if (polylinePath.length < 2) return;

    routeBorderRef.current = new google.maps.Polyline({
      path: polylinePath,
      strokeColor: "#1A1A1A",
      strokeWeight: 10,
      strokeOpacity: 0.5,
      map,
      zIndex: 1,
    });
    routeLineRef.current = new google.maps.Polyline({
      path: polylinePath,
      strokeColor: "#D4712A",
      strokeWeight: 5,
      strokeOpacity: 0.9,
      map,
      zIndex: 2,
    });

    const orderedStops = [...routeStops];

    if (!infoWindowRef.current) {
      infoWindowRef.current = new google.maps.InfoWindow();
      infoWindowRef.current.addListener("closeclick", () => {
        unmountInfoWindowContent();
      });
    }

    const infoWindow = infoWindowRef.current;

    orderedStops.forEach((stop, index) => {
      const marker = new google.maps.marker.AdvancedMarkerElement({
        position: { lat: stop.lat, lng: stop.lng },
        map,
        content: createNumberedMarkerElement(String(index + 1)),
        zIndex: 1001 + index,
      });

      const markerContent = marker.content as HTMLElement;
      if (markerContent) markerContent.style.cursor = "pointer";

      marker.addListener("click", () => {
        unmountInfoWindowContent();

        // Google Maps InfoWindow requires an HTMLElement; render React into this bridge node.
        const container = document.createElement("div");
        const root = createRoot(container);
        root.render(<RouteStopInfoWindowCard stop={stop} order={index + 1} />);
        infoWindowRootRef.current = root;

        infoWindow.setContent(container);
        infoWindow.open({ map, anchor: marker });
      });

      routeMarkerPoolRef.current.push(marker);
    });

    const bounds = new google.maps.LatLngBounds();
    polylinePath.forEach((point) => bounds.extend(point));
    map.fitBounds(bounds, { top: 60, right: 60, bottom: 60, left: 60 });

    return () => {
      clearOverlays();
    };
  }, [clearOverlays, map, routeResult, routeActive, routeStops, unmountInfoWindowContent]);

  return null;
}
