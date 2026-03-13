"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type OverlayModalShellProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  overlayClassName?: string;
  panelClassName?: string;
  showCloseButton?: boolean;
};

export function OverlayModalShell({
  open,
  onClose,
  children,
  overlayClassName,
  panelClassName,
  showCloseButton = true,
}: OverlayModalShellProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed inset-0 z-[120] flex items-center justify-center p-6",
        "bg-black/90 backdrop-blur-sm",
        overlayClassName,
      )}
    >
      <div className={cn("glass-panel relative", panelClassName)}>
        {showCloseButton ? (
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/55 transition hover:bg-white/20 hover:text-white"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        ) : null}

        {children}
      </div>
    </div>
  );
}
