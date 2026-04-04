import type { RouteStop } from "@/app/features/route/model/route.types";
import { cn } from "@/app/shared/lib/utils";
import { Card, CardContent } from "@/app/shared/ui/card";

interface RouteStopInfoWindowCardProps {
  stop: RouteStop;
  order: number;
  className?: string;
}

export function RouteStopInfoWindowCard({ stop, order, className }: RouteStopInfoWindowCardProps) {
  const query = encodeURIComponent(stop.address || `${stop.lat},${stop.lng}`);

  return (
    <Card className={cn("w-full min-w-[220px] bg-bg-card font-sans ring-1 ring-border", className)}>
      <CardContent className="space-y-1 py-3">
        <div className="text-sm font-bold text-[#1A1A1A]">
          Stop {order}: {stop.label}
        </div>
        <div className="text-xs text-[#666]">
          {stop.address}
        </div>
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${query}`}
          target="_blank"
          rel="noopener"
          className="inline-block text-xs font-semibold text-[#4285F4] no-underline"
        >
          View on Google Maps
        </a>
      </CardContent>
    </Card>
  );
}
