import type { PinStatus } from "@/app/features/pins/model/pin.types";
import {
  PIN_STATUS_BADGE_CLASSNAMES,
  PIN_STATUS_COLORS,
} from "@/app/features/pins/model/pin-status-palette";

export const PIN_INFO_STATUS_COLORS = PIN_STATUS_COLORS;
export const PIN_INFO_STATUS_CLASSNAMES: Record<PinStatus, string> = PIN_STATUS_BADGE_CLASSNAMES;

export const PIN_INFO_STATUS_LABELS: Record<PinStatus, string> = {
  prospect: "Prospect",
  active: "Active",
  "follow-up": "Follow-Up",
  lost: "Lost",
};
