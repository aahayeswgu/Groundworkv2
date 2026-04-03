import type { PinStatus } from "@/app/features/pins/model/pin.types";

export const PIN_MODAL_STATUS_OPTIONS: { value: PinStatus; label: string; color: string }[] = [
  { value: "prospect", label: "Prospect", color: "#3B82F6" },
  { value: "active", label: "Active", color: "#22C55E" },
  { value: "follow-up", label: "Follow-Up", color: "#F59E0B" },
  { value: "lost", label: "Lost", color: "#EF4444" },
];

export const PIN_MODAL_INPUT_CLASS =
  "w-full px-3 py-2 bg-bg-input border border-border rounded-lg text-sm text-text-primary outline-none focus:border-orange transition-colors";

export const PIN_MODAL_LABEL_CLASS = "block text-xs font-medium text-text-secondary mb-1";
