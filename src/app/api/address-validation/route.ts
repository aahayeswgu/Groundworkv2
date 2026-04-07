import { NextRequest, NextResponse } from "next/server";

interface CandidateInput {
  placeId?: string;
  address?: string;
}

interface ValidationSignal {
  placeId: string;
  residentialSignal: "business" | "residential" | "unknown";
}

const AV_ENDPOINT = "https://addressvalidation.googleapis.com/v1:validateAddress";
const MAX_CANDIDATES = 15;
const REQUEST_CONCURRENCY = 3;

function getAddressValidationApiKey(): string {
  return (
    process.env.GOOGLE_ADDRESS_VALIDATION_API_KEY ??
    process.env.GOOGLE_MAPS_API_KEY ??
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ??
    ""
  );
}

function coerceCandidates(raw: unknown): Array<{ placeId: string; address: string }> {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => item as CandidateInput)
    .filter((item) => typeof item.placeId === "string" && typeof item.address === "string")
    .map((item) => ({ placeId: item.placeId!.trim(), address: item.address!.trim() }))
    .filter((item) => item.placeId.length > 0 && item.address.length > 0)
    .slice(0, MAX_CANDIDATES);
}

function toResidentialSignal(metadata: unknown): ValidationSignal["residentialSignal"] {
  const payload = metadata as { residential?: boolean; business?: boolean } | null | undefined;
  const residential = payload?.residential === true;
  const business = payload?.business === true;
  if (business && !residential) return "business";
  if (residential && !business) return "residential";
  return "unknown";
}

async function validateAddress(address: string, apiKey: string): Promise<ValidationSignal["residentialSignal"]> {
  const res = await fetch(`${AV_ENDPOINT}?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      address: {
        regionCode: "US",
        addressLines: [address],
      },
    }),
  });

  if (!res.ok) return "unknown";
  const payload = await res.json() as {
    result?: {
      metadata?: unknown;
    };
  };
  return toResidentialSignal(payload.result?.metadata);
}

async function runWithConcurrency<T>(
  items: readonly T[],
  concurrency: number,
  worker: (item: T) => Promise<void>,
): Promise<void> {
  if (!items.length) return;

  const workerCount = Math.min(Math.max(1, concurrency), items.length);
  let nextIndex = 0;

  const runWorker = async () => {
    while (true) {
      const currentIndex = nextIndex;
      if (currentIndex >= items.length) return;
      nextIndex += 1;
      await worker(items[currentIndex]);
    }
  };

  await Promise.all(Array.from({ length: workerCount }, () => runWorker()));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const candidates = coerceCandidates((body as { candidates?: unknown }).candidates);
    if (!candidates.length) {
      return NextResponse.json({ signals: [] as ValidationSignal[] });
    }

    const apiKey = getAddressValidationApiKey();
    if (!apiKey) {
      return NextResponse.json({ signals: [] as ValidationSignal[] });
    }

    const signals: ValidationSignal[] = [];

    await runWithConcurrency(candidates, REQUEST_CONCURRENCY, async (candidate) => {
      const residentialSignal = await validateAddress(candidate.address, apiKey);
      signals.push({
        placeId: candidate.placeId,
        residentialSignal,
      });
    });

    return NextResponse.json({ signals });
  } catch (err) {
    console.error("[address-validation] request failed:", err);
    return NextResponse.json({ signals: [] as ValidationSignal[] });
  }
}
