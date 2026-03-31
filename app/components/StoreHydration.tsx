"use client";
import { useEffect } from "react";
import { useStore } from "@/app/store";

export default function StoreHydration() {
  useEffect(() => {
    useStore.persist.rehydrate();
  }, []);
  return null;
}
