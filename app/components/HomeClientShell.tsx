"use client";

import { useCallback, useState } from "react";
import Map from "@/app/features/map/Map";
import PinModal from "@/app/features/pins/PinModal";
import { useStore } from "@/app/store";
import MobileBottomBar from "./MobileBottomBar";
import Sidebar from "./Sidebar";
import StoreHydration from "./StoreHydration";

export default function HomeClientShell() {
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
      {editPin ? (
        <PinModal
          mode="edit"
          initialData={editPin}
          onClose={() => setEditPinId(null)}
        />
      ) : null}
    </>
  );
}

