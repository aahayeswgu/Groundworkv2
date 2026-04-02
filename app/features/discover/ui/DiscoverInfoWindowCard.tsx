import { useState } from "react";
import { classifyGooglePlace } from "@/app/features/discover/discover-filters";
import type { DiscoverResult } from "@/app/features/discover/model/discover.types";
import { fetchAiBrief } from "@/app/lib/ask-ai";

interface DiscoverInfoWindowCardProps {
  result: DiscoverResult;
  alreadySaved: boolean;
  isInRoute: boolean;
  onSave: () => void;
  onAddToRoute: () => boolean;
}

export function DiscoverInfoWindowCard({
  result,
  alreadySaved,
  isInRoute,
  onSave,
  onAddToRoute,
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
    <div style={{ width: "300px", fontFamily: "DM Sans, sans-serif" }}>
      {result.photoUri ? (
        <div
          style={{
            height: "140px",
            backgroundImage: `url('${result.photoUri}')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            borderRadius: "12px 12px 0 0",
          }}
        />
      ) : null}

      <div style={{ padding: result.photoUri ? "12px 16px 14px" : "14px 16px" }}>
        <div style={{ color: "#1A1A1A", fontSize: "15px", fontWeight: 700, lineHeight: 1.3, paddingRight: "16px" }}>
          {result.displayName}
        </div>
        <div style={{ color: "#D4712A", fontSize: "12px", fontWeight: 600, marginTop: "3px" }}>
          {placeType}
        </div>

        {result.rating ? (
          <div style={{ marginTop: "4px", fontSize: "12px" }}>
            <span style={{ color: "#F59E0B", letterSpacing: "1px" }}>{stars}</span> {result.rating}
          </div>
        ) : null}

        {result.address ? (
          <div style={{ fontSize: "11px", color: "#777", marginTop: "3px", lineHeight: 1.3 }}>
            {result.address}
          </div>
        ) : null}

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "10px", gap: "8px" }}>
          <a
            href={`https://www.google.com/maps/place/?q=place_id:${result.placeId}`}
            target="_blank"
            rel="noopener"
            style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "#4285F4", fontWeight: 600, textDecoration: "none" }}
          >
            Google Maps
          </a>

          <button
            type="button"
            onClick={handleSave}
            disabled={saved}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              padding: "6px 14px",
              borderRadius: "6px",
              border: "none",
              background: saved ? "none" : "#D4712A",
              color: saved ? "#22C55E" : "#fff",
              fontSize: "12px",
              fontWeight: 700,
              cursor: saved ? "default" : "pointer",
            }}
          >
            {saved ? "\u2713 Pinned" : "Save as Pin"}
          </button>
        </div>

        <button
          type="button"
          onClick={handleAddToRoute}
          disabled={routeState !== "idle"}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "4px",
            width: "100%",
            padding: "7px",
            borderRadius: "6px",
            border: "1px solid #D4712A",
            background: "none",
            color: "#D4712A",
            fontSize: "12px",
            fontWeight: 700,
            cursor: routeState === "idle" ? "pointer" : "default",
            marginTop: "8px",
            opacity: routeState === "idle" ? 1 : 0.7,
          }}
        >
          {routeState === "full" ? "Max 25 Stops" : routeState === "added" ? "\u2713 Added to Route" : "+ Add to Route"}
        </button>

        <button
          type="button"
          onClick={handleAiClick}
          disabled={aiLoading !== null}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            width: "100%",
            padding: "8px",
            borderRadius: "6px",
            border: "1.5px solid #4285F4",
            background: briefText ? "#4285F4" : "transparent",
            color: briefText ? "#fff" : "#4285F4",
            fontSize: "13px",
            fontWeight: 700,
            cursor: aiLoading ? "default" : "pointer",
            marginTop: "6px",
            opacity: aiLoading ? 0.7 : 1,
          }}
        >
          {aiButtonLabel}
        </button>

        {showAi ? (
          <div
            style={{
              marginTop: "8px",
              padding: "12px",
              borderRadius: "8px",
              background: "#f8f9fa",
              border: "1px solid #e0e0e0",
              fontSize: "13px",
              lineHeight: 1.6,
              color: aiError ? "#EF4444" : "#1A1A1A",
              maxHeight: "300px",
              overflowY: "auto",
              whiteSpace: "pre-wrap",
            }}
          >
            {aiError ?? aiText}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function normalizeAiText(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/^(\s*)\*\s+/gm, "$1• ")
    .replace(/^(\s*)[-–]\s+/gm, "$1• ")
    .trim();
}
