"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import { getStyleForTheme } from "./map-styles";
import MapButton from "@/app/components/MapButton";
import { MapContext } from "./MapContext";
import { reverseGeocode } from "@/app/lib/geocoding";
import MarkerLayer from "./MarkerLayer";
import PinModal from "@/app/features/pins/PinModal";
import DiscoverLayer from "@/app/features/discover/DiscoverLayer";
import RouteLayer from "@/app/features/route/RouteLayer";
import RouteConfirmPanel from "@/app/features/route/RouteConfirmPanel";
import { searchBusinessesInArea, validateBounds, type DrawBounds } from "@/app/features/discover/discover-search";
import { useStore } from "@/app/store";

const DEFAULT_CENTER = { lat: 27.9506, lng: -82.4572 };
const DEFAULT_ZOOM = 12;

interface PendingPin { lat: number; lng: number; address: string; }

interface MapProps {
  onEditPin: (pinId: string) => void;
}

export default function Map({ onEditPin }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const [satellite, setSatellite] = useState(false);
  const [mapState, setMapState] = useState<google.maps.Map | null>(null);
  const [dropMode, setDropMode] = useState(false);
  const dropListener = useRef<google.maps.MapsEventListener | null>(null);
  const [pendingPin, setPendingPin] = useState<PendingPin | null>(null);
  const [routePanelOpen, setRoutePanelOpen] = useState(false);
  const discoverMode = useStore((s) => s.discoverMode);
  const setDiscoverMode = useStore((s) => s.setDiscoverMode);
  const marathonMode = useStore((s) => s.marathonMode);
  const toggleMarathonMode = useStore((s) => s.toggleMarathonMode);
  const resetMarathon = useStore((s) => s.resetMarathon);
  const areaRectRef = useRef<google.maps.Rectangle | null>(null);
  const drawListenersRef = useRef<(() => void)[]>([]);
  const marathonZoneRectsRef = useRef<globalThis.Map<string, google.maps.Rectangle>>(new globalThis.Map());

  const getTheme = useCallback(
    () => document.body.getAttribute("data-theme") || "dark",
    [],
  );

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
    // Always clear the active draw rectangle
    if (areaRectRef.current) { areaRectRef.current.setMap(null); areaRectRef.current = null; }
    // In normal mode clear any persisted zone rectangles and reset marathon state
    const marathonModeNow = useStore.getState().marathonMode;
    if (!marathonModeNow) {
      marathonZoneRectsRef.current.forEach((rect) => rect.setMap(null));
      marathonZoneRectsRef.current.clear();
      resetMarathon();
    }
  }, [setDiscoverMode, stopDrawing, resetMarathon]);

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

        // Promote completed draw rect to zone pool in marathon mode
        const touchStore = useStore.getState();
        if (touchStore.marathonMode && areaRectRef.current) {
          areaRectRef.current.setOptions({
            strokeColor: "#D4712A", strokeWeight: 1.5,
            fillColor: "#D4712A", fillOpacity: 0.05, zIndex: 1,
          });
          marathonZoneRectsRef.current.set(Date.now().toString(), areaRectRef.current);
          areaRectRef.current = null;
          enterDiscoverMode(); // re-enter for next draw
        }
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

          // Promote completed draw rect to zone pool in marathon mode
          const mouseStore = useStore.getState();
          if (mouseStore.marathonMode && areaRectRef.current) {
            areaRectRef.current.setOptions({
              strokeColor: "#D4712A", strokeWeight: 1.5,
              fillColor: "#D4712A", fillOpacity: 0.05, zIndex: 1,
            });
            marathonZoneRectsRef.current.set(Date.now().toString(), areaRectRef.current);
            areaRectRef.current = null;
            enterDiscoverMode(); // re-enter for next draw
          }
        });
      };
      google.maps.event.addListenerOnce(map, "mousedown", onMouseDown);
    }
  }, [setDiscoverMode, exitDiscoverMode, stopDrawing]);

  useEffect(() => {
    setOptions({
      key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
      v: "weekly",
      libraries: ["places", "geometry", "marker"],
    });

    importLibrary("maps").then(async () => {
      if (!mapRef.current) return;
      const theme = getTheme();
      mapInstance.current = new google.maps.Map(mapRef.current, {
        mapId: process.env.NEXT_PUBLIC_GOOGLE_MAP_ID ?? "DEMO_MAP_ID",
        center: DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM,
        disableDefaultUI: true,
        zoomControl: true,
        zoomControlOptions: {
          position: google.maps.ControlPosition.RIGHT_BOTTOM,
        },
        styles: getStyleForTheme(theme),
        gestureHandling: "greedy",
        clickableIcons: false,
      });
      await importLibrary("marker");
      setMapState(mapInstance.current);

      // Backfill Google Places data for pins missing placeId (one-time, non-blocking)
      import("@/app/features/pins/backfill-place-data").then(({ backfillPlaceData }) => {
        backfillPlaceData();
      });
    });

    return () => {
      if (mapInstance.current) {
        exitDropMode();
        google.maps.event.clearInstanceListeners(mapInstance.current);
        mapInstance.current = null;
        setMapState(null);
      }
      if (areaRectRef.current) {
        areaRectRef.current.setMap(null);
        areaRectRef.current = null;
      }
      marathonZoneRectsRef.current.forEach((rect) => rect.setMap(null));
      marathonZoneRectsRef.current.clear();
    };
  }, [getTheme, exitDropMode]);

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
        map.setOptions({ styles: getStyleForTheme(getTheme()) });
      }
      return next;
    });
  }, [getTheme]);

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
        <MapButton
          title="Get directions"
          active={routePanelOpen}
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
          title="Marathon Mode — accumulate results across multiple draws"
          active={marathonMode}
          onClick={toggleMarathonMode}
        >
          {/* Repeat/loop icon — two curved arrows */}
          <path d="M17 1l4 4-4 4" />
          <path d="M3 11V9a4 4 0 014-4h14" />
          <path d="M7 23l-4-4 4-4" />
          <path d="M21 13v2a4 4 0 01-4 4H3" />
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
          className="!bg-orange !text-white !border-orange"
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
    </MapContext.Provider>
  );
}
