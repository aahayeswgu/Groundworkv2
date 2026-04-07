export interface DiscoverResult {
  placeId: string;
  displayName: string;
  address: string;
  lat: number;
  lng: number;
  types: string[];
  primaryType: string | null;
  businessStatus: string | null;
  matchedCategory: string | null;
  searchSource: "nearby" | "text-fallback";
  leadScore: number;
  residentialSignal: "business" | "residential" | "unknown";
  rating: number | null;
  ratingCount: number | null;
  photoUri: string | null;
}

export type DiscoverFilterRejectReason =
  | "missing_required_fields"
  | "out_of_bounds"
  | "duplicate_place"
  | "closed_business_status"
  | "excluded_type_without_trade_signal"
  | "address_only_without_trade_signal"
  | "excluded_chain"
  | "excluded_residential_name_without_trade_signal";

export interface DiscoverCategorySearchMetrics {
  id: string;
  nearby: {
    requested: boolean;
    raw: number;
    accepted: number;
    dropped: number;
    retriedWithoutExclusions: boolean;
    failed: boolean;
  };
  textFallback: {
    used: boolean;
    raw: number;
    accepted: number;
    dropped: number;
    failed: boolean;
  };
}

export interface DiscoverSearchMetrics {
  runId: number;
  categoriesTotal: number;
  categoriesWithFallback: number;
  nearbyRequests: number;
  nearbyFailures: number;
  textRequests: number;
  textFailures: number;
  rawFetchedNearby: number;
  rawFetchedText: number;
  acceptedNearby: number;
  acceptedText: number;
  droppedNearby: number;
  droppedText: number;
  avShortlistCount: number;
  avSignalsReturned: number;
  avBusinessSignals: number;
  avResidentialSignals: number;
  avUnknownSignals: number;
  avDroppedResults: number;
  finalResultCount: number;
  fallbackRate: number;
  rejectReasons: Partial<Record<DiscoverFilterRejectReason, number>>;
  categories: DiscoverCategorySearchMetrics[];
}

export interface MarathonZone {
  id: string;                    // uuid — unique per draw
  label: string;                 // e.g. "Zone 1", "Zone 2"
  bounds: {
    swLat: number;
    swLng: number;
    neLat: number;
    neLng: number;
  };
  results: DiscoverResult[];     // results found in this zone's search
  resultCount: number;           // snapshot count for badge display
}
