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
