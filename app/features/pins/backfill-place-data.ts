import { useStore } from "@/app/store";

/**
 * One-time backfill: for pins missing placeId/photoUrl/rating,
 * search Google Places by name + location and fill in the data.
 * Runs once on app startup, skips pins that already have placeId.
 */
export async function backfillPlaceData(): Promise<void> {
  const { Place } = (await google.maps.importLibrary("places")) as google.maps.PlacesLibrary;

  const pins = useStore.getState().pins;
  const pinsToBackfill = pins.filter((p) => !p.placeId && p.title);

  if (pinsToBackfill.length === 0) return;

  console.log(`[backfill] ${pinsToBackfill.length} pins need Google Places data`);

  for (const pin of pinsToBackfill) {
    try {
      const { places } = await Place.searchByText({
        textQuery: pin.title,
        fields: ["id", "displayName", "rating", "userRatingCount", "photos"],
        locationBias: new google.maps.Circle({
          center: { lat: pin.lat, lng: pin.lng },
          radius: 500, // 500m radius around the pin
        }),
        maxResultCount: 1,
      });

      const match = places?.[0];
      if (!match) continue;

      const photoUrl = match.photos?.[0]?.getURI?.({ maxWidth: 400 }) ?? undefined;

      useStore.getState().updatePin(pin.id, {
        placeId: match.id ?? undefined,
        photoUrl,
        rating: match.rating ?? undefined,
        ratingCount: (match as unknown as { userRatingCount?: number }).userRatingCount ?? undefined,
        updatedAt: new Date().toISOString(),
      });

      console.log(`[backfill] ✓ ${pin.title} — photo: ${photoUrl ? "yes" : "no"}, rating: ${match.rating ?? "n/a"}`);
    } catch (err) {
      console.warn(`[backfill] ✗ ${pin.title}:`, err);
    }

    // Small delay to avoid rate limits
    await new Promise((r) => setTimeout(r, 300));
  }

  console.log("[backfill] complete");
}
