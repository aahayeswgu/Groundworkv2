import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockUseStoreGetState,
  mockFetchAddressValidationSignals,
} = vi.hoisted(() => ({
  mockUseStoreGetState: vi.fn(),
  mockFetchAddressValidationSignals: vi.fn(),
}));

vi.mock("@/app/store", () => ({
  useStore: {
    getState: mockUseStoreGetState,
  },
}));

vi.mock("@/app/features/discover/api/discover-address-validation", () => ({
  fetchAddressValidationSignals: mockFetchAddressValidationSignals,
}));

vi.mock("@/app/features/discover/model/discover-categories", () => ({
  DISCOVER_CATEGORIES: [
    {
      id: "electrical",
      label: "Electrical",
      nearbyPrimaryType: "electrician",
      textQuery: "electrical contractor",
      textIncludedType: "electrician",
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
  ],
}));

const { searchBusinessesInArea } = await import("@/app/features/discover/api/discover-search");

class FakeLatLng {
  private readonly nextLat: number;
  private readonly nextLng: number;

  constructor(lat: number, lng: number) {
    this.nextLat = lat;
    this.nextLng = lng;
  }

  lat() {
    return this.nextLat;
  }

  lng() {
    return this.nextLng;
  }
}

class FakeLatLngBounds {
  readonly sw: { lat: number; lng: number };
  readonly ne: { lat: number; lng: number };

  constructor(sw: { lat: number; lng: number }, ne: { lat: number; lng: number }) {
    this.sw = sw;
    this.ne = ne;
  }
}

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
  const lat = overrides.lat ?? 28;
  const lng = overrides.lng ?? -82.4;
  return {
    id: overrides.id ?? "place-1",
    displayName: overrides.displayName ?? "Test Contractor",
    formattedAddress: overrides.formattedAddress ?? "123 Main St, Tampa, FL",
    location: { lat: () => lat, lng: () => lng },
    types: overrides.types ?? ["establishment"],
    primaryType: overrides.primaryType ?? null,
    businessStatus: overrides.businessStatus ?? "OPERATIONAL",
    rating: overrides.rating ?? 4.1,
    userRatingCount: overrides.userRatingCount ?? 22,
  };
}

describe("searchBusinessesInArea", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses Nearby-first, falls back to Text Search, and applies AV pruning", async () => {
    const nearbySearch = vi.fn(async (request: Record<string, unknown>) => {
      const includedPrimaryTypes = request.includedPrimaryTypes as string[] | undefined;
      if (includedPrimaryTypes?.[0] === "electrician") {
        return {
          places: [
            makePlace({
              id: "nearby-1",
              displayName: "Alpha Electric",
              types: ["electrician"],
              primaryType: "electrician",
              rating: 4.8,
              userRatingCount: 80,
            }),
          ],
        };
      }
      return { places: [] };
    });

    const textSearch = vi.fn(async (request: Record<string, unknown>) => {
      if (request.textQuery === "electrical contractor") {
        return {
          places: [
            makePlace({
              id: "text-1",
              displayName: "Bravo Electrical Contractor",
              types: ["establishment"],
              primaryType: null,
              rating: 4.2,
              userRatingCount: 24,
            }),
          ],
        };
      }

      if (request.textQuery === "HVAC contractor") {
        return {
          places: [
            makePlace({
              id: "amb-1",
              displayName: "City Services Tampa",
              types: ["establishment"],
              primaryType: null,
              businessStatus: null,
              rating: 3.8,
              userRatingCount: 4,
            }),
          ],
        };
      }

      return { places: [] };
    });

    vi.stubGlobal("google", {
      maps: {
        LatLng: FakeLatLng,
        LatLngBounds: FakeLatLngBounds,
        geometry: {
          spherical: {
            computeDistanceBetween: vi.fn().mockReturnValue(1200),
          },
        },
        places: {
          Place: {
            searchNearby: nearbySearch,
            searchByText: textSearch,
          },
        },
      },
    });

    const setDiscoverResults = vi.fn();
    const setDiscoverSearchMetrics = vi.fn();
    const setIsDrawing = vi.fn();
    const setSearchProgress = vi.fn();
    const addMarathonZone = vi.fn();
    const incrementMarathonCount = vi.fn();

    mockUseStoreGetState.mockReturnValue({
      setDiscoverResults,
      setDiscoverSearchMetrics,
      setIsDrawing,
      addMarathonZone,
      incrementMarathonCount,
      setSearchProgress,
      marathonMode: false,
      discoverResults: [],
      marathonSearchCount: 0,
    });

    mockFetchAddressValidationSignals.mockResolvedValue(
      new Map([["amb-1", "residential"]]),
    );

    await searchBusinessesInArea({
      swLat: 27.8,
      swLng: -82.7,
      neLat: 28.2,
      neLng: -82.1,
    });

    expect(nearbySearch).toHaveBeenCalledTimes(1);
    expect(textSearch).toHaveBeenCalledTimes(2);

    const nearbyRequest = nearbySearch.mock.calls[0][0] as Record<string, unknown>;
    expect(nearbyRequest.locationRestriction).toBeTruthy();
    expect((nearbyRequest.includedPrimaryTypes as string[])[0]).toBe("electrician");
    expect(nearbyRequest.maxResultCount).toBe(10);
    expect((nearbyRequest.excludedPrimaryTypes as string[]).includes("restaurant")).toBe(true);
    expect((nearbyRequest.excludedTypes as string[]).includes("street_address")).toBe(true);

    for (const call of textSearch.mock.calls) {
      const request = call[0] as Record<string, unknown>;
      expect(request.locationRestriction).toBeTruthy();
      expect(request.locationBias).toBeUndefined();
    }

    const electricalFallbackCall = textSearch.mock.calls.find(
      (call) => (call[0] as Record<string, unknown>).textQuery === "electrical contractor",
    );
    expect(electricalFallbackCall).toBeTruthy();
    const electricalFallbackRequest = electricalFallbackCall![0] as Record<string, unknown>;
    expect(electricalFallbackRequest.includedType).toBe("electrician");
    expect(electricalFallbackRequest.useStrictTypeFiltering).toBe(true);

    expect(mockFetchAddressValidationSignals).toHaveBeenCalledTimes(1);
    expect(mockFetchAddressValidationSignals.mock.calls[0][0]).toEqual([
      { placeId: "amb-1", address: "123 Main St, Tampa, FL" },
    ]);

    expect(setDiscoverResults.mock.calls.length >= 1).toBe(true);
    const persistedResults = setDiscoverResults.mock.calls[setDiscoverResults.mock.calls.length - 1][0] as Array<{ placeId: string }>;
    expect(persistedResults.map((result) => result.placeId)).toEqual(["nearby-1", "text-1"]);
    expect(persistedResults.every((result) => "leadScore" in result)).toBe(true);
    expect(setDiscoverSearchMetrics).toHaveBeenCalledTimes(1);
    const latestMetrics = setDiscoverSearchMetrics.mock.calls[0][0] as Record<string, unknown>;
    expect(latestMetrics).toEqual(expect.objectContaining({
      finalResultCount: 2,
      categoriesTotal: 2,
      fallbackRate: 1,
    }));
  });

  it("retries Nearby without exclusions on unsupported-type errors and emits metrics", async () => {
    const nearbySearch = vi.fn(async (request: Record<string, unknown>) => {
      if (nearbySearch.mock.calls.length === 1) {
        expect((request.excludedPrimaryTypes as string[]).length > 0).toBe(true);
        expect((request.excludedTypes as string[]).length > 0).toBe(true);
        throw new Error(
          'MapsRequestError: PLACES_NEARBY_SEARCH: INVALID_ARGUMENT: Error in searchNearby: Unsupported types: "food".',
        );
      }

      expect(request.excludedPrimaryTypes).toBeUndefined();
      expect(request.excludedTypes).toBeUndefined();
      return {
        places: [
          makePlace({
            id: "nearby-r1",
            displayName: "Retry Electrical One",
            types: ["electrician"],
            primaryType: "electrician",
            rating: 4.7,
            userRatingCount: 48,
          }),
          makePlace({
            id: "nearby-r2",
            displayName: "Retry Electrical Two",
            types: ["electrician"],
            primaryType: "electrician",
            rating: 4.6,
            userRatingCount: 37,
          }),
        ],
      };
    });

    const textSearch = vi.fn(async (request: Record<string, unknown>) => {
      if (request.textQuery === "HVAC contractor") {
        return {
          places: [
            makePlace({
              id: "hvac-1",
              displayName: "Reliable HVAC Systems",
              types: ["establishment"],
              primaryType: null,
            }),
          ],
        };
      }
      return { places: [] };
    });

    vi.stubGlobal("google", {
      maps: {
        LatLng: FakeLatLng,
        LatLngBounds: FakeLatLngBounds,
        geometry: {
          spherical: {
            computeDistanceBetween: vi.fn().mockReturnValue(1200),
          },
        },
        places: {
          Place: {
            searchNearby: nearbySearch,
            searchByText: textSearch,
          },
        },
      },
    });

    const setDiscoverResults = vi.fn();
    const setDiscoverSearchMetrics = vi.fn();
    const setIsDrawing = vi.fn();
    const setSearchProgress = vi.fn();
    const addMarathonZone = vi.fn();
    const incrementMarathonCount = vi.fn();

    mockUseStoreGetState.mockReturnValue({
      setDiscoverResults,
      setDiscoverSearchMetrics,
      setIsDrawing,
      addMarathonZone,
      incrementMarathonCount,
      setSearchProgress,
      marathonMode: false,
      discoverResults: [],
      marathonSearchCount: 0,
    });

    mockFetchAddressValidationSignals.mockResolvedValue(new Map());
    const consoleInfoSpy = vi.spyOn(console, "info").mockImplementation(() => {});

    await searchBusinessesInArea({
      swLat: 27.8,
      swLng: -82.7,
      neLat: 28.2,
      neLng: -82.1,
    });

    expect(nearbySearch).toHaveBeenCalledTimes(2);
    expect(textSearch).toHaveBeenCalledTimes(1);

    const metricsCall = consoleInfoSpy.mock.calls.find(
      (call) => call[0] === "[Discover] Search metrics",
    );
    expect(metricsCall).toBeTruthy();
    const metrics = metricsCall?.[1] as Record<string, unknown>;
    expect(metrics).toEqual(
      expect.objectContaining({
        nearbyRequests: 1,
        categoriesWithFallback: 1,
        fallbackRate: 0.5,
      }),
    );
    expect(metrics.categories).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "electrical",
          nearby: expect.objectContaining({
            retriedWithoutExclusions: true,
          }),
        }),
      ]),
    );

    consoleInfoSpy.mockRestore();
  });
});
