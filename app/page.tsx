"use client";

import { useState, useCallback } from "react";
import Sidebar from "./components/Sidebar";
import Map from "./features/map/Map";
import MobileBottomBar from "./components/MobileBottomBar";
import StoreHydration from "./components/StoreHydration";
import PinModal from "./features/pins/PinModal";
import { useStore } from "@/app/store";

export default function Home() {
  const [editPinId, setEditPinId] = useState<string | null>(null);
  const pins = useStore((s) => s.pins);

  const openEditModal = useCallback((pinId: string) => {
    setEditPinId(pinId);
  }, []);

  const editPin = editPinId ? (pins.find((p) => p.id === editPinId) ?? null) : null;

  return (
    <>
      <StoreHydration />
      <div className="flex h-screen w-screen">
        <Sidebar onEditPin={openEditModal} />
        <Map onEditPin={openEditModal} />
      </div>
      <MobileBottomBar />
      {editPin && (
        <PinModal
          mode="edit"
          initialData={editPin}
          onClose={() => setEditPinId(null)}
        />
      )}
    </>
  );
}
