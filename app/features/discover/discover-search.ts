import { DISCOVER_QUERIES } from "@/app/config/discover-queries";
import { filterAndMapPlace } from "@/app/features/discover/discover-filters";
import { useStore } from "@/app/store";
import type { DiscoverResult } from "@/app/types/discover.types";

export type DrawBounds = { swLat: number; swLng: number; neLat: number; neLng: number };

// Cancellation token — set to true to abort the current search
let cancelToken = false;

export function cancelDiscoverSearch(): void {
  cancelToken = true;
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
  // Cancel any in-progress search
  cancelToken = true;
  await sleep(50);
  cancelToken = false;

  const { Place } = (await google.maps.importLibrary("places")) as google.maps.PlacesLibrary;

  const store = useStore.getState() as ReturnType<typeof useStore.getState> & {
    setSearchProgress?: (msg: string) => void;
  };
  const { setDiscoverResults, setIsDrawing } = store;
  const setSearchProgress: (msg: string) => void = store.setSearchProgress ?? (() => {});

  // Clear old results before starting new search
  setDiscoverResults([]);
  setIsDrawing(false);
  setSearchProgress("Starting search...");

  const seen = new Set<string>();
  const results: DiscoverResult[] = [];

  for (let i = 0; i < DISCOVER_QUERIES.length; i++) {
    if (cancelToken) {
      setSearchProgress("");
      return;
    }

    const query = DISCOVER_QUERIES[i];
    setSearchProgress(`Searching: ${query}... (${results.length} found) [${i + 1}/${DISCOVER_QUERIES.length}]`);
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
      for (const place of places ?? []) {
        const result = filterAndMapPlace(
          place as Parameters<typeof filterAndMapPlace>[0],
          bounds,
          seen,
        );
        if (result) results.push(result);
      }
    } catch (err) {
      console.error(`[Discover] Query "${query}" failed:`, err);
    }
    await sleep(200);
  }

  if (cancelToken) {
    setSearchProgress("");
    return;
  }

  results.sort((a, b) => a.displayName.localeCompare(b.displayName));
  setDiscoverResults(results);
  setSearchProgress("");
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
