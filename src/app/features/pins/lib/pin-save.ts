import type { Pin } from "@/app/features/pins/model/pin.types";
import { resolvePinPlace } from "@/app/features/pins/api/resolve-pin-place";

interface ResolvePinMetadataForSaveInput {
  initialData: Partial<Pin>;
  title: string;
  address: string;
}

interface ResolvedPinMetadata {
  resolvedAddress: string;
  placeId?: string;
  photoUrl?: string;
  rating?: number;
  ratingCount?: number;
}

type ResolvePinMetadataForSaveResult =
  | { ok: true; data: ResolvedPinMetadata }
  | { ok: false; error: string };

export async function resolvePinMetadataForSave({
  initialData,
  title,
  address,
}: ResolvePinMetadataForSaveInput): Promise<ResolvePinMetadataForSaveResult> {
  const nextTitle = title.trim() || initialData.title?.trim() || "";
  const nextAddress = address.trim() || initialData.address?.trim() || "";
  const needsPlaceResolution = !initialData.placeId;
  const canResolvePlace =
    Number.isFinite(initialData.lat) &&
    Number.isFinite(initialData.lng) &&
    nextTitle.length > 0 &&
    nextAddress.length > 0;

  let resolvedPlace = null;
  if (needsPlaceResolution) {
    if (!canResolvePlace) {
      return {
        ok: false,
        error: "Please provide a business name and address before saving.",
      };
    }

    resolvedPlace = await resolvePinPlace({
      title: nextTitle,
      address: nextAddress,
      lat: initialData.lat as number,
      lng: initialData.lng as number,
    });

    if (!resolvedPlace?.placeId) {
      return {
        ok: false,
        error: "Could not match this pin to a Google Place. Refine name or address and try again.",
      };
    }
  }

  return {
    ok: true,
    data: {
      resolvedAddress: resolvedPlace?.resolvedAddress ?? address,
      placeId: resolvedPlace?.placeId ?? initialData.placeId,
      photoUrl: resolvedPlace?.photoUrl ?? initialData.photoUrl,
      rating: resolvedPlace?.rating ?? initialData.rating,
      ratingCount: resolvedPlace?.ratingCount ?? initialData.ratingCount,
    },
  };
}
