"use client";

export default function MapButton({
  title,
  children,
  active = false,
  badge,
  onClick,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  active?: boolean;
  badge?: number;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <div className="relative group">
      {badge != null && badge > 0 && (
        <span className="absolute -top-1.5 -right-1.5 z-10 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-bold text-white px-1" style={{ backgroundColor: "#C4692A" }}>
          {badge}
        </span>
      )}
      <button
        title={title}
        onClick={onClick}
        style={active
          ? { backgroundColor: "#fff", color: "#C4692A", borderColor: "#fff" }
          : { backgroundColor: "#C4692A", color: "#fff", borderColor: "#C4692A" }
        }
        className={`w-10 h-10 max-md:w-11 max-md:h-11 rounded-lg flex items-center justify-center shadow-gw transition-all duration-200 border ${className}`}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          {children}
        </svg>
      </button>
      {/* Hover tooltip label — appears to the left */}
      <span className="pointer-events-none absolute right-full top-1/2 -translate-y-1/2 mr-2 px-2 py-1 rounded bg-[#1A1A1A] text-white text-xs font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-lg">
        {title}
      </span>
    </div>
  );
}
