import type { PinStatus } from "@/app/types/pins.types";

interface PinStatusMeta {
  label: string;
  color: string;
}

export const PIN_STATUS_ORDER: PinStatus[] = ["prospect", "active", "follow-up", "lost"];

export const PIN_STATUS_META: Record<PinStatus, PinStatusMeta> = {
  prospect: { label: "Prospect", color: "#3B82F6" },
  active: { label: "Active", color: "#22C55E" },
  "follow-up": { label: "Follow-Up", color: "#F59E0B" },
  lost: { label: "Lost", color: "#EF4444" },
};

export function createDefaultPinStatusFilter(): Set<PinStatus> {
  return new Set(PIN_STATUS_ORDER);
}

export const PIN_STATUS_OPTIONS = PIN_STATUS_ORDER.map((status) => ({
  value: status,
  label: PIN_STATUS_META[status].label,
  color: PIN_STATUS_META[status].color,
}));

