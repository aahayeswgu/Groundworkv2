import { createRoot, type Root } from "react-dom/client";
import type { RouteStop } from "@/app/features/route/model/route.types";
import { RouteStopInfoWindowCard } from "@/app/features/route/ui/RouteStopInfoWindowCard";

interface OpenRouteInfoWindowArgs {
  map: google.maps.Map;
  anchor: google.maps.marker.AdvancedMarkerElement;
  stop: RouteStop;
  order: number;
}

export interface RouteInfoWindowBridge {
  open: (args: OpenRouteInfoWindowArgs) => void;
  close: () => void;
  destroy: () => void;
}

export function createRouteInfoWindowBridge(): RouteInfoWindowBridge {
  let infoWindow: google.maps.InfoWindow | null = null;
  let infoWindowRoot: Root | null = null;

  const unmountContent = () => {
    if (!infoWindowRoot) return;
    infoWindowRoot.unmount();
    infoWindowRoot = null;
  };

  const ensureInfoWindow = () => {
    if (infoWindow) return infoWindow;

    infoWindow = new google.maps.InfoWindow();
    infoWindow.addListener("closeclick", unmountContent);
    return infoWindow;
  };

  const close = () => {
    infoWindow?.close();
    unmountContent();
  };

  const open = ({ map, anchor, stop, order }: OpenRouteInfoWindowArgs) => {
    unmountContent();

    // Google Maps InfoWindow accepts an HTMLElement as content.
    const container = document.createElement("div");
    infoWindowRoot = createRoot(container);
    infoWindowRoot.render(<RouteStopInfoWindowCard stop={stop} order={order} />);

    const windowInstance = ensureInfoWindow();
    windowInstance.setContent(container);
    windowInstance.open({ map, anchor });
  };

  const destroy = () => {
    close();
    infoWindow = null;
  };

  return {
    open,
    close,
    destroy,
  };
}
