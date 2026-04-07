import { useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  ChevronDown,
  ExternalLink,
  Loader2,
  MapPin,
  Plus,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { classifyGooglePlace } from "@/app/features/discover/lib/discover-filters";
import type { DiscoverResult } from "@/app/features/discover/model/discover.types";
import { fetchAiBrief } from "@/app/shared/api/ask-ai";
import { buildPreferredPlaceMapsUrl } from "@/app/shared/lib/maps-links";
import { cn } from "@/app/shared/lib/utils";
import { useIsMobile } from "@/app/shared/lib/use-is-mobile";
import { Button } from "@/app/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/shared/ui/dropdown-menu";
import { InfoWindowCardShell } from "@/app/shared/ui/info-window-card-shell";
import { useStore } from "@/app/store";

interface DiscoverInfoWindowCardProps {
  result: DiscoverResult;
  alreadySaved: boolean;
  isInRoute: boolean;
  onSave: () => void;
  onAddToRoute: () => boolean;
  onClose?: () => void;
  className?: string;
}

export function DiscoverInfoWindowCard({
  result,
  alreadySaved,
  isInRoute,
  onSave,
  onAddToRoute,
  onClose,
  className,
}: DiscoverInfoWindowCardProps) {
  const isMobile = useIsMobile();
  const mapsProvider = useStore((state) => state.mapsProvider);
  const [saved, setSaved] = useState(alreadySaved);
  const [routeState, setRouteState] = useState<"idle" | "added" | "full">(isInRoute ? "added" : "idle");
  const [briefText, setBriefText] = useState("");
  const [detailedText, setDetailedText] = useState("");
  const [showAi, setShowAi] = useState(false);
  const [aiLoading, setAiLoading] = useState<"brief" | "detailed" | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const placeType = classifyGooglePlace(
    result.types,
    result.displayName,
    result.primaryType,
    result.matchedCategory,
  );
  const routeLabel = routeState === "full"
    ? "Route Full"
    : routeState === "added"
      ? "Added to Route"
      : "Add to Route";

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
          ? (showAi ? "Learn More" : "Show AI Brief")
          : "Ask AI";

  const aiText = detailedText
    ? `${normalizeAiText(briefText)}\n\n---\n\n${normalizeAiText(detailedText)}`
    : normalizeAiText(briefText);
  const mapsQuery = `${result.displayName} ${result.address}`.trim();
  const placeUrl = buildPreferredPlaceMapsUrl({
    query: mapsQuery,
    placeId: result.placeId,
    provider: mapsProvider,
  });
  const aiPromptText = `What should I know about ${result.displayName} before reaching out?`;

  return (
    <InfoWindowCardShell
      className={cn("max-w-[500px]", className)}
      contentClassName="relative overflow-hidden sm:rounded-r-[var(--info-card-radius)]"
      title={result.displayName}
      subtitle={(
        <span className="inline-flex rounded-md border border-[#4285F4]/30 bg-[#4285F4]/10 px-2 py-1 text-[10px] font-black tracking-[0.1em] text-[#7FB0FF] uppercase">
          {placeType}
        </span>
      )}
      rating={result.rating ? (
        <div className="flex items-center gap-2 font-semibold">
          <div className="flex items-center text-amber-400">
            <Star className="size-4 fill-current" />
            <span className="ml-1.5 text-[14px] text-white">{result.rating}</span>
          </div>
          {result.ratingCount ? (
            <span className="text-[12px] text-text-muted/80">({result.ratingCount} reviews)</span>
          ) : null}
        </div>
      ) : undefined}
      address={(
        <div className="flex items-start gap-2 leading-[1.5]">
          <MapPin className="mt-1 size-3.5 shrink-0 text-text-muted" />
          <span className="text-[13px] text-text-muted/90">{result.address}</span>
        </div>
      )}
      mapLinkHref={undefined}
      actions={(
        isMobile ? (
          <div className="space-y-2" onPointerDownCapture={(event) => event.stopPropagation()}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                window.open(placeUrl, "_blank", "noopener,noreferrer");
              }}
              className="h-9 w-full justify-start gap-2 rounded-xl border-white/10 bg-white/5 px-3 text-[12px] font-bold text-white hover:border-white/20 hover:bg-white/10 hover:text-white"
            >
              <ExternalLink className="size-3.5 text-[#7FB0FF]" />
              Open in Maps
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={saved}
              onClick={handleSave}
              className="h-9 w-full justify-start gap-2 rounded-xl border-white/10 bg-white/5 px-3 text-[12px] font-bold text-white hover:border-white/20 hover:bg-white/10 hover:text-white disabled:opacity-50"
            >
              {saved ? <Check className="size-3.5 text-emerald-400" /> : <Plus className="size-3.5 text-orange" />}
              {saved ? "Pinned" : "Save as Pin"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={routeState !== "idle"}
              onClick={handleAddToRoute}
              className="h-9 w-full justify-start gap-2 rounded-xl border-white/10 bg-white/5 px-3 text-[12px] font-bold text-white hover:border-white/20 hover:bg-white/10 hover:text-white disabled:opacity-50"
            >
              {routeState === "idle" ? <Plus className="size-3.5 text-orange" /> : <Check className="size-3.5 text-emerald-400" />}
              {routeLabel}
            </Button>
          </div>
        ) : (
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
              <DropdownMenuItem
                onSelect={() => {
                  window.open(placeUrl, "_blank", "noopener,noreferrer");
                }}
                className="gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-semibold text-white focus:bg-white/10 focus:text-white [&_svg]:text-[#7FB0FF] focus:[&_svg]:text-[#7FB0FF]"
              >
                <ExternalLink className="size-3.5" />
                Open in Maps
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem
                disabled={saved}
                onSelect={handleSave}
                className="gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-semibold text-white focus:bg-white/10 focus:text-white data-disabled:opacity-50"
              >
                {saved ? <Check className="size-3.5 text-emerald-400" /> : <Plus className="size-3.5 text-orange" />}
                {saved ? "Pinned" : "Save as Pin"}
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={routeState !== "idle"}
                onSelect={handleAddToRoute}
                className="gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-semibold text-white focus:bg-white/10 focus:text-white data-disabled:opacity-50"
              >
                {routeState === "idle" ? <Plus className="size-3.5 text-orange" /> : <Check className="size-3.5 text-emerald-400" />}
                {routeLabel}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      )}
      footer={(
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
                  className="h-[calc(100%-42px)] overflow-y-auto rounded-xl border border-white/10 bg-white/5 p-3 scrollbar-thin scrollbar-thumb-white/10"
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
      )}
      imageUrl={result.photoUri}
      imageAlt={result.displayName}
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
