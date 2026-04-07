import { describe, it, expect } from "vitest";
import {
  applyResidentialSignalAdjustment,
  compareDiscoverResultsByRecommendation,
  filterAndMapPlace,
} from "@/app/features/discover/lib/discover-filters";
import type { DiscoverResult } from "@/app/features/discover/model/discover.types";

const bounds = {
  swLat: 27.8,
  swLng: -82.7,
  neLat: 28.2,
  neLng: -82.1,
};

function makePlace(overrides: Partial<{
  id: string;
  displayName: string;
  formattedAddress: string;
  lat: number;
  lng: number;
  types: string[];
  primaryType: string | null;
  businessStatus: string | null;
  rating: number;
  userRatingCount: number;
}> = {}) {
  const lat = overrides.lat ?? 28.0;
  const lng = overrides.lng ?? -82.4;
  return {
    id: overrides.id ?? "place-1",
    displayName: overrides.displayName ?? "Test Contractor",
    formattedAddress: overrides.formattedAddress ?? "123 Main St, Tampa, FL",
    location: { lat: () => lat, lng: () => lng },
    types: overrides.types ?? ["general_contractor"],
    primaryType: overrides.primaryType ?? "general_contractor",
    businessStatus: overrides.businessStatus ?? "OPERATIONAL",
    rating: overrides.rating ?? 4.4,
    userRatingCount: overrides.userRatingCount ?? 32,
  };
}

function makeResult(overrides: Partial<DiscoverResult> = {}): DiscoverResult {
  return {
    placeId: "result-1",
    displayName: "Test Contractor",
    address: "123 Main St",
    lat: 28,
    lng: -82.4,
    types: ["general_contractor"],
    primaryType: "general_contractor",
    businessStatus: "OPERATIONAL",
    matchedCategory: "General Contractor",
    searchSource: "nearby",
    leadScore: 62,
    residentialSignal: "unknown",
    rating: 4.2,
    ratingCount: 21,
    photoUri: null,
    ...overrides,
  };
}

describe("filterAndMapPlace", () => {
  it("drops address-only records without trade signals", () => {
    const result = filterAndMapPlace({
      place: makePlace({
        id: "addr-1",
        displayName: "123 Main Street",
        types: ["street_address", "premise"],
        primaryType: "street_address",
      }),
      bounds,
      seen: new Set(),
      matchedCategory: "General Contractor",
      searchSource: "text-fallback",
    });

    expect(result).toBeNull();
  });

  it("keeps valid trade businesses and annotates score + metadata", () => {
    const result = filterAndMapPlace({
      place: makePlace({
        id: "trade-1",
        displayName: "Alpha Electrical Contractor",
        types: ["electrician", "establishment"],
        primaryType: "electrician",
      }),
      bounds,
      seen: new Set(),
      matchedCategory: "Electrical",
      searchSource: "nearby",
    });

    expect(result).not.toBeNull();
    expect(result?.matchedCategory).toBe("Electrical");
    expect(result?.searchSource).toBe("nearby");
    expect(result?.residentialSignal).toBe("business");
    expect((result?.leadScore ?? 0) > 50).toBe(true);
  });

  it("drops explicit closed business statuses", () => {
    const result = filterAndMapPlace({
      place: makePlace({
        id: "closed-1",
        businessStatus: "CLOSED_PERMANENTLY",
      }),
      bounds,
      seen: new Set(),
      matchedCategory: "General Contractor",
      searchSource: "nearby",
    });

    expect(result).toBeNull();
  });
});

describe("recommendation ordering", () => {
  it("sorts by leadScore, then rating, then displayName", () => {
    const results = [
      makeResult({ placeId: "a", displayName: "Zulu", leadScore: 70, rating: 4.1 }),
      makeResult({ placeId: "b", displayName: "Alpha", leadScore: 70, rating: 4.8 }),
      makeResult({ placeId: "c", displayName: "Bravo", leadScore: 92, rating: 4.0 }),
    ];

    results.sort(compareDiscoverResultsByRecommendation);

    expect(results.map((result) => result.placeId)).toEqual(["c", "b", "a"]);
  });
});

describe("applyResidentialSignalAdjustment", () => {
  it("boosts business signals and can drop low-score residential signals", () => {
    const boosted = applyResidentialSignalAdjustment(
      makeResult({ leadScore: 55, residentialSignal: "unknown" }),
      "business",
    );
    expect(boosted?.leadScore).toBe(75);
    expect(boosted?.residentialSignal).toBe("business");

    const dropped = applyResidentialSignalAdjustment(
      makeResult({ leadScore: 48, residentialSignal: "unknown" }),
      "residential",
    );
    expect(dropped).toBeNull();
  });
});
