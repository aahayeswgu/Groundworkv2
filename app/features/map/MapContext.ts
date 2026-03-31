import { createContext, useContext } from "react";

export const MapContext = createContext<google.maps.Map | null>(null);

export function useMapInstance(): google.maps.Map {
  const map = useContext(MapContext);
  if (!map) throw new Error("useMapInstance must be used inside a MapContext.Provider");
  return map;
}
