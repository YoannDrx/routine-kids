"use client";

import { Shield } from "lucide-react";
import { useMemo, useState } from "react";

import { useAppMessages } from "@/components/i18n/app-i18n-provider";
import { OverlayModalShell } from "@/components/settings/overlay-modal-shell";

type ParentalGateModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

function createMathChallenge() {
  return {
    left: Math.floor(Math.random() * 12) + 2,
    right: Math.floor(Math.random() * 12) + 1,
  };
}

export function ParentalGateModal({
  open,
  onClose,
  onSuccess,
}: ParentalGateModalProps) {
  const messages = useAppMessages();
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [challenge] = useState(createMathChallenge);

  const expectedAnswer = useMemo(
    () => challenge.left + challenge.right,
    [challenge.left, challenge.right],
  );

  return (
    <OverlayModalShell
      open={open}
      onClose={onClose}
      panelClassName="w-full max-w-sm rounded-3xl border border-white/10 bg-[rgba(255,255,255,0.1)] p-8 text-center shadow-2xl"
    >
      <Shield className="mx-auto mb-4 h-10 w-10 text-pink-300" />
      <h3 className="mb-2 text-xl font-bold">{messages.gate.title}</h3>
      <p className="mb-6 text-sm text-white/50">
        {messages.gate.questionPrefix}{" "}
        <span className="font-bold text-white">
          {challenge.left} + {challenge.right}
        </span>{" "}
        ?
      </p>
      <input
        type="text"
        value={answer}
        onChange={(event) => {
          setAnswer(event.target.value.replace(/\D/g, ""));
          setError(null);
        }}
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="off"
        placeholder={messages.gate.answerPlaceholder}
        className="mb-4 w-full rounded-xl border border-white/10 bg-[#120d2b] p-4 text-center text-xl font-bold outline-none focus:ring-2 focus:ring-pink-300"
      />
      {error ? <p className="mb-4 text-sm text-rose-200">{error}</p> : null}
      <button
        type="button"
        onClick={() => {
          if (Number(answer) !== expectedAnswer) {
            setError(messages.gate.wrongAnswer);
            return;
          }

          onSuccess();
        }}
        className="w-full rounded-xl bg-[linear-gradient(90deg,#ec4899,#f97316)] py-3 font-bold text-white"
      >
        {messages.gate.verify}
      </button>
    </OverlayModalShell>
  );
}
