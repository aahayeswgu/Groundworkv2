import { createNumberedMarkerElement } from "@/app/features/route/lib/create-numbered-marker-element";
import { createRouteInfoWindowBridge } from "@/app/features/route/lib/route-info-window-bridge";
import {
  ROUTE_BORDER_STYLE,
  ROUTE_FIT_BOUNDS_PADDING,
  ROUTE_LINE_STYLE,
  ROUTE_MARKER_Z_INDEX_BASE,
} from "@/app/features/route/model/route-layer.constants";
import type { RouteResult, RouteStop } from "@/app/features/route/model/route.types";

interface RouteOverlayRenderArgs {
  map: google.maps.Map;
  routeResult: RouteResult;
  routeStops: RouteStop[];
}

export interface RouteOverlayManager {
  render: (args: RouteOverlayRenderArgs) => void;
  clear: () => void;
  destroy: () => void;
}

function isRouteRenderable(routeResult: RouteResult, routeStops: RouteStop[]): boolean {
  return routeStops.length > 0 && routeResult.polylinePath.length >= 2;
}

function buildRouteBounds(path: Array<{ lat: number; lng: number }>): google.maps.LatLngBounds {
  const bounds = new google.maps.LatLngBounds();
  path.forEach((point) => bounds.extend(point));
  return bounds;
}

export function createRouteOverlayManager(): RouteOverlayManager {
  let borderLine: google.maps.Polyline | null = null;
  let primaryLine: google.maps.Polyline | null = null;
  let stopMarkers: google.maps.marker.AdvancedMarkerElement[] = [];

  const infoWindowBridge = createRouteInfoWindowBridge();

  const clearLines = () => {
    if (borderLine) {
      borderLine.setMap(null);
      borderLine = null;
    }

    if (primaryLine) {
      primaryLine.setMap(null);
      primaryLine = null;
    }
  };

  const clearMarkers = () => {
    stopMarkers.forEach((marker) => {
      google.maps.event.clearInstanceListeners(marker);
      marker.map = null;
    });
    stopMarkers = [];
  };

  const clear = () => {
    clearLines();
    clearMarkers();
    infoWindowBridge.close();
  };

  const render = ({ map, routeResult, routeStops }: RouteOverlayRenderArgs) => {
    clear();
    if (!isRouteRenderable(routeResult, routeStops)) return;

    const { polylinePath } = routeResult;

    borderLine = new google.maps.Polyline({
      ...ROUTE_BORDER_STYLE,
      path: polylinePath,
      map,
    });

    primaryLine = new google.maps.Polyline({
      ...ROUTE_LINE_STYLE,
      path: polylinePath,
      map,
    });

    routeStops.forEach((stop, index) => {
      const marker = new google.maps.marker.AdvancedMarkerElement({
        position: { lat: stop.lat, lng: stop.lng },
        map,
        content: createNumberedMarkerElement(String(index + 1)),
        zIndex: ROUTE_MARKER_Z_INDEX_BASE + index,
      });

      const markerContent = marker.content;
      if (markerContent instanceof HTMLElement) {
        markerContent.style.cursor = "pointer";
      }

      marker.addListener("click", () => {
        infoWindowBridge.open({
          map,
          anchor: marker,
          stop,
          order: index + 1,
        });
      });

      stopMarkers.push(marker);
    });

    map.fitBounds(buildRouteBounds(polylinePath), ROUTE_FIT_BOUNDS_PADDING);
  };

  const destroy = () => {
    clear();
    infoWindowBridge.destroy();
  };

  return {
    render,
    clear,
    destroy,
  };
}
