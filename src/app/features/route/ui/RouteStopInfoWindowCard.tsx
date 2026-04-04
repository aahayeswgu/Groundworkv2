import type { RouteStop } from "@/app/features/route/model/route.types";

interface RouteStopInfoWindowCardProps {
  stop: RouteStop;
  order: number;
}

export function RouteStopInfoWindowCard({ stop, order }: RouteStopInfoWindowCardProps) {
  const query = encodeURIComponent(stop.address || `${stop.lat},${stop.lng}`);

  return (
    <div className="min-w-[200px] px-3 py-2 font-sans">
      <div className="text-sm font-bold text-[#1A1A1A]">
        Stop {order}: {stop.label}
      </div>
      <div className="mt-1 text-xs text-[#666]">
        {stop.address}
      </div>
      <a
        href={`https://www.google.com/maps/search/?api=1&query=${query}`}
        target="_blank"
        rel="noopener"
        className="mt-2 inline-block text-xs font-semibold text-[#4285F4] no-underline"
      >
        View on Google Maps
      </a>
    </div>
  );
}
