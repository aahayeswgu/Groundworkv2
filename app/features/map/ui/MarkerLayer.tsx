"use client";

import { AdvancedMarker, InfoWindow, useMap } from "@vis.gl/react-google-maps";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useStore } from "@/app/store";
import type { Pin } from "@/app/features/pins/model/pin.types";
import { STATUS_COLORS } from "@/app/features/pins/pin-marker";
import type { RouteStop } from "@/app/features/route/model/route.types";
import { MARKER_BOUNCE_DURATION_MS, MIN_PIN_FOCUS_ZOOM } from "../model/map.constants";
import { PinInfoWindowCard } from "./PinInfoWindowCard";

interface MarkerLayerProps {
  onEditPin: (pinId: string) => void;
}

function lightenColor(hex: string, amount: number): string {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.min(255, (num >> 16) + amount);
  const g = Math.min(255, ((num >> 8) & 0x00ff) + amount);
  const b = Math.min(255, (num & 0x0000ff) + amount);
  return `rgb(${r},${g},${b})`;
}

function darkenColor(hex: string, amount: number): string {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.max(0, (num >> 16) - amount);
  const g = Math.max(0, ((num >> 8) & 0x00ff) - amount);
  const b = Math.max(0, (num & 0x0000ff) - amount);
  return `rgb(${r},${g},${b})`;
}

function toSafeSvgId(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, "_");
}

function PinMarkerVisual({ pin, bouncing }: { pin: Pin; bouncing: boolean }) {
  const color = STATUS_COLORS[pin.status];
  const markerId = toSafeSvgId(`${pin.id}-${pin.status}`);
  const highlightGradientId = `hg-${markerId}`;
  const shaftGradientId = `shaft-${markerId}`;
  const shadowFilterId = `sh-${markerId}`;

  return (
    <div
      className={bouncing ? "marker-bounce" : undefined}
      style={{ cursor: "pointer", display: "block", lineHeight: 0 }}
    >
      <svg width="24" height="36" viewBox="0 0 24 36" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id={highlightGradientId} cx="35%" cy="35%" r="60%" fx="25%" fy="25%">
            <stop offset="0%" stopColor={lightenColor(color, 60)} />
            <stop offset="50%" stopColor={color} />
            <stop offset="100%" stopColor={darkenColor(color, 50)} />
          </radialGradient>
          <linearGradient id={shaftGradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={darkenColor(color, 30)} />
            <stop offset="100%" stopColor={darkenColor(color, 60)} />
          </linearGradient>
          <filter id={shadowFilterId} x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="2" stdDeviation="1.5" floodColor="rgba(0,0,0,0.35)" />
          </filter>
        </defs>
        <ellipse cx="12" cy="34" rx="3" ry="1.2" fill="rgba(0,0,0,0.2)" />
        <polygon points="10.5,13 13.5,13 12.5,33 11.5,33" fill={`url(#${shaftGradientId})`} />
        <circle
          cx="12"
          cy="10"
          r="9"
          fill={`url(#${highlightGradientId})`}
          stroke="rgba(255,255,255,0.4)"
          strokeWidth="1"
          filter={`url(#${shadowFilterId})`}
        />
        <ellipse
          cx="9.5"
          cy="7.5"
          rx="2.5"
          ry="1.8"
          fill="rgba(255,255,255,0.25)"
          transform="rotate(-15,12,10)"
        />
      </svg>
    </div>
  );
}

export function MarkerLayer({ onEditPin }: MarkerLayerProps) {
  const map = useMap();
  const pins = useStore((s) => s.pins);
  const activeStatusFilter = useStore((s) => s.activeStatusFilter);
  const pinsVisible = useStore((s) => s.pinsVisible);
  const deletePin = useStore((s) => s.deletePin);
  const addStop = useStore((s) => s.addStop);
  const routeStops = useStore((s) => s.routeStops);
  const addPlannerStop = useStore((s) => s.addPlannerStop);
  const plannerDays = useStore((s) => s.plannerDays);
  const setActivePlannerDate = useStore((s) => s.setActivePlannerDate);
  const selectedPinId = useStore((s) => s.selectedPinId);
  const selectedPinNonce = useStore((s) => s.selectedPinNonce);
  const [openPinId, setOpenPinId] = useState<string | null>(null);
  const [bounceToken, setBounceToken] = useState<string | null>(null);

  const visiblePins = useMemo(
    () => (pinsVisible ? pins.filter((pin) => activeStatusFilter.has(pin.status)) : []),
    [activeStatusFilter, pins, pinsVisible],
  );
  const visiblePinsById = useMemo(
    () => new Map(visiblePins.map((pin) => [pin.id, pin])),
    [visiblePins],
  );
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const todayStops = plannerDays[today]?.stops ?? [];
  const openPin = useMemo(
    () => (openPinId ? visiblePinsById.get(openPinId) ?? null : null),
    [openPinId, visiblePinsById],
  );

  const closeInfoWindow = useCallback(() => {
    setOpenPinId(null);
  }, []);

  const handleMarkerClick = useCallback(
    (pin: Pin) => {
      if (map) {
        map.panTo({ lat: pin.lat, lng: pin.lng });
        const currentZoom = map.getZoom() ?? 12;
        if (currentZoom < MIN_PIN_FOCUS_ZOOM) {
          map.setZoom(MIN_PIN_FOCUS_ZOOM);
        }
      }
      setOpenPinId((currentOpenId) => (currentOpenId === pin.id ? null : pin.id));
    },
    [map],
  );

  useEffect(() => {
    if (!openPinId || visiblePinsById.has(openPinId)) return;
    const timeoutId = window.setTimeout(() => {
      closeInfoWindow();
    }, 0);
    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [closeInfoWindow, openPinId, visiblePinsById]);

  useEffect(() => {
    if (!selectedPinId || !map) return;

    const pin = visiblePinsById.get(selectedPinId);
    if (!pin) return;

    map.panTo({ lat: pin.lat, lng: pin.lng });
    const currentZoom = map.getZoom() ?? 12;
    if (currentZoom < MIN_PIN_FOCUS_ZOOM) {
      map.setZoom(MIN_PIN_FOCUS_ZOOM);
    }

    const timeoutId = window.setTimeout(() => {
      setOpenPinId(pin.id);
      setBounceToken(`${pin.id}:${selectedPinNonce}`);
    }, 0);
    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [map, selectedPinId, selectedPinNonce, visiblePinsById]);

  useEffect(() => {
    if (!bounceToken) return;
    const timeoutId = window.setTimeout(() => {
      setBounceToken(null);
    }, MARKER_BOUNCE_DURATION_MS);
    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [bounceToken]);

  if (!visiblePins.length && !openPin) {
    return null;
  }

  return (
    <>
      {visiblePins.map((pin) => {
        const isBouncing = bounceToken?.startsWith(`${pin.id}:`) ?? false;
        return (
          <AdvancedMarker
            key={pin.id}
            position={{ lat: pin.lat, lng: pin.lng }}
            title={pin.title}
            clickable
            zIndex={openPinId === pin.id ? 1000 : undefined}
            onClick={() => handleMarkerClick(pin)}
          >
            <PinMarkerVisual
              key={isBouncing ? bounceToken : pin.id}
              pin={pin}
              bouncing={isBouncing}
            />
          </AdvancedMarker>
        );
      })}

      {openPin ? (
        <InfoWindow
          position={{ lat: openPin.lat, lng: openPin.lng }}
          onClose={closeInfoWindow}
        >
          <PinInfoWindowCard
            pin={openPin}
            isInRoute={routeStops.some((stop) => stop.id === openPin.id)}
            isPlanned={todayStops.some((stop) => stop.pinId === openPin.id)}
            onEditPin={(pinId) => {
              closeInfoWindow();
              onEditPin(pinId);
            }}
            onDeletePin={(pinId) => {
              closeInfoWindow();
              deletePin(pinId);
            }}
            onAddRouteStop={(nextPin) => {
              if (routeStops.some((stop) => stop.id === nextPin.id)) {
                return "already";
              }

              const stop: RouteStop = {
                id: nextPin.id,
                label: nextPin.title,
                address: nextPin.address ?? "",
                lat: nextPin.lat,
                lng: nextPin.lng,
              };

              return addStop(stop) ? "added" : "full";
            }}
            onPlanPin={(nextPin) => {
              if (todayStops.some((stop) => stop.pinId === nextPin.id)) return;
              setActivePlannerDate(today);
              addPlannerStop({
                id: crypto.randomUUID(),
                pinId: nextPin.id,
                label: nextPin.title,
                address: nextPin.address ?? "",
                lat: nextPin.lat,
                lng: nextPin.lng,
                status: "planned",
                addedAt: new Date().toISOString(),
                visitedAt: null,
              });
            }}
          />
        </InfoWindow>
      ) : null}
    </>
  );
}

export default MarkerLayer;
