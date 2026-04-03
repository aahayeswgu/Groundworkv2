"use client";

import { AdvancedMarker, InfoWindow, useMap } from "@vis.gl/react-google-maps";
import { useCallback, useMemo, useState } from "react";
import { useStore } from "@/app/store";
import {
  MARKER_Z_INDEX,
  type DiscoverMarkerState,
} from "./discover-marker";
import { buildQuickSavePin } from "./discover-info";
import type { DiscoverResult } from "@/app/features/discover/model/discover.types";
import type { Pin } from "@/app/features/pins/model/pin.types";
import type { RouteStop } from "@/app/features/route/model/route.types";
import { DiscoverInfoWindowCard } from "./ui/DiscoverInfoWindowCard";

function getMarkerState(
  placeId: string,
  selectedIds: Set<string>,
  hoverId: string | null,
): DiscoverMarkerState {
  if (selectedIds.has(placeId)) return "selected";
  if (hoverId === placeId) return "hover";
  return "default";
}

function isResultAlreadyPinned(result: DiscoverResult, pins: Pin[]): boolean {
  return pins.some(
    (pin) =>
      pin.title.toLowerCase() === result.displayName.toLowerCase() ||
      (Math.abs(pin.lat - result.lat) < 0.001 && Math.abs(pin.lng - result.lng) < 0.001),
  );
}

function DiscoverMarkerVisual({ state }: { state: DiscoverMarkerState }) {
  if (state === "selected") {
    return (
      <div data-discover-state={state} style={{ cursor: "pointer", lineHeight: 0 }}>
        <svg width="30" height="30" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
          <circle cx="15" cy="15" r="13" fill="#22C55E" stroke="#fff" strokeWidth="2.5" />
          <path d="M10 15l4 4 6-7" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    );
  }

  if (state === "hover") {
    return (
      <div data-discover-state={state} style={{ cursor: "pointer", lineHeight: 0 }}>
        <svg width="30" height="30" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
          <circle cx="15" cy="15" r="13" fill="#F59E0B" stroke="#fff" strokeWidth="2.5" />
          <circle cx="15" cy="15" r="4" fill="#fff" />
        </svg>
      </div>
    );
  }

  return (
    <div data-discover-state={state} style={{ cursor: "pointer", lineHeight: 0 }}>
      <svg width="22" height="22" viewBox="0 0 22 22" xmlns="http://www.w3.org/2000/svg">
        <circle cx="11" cy="11" r="9" fill="#D4712A" opacity="0.7" stroke="#fff" strokeWidth="2" />
        <circle cx="11" cy="11" r="3" fill="#fff" />
      </svg>
    </div>
  );
}

export default function DiscoverLayer() {
  const map = useMap();
  const discoverResults = useStore((s) => s.discoverResults);
  const selectedDiscoverIds = useStore((s) => s.selectedDiscoverIds);
  const hoveredDiscoverId = useStore((s) => s.hoveredDiscoverId);
  const pins = useStore((s) => s.pins);
  const addPin = useStore((s) => s.addPin);
  const routeStops = useStore((s) => s.routeStops);
  const addStop = useStore((s) => s.addStop);
  const [openPlaceId, setOpenPlaceId] = useState<string | null>(null);

  const openResult = useMemo(
    () => discoverResults.find((result) => result.placeId === openPlaceId) ?? null,
    [discoverResults, openPlaceId],
  );

  const handleMarkerClick = useCallback(
    (result: DiscoverResult) => {
      if (map) {
        map.panTo({ lat: result.lat, lng: result.lng });
        if ((map.getZoom() ?? 0) < 15) {
          map.setZoom(15);
        }
      }

      setOpenPlaceId((currentOpenId) => (
        currentOpenId === result.placeId ? null : result.placeId
      ));
    },
    [map],
  );

  if (!discoverResults.length && !openResult) {
    return null;
  }

  return (
    <>
      {discoverResults.map((result) => {
        const state = getMarkerState(result.placeId, selectedDiscoverIds, hoveredDiscoverId);
        return (
          <AdvancedMarker
            key={result.placeId}
            position={{ lat: result.lat, lng: result.lng }}
            title={result.displayName}
            zIndex={MARKER_Z_INDEX[state]}
            clickable
            onClick={() => handleMarkerClick(result)}
          >
            <DiscoverMarkerVisual state={state} />
          </AdvancedMarker>
        );
      })}

      {openResult ? (
        <InfoWindow
          position={{ lat: openResult.lat, lng: openResult.lng }}
          onClose={() => setOpenPlaceId(null)}
        >
          <DiscoverInfoWindowCard
            result={openResult}
            alreadySaved={isResultAlreadyPinned(openResult, pins)}
            isInRoute={routeStops.some((stop) => stop.id === `discover_${openResult.placeId}`)}
            onSave={() => {
              if (!isResultAlreadyPinned(openResult, pins)) {
                addPin(buildQuickSavePin(openResult));
              }
            }}
            onAddToRoute={() => {
              const stop: RouteStop = {
                id: `discover_${openResult.placeId}`,
                label: openResult.displayName,
                address: openResult.address ?? "",
                lat: openResult.lat,
                lng: openResult.lng,
              };
              return addStop(stop);
            }}
          />
        </InfoWindow>
      ) : null}
    </>
  );
}
