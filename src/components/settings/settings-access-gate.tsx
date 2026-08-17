"use client";

import { useRouter } from "next/navigation";

import { ParentalGateModal } from "@/components/board/parental-gate-modal";

export function SettingsAccessGate({
  pinConfigured,
}: {
  pinConfigured: boolean;
}) {
  const router = useRouter();

  return (
    <main className="min-h-[100dvh] bg-[var(--surface-page)]">
      <ParentalGateModal
        open
        pinConfigured={pinConfigured}
        onClose={() => router.replace("/")}
        onSuccess={() => router.refresh()}
      />
    </main>
  );
}
