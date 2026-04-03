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
  const buttonStateClass = active
    ? "border-white bg-white text-orange"
    : "border-orange bg-orange text-white";

  return (
    <div className="relative group">
      {badge != null && badge > 0 && (
        <span className="absolute -right-1.5 -top-1.5 z-10 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-orange px-1 text-[10px] font-bold text-white">
          {badge}
        </span>
      )}
      <button
        title={title}
        onClick={onClick}
        className={`flex h-10 w-10 items-center justify-center rounded-lg border shadow-gw transition-all duration-200 max-md:h-11 max-md:w-11 ${buttonStateClass} ${className}`}
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
