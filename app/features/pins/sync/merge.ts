import type { Pin, PinStatus } from '@/app/types/pins.types';

export interface RemotePin {
  id: string;
  title: string;
  address: string;
  status: string;
  lat: number;
  lng: number;
  contact: string;
  phone: string;
  follow_up_date: string;
  notes: Array<{ text: string; date: string }>;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export function localToRemote(pin: Pin): RemotePin {
  return {
    id: pin.id,
    title: pin.title,
    address: pin.address,
    status: pin.status,
    lat: pin.lat,
    lng: pin.lng,
    contact: pin.contact,
    phone: pin.phone,
    follow_up_date: pin.followUpDate,
    notes: pin.notes,
    created_at: pin.createdAt,
    updated_at: pin.updatedAt,
    deleted_at: null,
  };
}

export function remoteToLocal(remote: RemotePin): Pin {
  return {
    id: remote.id,
    title: remote.title,
    address: remote.address,
    status: remote.status as PinStatus,
    lat: remote.lat,
    lng: remote.lng,
    contact: remote.contact,
    phone: remote.phone,
    followUpDate: remote.follow_up_date,
    notes: remote.notes,
    createdAt: remote.created_at,
    updatedAt: remote.updated_at,
  };
}

export function mergePins(localPins: Pin[], remotePins: RemotePin[]): Pin[] {
  const merged = new Map<string, Pin>();

  // Seed with all local pins
  for (const pin of localPins) {
    merged.set(pin.id, pin);
  }

  // Apply remote pins using last-write-wins by updated_at
  for (const remote of remotePins) {
    const local = merged.get(remote.id);

    if (remote.deleted_at) {
      // Soft-delete: remove only if remote is newer than any local version
      if (!local || new Date(remote.updated_at) > new Date(local.updatedAt)) {
        merged.delete(remote.id);
      }
      // If local is newer → keep it (the local edit happened after the delete)
      continue;
    }

    // No local pin, or remote is newer → adopt remote version
    if (!local || new Date(remote.updated_at) > new Date(local.updatedAt)) {
      merged.set(remote.id, remoteToLocal(remote));
    }
    // If local is newer → no-op (local wins)
  }

  return Array.from(merged.values());
}
