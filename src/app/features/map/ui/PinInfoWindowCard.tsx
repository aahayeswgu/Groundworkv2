import { useState } from "react";
import { fetchAiBrief } from "@/app/shared/api/ask-ai";
import type { Pin } from "@/app/features/pins/model/pin.types";
import { cn } from "@/app/shared/lib/utils";
import { Card, CardContent } from "@/app/shared/ui/card";
import type { RouteAddResult } from "../model/marker-layer.types";
import {
  PIN_INFO_STATUS_CLASSNAMES,
  PIN_INFO_STATUS_LABELS,
} from "../model/pin-info-window.model";

type RouteState = "idle" | RouteAddResult;

type ActionTone = "orange" | "red" | "planner";

interface PinInfoWindowCardProps {
  pin: Pin;
  isInRoute: boolean;
  isPlanned: boolean;
  onEditPin: (pinId: string) => void;
  onDeletePin: (pinId: string) => void;
  onAddRouteStop: (pin: Pin) => RouteAddResult;
  onPlanPin: (pin: Pin) => void;
  className?: string;
}

const ACTION_BUTTON_BASE_CLASS = "rounded-md px-3.5 py-1.5 text-xs font-bold text-white transition-all";

const ACTION_BUTTON_TONE_CLASSNAMES: Record<ActionTone, string> = {
  orange: "bg-orange",
  red: "bg-gw-red",
  planner: "bg-[#3B8CB5]",
};

export function PinInfoWindowCard({
  pin,
  isInRoute,
  isPlanned,
  onEditPin,
  onDeletePin,
  onAddRouteStop,
  onPlanPin,
  className,
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
    <Card className={cn("w-full min-w-0 gap-0 bg-bg-card font-sans ring-1 ring-border", className)}>
      {pin.photoUrl ? (
        <div
          className="h-[140px] bg-cover bg-center"
          style={{ backgroundImage: `url('${pin.photoUrl}')` }}
          aria-label={pin.title}
        />
      ) : null}

      <CardContent className={pin.photoUrl ? "pb-3.5 pt-3" : "pb-3.5 pt-3.5"}>
        <div className="mb-1 text-[15px] font-bold leading-[1.3] text-[#1A1A1A]">
          {pin.title}
        </div>

        <span
          className={`mb-2 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold text-white ${PIN_INFO_STATUS_CLASSNAMES[pin.status]}`}
        >
          {PIN_INFO_STATUS_LABELS[pin.status] ?? pin.status}
        </span>

        {pin.rating ? (
          <div className="mb-1.5 text-xs">
            {pin.placeId ? (
              <a
                href={`https://www.google.com/maps/place/?q=place_id:${pin.placeId}`}
                target="_blank"
                rel="noopener"
                className="cursor-pointer no-underline"
              >
                <span className="tracking-[1px] text-[#F59E0B]">{stars}</span>{" "}
                <span className="font-bold text-[#1A1A1A]">{pin.rating}</span>
                {pin.ratingCount ? (
                  <span className="text-[#888]"> ({pin.ratingCount} reviews)</span>
                ) : null}
              </a>
            ) : (
              <>
                <span className="tracking-[1px] text-[#F59E0B]">{stars}</span>{" "}
                <span className="font-bold text-[#1A1A1A]">{pin.rating}</span>
                {pin.ratingCount ? (
                  <span className="text-[#888]"> ({pin.ratingCount})</span>
                ) : null}
              </>
            )}
          </div>
        ) : null}

        {pin.address ? (
          <div className="mb-1 text-xs leading-[1.4] text-[#555]">
            {pin.address}
          </div>
        ) : null}

        {pin.contact ? (
          <div className="mb-0.5 text-xs text-[#333]">
            {"\u{1F464}"} {pin.contact}
          </div>
        ) : null}

        {pin.phone ? (
          <div className="mb-2 text-xs text-[#333]">
            {"\u{1F4DE}"} {pin.phone}
          </div>
        ) : null}

        {pin.placeId ? (
          <div className="mb-2">
            <a
              href={`https://www.google.com/maps/place/?q=place_id:${pin.placeId}`}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#4285F4] no-underline"
            >
              View on Google Maps
            </a>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-1.5">
          <ActionButton
            tone="orange"
            onClick={() => onEditPin(pin.id)}
          >
            Edit
          </ActionButton>
          <ActionButton
            tone="red"
            onClick={() => onDeletePin(pin.id)}
          >
            Delete
          </ActionButton>
          <ActionButton
            tone="orange"
            onClick={handleAddRoute}
            disabled={routeState !== "idle"}
          >
            {routeLabel}
          </ActionButton>
          <ActionButton
            tone="planner"
            onClick={handlePlan}
            disabled={planned}
          >
            {planned ? "\u2713 Planned" : "Add to Planner"}
          </ActionButton>
        </div>

        {pin.placeId ? (
          <>
            <button
              type="button"
              onClick={handleAiClick}
              disabled={aiLoading !== null}
              className={`mt-2 flex w-full items-center justify-center gap-1.5 rounded-md border-[1.5px] px-2 py-2 text-[13px] font-bold transition-all ${
                briefText
                  ? "border-[#4285F4] bg-[#4285F4] text-white"
                  : "border-[#4285F4] bg-transparent text-[#4285F4]"
              } ${aiLoading !== null ? "cursor-default opacity-70" : "cursor-pointer"}`}
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
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}

interface ActionButtonProps {
  children: React.ReactNode;
  tone: ActionTone;
  onClick: () => void;
  disabled?: boolean;
}

function ActionButton({ children, tone, onClick, disabled = false }: ActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${ACTION_BUTTON_BASE_CLASS} ${ACTION_BUTTON_TONE_CLASSNAMES[tone]} ${
        disabled ? "cursor-default opacity-70" : "hover:brightness-110"
      }`}
    >
      {children}
    </button>
  );
}

function normalizeAiText(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/^(\s*)\*\s+/gm, "$1• ")
    .replace(/^(\s*)[-–]\s+/gm, "$1• ")
    .trim();
}
