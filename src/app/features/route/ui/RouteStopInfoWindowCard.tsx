import { ExternalLink, MapPin } from "lucide-react";
import type { RouteStop } from "@/app/features/route/model/route.types";
import { buildPreferredPlaceMapsUrl } from "@/app/shared/lib/maps-links";
import { cn } from "@/app/shared/lib/utils";
import { InfoWindowCardShell } from "@/app/shared/ui/info-window-card-shell";
import { useStore } from "@/app/store";

interface RouteStopInfoWindowCardProps {
  stop: RouteStop;
  order: number;
  onClose?: () => void;
  className?: string;
}

export function RouteStopInfoWindowCard({ stop, order, onClose, className }: RouteStopInfoWindowCardProps) {
  const mapsProvider = useStore((state) => state.mapsProvider);
  const mapQuery = stop.address || `${stop.lat},${stop.lng}`;

  function handleOpenInMaps() {
    const url = buildPreferredPlaceMapsUrl({ query: mapQuery, provider: mapsProvider });
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <InfoWindowCardShell
      className={cn("max-w-[420px]", className)}
      title={stop.label}
      subtitle={(
        <span className="inline-flex rounded-md border border-orange/35 bg-orange/15 px-2 py-1 text-[10px] font-black tracking-[0.1em] text-orange uppercase">
          Route Stop {order}
        </span>
      )}
      address={(
        <div className="flex items-start gap-2 leading-[1.5]">
          <MapPin className="mt-1 size-3.5 shrink-0 text-text-muted" />
          <span className="text-[13px] text-text-muted/90">{stop.address}</span>
        </div>
      )}
      mapLinkHref={undefined}
      actions={(
        <button
          type="button"
          onClick={handleOpenInMaps}
          className="inline-flex h-8 items-center gap-1.5 rounded-full border border-white/5 bg-white/5 px-3 text-[10px] font-bold text-text-primary no-underline transition-all hover:border-white/20 hover:bg-white/10 active:scale-95"
        >
          <ExternalLink className="size-3" />
          Open in Maps
        </button>
      )}
      imageUrl={stop.photoUrl ?? null}
      imageAlt={stop.label}
      onClose={onClose}
    />
  );
}
