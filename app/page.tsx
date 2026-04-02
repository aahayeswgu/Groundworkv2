"use client";

import { useState, useCallback, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Map from "./features/map/ui/Map";
import MobileBottomBar from "./components/MobileBottomBar";
import StoreHydration from "./components/StoreHydration";
import GpsCheckin from "./features/planner/GpsCheckin";
import AuthListener from "./features/auth/AuthListener";
import EmailOverlay from "./features/email/EmailOverlay";
import PinModal from "./features/pins/ui/PinModal";
import { useStore } from "@/app/store";

export default function Home() {
  const [editPinId, setEditPinId] = useState<string | null>(null);
  const [emailOpen, setEmailOpen] = useState(false);
  const pins = useStore((s) => s.pins);

  useEffect(() => {
    function handleOpenEmail() { setEmailOpen(true); }
    window.addEventListener("gw-open-email", handleOpenEmail);
    return () => window.removeEventListener("gw-open-email", handleOpenEmail);
  }, []);

  const openEditModal = useCallback((pinId: string) => {
    setEditPinId(pinId);
  }, []);

  const editPin = editPinId ? (pins.find((p) => p.id === editPinId) ?? null) : null;

  return (
    <>
      <StoreHydration />
      <GpsCheckin />
      <AuthListener />
      <div className="flex h-screen w-screen">
        <Sidebar onEditPin={openEditModal} />
        <Map onEditPin={openEditModal} />
      </div>
      <MobileBottomBar />
      {emailOpen && <EmailOverlay onClose={() => setEmailOpen(false)} />}
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
