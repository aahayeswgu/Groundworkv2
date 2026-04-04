"use client";

import { useState, useCallback, useEffect } from "react";
import Sidebar from "@/app/widgets/sidebar/ui/Sidebar";
import Map from "@/app/features/map/ui/Map";
import StoreHydration from "@/app/shared/ui/StoreHydration";
import GpsCheckin from "@/app/features/planner/GpsCheckin";
import AuthListener from "@/app/features/auth/AuthListener";
import EmailOverlay from "@/app/features/email/EmailOverlay";
import PinModal from "@/app/features/pins/ui/PinModal";
import { useStore } from "@/app/store";
import MobileBottomBar from "@/app/widgets/mobile-navigation/ui/MobileBottomBar";
import {
  OPEN_MOBILE_TAB_EVENT,
  type OpenMobileTabEventDetail,
} from "@/app/shared/model/mobile-events";
import type { MobilePrimaryTab } from "@/app/widgets/mobile-navigation/model/mobile-navigation.model";
import type { SidebarTab } from "@/app/widgets/sidebar/model/sidebar.model";

export default function HomePageView() {
  const [editPinId, setEditPinId] = useState<string | null>(null);
  const [emailOpen, setEmailOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [mobileSidebarTab, setMobileSidebarTab] = useState<SidebarTab>("pins");
  const [mobileActiveTab, setMobileActiveTab] = useState<MobilePrimaryTab>("map");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const pins = useStore((s) => s.pins);

  const handleOpenEmail = useCallback(() => {
    setEmailOpen(true);
  }, []);

  const openEditModal = useCallback((pinId: string) => {
    setEditPinId(pinId);
  }, []);

  const closeMobileSidebar = useCallback(() => {
    setMobileSidebarOpen(false);
    setMobileActiveTab("map");
  }, []);

  const openMobileSidebarTab = useCallback((tab: SidebarTab) => {
    setMobileSidebarTab(tab);
    const nextPrimaryTab: MobilePrimaryTab = tab === "planner" ? "planner" : "pins";
    setMobileActiveTab(nextPrimaryTab);
    setMobileSidebarOpen(true);
  }, []);

  const handleMobileTabSelect = useCallback(
    (tab: MobilePrimaryTab) => {
      if (tab === "map") {
        closeMobileSidebar();
        return;
      }
      openMobileSidebarTab(tab);
    },
    [closeMobileSidebar, openMobileSidebarTab],
  );

  const handleOpenSettings = useCallback(() => {
    openMobileSidebarTab("pins");
    setSettingsOpen(true);
  }, [openMobileSidebarTab]);

  useEffect(() => {
    const handleOpenMobileTab = (event: Event) => {
      const detail = (event as CustomEvent<OpenMobileTabEventDetail>).detail;
      if (!detail) return;
      if (detail.tab === "map") {
        closeMobileSidebar();
        return;
      }
      openMobileSidebarTab(detail.tab);
    };

    window.addEventListener(OPEN_MOBILE_TAB_EVENT, handleOpenMobileTab);
    return () => window.removeEventListener(OPEN_MOBILE_TAB_EVENT, handleOpenMobileTab);
  }, [closeMobileSidebar, openMobileSidebarTab]);

  const editPin = editPinId ? (pins.find((p) => p.id === editPinId) ?? null) : null;

  return (
    <>
      <StoreHydration />
      <GpsCheckin />
      <AuthListener />
      <div className="flex h-[var(--mobile-viewport-height)] w-screen">
        <Sidebar
          onEditPin={openEditModal}
          mobileOpen={mobileSidebarOpen}
          mobileTab={mobileSidebarTab}
          onMobileTabChange={openMobileSidebarTab}
          onMobileClose={closeMobileSidebar}
          onOpenEmail={handleOpenEmail}
          settingsOpen={settingsOpen}
          onSettingsOpen={() => setSettingsOpen(true)}
          onSettingsClose={() => setSettingsOpen(false)}
        />
        <Map onEditPin={openEditModal} />
      </div>
      <MobileBottomBar
        activeTab={mobileActiveTab}
        onSelectTab={handleMobileTabSelect}
        onOpenSettings={handleOpenSettings}
        onOpenEmail={handleOpenEmail}
      />
      {emailOpen && <EmailOverlay onClose={() => setEmailOpen(false)} />}
      {editPin && <PinModal mode="edit" initialData={editPin} onClose={() => setEditPinId(null)} />}
    </>
  );
}
