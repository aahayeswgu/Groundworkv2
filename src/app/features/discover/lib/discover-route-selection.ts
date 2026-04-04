import type { DiscoverResult } from "@/app/features/discover/model/discover.types";
import type { RouteStop } from "@/app/features/route/model/route.types";

export interface AddSelectedDiscoverResultsParams {
  selectedDiscoverIds: Iterable<string>;
  discoverResults: DiscoverResult[];
  existingRouteStops: RouteStop[];
  addStop: (stop: RouteStop) => boolean;
}

export interface AddSelectedDiscoverResultsResult {
  addedCount: number;
  alreadyInRouteCount: number;
  capReached: boolean;
}

export function addSelectedDiscoverResultsToRoute({
  selectedDiscoverIds,
  discoverResults,
  existingRouteStops,
  addStop,
}: AddSelectedDiscoverResultsParams): AddSelectedDiscoverResultsResult {
  const existingRouteStopIds = new Set(existingRouteStops.map((stop) => stop.id));
  const discoverResultById = new Map(discoverResults.map((result) => [result.placeId, result]));

  let addedCount = 0;
  let alreadyInRouteCount = 0;
  let capReached = false;

  for (const placeId of selectedDiscoverIds) {
    const result = discoverResultById.get(placeId);
    if (!result) continue;

    const routeStopId = `discover_${result.placeId}`;
    if (existingRouteStopIds.has(routeStopId)) {
      alreadyInRouteCount += 1;
      continue;
    }

    const stop: RouteStop = {
      id: routeStopId,
      label: result.displayName,
      address: result.address ?? "",
      lat: result.lat,
      lng: result.lng,
    };

    const added = addStop(stop);
    if (!added) {
      capReached = true;
      break;
    }

    existingRouteStopIds.add(routeStopId);
    addedCount += 1;
  }

  return { addedCount, alreadyInRouteCount, capReached };
}

export function getRouteSelectionMessage({
  addedCount,
  alreadyInRouteCount,
  capReached,
}: AddSelectedDiscoverResultsResult): string {
  const messageParts: string[] = [];
  if (addedCount > 0) {
    messageParts.push(`Added ${addedCount} stop${addedCount !== 1 ? "s" : ""}.`);
  }
  if (alreadyInRouteCount > 0) {
    messageParts.push(`${alreadyInRouteCount} already in route.`);
  }
  if (capReached) {
    messageParts.push("Route is full (25 max).");
  }

  if (!messageParts.length) {
    return "No stops were added.";
  }

  return messageParts.join(" ");
}

