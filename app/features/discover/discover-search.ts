import { DISCOVER_QUERIES } from "@/app/config/discover-queries";
import { filterAndMapPlace } from "@/app/features/discover/discover-filters";
import { useStore } from "@/app/store";
import type { DiscoverResult } from "@/app/features/discover/model/discover.types";

export type DrawBounds = { swLat: number; swLng: number; neLat: number; neLng: number };

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

  const store = useStore.getState() as ReturnType<typeof useStore.getState> & {
    setSearchProgress?: (msg: string) => void;
  };
  const {
    setDiscoverResults,
    setIsDrawing,
    marathonMode,
    discoverResults: existingResults,
    addMarathonZone,
    incrementMarathonCount,
  } = store;
  const setSearchProgress: (msg: string) => void = store.setSearchProgress ?? (() => {});

  // In normal mode clear old results; in marathon mode accumulate
  if (!marathonMode) {
    setDiscoverResults([]);
  }
  setIsDrawing(false);
  setSearchProgress("Starting search...");

  const seen = new Set<string>();

  // Pre-seed seen with existing results to avoid cross-zone duplicates
  if (marathonMode) {
    existingResults.forEach((r) => seen.add(r.placeId));
  }

  const newResults: DiscoverResult[] = [];

  for (let i = 0; i < DISCOVER_QUERIES.length; i++) {
    if (isCancelled()) {
      setSearchProgress("");
      return;
    }

    const query = DISCOVER_QUERIES[i];
    setSearchProgress(`Searching: ${query}... (${newResults.length} found) [${i + 1}/${DISCOVER_QUERIES.length}]`);
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
        ],
        locationBias: new google.maps.LatLngBounds(
          { lat: bounds.swLat, lng: bounds.swLng },
          { lat: bounds.neLat, lng: bounds.neLng },
        ),
        maxResultCount: 20,
      });
      if (isCancelled()) {
        setSearchProgress("");
        return;
      }
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
      if (isCancelled() || isExpectedPlacesTransportError(err)) {
        continue;
      }
      console.error(`[Discover] Query "${query}" failed:`, err);
    }
    await sleep(200);
  }

  if (isCancelled()) {
    setSearchProgress("");
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

  setSearchProgress("");
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
