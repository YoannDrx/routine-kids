"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type FullScreenSheetProps = {
  open: boolean;
  children: ReactNode;
  className?: string;
  onClose?: () => void;
  ariaLabel?: string;
};

export function FullScreenSheet({
  open,
  children,
  className,
  onClose,
  ariaLabel = "RoutineKids",
}: FullScreenSheetProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      aria-hidden={!open}
      onKeyDown={(event) => {
        if (event.key === "Escape" && onClose) {
          event.preventDefault();
          onClose();
        }
      }}
      className={cn("full-view flex flex-col", open && "active", className)}
    >
      {children}
    </div>
  );
}
