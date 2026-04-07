import type { DiscoverResult } from "@/app/features/discover/model/discover.types";

interface AddressValidationCandidate {
  placeId: string;
  address: string;
}

interface AddressValidationSignalPayload {
  placeId: string;
  residentialSignal: DiscoverResult["residentialSignal"];
}

interface AddressValidationResponse {
  signals?: AddressValidationSignalPayload[];
}

export async function fetchAddressValidationSignals(
  candidates: AddressValidationCandidate[],
): Promise<Map<string, DiscoverResult["residentialSignal"]>> {
  if (!candidates.length) return new Map();

  try {
    const res = await fetch("/api/address-validation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ candidates }),
    });

    if (!res.ok) return new Map();
    const payload = await res.json() as AddressValidationResponse;
    const signals = payload.signals ?? [];
    return new Map(signals.map((entry) => [entry.placeId, entry.residentialSignal]));
  } catch {
    return new Map();
  }
}
