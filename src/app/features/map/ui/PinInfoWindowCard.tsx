import { useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Calendar,
  ChevronDown,
  Check,
  Edit2,
  ExternalLink,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Plus,
  Sparkles,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { fetchAiBrief } from "@/app/shared/api/ask-ai";
import type { Pin } from "@/app/features/pins/model/pin.types";
import { cn } from "@/app/shared/lib/utils";
import { Button } from "@/app/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/shared/ui/dropdown-menu";
import { InfoWindowCardShell } from "@/app/shared/ui/info-window-card-shell";
import type { RouteAddResult } from "../model/marker-layer.types";
import {
  PIN_INFO_STATUS_LABELS,
} from "../model/pin-info-window.model";

type RouteState = "idle" | RouteAddResult;

interface PinInfoWindowCardProps {
  pin: Pin;
  isInRoute: boolean;
  isPlanned: boolean;
  onEditPin: (pinId: string) => void;
  onDeletePin: (pinId: string) => void;
  onAddRouteStop: (pin: Pin) => RouteAddResult;
  onPlanPin: (pin: Pin) => void;
  onClose?: () => void;
  className?: string;
}

export function PinInfoWindowCard({
  pin,
  isInRoute,
  isPlanned,
  onEditPin,
  onDeletePin,
  onAddRouteStop,
  onPlanPin,
  onClose,
  className,
}: PinInfoWindowCardProps) {
  const [routeState, setRouteState] = useState<RouteState>(isInRoute ? "already" : "idle");
  const [planned, setPlanned] = useState(isPlanned);
  const [briefText, setBriefText] = useState("");
  const [detailedText, setDetailedText] = useState("");
  const [showAi, setShowAi] = useState(false);
  const [aiLoading, setAiLoading] = useState<"brief" | "detailed" | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const routeLabel =
    routeState === "full"
      ? "Route Full"
      : routeState === "added" || routeState === "already"
        ? "Added to Route"
        : "Add to Route";

  const aiButtonLabel = aiLoading === "brief"
    ? "Generating..."
    : aiLoading === "detailed"
      ? "Digging deeper..."
      : detailedText
        ? (showAi ? "Hide AI Brief" : "Show AI Brief")
        : briefText
          ? (showAi ? "Learn More" : "Show AI Brief")
          : "Ask AI";

  async function handleAiClick() {
    if (aiLoading) return;

    if (detailedText) {
      setShowAi((prev) => !prev);
      return;
    }

    if (briefText) {
      if (!showAi) {
        setShowAi(true);
        return;
      }

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
  const placeUrl = pin.placeId ? `https://www.google.com/maps/place/?q=place_id:${pin.placeId}` : null;
  const aiPromptText = `What should I know about ${pin.title} before reaching out?`;

  return (
    <InfoWindowCardShell
      className={cn("max-w-[500px]", className)}
      contentClassName="relative overflow-hidden sm:rounded-r-[var(--info-card-radius)]"
      title={pin.title}
      subtitle={(
        <span
          className={cn(
            "inline-flex rounded-md px-2 py-1 text-[10px] font-black tracking-[0.1em] uppercase shadow-sm ring-1 ring-inset",
            pin.status === "prospect" && "bg-blue-500/10 text-blue-400 ring-blue-500/30",
            pin.status === "active" && "bg-emerald-500/10 text-emerald-400 ring-emerald-500/30",
            pin.status === "follow-up" && "bg-amber-500/10 text-amber-400 ring-amber-500/30",
            pin.status === "lost" && "bg-red-500/10 text-red-400 ring-red-500/30",
          )}
        >
          {PIN_INFO_STATUS_LABELS[pin.status] ?? pin.status}
        </span>
      )}
      rating={pin.rating ? (
        <div className="flex items-center gap-2 font-semibold">
          <div className="flex items-center text-amber-400">
            <Star className="size-4 fill-current" />
            <span className="ml-1.5 text-[14px] text-white">{pin.rating}</span>
          </div>
          {pin.ratingCount ? (
            <span className="text-[12px] text-text-muted/80">({pin.ratingCount} reviews)</span>
          ) : null}
        </div>
      ) : undefined}
      address={(
        <div className="flex items-start gap-2 leading-[1.5]">
          <MapPin className="mt-1 size-3.5 shrink-0 text-text-muted" />
          <span className="text-[13px] text-text-muted/90">{pin.address}</span>
        </div>
      )}
      details={(pin.contact || pin.phone) ? (
        <div className="mt-1 space-y-1.5">
          {pin.contact ? (
            <div className="flex items-center gap-2 text-[13px] text-text-secondary/90">
              <Mail className="size-3.5 text-text-muted" />
              <span>{pin.contact}</span>
            </div>
          ) : null}
          {pin.phone ? (
            <div className="flex items-center gap-2 text-[13px] text-text-secondary/90">
              <Phone className="size-3.5 text-text-muted" />
              <span>{pin.phone}</span>
            </div>
          ) : null}
        </div>
      ) : undefined}
      mapLinkHref={undefined}
      actions={(
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-9 w-full justify-between rounded-xl border-white/10 bg-white/5 px-3 font-bold text-white hover:border-white/20 hover:bg-white/10 hover:text-white active:scale-95"
            >
              <span className="inline-flex items-center gap-2">
                Actions
              </span>
              <ChevronDown className="size-3.5 text-text-muted" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="min-w-[220px] rounded-xl border border-white/10 bg-[#202632] p-1.5 text-white shadow-[0_18px_45px_rgba(0,0,0,0.45)] [--accent:rgba(255,255,255,0.12)] [--accent-foreground:#ffffff]"
          >
            {placeUrl ? (
              <DropdownMenuItem
                onSelect={() => {
                  window.open(placeUrl, "_blank", "noopener,noreferrer");
                }}
                className="gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-semibold text-white focus:bg-white/10 focus:text-white [&_svg]:text-[#7FB0FF] focus:[&_svg]:text-[#7FB0FF]"
              >
                <ExternalLink className="size-3.5" />
                Open in Maps
              </DropdownMenuItem>
            ) : null}
            {placeUrl ? <DropdownMenuSeparator className="bg-white/10" /> : null}
            <DropdownMenuItem
              disabled={routeState !== "idle"}
              onSelect={handleAddRoute}
              className="gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-semibold text-white focus:bg-white/10 focus:text-white data-disabled:opacity-50"
            >
              {routeState === "idle" ? <Plus className="size-3.5 text-orange" /> : <Check className="size-3.5 text-emerald-400" />}
              {routeLabel}
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={planned}
              onSelect={handlePlan}
              className="gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-semibold text-white focus:bg-white/10 focus:text-white data-disabled:opacity-50"
            >
              {planned ? <Check className="size-3.5 text-emerald-400" /> : <Calendar className="size-3.5 text-blue-400" />}
              {planned ? "Planned" : "Plan Pin"}
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem
              onSelect={() => onEditPin(pin.id)}
              className="gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-semibold text-white focus:bg-white/10 focus:text-white [&_svg]:text-white/80 focus:[&_svg]:text-white"
            >
              <Edit2 className="size-3.5" />
              Edit Pin
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => onDeletePin(pin.id)}
              className="gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-semibold data-[variant=destructive]:text-red-400 data-[variant=destructive]:focus:bg-red-500/15 data-[variant=destructive]:focus:text-red-300 data-[variant=destructive]:[&_svg]:text-red-400 data-[variant=destructive]:focus:[&_svg]:text-red-300"
            >
              <Trash2 className="size-3.5" />
              Delete Pin
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      footer={pin.placeId ? (
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={handleAiClick}
            disabled={aiLoading !== null}
            className={cn(
              "inline-flex h-9 w-full items-center justify-center gap-2 rounded-xl border border-[#4285F4]/30 bg-[#4285F4]/5 px-3 text-[12px] font-bold text-[#4285F4] transition-all hover:border-[#4285F4]/45 hover:bg-[#4285F4]/10 hover:text-[#4285F4]",
              briefText && "border-transparent bg-[#4285F4] text-white hover:bg-[#4285F4]/90 hover:text-white hover:shadow-[0_0_20px_rgba(66,133,244,0.3)]",
              aiLoading !== null && "cursor-default opacity-70",
            )}
          >
            {aiLoading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Sparkles className={cn("size-4", briefText ? undefined : "text-[#4285F4]")} />
            )}
            {aiButtonLabel}
          </button>

          <AnimatePresence>
            {showAi ? (
              <motion.div
                initial={{ opacity: 0, x: 22, scale: 0.985 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 14, scale: 0.99 }}
                transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0 z-20 bg-[#1E2430]/96 p-3.5 backdrop-blur-md"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="mb-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setShowAi(false)}
                    className="inline-flex h-7 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2 text-[11px] font-bold text-white/85 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    <ArrowLeft className="size-3.5" />
                    Go Back
                  </button>
                  <div className="inline-flex items-center gap-2 text-[12px] font-bold tracking-[0.04em] uppercase text-[#7FB0FF]">
                    <Sparkles className="size-3.5" />
                    AI Context
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAi(false)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                    aria-label="Close AI context drawer"
                  >
                    <X className="size-4" />
                  </button>
                </div>

                <div
                  className={cn(
                    "h-[calc(100%-42px)] overflow-y-auto rounded-xl border border-white/10 bg-white/5 p-3 scrollbar-thin scrollbar-thumb-white/10",
                  )}
                  onWheelCapture={(event) => event.stopPropagation()}
                  onTouchMoveCapture={(event) => event.stopPropagation()}
                >
                  <div className="space-y-3">
                    <div className="flex justify-end">
                      <div className="max-w-[88%] rounded-2xl rounded-br-sm border border-[#4285F4]/35 bg-[#4285F4]/15 px-3 py-2.5 text-[12px] leading-relaxed text-[#BFD6FF]">
                        {aiPromptText}
                      </div>
                    </div>

                    <div className="flex justify-start">
                      <div
                        className={cn(
                          "max-w-[92%] rounded-2xl rounded-bl-sm border px-3 py-2.5",
                          aiError
                            ? "border-red-400/35 bg-red-500/10"
                            : "border-white/12 bg-[#2A3344]/85",
                        )}
                      >
                        <div
                          className={cn(
                            "mb-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-[0.06em] uppercase",
                            aiError
                              ? "bg-red-500/20 text-red-300"
                              : "bg-white/8 text-[#9EC1FF]",
                          )}
                        >
                          <Sparkles className="size-3" />
                          AI
                        </div>
                        <div
                          className={cn(
                            "whitespace-pre-wrap text-[12px] leading-relaxed",
                            aiError ? "text-red-300" : "text-white/90",
                          )}
                        >
                          {aiError ?? aiText}
                        </div>
                      </div>
                    </div>

                    {briefText && !detailedText ? (
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={handleAiClick}
                          disabled={aiLoading !== null}
                          className="inline-flex min-h-8 items-center gap-1.5 rounded-2xl rounded-br-sm border border-[#4285F4]/35 bg-[#4285F4]/12 px-3 py-1.5 text-[11px] font-bold text-[#9EC1FF] transition-colors hover:bg-[#4285F4]/18 hover:text-[#BFD6FF] disabled:cursor-default disabled:opacity-70"
                        >
                          {aiLoading === "detailed" ? <Loader2 className="size-3.5 animate-spin" /> : <ArrowUpRight className="size-3.5" />}
                          Learn More
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      ) : undefined}
      imageUrl={pin.photoUrl}
      imageAlt={pin.title}
      onClose={onClose}
    />
  );
}

function normalizeAiText(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/^(\s*)\*\s+/gm, "$1• ")
    .replace(/^(\s*)[-–]\s+/gm, "$1• ")
    .trim();
}
