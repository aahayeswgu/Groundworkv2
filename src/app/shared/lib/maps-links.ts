import type { MapsProvider } from "@/app/shared/model/maps-provider";

export type MapsRuntimePlatform = "ios" | "android" | "desktop";

function normalizeInput(value: string): string {
  return value.trim();
}

export function detectMapsRuntimePlatform(userAgent: string): MapsRuntimePlatform {
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

  return "desktop";
}

export function getMapsRuntimePlatform(): MapsRuntimePlatform {
  if (typeof navigator === "undefined") {
    return "desktop";
  }

  return detectMapsRuntimePlatform(navigator.userAgent ?? "");
}

export function resolveMapsProviderForPlatform(
  provider: MapsProvider,
  platform: MapsRuntimePlatform,
): MapsProvider {
  if (provider === "apple" && platform !== "ios") {
    return "google";
  }
  return provider;
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

export function buildPreferredPlaceMapsUrl(options: {
  query: string;
  placeId?: string;
  provider: MapsProvider;
  platform?: MapsRuntimePlatform;
}): string {
  const platform = options.platform ?? getMapsRuntimePlatform();
  const resolvedProvider = resolveMapsProviderForPlatform(options.provider, platform);

  if (resolvedProvider === "apple") {
    return buildAppleMapsSearchUrl(options.query);
  }

  if (options.placeId) {
    const googlePlaceUrl = buildGoogleMapsPlaceUrl(options.placeId);
    if (googlePlaceUrl) return googlePlaceUrl;
  }

  return buildGoogleMapsSearchUrl(options.query);
}
