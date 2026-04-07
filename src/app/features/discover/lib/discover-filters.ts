import type {
  DiscoverFilterRejectReason,
  DiscoverResult,
} from "@/app/features/discover/model/discover.types";
import type { DrawBounds } from "@/app/features/discover/api/discover-search";

export const EXCLUDED_CHAINS = /home depot|lowe'?s|ace hardware|menards|harbor freight|sherwin.williams|walmart|target|costco|cvs|walgreens|publix|mcdonald|starbucks|dunkin|subway|burger king|taco bell|pizza|chase bank|wells fargo|bank of america|state farm|allstate/i;

export const EXCLUDED_NAME_PATTERNS = /\b(home|house|residential|apartment|condo|duplex|townhome|single.?family|estate|realty|realtor|property management|handyman|maid|cleaning service|lawn care|pest control|pool service|garage door|window cleaning|gutter cleaning|pressure wash|junk removal|moving|storage)\b/i;

const CLOSED_BUSINESS_STATUSES = new Set([
  "CLOSED_TEMPORARILY",
  "CLOSED_PERMANENTLY",
  "CLOSED",
]);

const ADDRESS_ONLY_TYPES = new Set([
  "street_address",
  "premise",
  "subpremise",
  "route",
]);

const RESIDENTIAL_TYPES = new Set([
  "single_family_residential",
  "multi_family_residential",
  "housing_complex",
  "apartment_building",
  "apartment_rental_agency",
  "condominium_complex",
]);

const TRADE_SIGNAL_TYPES = new Set([
  "electrician",
  "plumber",
  "roofing_contractor",
  "painter",
  "general_contractor",
]);

// Strongly irrelevant business types for this use case.
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
  "neighborhood",
]);

export function classifyGooglePlace(
  types: string[],
  displayName: string,
  primaryType?: string | null,
  matchedCategory?: string | null,
): string {
  if (matchedCategory) return matchedCategory;

  const primary = primaryType ?? null;
  if (primary === "electrician") return "Electrical";
  if (primary === "plumber") return "Plumbing";
  if (primary === "roofing_contractor") return "Roofing";
  if (primary === "painter") return "Painting";
  if (primary === "general_contractor") return "General Contractor";

  const name = displayName.toLowerCase();
  if (types.includes("electrician")) return "Electrical";
  if (types.includes("plumber")) return "Plumbing";
  if (types.includes("roofing_contractor")) return "Roofing";
  if (types.includes("painter")) return "Painting";
  if (types.includes("general_contractor")) return "General Contractor";
  if (name.match(/hvac|heating.*cool|air condition/)) return "HVAC";
  if (name.match(/landscap|lawn|tree serv/)) return "Landscaping";
  if (name.match(/weld|fabricat/)) return "Welding/Fabrication";
  if (name.match(/concrete|cement|ready.?mix/)) return "Concrete";
  if (name.match(/demoli/)) return "Demolition";
  if (name.match(/excavat|grading|earthwork/)) return "Excavation";
  if (name.match(/pav|asphalt/)) return "Paving";
  if (name.match(/mason|brick/)) return "Masonry";
  if (name.match(/fence|fencing/)) return "Fencing";
  if (name.match(/drill|boring|well service/)) return "Drilling";
  if (name.match(/manufactur|industrial.*supply|production.*facility/)) return "Manufacturing";
  if (name.match(/construct|contract|builder/)) return "Construction";
  return "Trade/Contractor";
}

type PlaceLike = {
  id?: string;
  displayName?: string;
  formattedAddress?: string;
  location?: { lat: () => number; lng: () => number } | null;
  types?: string[];
  primaryType?: string | null;
  businessStatus?: string | null;
  rating?: number;
  userRatingCount?: number;
  photos?: Array<{ getURI?: (opts: { maxWidth: number }) => string }>;
};

export interface FilterAndMapPlaceParams {
  place: PlaceLike;
  bounds: DrawBounds;
  seen: Set<string>;
  matchedCategory: string;
  searchSource: "nearby" | "text-fallback";
  onRejected?: (reason: DiscoverFilterRejectReason) => void;
}

export type FilterRejectReason = DiscoverFilterRejectReason;

function isWithinBounds(
  lat: number,
  lng: number,
  bounds: DrawBounds,
): boolean {
  return (
    lat >= bounds.swLat &&
    lat <= bounds.neLat &&
    lng >= bounds.swLng &&
    lng <= bounds.neLng
  );
}

function isAddressOnlyPlace(types: readonly string[]): boolean {
  if (!types.length) return false;
  return types.every((type) => ADDRESS_ONLY_TYPES.has(type));
}

function hasTradeBusinessSignal(
  types: readonly string[],
  primaryType: string | null,
  matchedCategory: string,
  displayName: string,
): boolean {
  void matchedCategory;
  if (TRADE_SIGNAL_TYPES.has(primaryType ?? "")) return true;
  if (types.some((type) => TRADE_SIGNAL_TYPES.has(type))) return true;
  if (/contract|construction|builder|industrial|fabricat|trade/i.test(displayName)) return true;
  return false;
}

function inferResidentialSignal(
  types: readonly string[],
  primaryType: string | null,
  tradeSignal: boolean,
): DiscoverResult["residentialSignal"] {
  if (primaryType && RESIDENTIAL_TYPES.has(primaryType)) return "residential";
  if (types.some((type) => RESIDENTIAL_TYPES.has(type))) return "residential";
  if (tradeSignal) return "business";
  if (isAddressOnlyPlace(types)) return "residential";
  return "unknown";
}

function normalizeBusinessStatus(businessStatus: string | null | undefined): string | null {
  if (!businessStatus) return null;
  return String(businessStatus).toUpperCase();
}

function calculateLeadScore(args: {
  displayName: string;
  types: string[];
  primaryType: string | null;
  businessStatus: string | null;
  matchedCategory: string;
  searchSource: "nearby" | "text-fallback";
  rating: number | null;
  ratingCount: number | null;
  residentialSignal: DiscoverResult["residentialSignal"];
  tradeSignal: boolean;
}): number {
  const {
    displayName,
    types,
    primaryType,
    businessStatus,
    matchedCategory,
    searchSource,
    rating,
    ratingCount,
    residentialSignal,
    tradeSignal,
  } = args;

  let score = 45;

  if (matchedCategory) score += 14;
  if (tradeSignal) score += 8;
  if (searchSource === "nearby") score += 5;

  if (primaryType && TRADE_SIGNAL_TYPES.has(primaryType)) {
    score += 9;
  } else if (types.some((type) => TRADE_SIGNAL_TYPES.has(type))) {
    score += 5;
  }

  if (rating !== null) {
    if (rating >= 4.5) score += 10;
    else if (rating >= 4) score += 7;
    else if (rating >= 3.5) score += 4;
    else if (rating < 3) score -= 3;
  }

  if (ratingCount !== null) {
    if (ratingCount >= 100) score += 7;
    else if (ratingCount >= 30) score += 5;
    else if (ratingCount >= 8) score += 3;
    else if (ratingCount === 0) score -= 2;
  }

  if (businessStatus === "OPERATIONAL") score += 5;

  if (isAddressOnlyPlace(types)) score -= 18;
  if (EXCLUDED_NAME_PATTERNS.test(displayName)) score -= 20;

  if (residentialSignal === "business") score += 10;
  if (residentialSignal === "residential") score -= 28;

  if (EXCLUDED_CHAINS.test(displayName)) score -= 18;

  return Math.max(0, Math.min(100, score));
}

/**
 * Filter and map a Places API place object to a DiscoverResult.
 * Returns null if the place should be excluded.
 */
export function filterAndMapPlace({
  place,
  bounds,
  seen,
  matchedCategory,
  searchSource,
  onRejected,
}: FilterAndMapPlaceParams): DiscoverResult | null {
  if (!place.id || !place.displayName || !place.location) {
    onRejected?.("missing_required_fields");
    return null;
  }

  const lat = place.location.lat();
  const lng = place.location.lng();
  if (!isWithinBounds(lat, lng, bounds)) {
    onRejected?.("out_of_bounds");
    return null;
  }

  if (seen.has(place.id)) {
    onRejected?.("duplicate_place");
    return null;
  }

  const types = place.types ?? [];
  const primaryType = place.primaryType ?? null;
  const businessStatus = normalizeBusinessStatus(place.businessStatus);

  if (businessStatus && CLOSED_BUSINESS_STATUSES.has(businessStatus)) {
    onRejected?.("closed_business_status");
    return null;
  }

  const tradeSignal = hasTradeBusinessSignal(
    types,
    primaryType,
    matchedCategory,
    place.displayName,
  );

  if (types.some((type) => EXCLUDED_TYPES.has(type)) && !tradeSignal) {
    onRejected?.("excluded_type_without_trade_signal");
    return null;
  }
  if (isAddressOnlyPlace(types) && !tradeSignal) {
    onRejected?.("address_only_without_trade_signal");
    return null;
  }

  // Secondary cleanup
  if (EXCLUDED_CHAINS.test(place.displayName)) {
    onRejected?.("excluded_chain");
    return null;
  }
  if (EXCLUDED_NAME_PATTERNS.test(place.displayName) && !tradeSignal) {
    onRejected?.("excluded_residential_name_without_trade_signal");
    return null;
  }

  seen.add(place.id);

  const residentialSignal = inferResidentialSignal(types, primaryType, tradeSignal);
  const rating = place.rating ?? null;
  const ratingCount = place.userRatingCount ?? null;

  const leadScore = calculateLeadScore({
    displayName: place.displayName,
    types,
    primaryType,
    businessStatus,
    matchedCategory,
    searchSource,
    rating,
    ratingCount,
    residentialSignal,
    tradeSignal,
  });

  const photoUri = place.photos?.[0]?.getURI?.({ maxWidth: 400 }) ?? null;

  return {
    placeId: place.id,
    displayName: place.displayName,
    address: place.formattedAddress ?? "",
    lat,
    lng,
    types,
    primaryType,
    businessStatus,
    matchedCategory,
    searchSource,
    leadScore,
    residentialSignal,
    rating,
    ratingCount,
    photoUri,
  };
}

export function applyResidentialSignalAdjustment(
  result: DiscoverResult,
  signal: DiscoverResult["residentialSignal"],
): DiscoverResult | null {
  if (signal === "unknown") return result;

  if (signal === "business") {
    return {
      ...result,
      residentialSignal: "business",
      leadScore: Math.min(100, result.leadScore + 20),
    };
  }

  const downgradedScore = Math.max(0, result.leadScore - 45);
  if (downgradedScore < 38) return null;

  return {
    ...result,
    residentialSignal: "residential",
    leadScore: downgradedScore,
  };
}

export function compareDiscoverResultsByRecommendation(
  a: DiscoverResult,
  b: DiscoverResult,
): number {
  if (a.leadScore !== b.leadScore) {
    return b.leadScore - a.leadScore;
  }

  const ratingA = a.rating ?? -1;
  const ratingB = b.rating ?? -1;
  if (ratingA !== ratingB) {
    return ratingB - ratingA;
  }

  return a.displayName.localeCompare(b.displayName);
}

export function isDiscoverResultAmbiguous(result: DiscoverResult): boolean {
  if (result.residentialSignal !== "unknown") return false;
  if (!result.address.trim()) return false;
  return result.leadScore >= 35 && result.leadScore <= 75;
}
