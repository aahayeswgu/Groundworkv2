/**
 * Client-side helper for Ask AI feature.
 * Calls /api/ask-ai server route (never exposes Gemini key).
 * Caches results per placeId+mode — same business doesn't re-fetch.
 */

const cache = new Map<string, string>();

export async function fetchAiBrief(
  placeId: string,
  name: string,
  address: string,
  type: string,
  mode: "brief" | "detailed" = "brief",
  previousBrief?: string,
): Promise<string> {
  const cacheKey = `${placeId}_${mode}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const res = await fetch("/api/ask-ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, address, type, mode, previousBrief }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "AI brief request failed");
  }

  const data = await res.json();
  const text = data.text as string;

  cache.set(cacheKey, text);
  return text;
}
