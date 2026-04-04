"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { APIProvider, ControlPosition, Map as GoogleMap, useMap } from "@vis.gl/react-google-maps";
import MapButton from "@/app/features/map/ui/MapButton";
import { reverseGeocode } from "@/app/lib/geocoding";
import {
  startDiscoverDrawSession,
  startDropPinSession,
  type DiscoverDrawSession,
} from "@/app/features/map/lib/map-interactions";
import MarkerLayer from "./MarkerLayer";
import PinModal from "@/app/features/pins/ui/PinModal";
import DiscoverLayer from "@/app/features/discover/DiscoverLayer";
import RouteLayer from "@/app/features/route/RouteLayer";
import RouteConfirmPanel from "@/app/features/route/RouteConfirmPanel";
import {
  cancelDiscoverSearch,
  searchBusinessesInArea,
} from "@/app/features/discover/discover-search";
import { useStore } from "@/app/store";
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from "../model/map.constants";
import {
  MAP_ACTION_EVENT,
  dispatchOpenMobileTab,
  type MapMobileActionEventDetail,
} from "@/app/shared/model/mobile-events";

interface PendingPin { lat: number; lng: number; address: string; }

interface MapProps {
  onEditPin: (pinId: string) => void;
}

interface MapInstanceBridgeProps {
  onMapChange: (map: google.maps.Map | null) => void;
}

function MapInstanceBridge({ onMapChange }: MapInstanceBridgeProps) {
  const map = useMap();

  useEffect(() => {
    onMapChange(map);
    return () => onMapChange(null);
  }, [map, onMapChange]);

  return null;
}

export default function Map({ onEditPin }: MapProps) {
  const mapInstance = useRef<google.maps.Map | null>(null);
  const [satellite, setSatellite] = useState(false);
  const [mapState, setMapState] = useState<google.maps.Map | null>(null);
  const [dropMode, setDropMode] = useState(false);
  const dropSessionRef = useRef<(() => void) | null>(null);
  const discoverSessionRef = useRef<DiscoverDrawSession | null>(null);
  const [pendingPin, setPendingPin] = useState<PendingPin | null>(null);
  const [routePanelOpen, setRoutePanelOpen] = useState(false);
  const discoverMode = useStore((s) => s.discoverMode);
  const setDiscoverMode = useStore((s) => s.setDiscoverMode);
  const setIsDrawing = useStore((s) => s.setIsDrawing);
  const addActivityEntry = useStore((s) => s.addActivityEntry);
  const setActivePlannerDate = useStore((s) => s.setActivePlannerDate);
  const trackingEnabled = useStore((s) => s.trackingEnabled);
  const setNotesPage = useStore((s) => s.setNotesPage);
  const plannerDays = useStore((s) => s.plannerDays);
  const pinsVisible = useStore((s) => s.pinsVisible);
  const togglePinVisibility = useStore((s) => s.togglePinVisibility);
  const routeStops = useStore((s) => s.routeStops);
  const [toast, setToast] = useState<string | null>(null);
  const prevStopCount = useRef(0);
  const [quickListening, setQuickListening] = useState(false);
  const didStartBackfill = useRef(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const quickRecognitionRef = useRef<any>(null);

  const handleMapChange = useCallback((nextMap: google.maps.Map | null) => {
    mapInstance.current = nextMap;
    setMapState((prevMap) => (prevMap === nextMap ? prevMap : nextMap));
  }, []);

  const toggleQuickEntry = useCallback(() => {
    if (quickListening) {
      quickRecognitionRef.current?.stop();
      setQuickListening(false);
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      alert("Speech recognition is not supported in this browser. Try Chrome.");
      return;
    }

    const recognition = new SR();
    recognition.continuous = false; // Single utterance — stop after silence
    recognition.interimResults = false;
    recognition.lang = "en-US";
    quickRecognitionRef.current = recognition;

    recognition.onresult = (event: { results: { [key: number]: { [key: number]: { transcript: string } } } }) => {
      const transcript = event.results[0][0].transcript;
      if (!transcript.trim()) return;

      const today = new Date().toISOString().slice(0, 10);
      const time = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

      // Set active date to today
      setActivePlannerDate(today);

      // Add as activity log entry with timestamp
      if (trackingEnabled) {
        addActivityEntry({ time, text: `🎤 ${transcript}` });
      }

      // Also append to today's notes (page 0)
      const currentNotes = plannerDays[today]?.notes?.[0] ?? "";
      const separator = currentNotes && !currentNotes.endsWith("\n") ? "\n" : "";
      const newNote = `${currentNotes}${separator}[${time}] ${transcript}`;
      setNotesPage(0, newNote);
    };

    recognition.onerror = () => setQuickListening(false);
    recognition.onend = () => setQuickListening(false);

    recognition.start();
    setQuickListening(true);
  }, [quickListening, addActivityEntry, setActivePlannerDate, trackingEnabled, setNotesPage, plannerDays]);

  const stopDropSession = useCallback(() => {
    dropSessionRef.current?.();
    dropSessionRef.current = null;
  }, []);

  const stopDiscoverSession = useCallback((clearArea: boolean) => {
    const discoverSession = discoverSessionRef.current;
    if (!discoverSession) return;
    if (clearArea) {
      discoverSession.clearArea();
    }
    discoverSession.stop();
    discoverSessionRef.current = null;
  }, []);

  const exitDropMode = useCallback(() => {
    setDropMode(false);
    stopDropSession();
  }, [stopDropSession]);

  const enterDropMode = useCallback(() => {
    const map = mapInstance.current;
    if (!map) return;

    stopDropSession();
    setDropMode(true);

    dropSessionRef.current = startDropPinSession({
      map,
      onDrop: async (latLng) => {
        exitDropMode();
        const address = await reverseGeocode(latLng);
        setPendingPin({ lat: latLng.lat(), lng: latLng.lng(), address });
      },
    });
  }, [exitDropMode, stopDropSession]);

  const exitDiscoverMode = useCallback(() => {
    cancelDiscoverSearch();
    setIsDrawing(false);
    setDiscoverMode(false);
    stopDiscoverSession(true);
  }, [setDiscoverMode, setIsDrawing, stopDiscoverSession]);

  const enterDiscoverMode = useCallback(() => {
    const map = mapInstance.current;
    if (!map) return;

    setDiscoverMode(true);
    setIsDrawing(true);
    stopDiscoverSession(true);
    discoverSessionRef.current = startDiscoverDrawSession({
      map,
      onComplete: (result) => {
        discoverSessionRef.current = null;

        if (result.type === "bounds") {
          setIsDrawing(false);
          searchBusinessesInArea(result.bounds);
          const isMobileViewport = window.matchMedia("(max-width: 1024px)").matches;
          const marathonModeEnabled = useStore.getState().marathonMode;
          if (isMobileViewport && !marathonModeEnabled) {
            dispatchOpenMobileTab("pins");
          }
          return;
        }

        cancelDiscoverSearch();
        setIsDrawing(false);
        setDiscoverMode(false);
        if (result.type === "invalid") {
          alert(result.error);
        }
      },
    });
  }, [setDiscoverMode, setIsDrawing, stopDiscoverSession]);

  useEffect(() => {
    if (!mapState || didStartBackfill.current) return;
    didStartBackfill.current = true;

    // Backfill Google Places data for pins missing placeId (one-time, non-blocking)
    import("@/app/features/pins/backfill-place-data").then(({ backfillPlaceData }) => {
      backfillPlaceData();
    });
  }, [mapState]);

  useEffect(() => {
    return () => {
      quickRecognitionRef.current?.stop();
      exitDropMode();
      stopDiscoverSession(true);
      mapInstance.current = null;
      setMapState(null);
    };
  }, [exitDropMode, stopDiscoverSession]);

  // Show toast when route stops are added
  useEffect(() => {
    if (routeStops.length > 0 && routeStops.length > prevStopCount.current) {
      setToast(`${routeStops.length} stop${routeStops.length === 1 ? "" : "s"} routed`);
      const t = setTimeout(() => setToast(null), 2500);
      return () => clearTimeout(t);
    }
    prevStopCount.current = routeStops.length;
  }, [routeStops.length]);

  useEffect(() => {
    const handleMapAction = (event: Event) => {
      const detail = (event as CustomEvent<MapMobileActionEventDetail>).detail;
      if (!detail) return;

      if (detail.action === "toggle-drop-pin") {
        if (dropMode) {
          exitDropMode();
        } else {
          enterDropMode();
        }
        return;
      }

      if (detail.action === "toggle-discover") {
        if (discoverMode) {
          exitDiscoverMode();
        } else {
          enterDiscoverMode();
        }
        return;
      }

      if (detail.action === "toggle-route-panel") {
        setRoutePanelOpen((prev) => !prev);
        return;
      }

      if (detail.action === "toggle-voice-entry") {
        toggleQuickEntry();
      }
    };

    window.addEventListener(MAP_ACTION_EVENT, handleMapAction);
    return () => window.removeEventListener(MAP_ACTION_EVENT, handleMapAction);
  }, [
    discoverMode,
    dropMode,
    enterDiscoverMode,
    enterDropMode,
    exitDiscoverMode,
    exitDropMode,
    toggleQuickEntry,
  ]);

  const toggleSatellite = useCallback(() => {
    setSatellite((prev) => {
      const next = !prev;
      const map = mapInstance.current;
      if (!map) return next;
      map.setMapTypeId(next ? google.maps.MapTypeId.HYBRID : google.maps.MapTypeId.ROADMAP);
      return next;
    });
  }, []);
  const satelliteButtonStateClass = satellite
    ? "border-white bg-white text-orange"
    : "border-orange bg-orange text-white";

  return (
    <APIProvider
      apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}
      version="weekly"
      libraries={["places", "geometry", "marker", "routes", "geocoding"]}
    >
      <div className="relative flex-1 h-full overflow-hidden">
        <GoogleMap
          className="w-full h-full z-[1]"
          mapId={process.env.NEXT_PUBLIC_GOOGLE_MAP_ID ?? "DEMO_MAP_ID"}
          defaultCenter={DEFAULT_MAP_CENTER}
          defaultZoom={DEFAULT_MAP_ZOOM}
          disableDefaultUI
          zoomControl
          zoomControlOptions={{ position: ControlPosition.LEFT_TOP }}
          gestureHandling="greedy"
          clickableIcons={false}
        >
          <MapInstanceBridge onMapChange={handleMapChange} />
        </GoogleMap>

        {/* Floating controls */}
        <div className="map-controls absolute top-3 right-3 z-30 flex flex-col gap-2">
          <MapButton
            title="Drop a pin"
            active={dropMode}
            onClick={dropMode ? exitDropMode : enterDropMode}
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </MapButton>
          <MapButton
            title="Get directions"
            active={routePanelOpen}
            badge={routeStops.length || undefined}
            onClick={() => setRoutePanelOpen((prev) => !prev)}
          >
            <polygon points="3 11 22 2 13 21 11 13 3 11" />
          </MapButton>
          <MapButton
            title="Discover businesses"
            active={discoverMode}
            onClick={discoverMode ? exitDiscoverMode : enterDiscoverMode}
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
            <line x1="11" y1="8" x2="11" y2="14" />
            <line x1="8" y1="11" x2="14" y2="11" />
          </MapButton>
          <MapButton
            title="Show/hide pins"
            active={!pinsVisible}
            onClick={togglePinVisibility}
          >
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </MapButton>
          <MapButton
            title={quickListening ? "Listening... tap to stop" : "Quick Entry — voice note to planner"}
            active={quickListening}
            onClick={toggleQuickEntry}
          >
            <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
            <path d="M19 10v2a7 7 0 01-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </MapButton>
        </div>

        {/* Toast notification */}
        {toast && (
          <div className="absolute top-14 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-lg bg-charcoal text-white text-sm font-semibold shadow-gw-lg animate-[fadeInOut_2.5s_ease]">
            {toast}
          </div>
        )}

        {/* Floating satellite label (bottom-left, Google Maps style) */}
        <button
          onClick={toggleSatellite}
          className={`absolute bottom-8 left-3 z-20 flex items-center gap-1.5 px-3.5 py-2 rounded-lg border text-xs font-bold cursor-pointer shadow-gw transition-all duration-200 hover:brightness-110 max-lg:bottom-[calc(84px+env(safe-area-inset-bottom,0px))] ${satelliteButtonStateClass}`}
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
      {mapState && <DiscoverLayer />}
      {mapState && <RouteLayer />}
      <RouteConfirmPanel open={routePanelOpen} onClose={() => setRoutePanelOpen(false)} />
      {pendingPin && (
        <PinModal
          mode="create"
          initialData={{ lat: pendingPin.lat, lng: pendingPin.lng, address: pendingPin.address }}
          onClose={() => setPendingPin(null)}
        />
      )}
    </APIProvider>
  );
}
