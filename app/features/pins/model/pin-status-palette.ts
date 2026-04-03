import type { PinStatus } from "@/app/features/pins/model/pin.types";

export const PIN_STATUS_COLORS: Record<PinStatus, string> = {
  prospect: "#3B82F6",
  active: "#22C55E",
  "follow-up": "#F59E0B",
  lost: "#EF4444",
};

export const PIN_STATUS_BADGE_CLASSNAMES: Record<PinStatus, string> = {
  prospect: "bg-[#3B82F6]",
  active: "bg-[#22C55E]",
  "follow-up": "bg-[#F59E0B]",
  lost: "bg-[#EF4444]",
};
