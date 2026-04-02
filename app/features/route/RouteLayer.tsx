"use client";

import { useContext, useEffect, useMemo } from "react";
import { MapContext } from "@/app/features/map/MapContext";
import { createRouteOverlayManager } from "@/app/features/route/lib/route-overlay-manager";
import { useStore } from "@/app/store";

export default function RouteLayer() {
  const map = useContext(MapContext);
  const routeResult = useStore((s) => s.routeResult);
  const routeStops = useStore((s) => s.routeStops);
  const routeActive = useStore((s) => s.routeActive);

  const overlayManager = useMemo(() => createRouteOverlayManager(), []);

  useEffect(() => {
    if (!map || !routeActive || !routeResult) {
      overlayManager.clear();
      return;
    }

    overlayManager.render({ map, routeResult, routeStops });

    return () => {
      overlayManager.clear();
    };
  }, [map, routeActive, routeResult, routeStops, overlayManager]);

  useEffect(() => {
    return () => {
      overlayManager.destroy();
    };
  }, [overlayManager]);

  return null;
}
