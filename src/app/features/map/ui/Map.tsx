"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { AdvancedMarker, ControlPosition, Map as GoogleMap, useMap } from "@vis.gl/react-google-maps";
import { toast } from "sonner";
import MapButton from "@/app/features/map/ui/MapButton";
import { reverseGeocode } from "@/app/shared/api/geocoding";
import {
  startDiscoverDrawSession,
  startDropPinSession,
  type DiscoverDrawSession,
} from "@/app/features/map/lib/map-interactions";
import MarkerLayer from "./MarkerLayer";
import PinModal from "@/app/features/pins/ui/PinModal";
import DiscoverLayer from "@/app/features/discover/ui/DiscoverLayer";
import RouteLayer from "@/app/features/route/ui/RouteLayer";
import {
  cancelDiscoverSearch,
  searchBusinessesInArea,
} from "@/app/features/discover/api/discover-search";
import { useStore } from "@/app/store";
import {
  useDiscoverActions,
  useDiscoverMode,
  useIsDrawing,
  useMarathonMode,
} from "@/app/features/discover/model/discover.hooks";
import {
  usePlannerActions,
  usePlannerDays,
  useTrackingEnabled,
} from "@/app/features/planner/model/planner.hooks";
import { useRouteStops } from "@/app/features/route/model/route.hooks";
import {
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
} from "../model/map.constants";
import {
  MAP_ACTION_EVENT,
  PAN_TO_LOCATION_EVENT,
  dispatchOpenMobileTab,
  type MapMobileActionEventDetail,
  type PanToLocationEventDetail,
} from "@/app/shared/model/mobile-events";

interface PendingPin { lat: number; lng: number; address: string; }
interface TempMarker { lat: number; lng: number; label: string; }

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
  const [tempMarker, setTempMarker] = useState<TempMarker | null>(null);
  const tempMarkerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const discoverMode = useDiscoverMode();
  const isDrawing = useIsDrawing();
  const { setDiscoverMode, setIsDrawing } = useDiscoverActions();
  const { addActivityEntry, setActivePlannerDate, setNotesPage } = usePlannerActions();
  const trackingEnabled = useTrackingEnabled();
  const plannerDays = usePlannerDays();
  const pinsVisible = useStore((s) => s.pinsVisible);
  const togglePinVisibility = useStore((s) => s.togglePinVisibility);
  const routeStops = useRouteStops();
  const marathonMode = useMarathonMode();
  const prevStopCount = useRef(0);
  const [quickListening, setQuickListening] = useState(false);
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
      toast.error("Speech recognition isn't supported in this browser. Try Chrome.");
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
    let session: DiscoverDrawSession | null = null;
    session = startDiscoverDrawSession({
      map,
      onComplete: (result) => {
        if (result.type === "bounds") {
          discoverSessionRef.current = session;
        } else {
          discoverSessionRef.current = null;
        }

        if (result.type === "bounds") {
          setIsDrawing(false);
          setDiscoverMode(false);
          searchBusinessesInArea(result.bounds);
          const isMobileViewport = window.matchMedia("(max-width: 1024px)").matches;
          if (isMobileViewport && !marathonMode) {
            dispatchOpenMobileTab("discover");
          }
          return;
        }

        cancelDiscoverSearch();
        setIsDrawing(false);
        setDiscoverMode(false);
        if (result.type === "invalid") {
          toast.error(result.error);
        }
      },
    });
    discoverSessionRef.current = session;
  }, [marathonMode, setDiscoverMode, setIsDrawing, stopDiscoverSession]);

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
    const stopCount = routeStops.length;
    if (stopCount > 0 && stopCount > prevStopCount.current) {
      toast(`${stopCount} stop${stopCount === 1 ? "" : "s"} routed`, {
        duration: 2500,
        id: "route-stops-routed",
      });
    }
    prevStopCount.current = stopCount;
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

      if (detail.action === "restart-discover") {
        enterDiscoverMode();
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

  useEffect(() => {
    const handlePanToLocation = (event: Event) => {
      const detail = (event as CustomEvent<PanToLocationEventDetail>).detail;
      if (!detail) return;
      const map = mapInstance.current;
      if (!map) return;
      map.panTo({ lat: detail.lat, lng: detail.lng });
      if (detail.zoom) map.setZoom(detail.zoom);

      // Show a temporary marker at the search location
      if (detail.label) {
        if (tempMarkerTimerRef.current) clearTimeout(tempMarkerTimerRef.current);
        setTempMarker({ lat: detail.lat, lng: detail.lng, label: detail.label });
        tempMarkerTimerRef.current = setTimeout(() => setTempMarker(null), 15000);
      }
    };

    window.addEventListener(PAN_TO_LOCATION_EVENT, handlePanToLocation);
    return () => window.removeEventListener(PAN_TO_LOCATION_EVENT, handlePanToLocation);
  }, []);

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
  const mapStatusMessage = quickListening
    ? "Voice note capture active."
    : discoverMode && isDrawing
    ? "Draw on the map to select a search area."
    : discoverMode
    ? "Discover mode active."
    : dropMode
    ? "Drop pin mode active."
    : "Map ready.";

  return (
    <>
      <div className="relative flex-1 h-full overflow-hidden">
        <div aria-live="polite" className="sr-only">
          {mapStatusMessage}
        </div>
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
          {tempMarker && (
            <AdvancedMarker
              position={{ lat: tempMarker.lat, lng: tempMarker.lng }}
              title={tempMarker.label}
              onClick={() => setTempMarker(null)}
            >
              <div className="flex flex-col items-center">
                <div className="rounded-lg bg-bg-card px-3 py-1.5 text-xs font-bold text-text-primary shadow-gw-lg ring-1 ring-border">
                  {tempMarker.label}
                </div>
                <svg width="24" height="32" viewBox="0 0 24 32" className="drop-shadow-lg">
                  <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 20 12 20s12-11 12-20c0-6.6-5.4-12-12-12z" fill="#C4692A" />
                  <circle cx="12" cy="12" r="5" fill="white" />
                </svg>
              </div>
            </AdvancedMarker>
          )}
        </GoogleMap>

        {/* Floating controls */}
        <div className="map-controls absolute top-3 right-3 z-30 flex flex-col gap-2">
          <MapButton
            title="Drop a pin"
            active={dropMode}
            pressed={dropMode}
            onClick={dropMode ? exitDropMode : enterDropMode}
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </MapButton>
          <MapButton
            title="Get directions"
            active={routeStops.length > 0}
            badge={routeStops.length || undefined}
            onClick={() => dispatchOpenMobileTab("route")}
          >
            <polygon points="3 11 22 2 13 21 11 13 3 11" />
          </MapButton>
          <MapButton
            title="Discover businesses"
            active={discoverMode}
            pressed={discoverMode}
            onClick={() => {
              if (discoverMode && isDrawing) {
                exitDiscoverMode();
                return;
              }

              const isMobileViewport = window.matchMedia("(max-width: 1024px)").matches;
              if (!isMobileViewport) {
                dispatchOpenMobileTab("discover");
              }
              if (!discoverMode || !isDrawing) {
                enterDiscoverMode();
              }
            }}
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
            <line x1="11" y1="8" x2="11" y2="14" />
            <line x1="8" y1="11" x2="14" y2="11" />
          </MapButton>
          <MapButton
            title="Show/hide pins"
            active={!pinsVisible}
            pressed={!pinsVisible}
            onClick={togglePinVisibility}
          >
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </MapButton>
          <MapButton
            title={quickListening ? "Listening... tap to stop" : "Quick Entry — voice note to planner"}
            active={quickListening}
            pressed={quickListening}
            onClick={toggleQuickEntry}
          >
            <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
            <path d="M19 10v2a7 7 0 01-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </MapButton>
        </div>

        {discoverMode && isDrawing && (
          <div
            role="status"
            aria-live="polite"
            className="pointer-events-none absolute left-1/2 top-4 z-30 -translate-x-1/2 rounded-full border border-orange/60 bg-bg-card/95 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-orange shadow-gw animate-[pulse_1.4s_ease-in-out_infinite]"
          >
            Drag To Select Area
          </div>
        )}

        {/* Locate me button (bottom-right) */}
        <button
          onClick={() => {
            if (!navigator.geolocation) {
              toast("Geolocation is not supported by this browser.", { duration: 3000 });
              return;
            }
            toast("Locating...", { duration: 5000, id: "locate-me" });

            const onSuccess = (pos: GeolocationPosition) => {
              const map = mapInstance.current;
              if (!map) return;
              const lat = pos.coords.latitude;
              const lng = pos.coords.longitude;
              map.panTo({ lat, lng });
              map.setZoom(16);
              toast("Found you!", { duration: 2000, id: "locate-me" });

              if (tempMarkerTimerRef.current) clearTimeout(tempMarkerTimerRef.current);
              setTempMarker({ lat, lng, label: "You are here" });
              tempMarkerTimerRef.current = setTimeout(() => setTempMarker(null), 15000);
            };

            const onError = (err: GeolocationPositionError) => {
              const msg = err.code === 1
                ? "Location permission denied. Allow location access in your browser."
                : "Unable to get your location. Try again.";
              toast(msg, { duration: 4000, id: "locate-me" });
            };

            // Try fast (network-based) first, then fall back to high accuracy
            navigator.geolocation.getCurrentPosition(
              onSuccess,
              () => {
                navigator.geolocation.getCurrentPosition(onSuccess, onError, {
                  enableHighAccuracy: true,
                  timeout: 15000,
                  maximumAge: 60000,
                });
              },
              { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 },
            );
          }}
          title="Where am I?"
          className="absolute bottom-8 right-3 z-20 flex h-10 w-10 items-center justify-center rounded-lg border border-orange bg-orange text-white shadow-gw transition-all duration-200 hover:bg-orange-hover max-lg:bottom-[calc(84px+env(safe-area-inset-bottom,0px))]"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="4" />
            <line x1="12" y1="2" x2="12" y2="6" />
            <line x1="12" y1="18" x2="12" y2="22" />
            <line x1="2" y1="12" x2="6" y2="12" />
            <line x1="18" y1="12" x2="22" y2="12" />
          </svg>
        </button>

        {/* Floating satellite label (bottom-left, Google Maps style) */}
        <button
          type="button"
          aria-pressed={satellite}
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
      {pendingPin && (
        <PinModal
          mode="create"
          initialData={{ lat: pendingPin.lat, lng: pendingPin.lng, address: pendingPin.address }}
          onClose={() => setPendingPin(null)}
        />
      )}
    </>
  );
}
