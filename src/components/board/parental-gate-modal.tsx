"use client";

import { Shield } from "lucide-react";
import { useState, useTransition } from "react";

import { validateParentPinAction } from "@/app/security-actions";
import { useAppMessages } from "@/components/i18n/app-i18n-provider";
import { OverlayModalShell } from "@/components/settings/overlay-modal-shell";

type ParentalGateModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  pinConfigured: boolean;
};

export function ParentalGateModal({
  open,
  onClose,
  onSuccess,
  pinConfigured,
}: ParentalGateModalProps) {
  const messages = useAppMessages();
  const [credential, setCredential] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <OverlayModalShell
      open={open}
      onClose={onClose}
      panelClassName="w-full max-w-sm rounded-3xl border border-white/10 bg-[rgba(255,255,255,0.1)] p-8 text-center shadow-2xl"
    >
      <Shield className="mx-auto mb-4 h-10 w-10 text-pink-300" />
      <h3 className="mb-2 text-xl font-bold">{messages.gate.title}</h3>
      <p className="mb-6 text-sm text-white/60">
        {pinConfigured
          ? messages.gate.description
          : messages.gate.accountPasswordDescription}
      </p>
      <label htmlFor="parent-gate-credential" className="mb-2 block text-left text-sm font-semibold text-white/75">
        {pinConfigured
          ? messages.gate.pinLabel
          : messages.gate.accountPasswordLabel}
      </label>
      <input
        id="parent-gate-credential"
        type="password"
        value={credential}
        onChange={(event) => {
          setCredential(
            pinConfigured
              ? event.target.value.replace(/\D/g, "").slice(0, 4)
              : event.target.value,
          );
          setError(null);
        }}
        inputMode={pinConfigured ? "numeric" : "text"}
        pattern={pinConfigured ? "[0-9]*" : undefined}
        autoComplete="off"
        autoFocus
        placeholder={
          pinConfigured
            ? messages.gate.pinPlaceholder
            : messages.gate.accountPasswordPlaceholder
        }
        className="mb-4 w-full rounded-xl border border-white/10 bg-[#120d2b] p-4 text-center text-xl font-bold outline-none focus:ring-2 focus:ring-pink-300"
      />
      {error ? <p className="mb-4 text-sm text-rose-200">{error}</p> : null}
      <button
        type="button"
        disabled={pending || credential.length === 0}
        onClick={() => {
          startTransition(async () => {
            const result = await validateParentPinAction({ credential });

            if (result.status === "error") {
              setError(result.message || messages.gate.genericError);
              return;
            }

            onSuccess();
          });
        }}
        className="w-full rounded-xl bg-[linear-gradient(90deg,#ec4899,#f97316)] py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? messages.gate.verifying : messages.gate.verify}
      </button>
    </OverlayModalShell>
  );
}
