export interface RouteStop {
  id: string;
  label: string;
  address: string;
  lat: number;
  lng: number;
}

export interface RouteResult {
  optimizedOrder: number[];
  totalDistanceMeters: number;
  totalDurationSeconds: number;
  polylinePath: Array<{ lat: number; lng: number }>;
}
