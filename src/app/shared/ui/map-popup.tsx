"use client";

import { AdvancedMarker, AdvancedMarkerAnchorPoint } from "@vis.gl/react-google-maps";
import type { SyntheticEvent } from "react";
import { cn } from "@/app/shared/lib/utils";

interface MapPopupProps {
  position: google.maps.LatLngLiteral;
  children: React.ReactNode;
  zIndex?: number;
  className?: string;
}

export function MapPopup({ position, children, zIndex = 2000, className }: MapPopupProps) {
  const stopMapGesture = (event: SyntheticEvent) => {
    event.stopPropagation();
  };

  return (
    <AdvancedMarker
      position={position}
      zIndex={zIndex}
      clickable
      anchorPoint={AdvancedMarkerAnchorPoint.BOTTOM}
      onClick={(event) => {
        event.domEvent?.stopPropagation();
      }}
    >
      <div className={cn("pointer-events-none relative -translate-y-4", className)}>
        <div
          className="pointer-events-auto touch-pan-y"
          onWheelCapture={stopMapGesture}
          onTouchMoveCapture={stopMapGesture}
        >
          {children}
        </div>
        <div className="pointer-events-none absolute -bottom-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 border-r border-b border-border bg-bg-card shadow-gw" />
      </div>
    </AdvancedMarker>
  );
}
