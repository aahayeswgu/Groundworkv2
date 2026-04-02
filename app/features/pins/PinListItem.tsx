"use client";

import { PIN_STATUS_META } from "@/app/entities/pin/model/pin-status";
import { useStore } from "@/app/shared/store";
import type { Pin } from "@/app/types/pins.types";

interface PinListItemProps {
  pin: Pin;
  onEditPin: (pinId: string) => void;
}

export function PinListItem({ pin, onEditPin }: PinListItemProps) {
  const selectPin = useStore((s) => s.selectPin);

  function handleClick() {
    selectPin(pin.id);
  }

  return (
    <div
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors duration-150 hover:bg-orange-dim group"
      onClick={handleClick}
    >
      <span
        className={`w-2.5 h-2.5 rounded-full shrink-0 ${PIN_STATUS_META[pin.status].dotClassName}`}
      />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-text-primary truncate">
          {pin.title || "Unnamed Pin"}
        </div>
        <div className="text-[11px] text-text-secondary truncate mt-0.5">{pin.address}</div>
      </div>
      <button
        className="opacity-0 group-hover:opacity-100 shrink-0 text-text-muted hover:text-orange transition-opacity"
        onClick={(e) => {
          e.stopPropagation();
          onEditPin(pin.id);
        }}
        title="Edit pin"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      </button>
    </div>
  );
}
