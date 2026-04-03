let geocoder: google.maps.Geocoder | null = null;

function getGeocoder(): google.maps.Geocoder {
  if (!geocoder) {
    geocoder = new google.maps.Geocoder();
  }
  return geocoder;
}

export async function reverseGeocode(latLng: google.maps.LatLng): Promise<string> {
  const activeGeocoder = getGeocoder();
  try {
    const { results } = await activeGeocoder.geocode({ location: latLng });
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
  const activeGeocoder = getGeocoder();
  try {
    const { results } = await activeGeocoder.geocode({ address });
    const loc = results[0]?.geometry?.location;
    return loc ? { lat: loc.lat(), lng: loc.lng() } : null;
  } catch {
    return null;
  }
}

/**
 * Promise-wrapped getCurrentPosition for GPS start point.
 * Checks permission state first, enables high accuracy, 15s timeout.
 */
export async function getCurrentGpsPosition(): Promise<{ lat: number; lng: number }> {
  if (!navigator.geolocation) {
    throw new Error('Geolocation is not supported by this browser.');
  }

  // Check permission state before prompting (avoids silent timeout)
  if (navigator.permissions) {
    try {
      const status = await navigator.permissions.query({ name: 'geolocation' });
      if (status.state === 'denied') {
        throw new Error('Location permission denied. Enable it in browser settings.');
      }
    } catch {
      // permissions API not available — fall through to getCurrentPosition
    }
  }

  return new Promise((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            reject(new Error('Location permission denied. Enable it in browser settings.'));
            break;
          case err.POSITION_UNAVAILABLE:
            reject(new Error('Location unavailable. Make sure GPS/location services are on.'));
            break;
          case err.TIMEOUT:
            reject(new Error('Location request timed out. Try again or use Home/Custom start.'));
            break;
          default:
            reject(new Error('Could not get GPS location.'));
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 },
    ),
  );
}
