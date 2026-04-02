"use client";

type MapButtonTone = "default" | "accent";

type MapButtonProps = {
  title: string;
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  className?: string;
  tone?: MapButtonTone;
};

export default function MapButton({
  title,
  children,
  active = false,
  onClick,
  className = "",
  tone = "default",
}: MapButtonProps) {
  const stateClass =
    tone === "accent"
      ? "bg-orange text-white border-orange hover:bg-orange hover:text-white hover:border-orange hover:brightness-110 hover:shadow-[0_8px_18px_rgba(0,0,0,0.3)]"
      : active
        ? "bg-orange text-white border-orange"
        : "bg-bg-card text-text-primary border-border hover:border-orange hover:text-orange";

  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`w-10 h-10 max-md:w-11 max-md:h-11 rounded-lg flex items-center justify-center transition-all duration-200 border backdrop-blur-[2px] shadow-[0_4px_12px_rgba(0,0,0,0.24)] ${stateClass} ${className}`}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25">
        {children}
      </svg>
    </button>
  );
}
