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
