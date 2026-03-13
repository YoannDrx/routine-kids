"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type FullScreenSheetProps = {
  open: boolean;
  children: ReactNode;
  className?: string;
};

export function FullScreenSheet({
  open,
  children,
  className,
}: FullScreenSheetProps) {
  return (
    <div className={cn("full-view flex flex-col", open && "active", className)}>
      {children}
    </div>
  );
}
