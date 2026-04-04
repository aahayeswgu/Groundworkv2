"use client";

import { useEffect, useState } from "react";

const MOBILE_MEDIA_QUERY = "(max-width: 1024px)";

export function useIsMobile(query: string = MOBILE_MEDIA_QUERY) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const update = () => setIsMobile(mediaQuery.matches);
    update();

    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, [query]);

  return isMobile;
}
