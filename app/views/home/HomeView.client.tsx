"use client";

import { useCallback, useState } from "react";
import Map, { type PendingPinDraft } from "@/app/features/map/Map";
import PinModal from "@/app/features/pins/PinModal";
import { useStore } from "@/app/shared/store";
import StoreHydration from "@/app/shared/store/StoreHydration";
import MobileBottomBar from "@/app/widgets/mobile-bottom-bar/MobileBottomBar";
import Sidebar from "@/app/widgets/sidebar/Sidebar";

export default function HomeViewClient() {
  const [editPinId, setEditPinId] = useState<string | null>(null);
  const [pendingCreatePin, setPendingCreatePin] = useState<PendingPinDraft | null>(null);
  const pins = useStore((s) => s.pins);

  const openEditModal = useCallback((pinId: string) => {
    setEditPinId(pinId);
  }, []);

  const openCreateModal = useCallback((draft: PendingPinDraft) => {
    setPendingCreatePin(draft);
  }, []);

  const editPin = editPinId ? (pins.find((p) => p.id === editPinId) ?? null) : null;

  return (
    <>
      <StoreHydration />
      <div className="flex h-screen w-screen">
        <Sidebar onEditPin={openEditModal} />
        <Map onEditPin={openEditModal} onCreatePin={openCreateModal} />
      </div>
      <MobileBottomBar />
      {editPin ? (
        <PinModal
          mode="edit"
          initialData={editPin}
          onClose={() => setEditPinId(null)}
        />
      ) : null}
      {pendingCreatePin ? (
        <PinModal
          mode="create"
          initialData={{
            lat: pendingCreatePin.lat,
            lng: pendingCreatePin.lng,
            address: pendingCreatePin.address,
          }}
          onClose={() => setPendingCreatePin(null)}
        />
      ) : null}
    </>
  );
}
