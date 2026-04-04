export const MAP_ACTION_EVENT = "gw-map-action" as const;
export const OPEN_MOBILE_TAB_EVENT = "gw-open-mobile-tab" as const;

export type MapMobileAction =
  | "toggle-drop-pin"
  | "toggle-discover"
  | "toggle-voice-entry";

export interface MapMobileActionEventDetail {
  action: MapMobileAction;
}

export type MobileSidebarTab = "map" | "pins" | "planner" | "route";

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
