const GEOLOCATION_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10_000,
  maximumAge: 30_000,
};

const GEOLOCATION_ERROR_MESSAGE: Record<number, string> = {
  1: "Location permission was denied.",
  2: "Current location is unavailable.",
  3: "Timed out while retrieving current location.",
};

function toGeolocationError(error: GeolocationPositionError): Error {
  const message = GEOLOCATION_ERROR_MESSAGE[error.code] ?? "Unable to retrieve current location.";
  return new Error(message);
}

export function getCurrentPosition(
  options: PositionOptions = GEOLOCATION_OPTIONS,
): Promise<GeolocationPosition> {
  if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
    return Promise.reject(new Error("Geolocation is not supported in this browser."));
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      resolve,
      (error) => reject(toGeolocationError(error)),
      options,
    );
  });
}
