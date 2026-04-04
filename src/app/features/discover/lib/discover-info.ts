import type { DiscoverResult } from "@/app/features/discover/model/discover.types";
import type { Pin } from "@/app/features/pins/model/pin.types";
import { classifyGooglePlace } from "@/app/features/discover/lib/discover-filters";

/**
 * Build a Pin object from a DiscoverResult for quick-save.
 * Dedup check (by name/coords) is done in DiscoverLayer before calling addPin.
 */
export function buildQuickSavePin(result: DiscoverResult): Pin {
  const placeType = classifyGooglePlace(result.types, result.displayName);
  return {
    id: `pin_${Date.now()}_${result.placeId.slice(-6)}`,
    title: result.displayName,
    address: result.address,
    lat: result.lat,
    lng: result.lng,
    status: "prospect",
    contact: "",
    phone: "",
    followUpDate: "",
    notes: [{ text: `Discovered via Groundwork — ${placeType}`, date: new Date().toISOString() }],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    placeId: result.placeId,
    photoUrl: result.photoUri ?? undefined,
    rating: result.rating ?? undefined,
    ratingCount: result.ratingCount ?? undefined,
  };
}
