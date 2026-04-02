"use client";

type MapButtonTone = "default" | "accent";

type MapButtonProps = {
  title: string;
  children: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  tone?: MapButtonTone;
};

export default function MapButton({
  title,
  children,
  active = false,
  disabled = false,
  onClick,
  className = "",
  tone = "default",
}: MapButtonProps) {
  const stateClass =
    tone === "accent"
      ? "bg-orange text-white border-orange hover:bg-orange hover:text-white hover:border-orange hover:brightness-110 hover:shadow-[0_8px_18px_rgba(0,0,0,0.3)]"
      : active
        ? "bg-orange text-white border-orange"
        : "bg-charcoal text-white border-white/25 hover:bg-charcoal hover:text-white hover:border-orange";

  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`w-10 h-10 max-md:w-11 max-md:h-11 rounded-lg flex items-center justify-center transition-all duration-200 border ring-1 ring-black/45 shadow-[0_10px_22px_rgba(0,0,0,0.45)] disabled:cursor-not-allowed disabled:opacity-70 ${stateClass} ${className}`}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        className="drop-shadow-[0_1px_1px_rgba(0,0,0,0.4)]"
      >
        {children}
      </svg>
    </button>
  );
}
