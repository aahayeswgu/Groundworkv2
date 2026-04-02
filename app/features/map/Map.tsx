"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { MapContext } from "@/app/shared/lib/map/MapContext";
import { reverseGeocode } from "@/app/shared/lib/geocoding";
import { useTheme } from "@/app/shared/model/theme";
import MapButton from "@/app/shared/ui/MapButton";
import { useStore } from "@/app/shared/store";
import { useCurrentLocation } from "./lib/use-current-location";
import { useMapInstance } from "./lib/use-map-instance";
import MarkerLayer from "./MarkerLayer";

export interface PendingPinDraft {
  lat: number;
  lng: number;
  address: string;
}

interface MapProps {
  onEditPin: (pinId: string) => void;
  onCreatePin: (draft: PendingPinDraft) => void;
}

export default function Map({ onEditPin, onCreatePin }: MapProps) {
  const [satellite, setSatellite] = useState(false);
  const [dropMode, setDropMode] = useState(false);
  const dropListener = useRef<google.maps.MapsEventListener | null>(null);
  const { theme } = useTheme();
  const exitDropMode = useCallback((mapToReset?: google.maps.Map) => {
    setDropMode(false);
    mapToReset?.setOptions({ draggableCursor: "" });
    if (dropListener.current) {
      google.maps.event.removeListener(dropListener.current);
      dropListener.current = null;
    }
  }, []);

  const { mapContainerRef, map } = useMapInstance({
    theme,
    onBeforeMapDispose: exitDropMode,
  });
  const { locating, moveToCurrentLocation } = useCurrentLocation({ map });
  const pins = useStore((s) => s.pins);
  const selectedPinId = useStore((s) => s.selectedPinId);
  const selectedPinNonce = useStore((s) => s.selectedPinNonce);

  const enterDropMode = useCallback(() => {
    if (!map) return;
    setDropMode(true);
    map.setOptions({ draggableCursor: "crosshair" });
    dropListener.current = map.addListener(
      "click",
      async (e: google.maps.MapMouseEvent) => {
        if (!e.latLng) return;
        exitDropMode(map);
        const address = await reverseGeocode(e.latLng);
        onCreatePin({ lat: e.latLng.lat(), lng: e.latLng.lng(), address });
      }
    );
  }, [exitDropMode, map, onCreatePin]);

  const toggleSatellite = useCallback(() => {
    setSatellite((prev) => {
      const next = !prev;
      if (!map) return next;

      if (next) {
        map.setMapTypeId(google.maps.MapTypeId.HYBRID);
      } else {
        map.setMapTypeId(google.maps.MapTypeId.ROADMAP);
      }
      return next;
    });
  }, [map]);

  useEffect(() => {
    if (!selectedPinId) return;
    if (!map) return;

    const pin = pins.find((entry) => entry.id === selectedPinId);
    if (!pin) return;

    map.panTo({ lat: pin.lat, lng: pin.lng });
    map.setZoom(15);
  }, [map, pins, selectedPinId, selectedPinNonce]);

  return (
    <MapContext.Provider value={map}>
      <div className="flex-1 relative h-screen overflow-hidden">
        <div ref={mapContainerRef} className="w-full h-full z-[1]" />

        {/* Floating controls */}
        <div className="absolute top-3 right-3 z-20 flex flex-col gap-2">
          <MapButton
            title="Drop a pin"
            active={dropMode}
            onClick={dropMode ? () => exitDropMode(map ?? undefined) : enterDropMode}
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </MapButton>
          <MapButton
            title={locating ? "Locating..." : "My location"}
            active={locating}
            disabled={locating}
            onClick={moveToCurrentLocation}
          >
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M2 12h2M20 12h2" />
          </MapButton>
          <MapButton title="Get directions">
            <polygon points="3 11 22 2 13 21 11 13 3 11" />
          </MapButton>
          <MapButton title="Discover businesses">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
            <line x1="11" y1="8" x2="11" y2="14" />
            <line x1="8" y1="11" x2="14" y2="11" />
          </MapButton>
          <MapButton title="Show/hide pins">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </MapButton>
          <MapButton
            title={satellite ? "Road view" : "Satellite view"}
            active={satellite}
            onClick={toggleSatellite}
          >
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </MapButton>
          <MapButton
            title="Quick Entry"
            tone="accent"
          >
            <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
            <path d="M19 10v2a7 7 0 01-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </MapButton>
        </div>

        {/* Floating satellite label (bottom-left, Google Maps style) */}
        <button
          onClick={toggleSatellite}
          className={`absolute bottom-8 left-3 z-20 flex items-center gap-1.5 px-3.5 py-2 rounded-lg border text-xs font-bold cursor-pointer shadow-gw transition-all duration-200 ${
            satellite
              ? "bg-orange text-white border-orange"
              : "bg-bg-card text-text-primary border-border hover:border-orange hover:text-orange"
          }`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
          {satellite ? "Road view" : "Satellite"}
        </button>
      </div>
      {map && <MarkerLayer onEditPin={onEditPin} />}
    </MapContext.Provider>
  );
}
