export type PinStatus = "prospect" | "active" | "follow-up" | "lost";

export interface NoteEntry {
  text: string;
  date: string;
}

export interface Pin {
  id: string;
  title: string;
  address: string;
  status: PinStatus;
  lat: number;
  lng: number;
  contact: string;
  phone: string;
  followUpDate: string;
  notes: NoteEntry[];
  createdAt: string;
  updatedAt: string;
  placeId?: string;
  photoUrl?: string;
  rating?: number;
  ratingCount?: number;
}
