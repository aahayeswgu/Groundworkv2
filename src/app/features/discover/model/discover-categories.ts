export interface DiscoverCategory {
  id: string;
  label: string;
  nearbyPrimaryType: string | null;
  textQuery: string;
  textIncludedType: string | null;
  minNearbyResultsBeforeFallback: number;
}

export const DISCOVER_CATEGORIES: readonly DiscoverCategory[] = [
  {
    id: "general-contractor",
    label: "General Contractor",
    // `general_contractor` is response-only (not valid for Nearby/Text type filters).
    nearbyPrimaryType: null,
    textQuery: "general contractor",
    textIncludedType: null,
    minNearbyResultsBeforeFallback: 3,
  },
  {
    id: "roofing",
    label: "Roofing",
    nearbyPrimaryType: "roofing_contractor",
    textQuery: "roofing contractor",
    textIncludedType: "roofing_contractor",
    minNearbyResultsBeforeFallback: 3,
  },
  {
    id: "plumbing",
    label: "Plumbing",
    nearbyPrimaryType: "plumber",
    textQuery: "plumbing contractor",
    textIncludedType: "plumber",
    minNearbyResultsBeforeFallback: 3,
  },
  {
    id: "electrical",
    label: "Electrical",
    nearbyPrimaryType: "electrician",
    textQuery: "electrical contractor",
    textIncludedType: "electrician",
    minNearbyResultsBeforeFallback: 3,
  },
  {
    id: "painting",
    label: "Painting",
    nearbyPrimaryType: "painter",
    textQuery: "painting contractor",
    textIncludedType: "painter",
    minNearbyResultsBeforeFallback: 2,
  },
  {
    id: "hvac",
    label: "HVAC",
    nearbyPrimaryType: null,
    textQuery: "HVAC contractor",
    textIncludedType: null,
    minNearbyResultsBeforeFallback: 2,
  },
  {
    id: "concrete",
    label: "Concrete",
    nearbyPrimaryType: null,
    textQuery: "concrete contractor",
    textIncludedType: null,
    minNearbyResultsBeforeFallback: 2,
  },
  {
    id: "framing",
    label: "Framing",
    nearbyPrimaryType: null,
    textQuery: "framing contractor",
    textIncludedType: null,
    minNearbyResultsBeforeFallback: 2,
  },
  {
    id: "drywall",
    label: "Drywall",
    nearbyPrimaryType: null,
    textQuery: "drywall contractor",
    textIncludedType: null,
    minNearbyResultsBeforeFallback: 2,
  },
  {
    id: "flooring",
    label: "Flooring",
    nearbyPrimaryType: null,
    textQuery: "flooring contractor",
    textIncludedType: null,
    minNearbyResultsBeforeFallback: 2,
  },
  {
    id: "landscaping",
    label: "Landscaping",
    nearbyPrimaryType: null,
    textQuery: "landscaping contractor",
    textIncludedType: null,
    minNearbyResultsBeforeFallback: 2,
  },
  {
    id: "masonry",
    label: "Masonry",
    nearbyPrimaryType: null,
    textQuery: "masonry contractor",
    textIncludedType: null,
    minNearbyResultsBeforeFallback: 2,
  },
  {
    id: "window-installation",
    label: "Window Installation",
    nearbyPrimaryType: null,
    textQuery: "window installation",
    textIncludedType: null,
    minNearbyResultsBeforeFallback: 2,
  },
  {
    id: "solar",
    label: "Solar",
    nearbyPrimaryType: null,
    textQuery: "solar panel installer",
    textIncludedType: null,
    minNearbyResultsBeforeFallback: 2,
  },
];
