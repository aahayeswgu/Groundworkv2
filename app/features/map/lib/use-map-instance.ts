"use client";

import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import { useCallback, useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import type { AppTheme } from "@/app/shared/model/theme";
import { MAP_CONFIG } from "../model/map-config";
import { DEFAULT_CENTER, DEFAULT_MAP_ID, DEFAULT_ZOOM } from "../model/map.constants";
import { getMapColorScheme } from "./get-map-color-scheme";

interface MapCameraState {
  center: google.maps.LatLngLiteral;
  zoom: number;
  mapTypeId: string;
}

interface UseMapInstanceParams {
  theme: AppTheme;
  onBeforeMapDispose?: (map: google.maps.Map) => void;
}

interface UseMapInstanceResult {
  mapContainerRef: RefObject<HTMLDivElement | null>;
  map: google.maps.Map | null;
}

export function useMapInstance({
  theme,
  onBeforeMapDispose,
}: UseMapInstanceParams): UseMapInstanceResult {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const activeTheme = useRef<AppTheme | null>(null);
  const initialTheme = useRef(theme);
  const [map, setMap] = useState<google.maps.Map | null>(null);

  const createMapInstance = useCallback((themeForMap: AppTheme, camera?: MapCameraState) => {
    if (!mapContainerRef.current) return null;

    const nextMap = new google.maps.Map(mapContainerRef.current, {
      mapId: MAP_CONFIG.mapId,
      colorScheme: getMapColorScheme(themeForMap),
      center: camera?.center ?? DEFAULT_CENTER,
      zoom: camera?.zoom ?? DEFAULT_ZOOM,
      mapTypeId: camera?.mapTypeId ?? google.maps.MapTypeId.ROADMAP,
      disableDefaultUI: true,
      zoomControl: true,
      zoomControlOptions: {
        position: google.maps.ControlPosition.RIGHT_BOTTOM,
      },
      gestureHandling: "greedy",
      clickableIcons: false,
    });

    mapInstance.current = nextMap;
    activeTheme.current = themeForMap;
    setMap(nextMap);

    return nextMap;
  }, []);

  const disposeMapInstance = useCallback((
    mapToDispose: google.maps.Map,
    clearState: boolean,
  ) => {
    onBeforeMapDispose?.(mapToDispose);
    google.maps.event.clearInstanceListeners(mapToDispose);

    if (mapInstance.current === mapToDispose) {
      mapInstance.current = null;
    }
    activeTheme.current = null;

    if (clearState) {
      setMap(null);
    }
  }, [onBeforeMapDispose]);

  useEffect(() => {
    let cancelled = false;
    setOptions({
      key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
      v: "weekly",
      libraries: ["places", "geometry", "marker"],
    });

    importLibrary("maps").then(async () => {
      await importLibrary("marker");
      if (cancelled) return;
      createMapInstance(initialTheme.current);

      if (
        process.env.NODE_ENV !== "production"
        && MAP_CONFIG.mapId === DEFAULT_MAP_ID
      ) {
        console.info(
          "Using DEMO_MAP_ID. Replace MAP_CONFIG.mapId in app/features/map/model/map-config.ts with your Cloud Map ID to apply custom brand styling.",
        );
      }
    });

    return () => {
      cancelled = true;
      const currentMap = mapInstance.current;
      if (!currentMap) return;
      disposeMapInstance(currentMap, true);
    };
  }, [createMapInstance, disposeMapInstance]);

  useEffect(() => {
    const currentMap = mapInstance.current;
    if (!currentMap) return;
    if (activeTheme.current === theme) return;

    const nextCamera: MapCameraState = {
      center: currentMap.getCenter()?.toJSON() ?? DEFAULT_CENTER,
      zoom: currentMap.getZoom() ?? DEFAULT_ZOOM,
      mapTypeId: currentMap.getMapTypeId() ?? google.maps.MapTypeId.ROADMAP,
    };

    disposeMapInstance(currentMap, false);

    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      createMapInstance(theme, nextCamera);
    });

    return () => {
      cancelled = true;
    };
  }, [createMapInstance, disposeMapInstance, theme]);

  return {
    mapContainerRef,
    map,
  };
}
