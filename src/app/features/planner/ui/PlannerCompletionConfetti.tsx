"use client";

import { useEffect, useRef } from "react";
import {
  useActivePlannerDate,
  usePlannerDays,
} from "@/app/features/planner/model/planner.hooks";
import { getOrCreateDay } from "@/app/features/planner/model/planner.store";

async function fireCompletionConfetti() {
  const { default: confetti } = await import("canvas-confetti");
  const base = {
    origin: { x: 0.5, y: 1 },
    zIndex: 20000,
    spread: 84,
    startVelocity: 56,
    gravity: 1.04,
    ticks: 140,
    scalar: 1,
  } as const;

  confetti({ ...base, particleCount: 110, angle: 62 });
  confetti({ ...base, particleCount: 110, angle: 118 });
  window.setTimeout(() => {
    confetti({ ...base, particleCount: 80, spread: 104, startVelocity: 46, angle: 90 });
  }, 120);
}

export default function PlannerCompletionConfetti() {
  const plannerDays = usePlannerDays();
  const activePlannerDate = useActivePlannerDate();
  const completionByDateRef = useRef<Record<string, boolean>>({});
  const initializedDatesRef = useRef<Set<string>>(new Set());

  const day = getOrCreateDay(plannerDays, activePlannerDate);
  const hasStops = day.stops.length > 0;
  const hasPlannedStops = day.stops.some((stop) => stop.status === "planned");
  const hasVisitedStops = day.stops.some((stop) => stop.status === "visited");
  const isRouteFinished = hasStops && !hasPlannedStops && hasVisitedStops;

  useEffect(() => {
    if (!initializedDatesRef.current.has(activePlannerDate)) {
      initializedDatesRef.current.add(activePlannerDate);
      completionByDateRef.current[activePlannerDate] = isRouteFinished;
      return;
    }

    const wasFinished = completionByDateRef.current[activePlannerDate] ?? false;
    completionByDateRef.current[activePlannerDate] = isRouteFinished;

    if (isRouteFinished && !wasFinished) {
      void fireCompletionConfetti();
    }
  }, [activePlannerDate, isRouteFinished]);

  return null;
}
