import type { PinStatus } from "@/app/features/pins/model/pin.types";

export const PIN_INFO_STATUS_COLORS: Record<PinStatus, string> = {
  prospect: "#3B82F6",
  active: "#22C55E",
  "follow-up": "#F59E0B",
  lost: "#EF4444",
};

export const PIN_INFO_STATUS_LABELS: Record<PinStatus, string> = {
  prospect: "Prospect",
  active: "Active",
  "follow-up": "Follow-Up",
  lost: "Lost",
};
