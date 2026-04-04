import type { MapMobileAction } from "@/app/shared/model/mobile-events";

export type MobilePrimaryTab = "map" | "pins" | "planner";

export interface MobilePrimaryTabItem {
  id: MobilePrimaryTab;
  label: string;
  icon: "map" | "pins" | "planner";
}

export const MOBILE_PRIMARY_TABS: readonly MobilePrimaryTabItem[] = [
  { id: "map", label: "Map", icon: "map" },
  { id: "pins", label: "Pins", icon: "pins" },
  { id: "planner", label: "Planner", icon: "planner" },
];

export type MobileQuickActionId =
  | "discover"
  | "route"
  | "drop-pin"
  | "voice-note"
  | "email"
  | "settings";

export interface MobileQuickActionItem {
  id: MobileQuickActionId;
  label: string;
  detail: string;
  icon: "discover" | "route" | "drop-pin" | "voice-note" | "email" | "settings";
  mapAction?: MapMobileAction;
}

export const MOBILE_QUICK_ACTIONS: readonly MobileQuickActionItem[] = [
  {
    id: "discover",
    label: "Discover",
    detail: "Draw and search businesses",
    icon: "discover",
    mapAction: "toggle-discover",
  },
  {
    id: "route",
    label: "Route",
    detail: "Open route confirmation",
    icon: "route",
    mapAction: "toggle-route-panel",
  },
  {
    id: "drop-pin",
    label: "Drop Pin",
    detail: "Tap map to place a new pin",
    icon: "drop-pin",
    mapAction: "toggle-drop-pin",
  },
  {
    id: "voice-note",
    label: "Voice Note",
    detail: "Quick dictation to planner",
    icon: "voice-note",
    mapAction: "toggle-voice-entry",
  },
  {
    id: "email",
    label: "Email",
    detail: "Open built-in inbox",
    icon: "email",
  },
  {
    id: "settings",
    label: "Settings",
    detail: "Profile and preferences",
    icon: "settings",
  },
];
