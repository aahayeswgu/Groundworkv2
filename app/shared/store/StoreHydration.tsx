"use client";
import { useEffect } from "react";
import { useStore } from "@/app/shared/store";

export default function StoreHydration() {
  useEffect(() => {
    useStore.persist.rehydrate();
  }, []);
  return null;
}
