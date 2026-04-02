"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CURRENT_LOCATION_MIN_ZOOM, DEFAULT_ZOOM } from "../model/map.constants";
import { getCurrentPosition } from "./get-current-position";
import { upsertCurrentLocationMarker } from "./upsert-current-location-marker";

interface UseCurrentLocationParams {
  map: google.maps.Map | null;
}

interface UseCurrentLocationResult {
  locating: boolean;
  moveToCurrentLocation: () => Promise<void>;
}

export function useCurrentLocation({ map }: UseCurrentLocationParams): UseCurrentLocationResult {
  const [locating, setLocating] = useState(false);
  const currentLocationMarker = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const currentLocation = useRef<google.maps.LatLngLiteral | null>(null);

  useEffect(() => {
    if (!map || !currentLocation.current) return;

    currentLocationMarker.current = upsertCurrentLocationMarker({
      map,
      position: currentLocation.current,
      marker: currentLocationMarker.current,
    });
  }, [map]);

  useEffect(() => () => {
    if (currentLocationMarker.current) {
      currentLocationMarker.current.map = null;
      currentLocationMarker.current = null;
    }
    currentLocation.current = null;
  }, []);

  const moveToCurrentLocation = useCallback(async () => {
    if (locating || !map) return;

    setLocating(true);
    try {
      const position = await getCurrentPosition();
      const nextCenter = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
      currentLocation.current = nextCenter;
      currentLocationMarker.current = upsertCurrentLocationMarker({
        map,
        position: nextCenter,
        marker: currentLocationMarker.current,
      });

      map.panTo(nextCenter);
      map.setZoom(Math.max(map.getZoom() ?? DEFAULT_ZOOM, CURRENT_LOCATION_MIN_ZOOM));
    } catch (error) {
      console.warn("Unable to move map to current location.", error);
    } finally {
      setLocating(false);
    }
  }, [locating, map]);

  return {
    locating,
    moveToCurrentLocation,
  };
}
