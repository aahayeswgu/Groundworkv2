"use client";

import { useSyncExternalStore } from "react";
import { useStore } from "@/app/store";

export function useStoreHydrated(): boolean {
  return useSyncExternalStore(
    (onStoreChange) => {
      const persistApi = useStore.persist;
      const unsubscribeHydrate = persistApi.onHydrate(onStoreChange);
      const unsubscribeFinishHydration = persistApi.onFinishHydration(onStoreChange);

      return () => {
        unsubscribeHydrate();
        unsubscribeFinishHydration();
      };
    },
    () => useStore.persist.hasHydrated(),
    () => false,
  );
}
