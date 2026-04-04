import { useState } from "react";
import { classifyGooglePlace } from "@/app/features/discover/lib/discover-filters";
import type { DiscoverResult } from "@/app/features/discover/model/discover.types";
import { fetchAiBrief } from "@/app/shared/api/ask-ai";
import { cn } from "@/app/shared/lib/utils";
import { Card, CardContent } from "@/app/shared/ui/card";

interface DiscoverInfoWindowCardProps {
  result: DiscoverResult;
  alreadySaved: boolean;
  isInRoute: boolean;
  onSave: () => void;
  onAddToRoute: () => boolean;
  className?: string;
}

export function DiscoverInfoWindowCard({
  result,
  alreadySaved,
  isInRoute,
  onSave,
  onAddToRoute,
  className,
}: DiscoverInfoWindowCardProps) {
  const [saved, setSaved] = useState(alreadySaved);
  const [routeState, setRouteState] = useState<"idle" | "added" | "full">(isInRoute ? "added" : "idle");
  const [briefText, setBriefText] = useState("");
  const [detailedText, setDetailedText] = useState("");
  const [showAi, setShowAi] = useState(false);
  const [aiLoading, setAiLoading] = useState<"brief" | "detailed" | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const placeType = classifyGooglePlace(result.types, result.displayName);
  const stars = result.rating
    ? "\u2605".repeat(Math.round(result.rating)) + "\u2606".repeat(5 - Math.round(result.rating))
    : "";

  async function handleAiClick() {
    if (aiLoading) return;

    if (detailedText) {
      setShowAi((prev) => !prev);
      return;
    }

    if (briefText) {
      setAiError(null);
      setAiLoading("detailed");
      try {
        const detailed = await fetchAiBrief(
          result.placeId,
          result.displayName,
          result.address,
          placeType,
          "detailed",
          briefText,
        );
        setDetailedText(detailed);
        setShowAi(true);
      } catch {
        setAiError("Failed to load detailed brief. Please try again.");
      } finally {
        setAiLoading(null);
      }
      return;
    }

    setAiError(null);
    setAiLoading("brief");
    try {
      const brief = await fetchAiBrief(
        result.placeId,
        result.displayName,
        result.address,
        placeType,
        "brief",
      );
      setBriefText(brief);
      setShowAi(true);
    } catch {
      setAiError("Failed to generate AI brief. Please try again.");
      setShowAi(true);
    } finally {
      setAiLoading(null);
    }
  }

  function handleSave() {
    onSave();
    setSaved(true);
  }

  function handleAddToRoute() {
    const added = onAddToRoute();
    setRouteState(added ? "added" : "full");
  }

  const aiButtonLabel = aiLoading === "brief"
    ? "Generating..."
    : aiLoading === "detailed"
      ? "Digging deeper..."
      : detailedText
        ? (showAi ? "Hide AI Brief" : "Show AI Brief")
        : briefText
          ? "Learn More"
          : "Ask AI";

  const aiText = detailedText
    ? `${normalizeAiText(briefText)}\n\n---\n\n${normalizeAiText(detailedText)}`
    : normalizeAiText(briefText);

  return (
    <Card className={cn("w-full min-w-0 gap-0 bg-bg-card font-sans ring-1 ring-border", className)}>
      {result.photoUri ? (
        <div
          className="h-[140px] bg-cover bg-center"
          style={{ backgroundImage: `url('${result.photoUri}')` }}
          aria-label={result.displayName}
        />
      ) : null}

      <CardContent className={result.photoUri ? "pb-3.5 pt-3" : "pb-3.5 pt-3.5"}>
        <div className="pr-4 text-[15px] font-bold leading-[1.3] text-[#1A1A1A]">{result.displayName}</div>
        <div className="mt-[3px] text-xs font-semibold text-[#D4712A]">{placeType}</div>

        {result.rating ? (
          <div className="mt-1 text-xs">
            <span className="tracking-[1px] text-[#F59E0B]">{stars}</span> {result.rating}
          </div>
        ) : null}

        {result.address ? (
          <div className="mt-[3px] text-[11px] leading-[1.3] text-[#777]">{result.address}</div>
        ) : null}

        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <a
            href={`https://www.google.com/maps/place/?q=place_id:${result.placeId}`}
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#4285F4] no-underline"
          >
            Google Maps
          </a>

          <button
            type="button"
            onClick={handleSave}
            disabled={saved}
            className={`inline-flex items-center gap-1 rounded-md px-3.5 py-1.5 text-xs font-bold transition-all ${
              saved
                ? "cursor-default bg-transparent text-gw-green"
                : "cursor-pointer bg-[#D4712A] text-white hover:brightness-110"
            }`}
          >
            {saved ? "\u2713 Pinned" : "Save as Pin"}
          </button>
        </div>

        <button
          type="button"
          onClick={handleAddToRoute}
          disabled={routeState !== "idle"}
          className={`mt-2 flex w-full items-center justify-center gap-1 rounded-md border px-2 py-[7px] text-xs font-bold text-[#D4712A] transition-all ${
            routeState === "idle"
              ? "cursor-pointer border-[#D4712A]"
              : "cursor-default border-[#D4712A] opacity-70"
          }`}
        >
          {routeState === "full" ? "Max 25 Stops" : routeState === "added" ? "\u2713 Added to Route" : "+ Add to Route"}
        </button>

        <button
          type="button"
          onClick={handleAiClick}
          disabled={aiLoading !== null}
          className={`mt-1.5 flex w-full items-center justify-center gap-1.5 rounded-md border-[1.5px] px-2 py-2 text-[13px] font-bold transition-all ${
            briefText
              ? "border-[#4285F4] bg-[#4285F4] text-white"
              : "border-[#4285F4] bg-transparent text-[#4285F4]"
          } ${aiLoading ? "cursor-default opacity-70" : "cursor-pointer"}`}
        >
          {aiButtonLabel}
        </button>

        {showAi ? (
          <div
            className={`mt-2 max-h-[300px] overflow-y-auto whitespace-pre-wrap rounded-lg border px-3 py-3 text-[13px] leading-[1.6] ${
              aiError
                ? "border-[#e0e0e0] bg-[#f8f9fa] text-gw-red"
                : "border-[#e0e0e0] bg-[#f8f9fa] text-[#1A1A1A]"
            }`}
          >
            {aiError ?? aiText}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function normalizeAiText(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/^(\s*)\*\s+/gm, "$1• ")
    .replace(/^(\s*)[-–]\s+/gm, "$1• ")
    .trim();
}
