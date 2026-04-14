export const MAP_ACTION_EVENT = "gw-map-action" as const;
export const OPEN_MOBILE_TAB_EVENT = "gw-open-mobile-tab" as const;

export type MapMobileAction =
  | "toggle-drop-pin"
  | "toggle-discover"
  | "restart-discover"
  | "toggle-voice-entry";

export interface MapMobileActionEventDetail {
  action: MapMobileAction;
}

export type MobileSidebarTab = "map" | "pins" | "discover" | "planner" | "route";

export interface OpenMobileTabEventDetail {
  tab: MobileSidebarTab;
}

export function dispatchMapMobileAction(action: MapMobileAction) {
  window.dispatchEvent(new CustomEvent<MapMobileActionEventDetail>(MAP_ACTION_EVENT, {
    detail: { action },
  }));
}

export function dispatchOpenMobileTab(tab: MobileSidebarTab) {
  window.dispatchEvent(new CustomEvent<OpenMobileTabEventDetail>(OPEN_MOBILE_TAB_EVENT, {
    detail: { tab },
  }));
}

export const PAN_TO_LOCATION_EVENT = "gw-pan-to-location" as const;

export interface PanToLocationEventDetail {
  lat: number;
  lng: number;
  zoom?: number;
  label?: string;
}

export function dispatchPanToLocation(lat: number, lng: number, zoom?: number, label?: string) {
  window.dispatchEvent(new CustomEvent<PanToLocationEventDetail>(PAN_TO_LOCATION_EVENT, {
    detail: { lat, lng, zoom, label },
  }));
}

export const CREATE_PIN_AT_LOCATION_EVENT = "gw-create-pin-at-location" as const;

export interface CreatePinAtLocationEventDetail {
  lat: number;
  lng: number;
  address: string;
}

export function dispatchCreatePinAtLocation(lat: number, lng: number, address: string) {
  window.dispatchEvent(new CustomEvent<CreatePinAtLocationEventDetail>(CREATE_PIN_AT_LOCATION_EVENT, {
    detail: { lat, lng, address },
  }));
}
