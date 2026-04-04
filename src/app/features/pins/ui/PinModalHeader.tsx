interface PinModalHeaderProps {
  mode: "create" | "edit";
  onClose: () => void;
}

export function PinModalHeader({ mode, onClose }: PinModalHeaderProps) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
      <h2 className="text-base font-semibold text-text-primary">
        {mode === "create" ? "New Pin" : "Edit Pin"}
      </h2>
      <button
        onClick={onClose}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-secondary transition-colors"
        aria-label="Close"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}
