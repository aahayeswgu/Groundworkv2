import type { RouteStop } from "@/app/features/route/model/route.types";

interface RouteStopInfoWindowCardProps {
  stop: RouteStop;
  order: number;
}

export function RouteStopInfoWindowCard({ stop, order }: RouteStopInfoWindowCardProps) {
  const query = encodeURIComponent(stop.address || `${stop.lat},${stop.lng}`);

  return (
    <div style={{ fontFamily: "DM Sans, sans-serif", padding: "8px 12px", minWidth: "200px" }}>
      <div style={{ fontSize: "14px", fontWeight: 700, color: "#1A1A1A" }}>
        Stop {order}: {stop.label}
      </div>
      <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
        {stop.address}
      </div>
      <a
        href={`https://www.google.com/maps/search/?api=1&query=${query}`}
        target="_blank"
        rel="noopener"
        style={{
          display: "inline-block",
          marginTop: "8px",
          fontSize: "12px",
          color: "#4285F4",
          fontWeight: 600,
          textDecoration: "none",
        }}
      >
        View on Google Maps
      </a>
    </div>
  );
}
