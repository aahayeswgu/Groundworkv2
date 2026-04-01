"use client";
import { useEffect } from "react";
import { useStore } from "@/app/store";

export default function StoreHydration() {
  const purgeStaleDays = useStore((s) => s.purgeStaleDays);

  useEffect(() => {
    useStore.persist.rehydrate();
  }, []);

  useEffect(() => {
    // purgeStaleDays runs after rehydrate() on mount
    // The purge can run anytime after mount safely
    purgeStaleDays();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
