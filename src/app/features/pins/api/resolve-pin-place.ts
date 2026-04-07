export interface ResolvePinPlaceInput {
  title: string;
  address: string;
  lat: number;
  lng: number;
}

export interface ResolvedPinPlace {
  placeId: string;
  photoUrl?: string;
  rating?: number;
  ratingCount?: number;
  resolvedAddress?: string;
}

const PLACE_SEARCH_RADIUS_METERS = 700;

function buildSearchQueries(input: ResolvePinPlaceInput): string[] {
  const queries = [
    `${input.title} ${input.address}`.trim(),
    input.title.trim(),
    input.address.trim(),
  ];

  return Array.from(new Set(queries.filter((value) => value.length > 0)));
}

function getPlaceApi(): typeof google.maps.places.Place | null {
  if (typeof window === "undefined") return null;
  return google.maps?.places?.Place ?? null;
}

export async function resolvePinPlace(input: ResolvePinPlaceInput): Promise<ResolvedPinPlace | null> {
  const Place = getPlaceApi();
  if (!Place) return null;

  const searchQueries = buildSearchQueries(input);

  for (const textQuery of searchQueries) {
    try {
      const { places } = await Place.searchByText({
        textQuery,
        fields: ["id", "formattedAddress", "rating", "userRatingCount", "photos"],
        locationBias: new google.maps.Circle({
          center: { lat: input.lat, lng: input.lng },
          radius: PLACE_SEARCH_RADIUS_METERS,
        }),
        maxResultCount: 1,
      });

      const match = places?.[0];
      if (!match?.id) continue;

      return {
        placeId: match.id,
        photoUrl: match.photos?.[0]?.getURI?.({ maxWidth: 400 }) ?? undefined,
        rating: match.rating ?? undefined,
        ratingCount: (match as unknown as { userRatingCount?: number }).userRatingCount ?? undefined,
        resolvedAddress: (match as unknown as { formattedAddress?: string }).formattedAddress ?? undefined,
      };
    } catch {
      // Continue trying fallback queries.
    }
  }

  return null;
}
