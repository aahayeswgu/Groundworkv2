"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { APIProvider, ControlPosition, Map as GoogleMap, useMap } from "@vis.gl/react-google-maps";
import MapButton from "@/app/components/MapButton";
import { reverseGeocode } from "@/app/lib/geocoding";
import MarkerLayer from "./MarkerLayer";
import PinModal from "@/app/features/pins/ui/PinModal";
import DiscoverLayer from "@/app/features/discover/DiscoverLayer";
import RouteLayer from "@/app/features/route/RouteLayer";
import RouteConfirmPanel from "@/app/features/route/RouteConfirmPanel";
import { searchBusinessesInArea, validateBounds, type DrawBounds } from "@/app/features/discover/discover-search";
import { useStore } from "@/app/store";
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from "../model/map.constants";

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
  const dropListener = useRef<google.maps.MapsEventListener | null>(null);
  const [pendingPin, setPendingPin] = useState<PendingPin | null>(null);
  const [routePanelOpen, setRoutePanelOpen] = useState(false);
  const discoverMode = useStore((s) => s.discoverMode);
  const setDiscoverMode = useStore((s) => s.setDiscoverMode);
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
  const areaRectRef = useRef<google.maps.Rectangle | null>(null);
  const drawListenersRef = useRef<(() => void)[]>([]);
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
        setPendingPin({ lat: e.latLng.lat(), lng: e.latLng.lng(), address });
      }
    );
  }, [exitDropMode]);

  const stopDrawing = useCallback(() => {
    mapInstance.current?.setOptions({ draggableCursor: "", draggable: true });
    drawListenersRef.current.forEach((fn) => fn());
    drawListenersRef.current = [];
  }, []);

  const exitDiscoverMode = useCallback(() => {
    stopDrawing();
    setDiscoverMode(false);
    if (areaRectRef.current) { areaRectRef.current.setMap(null); areaRectRef.current = null; }
  }, [setDiscoverMode, stopDrawing]);

  const enterDiscoverMode = useCallback(() => {
    if (!mapInstance.current) return;
    setDiscoverMode(true);
    mapInstance.current.setOptions({ draggableCursor: "crosshair", draggable: false });

    const map = mapInstance.current;
    const isMobile = window.matchMedia("(pointer: coarse)").matches;

    if (isMobile) {
      let holdTimer: ReturnType<typeof setTimeout> | null = null;
      let touchStarted = false;
      let areaStartLatLng: google.maps.LatLng | null = null;

      const onTouchStart = (e: TouchEvent) => {
        holdTimer = setTimeout(() => {
          touchStarted = true;
          const touch = e.touches[0];
          const mapBounds = map.getBounds()!;
          const ne = mapBounds.getNorthEast();
          const sw = mapBounds.getSouthWest();
          const mapDiv = map.getDiv();
          const rect = mapDiv.getBoundingClientRect();
          const x = (touch.clientX - rect.left) / rect.width;
          const y = (touch.clientY - rect.top) / rect.height;
          const lat = ne.lat() - y * (ne.lat() - sw.lat());
          const lng = sw.lng() + x * (ne.lng() - sw.lng());
          areaStartLatLng = new google.maps.LatLng(lat, lng);
          if (areaRectRef.current) areaRectRef.current.setMap(null);
          areaRectRef.current = new google.maps.Rectangle({
            bounds: new google.maps.LatLngBounds(areaStartLatLng, areaStartLatLng),
            strokeColor: "#D4712A",
            strokeWeight: 2,
            fillColor: "#D4712A",
            fillOpacity: 0.08,
            map,
            editable: false,
            clickable: false,
          });
        }, 300);
      };

      const onTouchMove = (e: TouchEvent) => {
        if (!touchStarted) {
          if (holdTimer) { clearTimeout(holdTimer); holdTimer = null; }
          return;
        }
        if (!areaRectRef.current || !areaStartLatLng) return;
        e.preventDefault();
        const touch = e.touches[0];
        const mapBounds = map.getBounds()!;
        const ne = mapBounds.getNorthEast();
        const sw = mapBounds.getSouthWest();
        const mapDiv = map.getDiv();
        const rect = mapDiv.getBoundingClientRect();
        const x = (touch.clientX - rect.left) / rect.width;
        const y = (touch.clientY - rect.top) / rect.height;
        const lat = ne.lat() - y * (ne.lat() - sw.lat());
        const lng = sw.lng() + x * (ne.lng() - sw.lng());
        areaRectRef.current.setBounds(
          new google.maps.LatLngBounds(
            { lat: Math.min(areaStartLatLng.lat(), lat), lng: Math.min(areaStartLatLng.lng(), lng) },
            { lat: Math.max(areaStartLatLng.lat(), lat), lng: Math.max(areaStartLatLng.lng(), lng) },
          ),
        );
      };

      const onTouchEnd = () => {
        if (holdTimer) { clearTimeout(holdTimer); holdTimer = null; }
        const mapDiv = map.getDiv();
        mapDiv.removeEventListener("touchstart", onTouchStart);
        mapDiv.removeEventListener("touchmove", onTouchMove);
        mapDiv.removeEventListener("touchend", onTouchEnd);
        if (!touchStarted || !areaRectRef.current) {
          exitDiscoverMode();
          return;
        }
        touchStarted = false;
        const rectBounds = areaRectRef.current.getBounds()!;
        const ne = rectBounds.getNorthEast();
        const sw = rectBounds.getSouthWest();
        const bounds: DrawBounds = {
          swLat: sw.lat(), swLng: sw.lng(),
          neLat: ne.lat(), neLng: ne.lng(),
        };
        const validation = validateBounds(bounds);
        if (!validation.valid) {
          alert(validation.error);
          if (areaRectRef.current) { areaRectRef.current.setMap(null); areaRectRef.current = null; }
          exitDiscoverMode();
          return;
        }
        stopDrawing();
        searchBusinessesInArea(bounds);

      };

      const mapDiv = map.getDiv();
      mapDiv.addEventListener("touchstart", onTouchStart, { passive: false });
      mapDiv.addEventListener("touchmove", onTouchMove, { passive: false });
      mapDiv.addEventListener("touchend", onTouchEnd, { passive: false });
      drawListenersRef.current = [
        () => mapDiv.removeEventListener("touchstart", onTouchStart),
        () => mapDiv.removeEventListener("touchmove", onTouchMove),
        () => mapDiv.removeEventListener("touchend", onTouchEnd),
      ];
    } else {
      // Desktop: mousedown starts, mousemove updates, mouseup triggers search
      const onMouseDown = (e: google.maps.MapMouseEvent) => {
        const areaStartLL = e.latLng!;
        if (areaRectRef.current) areaRectRef.current.setMap(null);
        areaRectRef.current = new google.maps.Rectangle({
          bounds: new google.maps.LatLngBounds(areaStartLL, areaStartLL),
          strokeColor: "#D4712A",
          strokeWeight: 2,
          fillColor: "#D4712A",
          fillOpacity: 0.08,
          map,
          editable: false,
          clickable: false,
        });
        const moveListener = map.addListener("mousemove", (e2: google.maps.MapMouseEvent) => {
          if (!e2.latLng) return;
          areaRectRef.current?.setBounds(
            new google.maps.LatLngBounds(
              { lat: Math.min(areaStartLL.lat(), e2.latLng.lat()), lng: Math.min(areaStartLL.lng(), e2.latLng.lng()) },
              { lat: Math.max(areaStartLL.lat(), e2.latLng.lat()), lng: Math.max(areaStartLL.lng(), e2.latLng.lng()) },
            ),
          );
        });
        google.maps.event.addListenerOnce(map, "mouseup", (e3: google.maps.MapMouseEvent) => {
          google.maps.event.removeListener(moveListener);
          if (!e3.latLng) return;
          const finalBounds = new google.maps.LatLngBounds(
            { lat: Math.min(areaStartLL.lat(), e3.latLng.lat()), lng: Math.min(areaStartLL.lng(), e3.latLng.lng()) },
            { lat: Math.max(areaStartLL.lat(), e3.latLng.lat()), lng: Math.max(areaStartLL.lng(), e3.latLng.lng()) },
          );
          const ne = finalBounds.getNorthEast();
          const sw = finalBounds.getSouthWest();
          const bounds: DrawBounds = {
            swLat: sw.lat(), swLng: sw.lng(),
            neLat: ne.lat(), neLng: ne.lng(),
          };
          const validation = validateBounds(bounds);
          stopDrawing();
          if (!validation.valid) {
            alert(validation.error);
            if (areaRectRef.current) { areaRectRef.current.setMap(null); areaRectRef.current = null; }
            setDiscoverMode(false);
            return;
          }
          searchBusinessesInArea(bounds);

        });
      };
      google.maps.event.addListenerOnce(map, "mousedown", onMouseDown);
    }
  }, [setDiscoverMode, exitDiscoverMode, stopDrawing]);

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
      exitDropMode();
      stopDrawing();
      if (areaRectRef.current) {
        areaRectRef.current.setMap(null);
        areaRectRef.current = null;
      }
      mapInstance.current = null;
      setMapState(null);
    };
  }, [exitDropMode, stopDrawing]);

  // Show toast when route stops are added
  useEffect(() => {
    if (routeStops.length > 0 && routeStops.length > prevStopCount.current) {
      setToast(`${routeStops.length} stop${routeStops.length === 1 ? "" : "s"} routed`);
      const t = setTimeout(() => setToast(null), 2500);
      return () => clearTimeout(t);
    }
    prevStopCount.current = routeStops.length;
  }, [routeStops.length]);

  const toggleSatellite = useCallback(() => {
    setSatellite((prev) => {
      const next = !prev;
      const map = mapInstance.current;
      if (!map) return next;
      map.setMapTypeId(next ? google.maps.MapTypeId.HYBRID : google.maps.MapTypeId.ROADMAP);
      return next;
    });
  }, []);

  return (
    <APIProvider
      apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}
      version="weekly"
      libraries={["places", "geometry", "marker", "routes", "geocoding"]}
    >
      <div className="flex-1 relative h-screen overflow-hidden">
        <GoogleMap
          className="w-full h-full z-[1]"
          mapId={process.env.NEXT_PUBLIC_GOOGLE_MAP_ID ?? "DEMO_MAP_ID"}
          defaultCenter={DEFAULT_MAP_CENTER}
          defaultZoom={DEFAULT_MAP_ZOOM}
          disableDefaultUI
          zoomControl
          zoomControlOptions={{ position: ControlPosition.RIGHT_BOTTOM }}
          gestureHandling="greedy"
          clickableIcons={false}
        >
          <MapInstanceBridge onMapChange={handleMapChange} />
        </GoogleMap>

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
          style={satellite
            ? { backgroundColor: "#fff", color: "#C4692A", borderColor: "#fff" }
            : { backgroundColor: "#C4692A", color: "#fff", borderColor: "#C4692A" }
          }
          className="absolute bottom-8 left-3 z-20 flex items-center gap-1.5 px-3.5 py-2 rounded-lg border text-xs font-bold cursor-pointer shadow-gw transition-all duration-200 hover:brightness-110"
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
