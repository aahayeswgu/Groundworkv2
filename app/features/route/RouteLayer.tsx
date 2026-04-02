"use client";

import { useEffect, useRef, useContext } from "react";
import { MapContext } from "@/app/features/map/MapContext";
import { useStore } from "@/app/store";
import { createNumberedMarkerElement } from "@/app/features/route/route-markers";

export default function RouteLayer() {
  const map = useContext(MapContext);
  const routeResult = useStore((s) => s.routeResult);
  const routeStops = useStore((s) => s.routeStops);
  const routeActive = useStore((s) => s.routeActive);

  // Polyline refs (two-layer: border + color)
  const routeBorderRef = useRef<google.maps.Polyline | null>(null);
  const routeLineRef = useRef<google.maps.Polyline | null>(null);
  // Numbered marker pool — array because we only need bulk cleanup, not keyed access
  const routeMarkerPoolRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  // Single shared InfoWindow for route stop details
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  const clearOverlays = () => {
    if (routeBorderRef.current) { routeBorderRef.current.setMap(null); routeBorderRef.current = null; }
    if (routeLineRef.current) { routeLineRef.current.setMap(null); routeLineRef.current = null; }
    routeMarkerPoolRef.current.forEach((m) => { m.map = null; });
    routeMarkerPoolRef.current = [];
  };

  useEffect(() => {
    if (!map) return;
    clearOverlays();

    if (!routeActive || !routeResult || routeStops.length === 0) return;

    const { polylinePath, optimizedOrder } = routeResult;
    if (polylinePath.length < 2) return;

    // Draw two-layer polyline: dark border (weight 10) + branded orange fill (weight 5)
    routeBorderRef.current = new google.maps.Polyline({
      path: polylinePath,
      strokeColor: '#1A1A1A',
      strokeWeight: 10,
      strokeOpacity: 0.5,
      map,
      zIndex: 1,
    });
    routeLineRef.current = new google.maps.Polyline({
      path: polylinePath,
      strokeColor: '#D4712A',
      strokeWeight: 5,
      strokeOpacity: 0.9,
      map,
      zIndex: 2,
    });

    // Place numbered markers at each stop position (always use routeStops array order —
    // the polyline already shows the optimized path, markers just label the stops)
    const orderedStops = [...routeStops];

    // Lazy-init shared InfoWindow
    if (!infoWindowRef.current) {
      infoWindowRef.current = new google.maps.InfoWindow();
    }
    const infoWindow = infoWindowRef.current;

    orderedStops.forEach((stop, i) => {
      const marker = new google.maps.marker.AdvancedMarkerElement({
        position: { lat: stop.lat, lng: stop.lng },
        map,
        content: createNumberedMarkerElement(String(i + 1)),
        zIndex: 1001 + i,
      });

      // Click to show business info
      const markerContent = marker.content as HTMLElement;
      if (markerContent) markerContent.style.cursor = "pointer";
      marker.addListener("click", () => {
        const content = document.createElement("div");
        content.style.cssText = "font-family:DM Sans,sans-serif;padding:8px 12px;min-width:200px;";
        content.innerHTML = `
          <div style="font-size:14px;font-weight:700;color:#1A1A1A;">Stop ${i + 1}: ${stop.label}</div>
          <div style="font-size:12px;color:#666;margin-top:4px;">${stop.address}</div>
          <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stop.address || `${stop.lat},${stop.lng}`)}" target="_blank" rel="noopener" style="display:inline-block;margin-top:8px;font-size:12px;color:#4285F4;font-weight:600;text-decoration:none;">View on Google Maps</a>
        `;
        infoWindow.setContent(content);
        infoWindow.open({ map, anchor: marker });
      });

      routeMarkerPoolRef.current.push(marker);
    });

    // Fit map bounds to show full route
    const bounds = new google.maps.LatLngBounds();
    polylinePath.forEach((p) => bounds.extend(p));
    map.fitBounds(bounds, { top: 60, right: 60, bottom: 60, left: 60 });

    return () => {
      clearOverlays();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, routeResult, routeActive, routeStops]);

  return null; // Imperative-only component — no JSX output
}
