"use client";

import { useState, useCallback, useEffect } from "react";
import { hasTutorialBeenSeen, markTutorialSeen } from "../model/tutorial.model";

interface TutorialSlide {
  title: string;
  description: string;
  accent: string;
}

const SLIDES: TutorialSlide[] = [
  {
    title: "Drop Pins on Job Sites",
    description:
      "Tap the + button on the map, then click anywhere to drop a pin. Track site names, contacts, statuses, notes, and follow-up dates — all in one place.",
    accent: "#3B82F6",
  },
  {
    title: "Plan Your Day",
    description:
      "Switch to the Planner tab to build today's stop list. Add pins to your plan, choose your starting point, then hit Route It for turn-by-turn directions.",
    accent: "#F59E0B",
  },
  {
    title: "Discover New Businesses",
    description:
      "Click the magnifying glass + button on the map to open Discover. Draw a rectangle and Groundwork will find contractors, electricians, and more using Google Places.",
    accent: "#D4712A",
  },
  {
    title: "Build & Navigate Routes",
    description:
      "Add stops to your route, then hit Get Directions for an optimized multi-stop route. Export to Google Maps for turn-by-turn navigation.",
    accent: "#22C55E",
  },
  {
    title: "Set Up Your Profile",
    description:
      "Tap your avatar in the sidebar to set your name, territory, and home base address. Your home base auto-fills as the start/end point for all routes.",
    accent: "#8B5CF6",
  },
];

const SLIDE_ICONS: React.ReactNode[] = [
  // Pin
  <svg key="pin" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>,
  // Planner
  <svg key="planner" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>,
  // Discover
  <svg key="discover" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>,
  // Navigate
  <svg key="navigate" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <polygon points="3 11 22 2 13 21 11 13 3 11" />
  </svg>,
  // Profile
  <svg key="profile" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>,
];

interface TutorialOverlayProps {
  forceOpen?: boolean;
  onClose?: () => void;
}

export default function TutorialOverlay({ forceOpen = false, onClose }: TutorialOverlayProps) {
  const [visible, setVisible] = useState(false);
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    if (forceOpen) {
      setSlide(0);
      setVisible(true);
      return;
    }
    if (!hasTutorialBeenSeen()) {
      setVisible(true);
    }
  }, [forceOpen]);

  const close = useCallback(() => {
    markTutorialSeen();
    setVisible(false);
    onClose?.();
  }, [onClose]);

  const next = useCallback(() => {
    if (slide < SLIDES.length - 1) setSlide((s) => s + 1);
    else close();
  }, [slide, close]);

  const prev = useCallback(() => {
    if (slide > 0) setSlide((s) => s - 1);
  }, [slide]);

  if (!visible) return null;

  const current = SLIDES[slide];
  const isFirst = slide === 0;
  const isLast = slide === SLIDES.length - 1;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-bg-card shadow-gw-lg">
        {/* Header with icon */}
        <div
          className="flex flex-col items-center gap-3 px-8 pb-6 pt-10"
          style={{ background: `linear-gradient(135deg, ${current.accent}22, ${current.accent}08)` }}
        >
          <div style={{ color: current.accent }}>{SLIDE_ICONS[slide]}</div>
          <h2 className="text-xl font-bold tracking-tight text-text-primary">{current.title}</h2>
        </div>

        {/* Description */}
        <div className="px-8 py-5">
          <p className="text-sm leading-relaxed text-text-secondary">{current.description}</p>
        </div>

        {/* Footer: dots + nav */}
        <div className="flex items-center justify-between px-8 pb-6">
          <div className="flex gap-1.5">
            {SLIDES.map((_, i) => (
              <div
                key={i}
                className="h-2 rounded-full transition-all duration-300"
                style={{
                  width: i === slide ? 20 : 8,
                  backgroundColor: i === slide ? current.accent : "var(--border)",
                }}
              />
            ))}
          </div>
          <div className="flex gap-2">
            {isFirst ? (
              <button
                onClick={close}
                className="rounded-lg px-4 py-2 text-xs font-semibold text-text-muted transition-colors hover:text-text-primary"
              >
                Skip Tour
              </button>
            ) : (
              <button
                onClick={prev}
                className="rounded-lg px-4 py-2 text-xs font-semibold text-text-muted transition-colors hover:text-text-primary"
              >
                Back
              </button>
            )}
            <button
              onClick={next}
              className="rounded-lg px-5 py-2 text-xs font-bold text-white transition-colors"
              style={{ backgroundColor: current.accent }}
            >
              {isLast ? "Get Started" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
