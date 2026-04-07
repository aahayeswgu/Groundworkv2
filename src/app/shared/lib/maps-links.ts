export type MobileMapsPlatform = "ios" | "android" | "other";

function normalizeInput(value: string): string {
  return value.trim();
}

export function detectMobileMapsPlatform(userAgent: string): MobileMapsPlatform {
  const normalizedAgent = userAgent.toLowerCase();

  if (normalizedAgent.includes("android")) {
    return "android";
  }

  const isIOSDevice =
    normalizedAgent.includes("iphone")
    || normalizedAgent.includes("ipad")
    || normalizedAgent.includes("ipod");
  const isIPadDesktopMode = normalizedAgent.includes("macintosh") && normalizedAgent.includes("mobile");

  if (isIOSDevice || isIPadDesktopMode) {
    return "ios";
  }

  return "other";
}

export function getMobileMapsPlatform(): MobileMapsPlatform {
  if (typeof navigator === "undefined") {
    return "other";
  }

  return detectMobileMapsPlatform(navigator.userAgent ?? "");
}

export function buildGoogleMapsSearchUrl(query: string): string {
  const normalizedQuery = normalizeInput(query);
  if (!normalizedQuery) return "";

  const params = new URLSearchParams({
    api: "1",
    query: normalizedQuery,
  });

  return `https://www.google.com/maps/search/?${params.toString()}`;
}

export function buildGoogleMapsPlaceUrl(placeId: string): string {
  const normalizedPlaceId = normalizeInput(placeId);
  if (!normalizedPlaceId) return "";
  return `https://www.google.com/maps/place/?q=place_id:${encodeURIComponent(normalizedPlaceId)}`;
}

export function buildAppleMapsSearchUrl(query: string): string {
  const normalizedQuery = normalizeInput(query);
  if (!normalizedQuery) return "";

  const params = new URLSearchParams({ q: normalizedQuery });
  return `https://maps.apple.com/?${params.toString()}`;
}

export function buildAppleMapsDirectionsUrl(options: {
  destination: string;
  origin?: string;
}): string {
  const destination = normalizeInput(options.destination);
  if (!destination) return "";

  const params = new URLSearchParams({
    daddr: destination,
    dirflg: "d",
  });

  const origin = options.origin ? normalizeInput(options.origin) : "";
  if (origin) {
    params.set("saddr", origin);
  }

  return `https://maps.apple.com/?${params.toString()}`;
}

export function buildMobilePlaceMapsUrl(options: {
  query: string;
  placeId?: string;
  platform?: MobileMapsPlatform;
}): string {
  const platform = options.platform ?? getMobileMapsPlatform();

  if (platform === "ios") {
    return buildAppleMapsSearchUrl(options.query);
  }

  if (options.placeId) {
    const googlePlaceUrl = buildGoogleMapsPlaceUrl(options.placeId);
    if (googlePlaceUrl) return googlePlaceUrl;
  }

  return buildGoogleMapsSearchUrl(options.query);
}
