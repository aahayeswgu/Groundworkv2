export type DiscoverMarkerState = 'default' | 'selected' | 'hover';

export const MARKER_Z_INDEX: Record<DiscoverMarkerState, number> = {
  default: 600,
  selected: 800,
  hover: 900,
};
