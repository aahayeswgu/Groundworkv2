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
      className={`w-10 h-10 max-md:w-11 max-md:h-11 bg-bg-card border border-border rounded-lg flex items-center justify-center text-text-primary shadow-gw transition-all duration-200 hover:border-orange hover:text-orange ${
        active ? "!bg-orange !text-white !border-orange" : ""
      } ${className}`}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        {children}
      </svg>
    </button>
  );
}
