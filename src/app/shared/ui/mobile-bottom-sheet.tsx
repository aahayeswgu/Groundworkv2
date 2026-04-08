"use client";

import type { CSSProperties, ReactNode, RefObject } from "react";
import { Sheet, type SheetRef } from "react-modal-sheet";
import { cn } from "@/app/shared/lib/utils";

interface MobileBottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  className?: string;
  containerClassName?: string;
  headerClassName?: string;
  fullHeight?: boolean;
  detent?: "default" | "content" | "full";
  inset?: boolean;
  disableContentDrag?: boolean;
  snapPoints?: number[];
  initialSnap?: number;
  onSnap?: (index: number) => void;
  sheetRef?: RefObject<SheetRef | null>;
}

export function MobileBottomSheet({
  open,
  onOpenChange,
  children,
  className,
  containerClassName,
  headerClassName,
  fullHeight = false,
  detent = "default",
  inset = false,
  disableContentDrag = false,
  snapPoints,
  initialSnap,
  onSnap,
  sheetRef,
}: MobileBottomSheetProps) {
  const containerStyle: CSSProperties = {
    bottom: "var(--mobile-bottom-bar-offset)",
    maxHeight: "var(--mobile-sheet-max-height)",
    width: inset ? "auto" : "100%",
    left: inset ? "0.5rem" : 0,
    right: inset ? "0.5rem" : 0,
  };

  if (fullHeight) {
    containerStyle.height = "var(--mobile-sheet-max-height)";
  }

  return (
    <Sheet
      ref={sheetRef}
      isOpen={open}
      onClose={() => onOpenChange(false)}
      unstyled
      disableScrollLocking
      detent={detent}
      snapPoints={snapPoints}
      initialSnap={initialSnap}
      onSnap={onSnap}
      className="z-50"
    >
      <Sheet.Container
        className={cn(
          "overflow-hidden border border-border border-b-0 bg-bg-secondary shadow-gw",
          inset ? "rounded-2xl" : "rounded-t-2xl",
          containerClassName,
        )}
        style={containerStyle}
      >
        <Sheet.Header className={cn("border-b border-border bg-bg-card", headerClassName)}>
          <div className="flex items-center justify-center py-2">
            <span className="h-1.5 w-12 rounded-full bg-border" />
          </div>
        </Sheet.Header>
        <Sheet.Content
          disableScroll
          disableDrag={disableContentDrag}
          className={cn("min-h-0", className)}
          scrollClassName="min-h-0"
        >
          {children}
        </Sheet.Content>
      </Sheet.Container>
      <Sheet.Backdrop
        className="bg-black/10"
        style={{ bottom: "var(--mobile-bottom-bar-offset)" }}
        onTap={() => onOpenChange(false)}
      />
    </Sheet>
  );
}
