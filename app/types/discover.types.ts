export interface DiscoverResult {
  placeId: string;
  displayName: string;
  address: string;
  lat: number;
  lng: number;
  types: string[];
  rating: number | null;
  photoUri: string | null;
}

export interface MarathonZone {
  id: string;                    // uuid — unique per draw
  label: string;                 // e.g. "Zone 1", "Zone 2"
  bounds: {
    swLat: number;
    swLng: number;
    neLat: number;
    neLng: number;
  };
  results: DiscoverResult[];     // results found in this zone's search
  resultCount: number;           // snapshot count for badge display
}
