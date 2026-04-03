import type { NoteEntry, Pin, PinStatus } from "@/app/features/pins/model/pin.types";

interface BuildCreatePinInput {
  initialData: Partial<Pin>;
  title: string;
  address: string;
  status: PinStatus;
  contact: string;
  phone: string;
  followUpDate: string;
  notes: NoteEntry[];
  timestamp: string;
}

interface BuildUpdatePinPatchInput {
  title: string;
  address: string;
  status: PinStatus;
  contact: string;
  phone: string;
  followUpDate: string;
  notes: NoteEntry[];
  timestamp: string;
}

export function buildCreatePin({
  initialData,
  title,
  address,
  status,
  contact,
  phone,
  followUpDate,
  notes,
  timestamp,
}: BuildCreatePinInput): Pin {
  return {
    id: crypto.randomUUID(),
    title: title.trim() || address || "New Pin",
    address,
    status,
    contact,
    phone,
    followUpDate,
    notes,
    lat: initialData.lat ?? 0,
    lng: initialData.lng ?? 0,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function buildUpdatePinPatch({
  title,
  address,
  status,
  contact,
  phone,
  followUpDate,
  notes,
  timestamp,
}: BuildUpdatePinPatchInput): Partial<Pin> {
  return {
    title,
    address,
    status,
    contact,
    phone,
    followUpDate,
    notes,
    updatedAt: timestamp,
  };
}

export function buildNoteEntry(text: string, timestamp: string): NoteEntry | null {
  const nextText = text.trim();
  if (!nextText) return null;
  return { text: nextText, date: timestamp };
}

export function formatNoteDate(date: string): string {
  return new Date(date).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
