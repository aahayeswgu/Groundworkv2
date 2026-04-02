"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import { getStyleForTheme } from "./map-styles";
import { MapContext } from "@/app/shared/lib/map/MapContext";
import { reverseGeocode } from "@/app/shared/lib/geocoding";
import { useTheme } from "@/app/shared/model/theme";
import MapButton from "@/app/shared/ui/MapButton";
import { useStore } from "@/app/shared/store";
import MarkerLayer from "./MarkerLayer";

const DEFAULT_CENTER = { lat: 27.9506, lng: -82.4572 };
const DEFAULT_ZOOM = 12;

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
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const [satellite, setSatellite] = useState(false);
  const [mapState, setMapState] = useState<google.maps.Map | null>(null);
  const [dropMode, setDropMode] = useState(false);
  const dropListener = useRef<google.maps.MapsEventListener | null>(null);
  const { theme } = useTheme();
  const initialTheme = useRef(theme);
  const pins = useStore((s) => s.pins);
  const selectedPinId = useStore((s) => s.selectedPinId);
  const selectedPinNonce = useStore((s) => s.selectedPinNonce);

  const exitDropMode = useCallback(() => {
    setDropMode(false);
    mapInstance.current?.setOptions({ draggableCursor: "" });
    if (dropListener.current) {
      google.maps.event.removeListener(dropListener.current);
      dropListener.current = null;
    }
  }, []);

  const enterDropMode = useCallback(() => {
    if (!mapInstance.current) return;
    setDropMode(true);
    mapInstance.current.setOptions({ draggableCursor: "crosshair" });
    dropListener.current = mapInstance.current.addListener(
      "click",
      async (e: google.maps.MapMouseEvent) => {
        if (!e.latLng) return;
        exitDropMode();
        const address = await reverseGeocode(e.latLng);
        onCreatePin({ lat: e.latLng.lat(), lng: e.latLng.lng(), address });
      }
    );
  }, [exitDropMode, onCreatePin]);

  useEffect(() => {
    setOptions({
      key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
      v: "weekly",
      libraries: ["places", "geometry", "marker"],
    });

    importLibrary("maps").then(async () => {
      if (!mapRef.current) return;
      mapInstance.current = new google.maps.Map(mapRef.current, {
        mapId: process.env.NEXT_PUBLIC_GOOGLE_MAP_ID ?? "DEMO_MAP_ID",
        center: DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM,
        disableDefaultUI: true,
        zoomControl: true,
        zoomControlOptions: {
          position: google.maps.ControlPosition.RIGHT_BOTTOM,
        },
        styles: getStyleForTheme(initialTheme.current),
        gestureHandling: "greedy",
        clickableIcons: false,
      });
      await importLibrary("marker");
      setMapState(mapInstance.current);
    });

    return () => {
      if (mapInstance.current) {
        exitDropMode();
        google.maps.event.clearInstanceListeners(mapInstance.current);
        mapInstance.current = null;
        setMapState(null);
      }
    };
  }, [exitDropMode]);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map || satellite) return;
    map.setMapTypeId(google.maps.MapTypeId.ROADMAP);
    map.setOptions({ styles: getStyleForTheme(theme) });
  }, [theme, satellite]);

  const toggleSatellite = useCallback(() => {
    setSatellite((prev) => {
      const next = !prev;
      const map = mapInstance.current;
      if (!map) return next;

      if (next) {
        map.setMapTypeId(google.maps.MapTypeId.HYBRID);
        map.setOptions({ styles: [] });
      } else {
        map.setMapTypeId(google.maps.MapTypeId.ROADMAP);
        map.setOptions({ styles: getStyleForTheme(theme) });
      }
      return next;
    });
  }, [theme]);

  useEffect(() => {
    if (!selectedPinId) return;
    const map = mapInstance.current;
    if (!map) return;

    const pin = pins.find((entry) => entry.id === selectedPinId);
    if (!pin) return;

    map.panTo({ lat: pin.lat, lng: pin.lng });
    map.setZoom(15);
  }, [pins, selectedPinId, selectedPinNonce]);

  return (
    <MapContext.Provider value={mapState}>
      <div className="flex-1 relative h-screen overflow-hidden">
        <div ref={mapRef} className="w-full h-full z-[1]" />

        {/* Floating controls */}
        <div className="absolute top-3 right-3 z-20 flex flex-col gap-2">
          <MapButton
            title="Drop a pin"
            active={dropMode}
            onClick={dropMode ? exitDropMode : enterDropMode}
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </MapButton>
          <MapButton title="My location">
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
            className="!bg-orange !text-white !border-orange hover:!bg-orange hover:!text-white hover:!border-orange hover:!brightness-110 hover:!shadow-[0_8px_18px_rgba(0,0,0,0.3)]"
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
      {mapState && <MarkerLayer onEditPin={onEditPin} />}
    </MapContext.Provider>
  );
}
