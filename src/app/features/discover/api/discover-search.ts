import { DISCOVER_QUERIES } from "@/app/features/discover/model/discover-queries";
import { filterAndMapPlace } from "@/app/features/discover/lib/discover-filters";
import { useStore } from "@/app/store";
import type { DiscoverResult } from "@/app/features/discover/model/discover.types";

export type DrawBounds = { swLat: number; swLng: number; neLat: number; neLng: number };

const DISCOVER_QUERY_CONCURRENCY = 3;

// Each new search increments this id; older runs become stale and should stop.
let activeSearchRunId = 0;

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
    message.includes("Rpc failed due to xhr error") ||
    message.includes("error code: 6") ||
    message.includes(" [0]")
  );
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

  const Place = google.maps.places.Place;

  const state = useStore.getState();
  const {
    setDiscoverResults,
    setIsDrawing,
    addMarathonZone,
    incrementMarathonCount,
    setSearchProgress,
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

  // Pre-seed seen with existing results to avoid cross-zone duplicates
  if (marathonMode) {
    existingResults.forEach((r) => seen.add(r.placeId));
  }

  const newResults: DiscoverResult[] = [];
  const totalQueries = DISCOVER_QUERIES.length;
  let completedQueries = 0;
  setProgressForActiveRun(buildSearchProgress(completedQueries, totalQueries));

  await runWithConcurrency(
    DISCOVER_QUERIES,
    DISCOVER_QUERY_CONCURRENCY,
    async (query) => {
      if (isCancelled()) return;

      try {
        const { places } = await Place.searchByText({
          textQuery: query,
          fields: [
            "id",
            "displayName",
            "formattedAddress",
            "location",
            "types",
            "rating",
            "userRatingCount",
            "photos",
            "businessStatus",
          ],
          locationBias: new google.maps.LatLngBounds(
            { lat: bounds.swLat, lng: bounds.swLng },
            { lat: bounds.neLat, lng: bounds.neLng },
          ),
          maxResultCount: 20,
        });

        if (isCancelled()) return;

        for (const place of places ?? []) {
          const result = filterAndMapPlace(
            place as Parameters<typeof filterAndMapPlace>[0],
            bounds,
            seen,
          );
          if (result) newResults.push(result);
        }
      } catch (err) {
        // Frequent transient transport/cancel noise from Places RPC should not spam console.
        if (!isCancelled() && !isExpectedPlacesTransportError(err)) {
          console.error(`[Discover] Query "${query}" failed:`, err);
        }
      } finally {
        completedQueries += 1;
        setProgressForActiveRun(buildSearchProgress(completedQueries, totalQueries));
      }
    },
  );

  if (isCancelled()) {
    setProgressForActiveRun("");
    return;
  }

  const combined = marathonMode
    ? [...existingResults, ...newResults]
    : newResults;
  combined.sort((a, b) => a.displayName.localeCompare(b.displayName));
  setDiscoverResults(combined);

  // Register the zone after search completes (marathon mode only)
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

  setProgressForActiveRun("");
}
