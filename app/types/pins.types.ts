export type PinStatus = "prospect" | "active" | "follow-up" | "lost";

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
  notes: string;
  createdAt: string;
  updatedAt: string;
}
