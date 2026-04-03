import type { Pin } from "@/app/features/pins/model/pin.types";

export type RouteAddResult = "added" | "full" | "already";

export interface MarkerLayerProps {
  onEditPin: (pinId: string) => void;
}

export interface PinMarkerVisualProps {
  pin: Pin;
  bouncing: boolean;
}
