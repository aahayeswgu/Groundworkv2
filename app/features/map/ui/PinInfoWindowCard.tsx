import { useState, type CSSProperties } from "react";
import { fetchAiBrief } from "@/app/lib/ask-ai";
import type { Pin } from "@/app/features/pins/model/pin.types";
import { PIN_INFO_STATUS_COLORS, PIN_INFO_STATUS_LABELS } from "../model/pin-info-window.model";

type RouteAddResult = "added" | "full" | "already";
type RouteState = "idle" | RouteAddResult;

interface PinInfoWindowCardProps {
  pin: Pin;
  isInRoute: boolean;
  isPlanned: boolean;
  onEditPin: (pinId: string) => void;
  onDeletePin: (pinId: string) => void;
  onAddRouteStop: (pin: Pin) => RouteAddResult;
  onPlanPin: (pin: Pin) => void;
}

export function PinInfoWindowCard({
  pin,
  isInRoute,
  isPlanned,
  onEditPin,
  onDeletePin,
  onAddRouteStop,
  onPlanPin,
}: PinInfoWindowCardProps) {
  const [routeState, setRouteState] = useState<RouteState>(isInRoute ? "already" : "idle");
  const [planned, setPlanned] = useState(isPlanned);
  const [briefText, setBriefText] = useState("");
  const [detailedText, setDetailedText] = useState("");
  const [showAi, setShowAi] = useState(false);
  const [aiLoading, setAiLoading] = useState<"brief" | "detailed" | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const stars = pin.rating
    ? "\u2605".repeat(Math.round(pin.rating)) + "\u2606".repeat(5 - Math.round(pin.rating))
    : "";

  const routeLabel =
    routeState === "full"
      ? "Max 25"
      : routeState === "added" || routeState === "already"
        ? "\u2713 Added"
        : "+ Route";

  const aiButtonLabel = aiLoading === "brief"
    ? "Generating..."
    : aiLoading === "detailed"
      ? "Digging deeper..."
      : detailedText
        ? (showAi ? "Hide AI Brief" : "Show AI Brief")
        : briefText
          ? "Learn More"
          : "Ask AI";

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
          pin.placeId!,
          pin.title,
          pin.address,
          pin.status,
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
      const brief = await fetchAiBrief(pin.placeId!, pin.title, pin.address, pin.status, "brief");
      setBriefText(brief);
      setShowAi(true);
    } catch {
      setAiError("Failed to generate AI brief. Please try again.");
      setShowAi(true);
    } finally {
      setAiLoading(null);
    }
  }

  function handleAddRoute() {
    const result = onAddRouteStop(pin);
    setRouteState(result);
  }

  function handlePlan() {
    onPlanPin(pin);
    setPlanned(true);
  }

  const aiText = detailedText
    ? `${normalizeAiText(briefText)}\n\n---\n\n${normalizeAiText(detailedText)}`
    : normalizeAiText(briefText);

  return (
    <div style={{ minWidth: "280px", fontFamily: "DM Sans, sans-serif" }}>
      {pin.photoUrl ? (
        <div
          style={{
            height: "140px",
            backgroundImage: `url('${pin.photoUrl}')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            borderRadius: "12px 12px 0 0",
          }}
        />
      ) : null}

      <div style={{ padding: pin.photoUrl ? "12px 16px 14px" : "14px 16px" }}>
        <div style={{ fontWeight: 700, fontSize: "15px", marginBottom: "4px", lineHeight: 1.3, color: "#1A1A1A" }}>
          {pin.title}
        </div>

        <span
          style={{
            display: "inline-block",
            padding: "2px 8px",
            borderRadius: "12px",
            backgroundColor: PIN_INFO_STATUS_COLORS[pin.status],
            color: "#fff",
            fontSize: "11px",
            fontWeight: 600,
            marginBottom: "8px",
          }}
        >
          {PIN_INFO_STATUS_LABELS[pin.status] ?? pin.status}
        </span>

        {pin.rating ? (
          <div style={{ fontSize: "12px", marginBottom: "6px" }}>
            {pin.placeId ? (
              <a
                href={`https://www.google.com/maps/place/?q=place_id:${pin.placeId}`}
                target="_blank"
                rel="noopener"
                style={{ textDecoration: "none", cursor: "pointer" }}
              >
                <span style={{ color: "#F59E0B", letterSpacing: "1px" }}>{stars}</span>{" "}
                <span style={{ color: "#1A1A1A", fontWeight: 700 }}>{pin.rating}</span>
                {pin.ratingCount ? (
                  <span style={{ color: "#888" }}> ({pin.ratingCount} reviews)</span>
                ) : null}
              </a>
            ) : (
              <>
                <span style={{ color: "#F59E0B", letterSpacing: "1px" }}>{stars}</span>{" "}
                <span style={{ color: "#1A1A1A", fontWeight: 700 }}>{pin.rating}</span>
                {pin.ratingCount ? (
                  <span style={{ color: "#888" }}> ({pin.ratingCount})</span>
                ) : null}
              </>
            )}
          </div>
        ) : null}

        {pin.address ? (
          <div style={{ fontSize: "12px", color: "#555", marginBottom: "4px", lineHeight: 1.4 }}>
            {pin.address}
          </div>
        ) : null}

        {pin.contact ? (
          <div style={{ fontSize: "12px", color: "#333", marginBottom: "2px" }}>
            {"\u{1F464}"} {pin.contact}
          </div>
        ) : null}

        {pin.phone ? (
          <div style={{ fontSize: "12px", color: "#333", marginBottom: "8px" }}>
            {"\u{1F4DE}"} {pin.phone}
          </div>
        ) : null}

        {pin.placeId ? (
          <div style={{ marginBottom: "8px" }}>
            <a
              href={`https://www.google.com/maps/place/?q=place_id:${pin.placeId}`}
              target="_blank"
              rel="noopener"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "12px",
                color: "#4285F4",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              View on Google Maps
            </a>
          </div>
        ) : null}

        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => onEditPin(pin.id)}
            style={actionButtonStyle("#C4692A")}
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => onDeletePin(pin.id)}
            style={actionButtonStyle("#EF4444")}
          >
            Delete
          </button>
          <button
            type="button"
            onClick={handleAddRoute}
            disabled={routeState !== "idle"}
            style={actionButtonStyle("#C4692A", routeState !== "idle")}
          >
            {routeLabel}
          </button>
          <button
            type="button"
            onClick={handlePlan}
            disabled={planned}
            style={actionButtonStyle("#3B8CB5", planned)}
          >
            {planned ? "\u2713 Planned" : "Add to Planner"}
          </button>
        </div>

        {pin.placeId ? (
          <>
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
                backgroundColor: briefText ? "#4285F4" : "transparent",
                color: briefText ? "#fff" : "#4285F4",
                fontSize: "13px",
                fontWeight: 700,
                cursor: aiLoading !== null ? "default" : "pointer",
                marginTop: "8px",
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
          </>
        ) : null}
      </div>
    </div>
  );
}

function actionButtonStyle(backgroundColor: string, disabled = false): CSSProperties {
  return {
    padding: "6px 14px",
    backgroundColor,
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: disabled ? "default" : "pointer",
    fontSize: "12px",
    fontWeight: 700,
    opacity: disabled ? 0.7 : 1,
  };
}

function normalizeAiText(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/^(\s*)\*\s+/gm, "$1• ")
    .replace(/^(\s*)[-–]\s+/gm, "$1• ")
    .trim();
}
