import type { DiscoverResult } from "@/app/features/discover/model/discover.types";
import type { DiscoverSortKey } from "@/app/features/discover/model/discover-panel.model";
import type { Pin } from "@/app/features/pins/model/pin.types";

const CLOSE_COORDINATE_THRESHOLD = 0.001;

export function isDiscoverResultAlreadyPinned(result: DiscoverResult, pins: Pin[]): boolean {
  const normalizedName = result.displayName.toLowerCase();
  return pins.some(
    (pin) =>
      pin.title.toLowerCase() === normalizedName ||
      (
        Math.abs(pin.lat - result.lat) < CLOSE_COORDINATE_THRESHOLD &&
        Math.abs(pin.lng - result.lng) < CLOSE_COORDINATE_THRESHOLD
      ),
  );
}

export function createSavedDiscoverIdSet(
  discoverResults: DiscoverResult[],
  pins: Pin[],
): Set<string> {
  const savedIds = new Set<string>();
  for (const result of discoverResults) {
    if (isDiscoverResultAlreadyPinned(result, pins)) {
      savedIds.add(result.placeId);
    }
  }
  return savedIds;
}

interface GetVisibleDiscoverResultsParams {
  discoverResults: DiscoverResult[];
  selectedDiscoverIds: Set<string>;
  savedDiscoverIds: Set<string>;
  selectedOnly: boolean;
  savedOnly: boolean;
  sortKey: DiscoverSortKey;
}

function compareByRatingThenName(a: DiscoverResult, b: DiscoverResult): number {
  const ratingA = a.rating ?? -1;
  const ratingB = b.rating ?? -1;
  if (ratingA !== ratingB) {
    return ratingB - ratingA;
  }
  return a.displayName.localeCompare(b.displayName);
}

function compareByNameAsc(a: DiscoverResult, b: DiscoverResult): number {
  return a.displayName.localeCompare(b.displayName);
}

function compareByNameDesc(a: DiscoverResult, b: DiscoverResult): number {
  return b.displayName.localeCompare(a.displayName);
}

export function getVisibleDiscoverResults({
  discoverResults,
  selectedDiscoverIds,
  savedDiscoverIds,
  selectedOnly,
  savedOnly,
  sortKey,
}: GetVisibleDiscoverResultsParams): DiscoverResult[] {
  const filtered = discoverResults.filter((result) => {
    if (selectedOnly && !selectedDiscoverIds.has(result.placeId)) return false;
    if (savedOnly && !savedDiscoverIds.has(result.placeId)) return false;
    return true;
  });

  if (sortKey === "recommended") {
    return filtered;
  }

  const sorted = [...filtered];
  if (sortKey === "rating-desc") {
    sorted.sort(compareByRatingThenName);
    return sorted;
  }
  if (sortKey === "name-asc") {
    sorted.sort(compareByNameAsc);
    return sorted;
  }
  sorted.sort(compareByNameDesc);
  return sorted;
}
