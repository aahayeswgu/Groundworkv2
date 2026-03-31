"use client";

export default function MapButton({
  title,
  children,
  active = false,
  onClick,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
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
  );
}
