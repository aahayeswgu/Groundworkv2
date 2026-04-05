"use client";

import { useEffect, useRef } from "react";
import { useStore } from "@/app/store";
import {
  selectPlannerActions,
  selectPlannerDays,
  selectTrackingEnabled,
} from "@/app/features/planner/model/planner.selectors";
import { getOrCreateDay } from "../model/planner.store";

const CHECKIN_RADIUS_M = 60; // ~200ft

function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function GpsCheckin() {
  const checkedIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!("geolocation" in navigator)) return;

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const state = useStore.getState();
        if (!selectTrackingEnabled(state)) return;

        const today = new Date().toISOString().slice(0, 10);
        const day = getOrCreateDay(selectPlannerDays(state), today);
        const { setPlannerStopStatus, addActivityEntry } = selectPlannerActions(state);

        for (const stop of day.stops) {
          if (stop.status !== "planned") continue;
          if (checkedIds.current.has(stop.id)) continue;

          const dist = distanceMeters(latitude, longitude, stop.lat, stop.lng);
          if (dist <= CHECKIN_RADIUS_M) {
            checkedIds.current.add(stop.id);
            setPlannerStopStatus(stop.id, "visited");
            addActivityEntry({
              time: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
              text: `Auto check-in: ${stop.label}`,
            });
          }
        }
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 },
    );

    return () => navigator.geolocation.clearWatch(id);
  }, []);

  return null;
}
