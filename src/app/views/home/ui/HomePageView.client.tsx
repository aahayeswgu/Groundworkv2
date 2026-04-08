"use client";

import { useState, useCallback, useEffect } from "react";
import { APIProvider } from "@vis.gl/react-google-maps";
import Sidebar from "@/app/widgets/sidebar/ui/Sidebar";
import Map from "@/app/features/map/ui/Map";
import { GOOGLE_MAPS_API_VERSION } from "@/app/features/map/model/map.constants";
import StoreHydration from "@/app/shared/ui/StoreHydration";
import GpsCheckin from "@/app/features/planner/ui/GpsCheckin";
import PlannerCompletionConfetti from "@/app/features/planner/ui/PlannerCompletionConfetti";
import AuthListener from "@/app/features/auth/ui/AuthListener";
import EmailOverlay from "@/app/features/email/ui/EmailOverlay";
import PinModal from "@/app/features/pins/ui/PinModal";
import TutorialOverlay from "@/app/features/tutorial/ui/TutorialOverlay";
import { useStore } from "@/app/store";
import MobileBottomBar from "@/app/widgets/mobile-navigation/ui/MobileBottomBar";
import {
  OPEN_MOBILE_TAB_EVENT,
  type MobileSidebarTab,
  type OpenMobileTabEventDetail,
} from "@/app/shared/model/mobile-events";
import type { MobilePrimaryTab } from "@/app/widgets/mobile-navigation/model/mobile-navigation.model";
import type { SidebarTab } from "@/app/widgets/sidebar/model/sidebar.model";

export default function HomePageView() {
  const [editPinId, setEditPinId] = useState<string | null>(null);
  const [emailOpen, setEmailOpen] = useState(false);
  const [mobileActiveView, setMobileActiveView] = useState<MobileSidebarTab>("map");
  const [mobileActiveTab, setMobileActiveTab] = useState<MobilePrimaryTab>("map");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const pins = useStore((s) => s.pins);

  const handleOpenEmail = useCallback(() => {
    setEmailOpen(true);
  }, []);

  const openEditModal = useCallback((pinId: string) => {
    setEditPinId(pinId);
  }, []);

  const closeMobileSidebar = useCallback(() => {
    setSettingsOpen(false);
    setMobileActiveView("map");
    setMobileActiveTab("map");
  }, []);

  const getPrimaryTabForView = useCallback((view: MobileSidebarTab): MobilePrimaryTab => {
    if (view === "map") return "map";
    if (view === "discover") return "discover";
    if (view === "planner" || view === "route") return "planner";
    return "pins";
  }, []);

  const openMobileSidebarTab = useCallback((tab: SidebarTab) => {
    setSettingsOpen(false);
    setMobileActiveView(tab);
    setMobileActiveTab(getPrimaryTabForView(tab));
  }, [getPrimaryTabForView]);

  const handleMobileTabSelect = useCallback(
    (tab: MobilePrimaryTab) => {
      setSettingsOpen(false);
      if (tab === "map") {
        closeMobileSidebar();
        return;
      }
      setMobileActiveView(tab);
      setMobileActiveTab(tab);
    },
    [closeMobileSidebar],
  );

  const handleOpenSettings = useCallback(() => {
    setMobileActiveView("pins");
    setMobileActiveTab("pins");
    setSettingsOpen(true);
  }, []);

  useEffect(() => {
    const handleOpenMobileTab = (event: Event) => {
      const detail = (event as CustomEvent<OpenMobileTabEventDetail>).detail;
      if (!detail) return;
      const isMobileViewport = window.matchMedia("(max-width: 1024px)").matches;
      if (!isMobileViewport) return;
      if (detail.tab === "map") {
        closeMobileSidebar();
        return;
      }
      setSettingsOpen(false);
      setMobileActiveView(detail.tab);
      setMobileActiveTab(getPrimaryTabForView(detail.tab));
    };

    window.addEventListener(OPEN_MOBILE_TAB_EVENT, handleOpenMobileTab);
    return () => window.removeEventListener(OPEN_MOBILE_TAB_EVENT, handleOpenMobileTab);
  }, [closeMobileSidebar, getPrimaryTabForView]);

  const editPin = editPinId ? (pins.find((p) => p.id === editPinId) ?? null) : null;

  return (
    <APIProvider
      apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}
      version={GOOGLE_MAPS_API_VERSION}
      libraries={["places", "geometry", "marker", "routes", "geocoding"]}
    >
      <StoreHydration />
      <GpsCheckin />
      <PlannerCompletionConfetti />
      <AuthListener />
      <div className="flex h-[var(--mobile-viewport-height)] w-screen">
        <Sidebar
          onEditPin={openEditModal}
          mobileOpen={mobileActiveView !== "map"}
          mobileTab={mobileActiveView === "map" ? "pins" : mobileActiveView}
          onMobileTabChange={openMobileSidebarTab}
          onMobileClose={closeMobileSidebar}
          onOpenEmail={handleOpenEmail}
          settingsOpen={settingsOpen}
          onSettingsOpen={() => setSettingsOpen(true)}
          onSettingsClose={() => setSettingsOpen(false)}
          onReplayTutorial={() => setTutorialOpen(true)}
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
      <TutorialOverlay
        forceOpen={tutorialOpen}
        onClose={() => setTutorialOpen(false)}
      />
    </APIProvider>
  );
}
