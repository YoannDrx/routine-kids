"use client";

import { X } from "lucide-react";
import { useEffect, useRef, type KeyboardEvent, type ReactNode } from "react";

import { cn } from "@/lib/utils";
import { useAppMessages } from "@/components/i18n/app-i18n-provider";

type OverlayModalShellProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  overlayClassName?: string;
  panelClassName?: string;
  showCloseButton?: boolean;
  ariaLabel?: string;
};

export function OverlayModalShell({
  open,
  onClose,
  children,
  overlayClassName,
  panelClassName,
  showCloseButton = true,
  ariaLabel = "RoutineKids",
}: OverlayModalShellProps) {
  const messages = useAppMessages();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [open]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }

    if (event.key !== "Tab") return;

    const focusable = panelRef.current?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    if (!focusable?.length) {
      event.preventDefault();
      panelRef.current?.focus();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

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
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className={cn("glass-panel relative outline-none", panelClassName)}
      >
        {showCloseButton ? (
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/55 transition hover:bg-white/20 hover:text-white"
            aria-label={messages.common.close}
          >
            <X className="h-5 w-5" />
          </button>
        ) : null}

        {children}
      </div>
    </div>
  );
}
