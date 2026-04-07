import { MapPin } from "lucide-react";
import type { RouteStop } from "@/app/features/route/model/route.types";
import { cn } from "@/app/shared/lib/utils";
import { InfoWindowCardShell } from "@/app/shared/ui/info-window-card-shell";

interface RouteStopInfoWindowCardProps {
  stop: RouteStop;
  order: number;
  onClose?: () => void;
  className?: string;
}

export function RouteStopInfoWindowCard({ stop, order, onClose, className }: RouteStopInfoWindowCardProps) {
  const query = encodeURIComponent(stop.address || `${stop.lat},${stop.lng}`);
  const mapLinkHref = `https://www.google.com/maps/search/?api=1&query=${query}`;

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
      mapLinkHref={mapLinkHref}
      mapLinkLabel="Open in Google Maps"
      imageUrl={null}
      onClose={onClose}
    />
  );
}
