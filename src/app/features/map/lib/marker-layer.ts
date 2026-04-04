import type { Pin } from "@/app/features/pins/model/pin.types";
import type { PlannerStop } from "@/app/features/planner/model/planner.types";
import type { RouteStop } from "@/app/features/route/model/route.types";

export function getIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function lightenColor(hex: string, amount: number): string {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.min(255, (num >> 16) + amount);
  const g = Math.min(255, ((num >> 8) & 0x00ff) + amount);
  const b = Math.min(255, (num & 0x0000ff) + amount);
  return `rgb(${r},${g},${b})`;
}

export function darkenColor(hex: string, amount: number): string {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.max(0, (num >> 16) - amount);
  const g = Math.max(0, ((num >> 8) & 0x00ff) - amount);
  const b = Math.max(0, (num & 0x0000ff) - amount);
  return `rgb(${r},${g},${b})`;
}

export function toSafeSvgId(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, "_");
}

export function createRouteStopIdSet(routeStops: RouteStop[]): Set<string> {
  return new Set(routeStops.map((stop) => stop.id));
}

export function createPlannerPinIdSet(stops: PlannerStop[]): Set<string> {
  const pinIds = new Set<string>();
  for (const stop of stops) {
    if (stop.pinId) {
      pinIds.add(stop.pinId);
    }
  }
  return pinIds;
}

export function buildRouteStopFromPin(pin: Pin): RouteStop {
  return {
    id: pin.id,
    label: pin.title,
    address: pin.address ?? "",
    lat: pin.lat,
    lng: pin.lng,
  };
}

export function buildPlannerStopFromPin(pin: Pin, timestamp: string): PlannerStop {
  return {
    id: crypto.randomUUID(),
    pinId: pin.id,
    label: pin.title,
    address: pin.address ?? "",
    lat: pin.lat,
    lng: pin.lng,
    status: "planned",
    addedAt: timestamp,
    visitedAt: null,
  };
}
