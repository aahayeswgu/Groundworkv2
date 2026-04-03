import type { Pin, PinStatus } from "@/app/features/pins/model/pin.types";

export interface PinListStats {
  totalPins: number;
  activeCount: number;
  thisWeekCount: number;
  overdueCount: number;
}

export const STATUS_CHIPS: { status: PinStatus; label: string; dotClassName: string }[] = [
  { status: "prospect", label: "Prospect", dotClassName: "bg-[#3B82F6]" },
  { status: "active", label: "Active", dotClassName: "bg-[#22C55E]" },
  { status: "follow-up", label: "Follow-Up", dotClassName: "bg-[#F59E0B]" },
  { status: "lost", label: "Lost", dotClassName: "bg-[#EF4444]" },
];

export function filterPinsByQueryAndStatus(
  pins: Pin[],
  searchText: string,
  activeStatusFilter: Set<PinStatus>,
): Pin[] {
  const query = searchText.toLowerCase().trim();

  return pins.filter((pin) => {
    const matchesSearch =
      !query
      || pin.title.toLowerCase().includes(query)
      || pin.address.toLowerCase().includes(query)
      || pin.contact.toLowerCase().includes(query);

    return matchesSearch && activeStatusFilter.has(pin.status);
  });
}

export function computePinListStats(pins: Pin[]): PinListStats {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);

  const activeCount = pins.filter((pin) => pin.status === "active").length;
  const thisWeekCount = pins.filter((pin) => isFollowUpInWindow(pin, today, nextWeek)).length;
  const overdueCount = pins.filter((pin) => isOverdue(pin, today)).length;

  return {
    totalPins: pins.length,
    activeCount,
    thisWeekCount,
    overdueCount,
  };
}

export function toggleStatusFilter(
  activeStatusFilter: Set<PinStatus>,
  status: PinStatus,
): Set<PinStatus> {
  const next = new Set(activeStatusFilter);
  if (next.has(status)) {
    next.delete(status);
  } else {
    next.add(status);
  }
  return next;
}

function isFollowUpInWindow(pin: Pin, start: Date, end: Date): boolean {
  if (!pin.followUpDate) return false;
  const followUpDate = new Date(pin.followUpDate);
  return followUpDate >= start && followUpDate <= end;
}

function isOverdue(pin: Pin, today: Date): boolean {
  if (!pin.followUpDate) return false;
  return new Date(pin.followUpDate) < today;
}
