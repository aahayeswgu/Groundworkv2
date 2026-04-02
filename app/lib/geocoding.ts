let geocoder: google.maps.Geocoder | null = null;

export async function reverseGeocode(latLng: google.maps.LatLng): Promise<string> {
  if (!geocoder) {
    await google.maps.importLibrary("geocoding");
    geocoder = new google.maps.Geocoder();
  }
  try {
    const { results } = await geocoder.geocode({ location: latLng });
    return results[0]?.formatted_address ?? coordinateFallback(latLng);
  } catch {
    return coordinateFallback(latLng);
  }
}

function coordinateFallback(latLng: google.maps.LatLng): string {
  return `${latLng.lat().toFixed(5)}, ${latLng.lng().toFixed(5)}`;
}

/**
 * Forward geocode: address string → {lat, lng}.
 * Returns null if address cannot be resolved.
 * Reuses the lazy geocoder singleton from reverseGeocode.
 */
export async function forwardGeocode(address: string): Promise<{ lat: number; lng: number } | null> {
  if (!geocoder) {
    await google.maps.importLibrary('geocoding');
    geocoder = new google.maps.Geocoder();
  }
  try {
    const { results } = await geocoder.geocode({ address });
    const loc = results[0]?.geometry?.location;
    return loc ? { lat: loc.lat(), lng: loc.lng() } : null;
  } catch {
    return null;
  }
}

/**
 * Promise-wrapped getCurrentPosition for GPS start point.
 * Rejects after 10 seconds.
 */
export function getCurrentGpsPosition(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      reject,
      { timeout: 10000 },
    ),
  );
}
