import type { DiscoverResult } from "@/app/types/discover.types";
import type { DrawBounds } from "@/app/features/discover/discover-search";

export const EXCLUDED_CHAINS = /home depot|lowe'?s|ace hardware|menards|harbor freight|sherwin.williams|walmart|target|costco|cvs|walgreens|publix|mcdonald|starbucks|dunkin|subway|burger king|taco bell|pizza|chase bank|wells fargo|bank of america|state farm|allstate/i;

export const EXCLUDED_NAME_PATTERNS = /\b(home|house|residential|apartment|condo|duplex|townhome|single.?family|estate|realty|realtor|property management|handyman|maid|cleaning service|lawn care|pest control|pool service|garage door|window cleaning|gutter cleaning|pressure wash|junk removal|moving|storage)\b/i;

export function classifyGooglePlace(types: string[], displayName: string): string {
  const name = displayName.toLowerCase();
  if (types.includes('electrician')) return 'Electrical';
  if (types.includes('plumber')) return 'Plumbing';
  if (types.includes('roofing_contractor')) return 'Roofing';
  if (types.includes('painter')) return 'Painting';
  if (types.includes('general_contractor')) return 'General Contractor';
  if (name.match(/hvac|heating.*cool|air condition/)) return 'HVAC';
  if (name.match(/landscap|lawn|tree serv/)) return 'Landscaping';
  if (name.match(/weld|fabricat/)) return 'Welding/Fabrication';
  if (name.match(/concrete|cement|ready.?mix/)) return 'Concrete';
  if (name.match(/demoli/)) return 'Demolition';
  if (name.match(/excavat|grading|earthwork/)) return 'Excavation';
  if (name.match(/pav|asphalt/)) return 'Paving';
  if (name.match(/mason|brick/)) return 'Masonry';
  if (name.match(/fence|fencing/)) return 'Fencing';
  if (name.match(/manufactur|industrial.*supply|production.*facility/)) return 'Manufacturing';
  if (name.match(/construct|contract|builder/)) return 'Construction';
  return 'Trade/Contractor';
}

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
