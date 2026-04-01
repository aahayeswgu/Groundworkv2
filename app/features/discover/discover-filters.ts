import type { DiscoverResult } from "@/app/types/discover.types";
import type { DrawBounds } from "@/app/features/discover/discover-search";

// Business types to exclude from discover results (chains, residential, irrelevant).
const EXCLUDED_TYPES = new Set([
  "lodging",
  "restaurant",
  "food",
  "grocery_or_supermarket",
  "convenience_store",
  "gas_station",
  "bank",
  "atm",
  "pharmacy",
  "hospital",
  "school",
  "church",
  "place_of_worship",
  "park",
  "transit_station",
  "subway_station",
  "bus_station",
]);

type PlaceLike = {
  id?: string;
  displayName?: string;
  formattedAddress?: string;
  location?: { lat: () => number; lng: () => number } | null;
  types?: string[];
  rating?: number;
  userRatingCount?: number;
  photos?: Array<{ getURI?: (opts: { maxWidth: number }) => string }>;
};

/**
 * Filter and map a Places API place object to a DiscoverResult.
 * Returns null if the place should be excluded (out of bounds, chain, already seen, etc.).
 */
export function filterAndMapPlace(
  place: PlaceLike,
  bounds: DrawBounds,
  seen: Set<string>,
): DiscoverResult | null {
  if (!place.id || !place.displayName || !place.location) return null;

  const lat = place.location.lat();
  const lng = place.location.lng();

  // Strict bounds filtering — locationRestriction is a hint, not a guarantee.
  if (
    lat < bounds.swLat ||
    lat > bounds.neLat ||
    lng < bounds.swLng ||
    lng > bounds.neLng
  ) {
    return null;
  }

  // Dedup by place id.
  if (seen.has(place.id)) return null;
  seen.add(place.id);

  // Exclude irrelevant types.
  const types = place.types ?? [];
  if (types.some((t) => EXCLUDED_TYPES.has(t))) return null;

  const photoUri = place.photos?.[0]?.getURI?.({ maxWidth: 400 }) ?? null;

  return {
    placeId: place.id,
    displayName: place.displayName,
    address: place.formattedAddress ?? "",
    lat,
    lng,
    types,
    rating: place.rating ?? null,
    photoUri,
  };
}
