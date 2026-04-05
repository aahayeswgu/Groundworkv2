"use client";
import { useEffect } from "react";
import { useStore } from "@/app/store";

export default function StoreHydration() {
  const purgeStaleDays = useStore((s) => s.purgeStaleDays);

  useEffect(() => {
    if (useStore.persist.hasHydrated()) {
      purgeStaleDays();
      return;
    }

    const unsubscribe = useStore.persist.onFinishHydration(() => {
      purgeStaleDays();
    });
    void useStore.persist.rehydrate();

    return () => {
      unsubscribe();
    };
  }, [purgeStaleDays]);

  return null;
}
