import type { PinStatus } from "@/app/types/pins.types";

interface PinStatusMeta {
  label: string;
  color: string;
  dotClassName: string;
  badgeClassName: string;
  chipSelectedClassName: string;
  chipUnselectedClassName: string;
}

export const PIN_STATUS_ORDER: PinStatus[] = ["prospect", "active", "follow-up", "lost"];

export const PIN_STATUS_META: Record<PinStatus, PinStatusMeta> = {
  prospect: {
    label: "Prospect",
    color: "#3B82F6",
    dotClassName: "bg-blue-500",
    badgeClassName: "bg-blue-500 text-white",
    chipSelectedClassName: "bg-blue-500 border-blue-500 text-white",
    chipUnselectedClassName: "bg-transparent border-blue-500 text-blue-500",
  },
  active: {
    label: "Active",
    color: "#22C55E",
    dotClassName: "bg-gw-green",
    badgeClassName: "bg-gw-green text-white",
    chipSelectedClassName: "bg-gw-green border-gw-green text-white",
    chipUnselectedClassName: "bg-transparent border-gw-green text-gw-green",
  },
  "follow-up": {
    label: "Follow-Up",
    color: "#F59E0B",
    dotClassName: "bg-amber-500",
    badgeClassName: "bg-amber-500 text-white",
    chipSelectedClassName: "bg-amber-500 border-amber-500 text-white",
    chipUnselectedClassName: "bg-transparent border-amber-500 text-amber-500",
  },
  lost: {
    label: "Lost",
    color: "#EF4444",
    dotClassName: "bg-gw-red",
    badgeClassName: "bg-gw-red text-white",
    chipSelectedClassName: "bg-gw-red border-gw-red text-white",
    chipUnselectedClassName: "bg-transparent border-gw-red text-gw-red",
  },
};

export function createDefaultPinStatusFilter(): Set<PinStatus> {
  return new Set(PIN_STATUS_ORDER);
}

export const PIN_STATUS_OPTIONS = PIN_STATUS_ORDER.map((status) => ({
  value: status,
  label: PIN_STATUS_META[status].label,
  color: PIN_STATUS_META[status].color,
  dotClassName: PIN_STATUS_META[status].dotClassName,
  chipSelectedClassName: PIN_STATUS_META[status].chipSelectedClassName,
  chipUnselectedClassName: PIN_STATUS_META[status].chipUnselectedClassName,
}));
