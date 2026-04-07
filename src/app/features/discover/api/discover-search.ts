import {
  DISCOVER_CATEGORIES,
  type DiscoverCategory,
} from "@/app/features/discover/model/discover-categories";
import { fetchAddressValidationSignals } from "@/app/features/discover/api/discover-address-validation";
import {
  applyResidentialSignalAdjustment,
  compareDiscoverResultsByRecommendation,
  filterAndMapPlace,
  isDiscoverResultAmbiguous,
} from "@/app/features/discover/lib/discover-filters";
import { useStore } from "@/app/store";
import type {
  DiscoverFilterRejectReason,
  DiscoverResult,
  DiscoverSearchMetrics,
} from "@/app/features/discover/model/discover.types";

export type DrawBounds = { swLat: number; swLng: number; neLat: number; neLng: number };

const DISCOVER_QUERY_CONCURRENCY = 3;
const NEARBY_MAX_RESULT_COUNT = 10;
const TEXT_MAX_RESULT_COUNT = 20;
const ADDRESS_VALIDATION_SHORTLIST_LIMIT = 12;
const NEARBY_EXCLUDED_PRIMARY_TYPES = [
  "restaurant",
  "lodging",
  "gas_station",
  "bank",
  "atm",
  "pharmacy",
  "hospital",
  "school",
  "transit_station",
  "park",
] as const;
const NEARBY_EXCLUDED_TYPES = [
  "food",
  "street_address",
  "premise",
  "subpremise",
  "route",
] as const;

const PLACE_SEARCH_FIELDS = [
  "id",
  "displayName",
  "formattedAddress",
  "location",
  "types",
  "primaryType",
  "businessStatus",
  "rating",
  "userRatingCount",
  "photos",
] as const;

// Each new search increments this id; older runs become stale and should stop.
let activeSearchRunId = 0;
let nearbyExclusionsSupported: boolean | null = null;

interface SearchResponse {
  places?: unknown[];
}

interface PlaceSearchApi {
  searchByText: (request: unknown) => Promise<SearchResponse>;
  searchNearby?: (request: unknown) => Promise<SearchResponse>;
}

type RejectCountMap = Partial<Record<DiscoverFilterRejectReason, number>>;

export function cancelDiscoverSearch(): void {
  activeSearchRunId += 1;
}

function isSearchRunStale(runId: number): boolean {
  return runId !== activeSearchRunId;
}

function isExpectedPlacesTransportError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return (
    message.includes("PLACES_SEARCH_TEXT") ||
    message.includes("PLACES_SEARCH_NEARBY") ||
    message.includes("Rpc failed due to xhr error") ||
    message.includes("error code: 6") ||
    message.includes(" [0]")
  );
}

function isUnsupportedTypesInvalidArgument(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return message.includes("INVALID_ARGUMENT") && message.includes("Unsupported types");
}

function incrementRejectReasonCount(
  rejectCounts: RejectCountMap,
  reason: DiscoverFilterRejectReason,
): void {
  rejectCounts[reason] = (rejectCounts[reason] ?? 0) + 1;
}

function mergeRejectCounts(target: RejectCountMap, source: RejectCountMap): void {
  for (const [key, value] of Object.entries(source)) {
    if (!value) continue;
    const reason = key as DiscoverFilterRejectReason;
    target[reason] = (target[reason] ?? 0) + value;
  }
}

function buildSearchProgress(completed: number, total: number): string {
  return `Searching businesses... [${completed}/${total}]`;
}

async function runWithConcurrency<T>(
  items: readonly T[],
  concurrency: number,
  worker: (item: T) => Promise<void>,
): Promise<void> {
  if (!items.length) return;

  const workerCount = Math.min(Math.max(1, concurrency), items.length);
  let nextIndex = 0;

  const runWorker = async () => {
    while (true) {
      const currentIndex = nextIndex;
      if (currentIndex >= items.length) return;
      nextIndex += 1;
      await worker(items[currentIndex]);
    }
  };

  await Promise.all(Array.from({ length: workerCount }, () => runWorker()));
}

function toLatLngBounds(bounds: DrawBounds): google.maps.LatLngBounds {
  return new google.maps.LatLngBounds(
    { lat: bounds.swLat, lng: bounds.swLng },
    { lat: bounds.neLat, lng: bounds.neLng },
  );
}

function getCoveringCircle(bounds: DrawBounds): { center: google.maps.LatLngLiteral; radius: number } {
  const center = {
    lat: (bounds.swLat + bounds.neLat) / 2,
    lng: (bounds.swLng + bounds.neLng) / 2,
  };
  const centerPoint = new google.maps.LatLng(center.lat, center.lng);
  const northEast = new google.maps.LatLng(bounds.neLat, bounds.neLng);
  const southWest = new google.maps.LatLng(bounds.swLat, bounds.swLng);

  const radius = Math.min(
    50_000,
    Math.max(
      google.maps.geometry.spherical.computeDistanceBetween(centerPoint, northEast),
      google.maps.geometry.spherical.computeDistanceBetween(centerPoint, southWest),
      200,
    ),
  );

  return { center, radius };
}

function createSearchByTextRequest(
  category: DiscoverCategory,
  bounds: DrawBounds,
): Record<string, unknown> {
  const request: Record<string, unknown> = {
    textQuery: category.textQuery,
    fields: PLACE_SEARCH_FIELDS,
    locationRestriction: toLatLngBounds(bounds),
    maxResultCount: TEXT_MAX_RESULT_COUNT,
    minRating: 2,
  };

  if (category.textIncludedType) {
    request.includedType = category.textIncludedType;
    request.useStrictTypeFiltering = true;
  }

  return request;
}

function createSearchNearbyRequest(
  category: DiscoverCategory,
  bounds: DrawBounds,
  withExclusions: boolean,
): Record<string, unknown> {
  const { center, radius } = getCoveringCircle(bounds);
  const request: Record<string, unknown> = {
    fields: PLACE_SEARCH_FIELDS,
    locationRestriction: {
      center,
      radius,
    },
    includedPrimaryTypes: [category.nearbyPrimaryType],
    maxResultCount: NEARBY_MAX_RESULT_COUNT,
    rankPreference: "POPULARITY",
  };

  if (withExclusions) {
    request.excludedPrimaryTypes = [...NEARBY_EXCLUDED_PRIMARY_TYPES];
    request.excludedTypes = [...NEARBY_EXCLUDED_TYPES];
  }

  return request;
}

function mapPlacesIntoResults(args: {
  places: unknown[];
  category: DiscoverCategory;
  bounds: DrawBounds;
  seen: Set<string>;
  searchSource: "nearby" | "text-fallback";
  rejectCountsTarget?: RejectCountMap;
}): { mapped: DiscoverResult[]; droppedCount: number } {
  const { places, category, bounds, seen, searchSource } = args;
  const rejectCounts: RejectCountMap = {};
  const mapped: DiscoverResult[] = [];

  for (const place of places) {
    const result = filterAndMapPlace({
      place: place as Parameters<typeof filterAndMapPlace>[0]["place"],
      bounds,
      seen,
      matchedCategory: category.label,
      searchSource,
      onRejected: (reason) => incrementRejectReasonCount(rejectCounts, reason),
    });
    if (result) mapped.push(result);
  }

  if (args.rejectCountsTarget) {
    mergeRejectCounts(args.rejectCountsTarget, rejectCounts);
  }

  return {
    mapped,
    droppedCount: Math.max(0, places.length - mapped.length),
  };
}

async function applyAddressValidationEnrichment(
  results: DiscoverResult[],
  isCancelled: () => boolean,
): Promise<{
  results: DiscoverResult[];
  shortlistCount: number;
  signalsReturned: number;
  businessSignals: number;
  residentialSignals: number;
  unknownSignals: number;
  droppedByResidentialSignal: number;
}> {
  const shortlist = results
    .filter(isDiscoverResultAmbiguous)
    .sort(compareDiscoverResultsByRecommendation)
    .slice(0, ADDRESS_VALIDATION_SHORTLIST_LIMIT);

  if (!shortlist.length) {
    return {
      results,
      shortlistCount: 0,
      signalsReturned: 0,
      businessSignals: 0,
      residentialSignals: 0,
      unknownSignals: 0,
      droppedByResidentialSignal: 0,
    };
  }

  const candidates = shortlist
    .filter((result) => result.address.trim().length > 0)
    .map((result) => ({
      placeId: result.placeId,
      address: result.address,
    }));

  if (!candidates.length) {
    return {
      results,
      shortlistCount: shortlist.length,
      signalsReturned: 0,
      businessSignals: 0,
      residentialSignals: 0,
      unknownSignals: shortlist.length,
      droppedByResidentialSignal: 0,
    };
  }

  const validationSignals = await fetchAddressValidationSignals(candidates);
  if (isCancelled() || !validationSignals.size) {
    return {
      results,
      shortlistCount: shortlist.length,
      signalsReturned: 0,
      businessSignals: 0,
      residentialSignals: 0,
      unknownSignals: shortlist.length,
      droppedByResidentialSignal: 0,
    };
  }

  let droppedByResidentialSignal = 0;
  let businessSignals = 0;
  let residentialSignals = 0;
  let unknownSignals = 0;

  for (const candidate of candidates) {
    const signal = validationSignals.get(candidate.placeId) ?? "unknown";
    if (signal === "business") businessSignals += 1;
    else if (signal === "residential") residentialSignals += 1;
    else unknownSignals += 1;
  }

  const adjusted: DiscoverResult[] = [];
  for (const result of results) {
    const next = applyResidentialSignalAdjustment(
      result,
      validationSignals.get(result.placeId) ?? "unknown",
    );
    if (next) {
      adjusted.push(next);
    } else {
      droppedByResidentialSignal += 1;
    }
  }

  return {
    results: adjusted,
    shortlistCount: shortlist.length,
    signalsReturned: validationSignals.size,
    businessSignals,
    residentialSignals,
    unknownSignals,
    droppedByResidentialSignal,
  };
}

export function validateBounds(bounds: DrawBounds): { valid: boolean; error?: string } {
  const ne = new google.maps.LatLng(bounds.neLat, bounds.neLng);
  const sw = new google.maps.LatLng(bounds.swLat, bounds.swLng);
  const size = google.maps.geometry.spherical.computeDistanceBetween(ne, sw);
  if (size < 200) return { valid: false, error: "Area too small. Draw a larger rectangle." };
  if (size > 30000) return { valid: false, error: "Area too large. Zoom in first." };
  return { valid: true };
}

export async function searchBusinessesInArea(bounds: DrawBounds): Promise<void> {
  // Start a new run and invalidate any previous in-flight search loop.
  activeSearchRunId += 1;
  const searchRunId = activeSearchRunId;
  const isCancelled = (): boolean => isSearchRunStale(searchRunId);

  const Place = google.maps.places.Place as unknown as PlaceSearchApi;

  const state = useStore.getState();
  const {
    setDiscoverResults,
    setIsDrawing,
    addMarathonZone,
    incrementMarathonCount,
    setSearchProgress,
    setDiscoverSearchMetrics,
    marathonMode,
    discoverResults: existingResults,
  } = state;

  const setProgressForActiveRun = (msg: string): void => {
    if (isCancelled()) return;
    setSearchProgress(msg);
  };

  // In normal mode clear old results; in marathon mode accumulate
  if (!marathonMode) {
    setDiscoverResults([]);
  }
  setIsDrawing(false);
  setProgressForActiveRun("Starting search...");

  const seen = new Set<string>();
  if (marathonMode) {
    existingResults.forEach((result) => seen.add(result.placeId));
  }

  let newResults: DiscoverResult[] = [];
  let completedCategories = 0;
  const totalCategories = DISCOVER_CATEGORIES.length;
  const searchMetrics: DiscoverSearchMetrics = {
    runId: searchRunId,
    categoriesTotal: totalCategories,
    categoriesWithFallback: 0,
    nearbyRequests: 0,
    nearbyFailures: 0,
    textRequests: 0,
    textFailures: 0,
    rawFetchedNearby: 0,
    rawFetchedText: 0,
    acceptedNearby: 0,
    acceptedText: 0,
    droppedNearby: 0,
    droppedText: 0,
    avShortlistCount: 0,
    avSignalsReturned: 0,
    avBusinessSignals: 0,
    avResidentialSignals: 0,
    avUnknownSignals: 0,
    avDroppedResults: 0,
    finalResultCount: 0,
    fallbackRate: 0,
    rejectReasons: {},
    categories: [],
  };
  setProgressForActiveRun(buildSearchProgress(completedCategories, totalCategories));

  await runWithConcurrency(
    DISCOVER_CATEGORIES,
    DISCOVER_QUERY_CONCURRENCY,
    async (category) => {
      if (isCancelled()) return;

      const categoryMetrics: DiscoverSearchMetrics["categories"][number] = {
        id: category.id,
        nearby: {
          requested: false,
          raw: 0,
          accepted: 0,
          dropped: 0,
          retriedWithoutExclusions: false,
          failed: false,
        },
        textFallback: {
          used: false,
          raw: 0,
          accepted: 0,
          dropped: 0,
          failed: false,
        },
      };

      let nearbyAcceptedCount = 0;

      try {
        if (category.nearbyPrimaryType && Place.searchNearby) {
          categoryMetrics.nearby.requested = true;
          searchMetrics.nearbyRequests += 1;
          let response: SearchResponse | null = null;
          const shouldTryExclusions = nearbyExclusionsSupported !== false;
          try {
            response = await Place.searchNearby(
              createSearchNearbyRequest(category, bounds, shouldTryExclusions),
            );
            if (shouldTryExclusions) {
              nearbyExclusionsSupported = true;
            }
          } catch (err) {
            if (shouldTryExclusions && isUnsupportedTypesInvalidArgument(err)) {
              categoryMetrics.nearby.retriedWithoutExclusions = true;
              nearbyExclusionsSupported = false;
              response = await Place.searchNearby(
                createSearchNearbyRequest(category, bounds, false),
              );
            } else {
              throw err;
            }
          }

          if (!isCancelled()) {
            const places = response?.places ?? [];
            const mappedResults = mapPlacesIntoResults({
              places,
              category,
              bounds,
              seen,
              searchSource: "nearby",
              rejectCountsTarget: searchMetrics.rejectReasons,
            });
            nearbyAcceptedCount = mappedResults.mapped.length;
            categoryMetrics.nearby.raw = places.length;
            categoryMetrics.nearby.accepted = mappedResults.mapped.length;
            categoryMetrics.nearby.dropped = mappedResults.droppedCount;
            searchMetrics.rawFetchedNearby += places.length;
            searchMetrics.acceptedNearby += mappedResults.mapped.length;
            searchMetrics.droppedNearby += mappedResults.droppedCount;
            newResults.push(...mappedResults.mapped);
          }
        }
      } catch (err) {
        categoryMetrics.nearby.failed = true;
        searchMetrics.nearbyFailures += 1;
        if (!isCancelled() && !isExpectedPlacesTransportError(err)) {
          console.error(`[Discover] Nearby category "${category.id}" failed:`, err);
        }
      }

      const needsTextFallback =
        !category.nearbyPrimaryType ||
        !Place.searchNearby ||
        nearbyAcceptedCount < category.minNearbyResultsBeforeFallback;

      if (needsTextFallback) {
        searchMetrics.categoriesWithFallback += 1;
      }

      if (!needsTextFallback || isCancelled()) {
        searchMetrics.categories.push(categoryMetrics);
        completedCategories += 1;
        setProgressForActiveRun(buildSearchProgress(completedCategories, totalCategories));
        return;
      }

      try {
        categoryMetrics.textFallback.used = true;
        searchMetrics.textRequests += 1;
        const response = await Place.searchByText(
          createSearchByTextRequest(category, bounds),
        );

        if (!isCancelled()) {
          const places = response.places ?? [];
          const mappedResults = mapPlacesIntoResults({
            places,
            category,
            bounds,
            seen,
            searchSource: "text-fallback",
            rejectCountsTarget: searchMetrics.rejectReasons,
          });
          categoryMetrics.textFallback.raw = places.length;
          categoryMetrics.textFallback.accepted = mappedResults.mapped.length;
          categoryMetrics.textFallback.dropped = mappedResults.droppedCount;
          searchMetrics.rawFetchedText += places.length;
          searchMetrics.acceptedText += mappedResults.mapped.length;
          searchMetrics.droppedText += mappedResults.droppedCount;
          newResults.push(...mappedResults.mapped);
        }
      } catch (err) {
        categoryMetrics.textFallback.failed = true;
        searchMetrics.textFailures += 1;
        if (!isCancelled() && !isExpectedPlacesTransportError(err)) {
          console.error(`[Discover] Text fallback category "${category.id}" failed:`, err);
        }
      } finally {
        searchMetrics.categories.push(categoryMetrics);
        completedCategories += 1;
        setProgressForActiveRun(buildSearchProgress(completedCategories, totalCategories));
      }
    },
  );

  if (isCancelled()) {
    setProgressForActiveRun("");
    return;
  }

  const avEnrichment = await applyAddressValidationEnrichment(newResults, isCancelled);
  if (isCancelled()) {
    setProgressForActiveRun("");
    return;
  }
  newResults = avEnrichment.results;
  searchMetrics.avShortlistCount = avEnrichment.shortlistCount;
  searchMetrics.avSignalsReturned = avEnrichment.signalsReturned;
  searchMetrics.avBusinessSignals = avEnrichment.businessSignals;
  searchMetrics.avResidentialSignals = avEnrichment.residentialSignals;
  searchMetrics.avUnknownSignals = avEnrichment.unknownSignals;
  searchMetrics.avDroppedResults = avEnrichment.droppedByResidentialSignal;

  newResults.sort(compareDiscoverResultsByRecommendation);

  const combined = marathonMode
    ? [...existingResults, ...newResults]
    : newResults;
  combined.sort(compareDiscoverResultsByRecommendation);
  searchMetrics.finalResultCount = combined.length;
  setDiscoverResults(combined);

  if (marathonMode) {
    const zoneCount = useStore.getState().marathonSearchCount + 1;
    addMarathonZone({
      id: crypto.randomUUID(),
      label: `Zone ${zoneCount}`,
      bounds,
      results: newResults,
      resultCount: newResults.length,
    });
    incrementMarathonCount();
  }

  if (!isCancelled()) {
    searchMetrics.fallbackRate = totalCategories === 0
      ? 0
      : Number((searchMetrics.categoriesWithFallback / totalCategories).toFixed(3));
    setDiscoverSearchMetrics(searchMetrics);
    console.info("[Discover] Search metrics", {
      ...searchMetrics,
    });
  }

  setProgressForActiveRun("");
}
