"use client";

import { Check, CircleAlert, CircleHelp, Crown, Users } from "lucide-react";
import type { ReactNode } from "react";

import { useAppMessages } from "@/components/i18n/app-i18n-provider";
import { OverlayModalShell } from "@/components/settings/overlay-modal-shell";

type AlertModalProps = {
  open: boolean;
  message: string;
  onClose: () => void;
};

type SuccessModalProps = {
  open: boolean;
  title: string;
  message: string;
  onClose: () => void;
};

type ConfirmModalProps = {
  open: boolean;
  title: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
  confirmLabel?: string;
};

type PremiumModalProps = {
  open: boolean;
  onClose: () => void;
  onActivate: (interval: "monthly" | "yearly") => boolean | Promise<boolean>;
  message?: string;
};

export function AlertModal({ open, message, onClose }: AlertModalProps) {
  const messages = useAppMessages();

  return (
    <OverlayModalShell
      open={open}
      onClose={onClose}
      overlayClassName="z-[9998]"
      panelClassName="w-full max-w-sm rounded-3xl border border-white/10 p-8 text-center shadow-2xl"
      showCloseButton={false}
    >
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#ec4899]/20 text-[#ec4899]">
        <CircleAlert className="h-7 w-7" />
      </div>
      <p className="mb-6 text-sm text-white/80">{message}</p>
      <button
        type="button"
        onClick={onClose}
        className="w-full rounded-xl bg-white/10 py-3 font-bold transition hover:bg-white/20"
      >
        {messages.common.ok}
      </button>
    </OverlayModalShell>
  );
}

export function SuccessModal({
  open,
  title,
  message,
  onClose,
}: SuccessModalProps) {
  const messages = useAppMessages();

  return (
    <OverlayModalShell
      open={open}
      onClose={onClose}
      overlayClassName="z-[130]"
      panelClassName="w-full max-w-sm rounded-3xl border border-emerald-500/30 p-8 text-center shadow-2xl"
    >
      <div className="mx-auto mb-6 flex h-20 w-20 animate-bounce items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
        <Check className="h-10 w-10" />
      </div>
      <h3 className="mb-2 text-2xl font-bold text-emerald-400">{title}</h3>
      <p className="mb-6 text-sm text-white/70">{message}</p>
      <button
        type="button"
        onClick={onClose}
        className="w-full rounded-xl bg-white/10 py-3 font-bold transition hover:bg-white/20"
      >
        {messages.common.ok}
      </button>
    </OverlayModalShell>
  );
}

export function ConfirmModal({
  open,
  title,
  message,
  onCancel,
  onConfirm,
  confirmLabel,
}: ConfirmModalProps) {
  const messages = useAppMessages();

  return (
    <OverlayModalShell
      open={open}
      onClose={onCancel}
      overlayClassName="z-[9999] bg-black/95"
      panelClassName="w-full max-w-sm rounded-3xl border border-white/10 p-8 text-center shadow-2xl"
      showCloseButton={false}
    >
      <h3 className="mb-2 text-xl font-bold">{title}</h3>
      <p className="mb-6 text-sm text-white/60">{message}</p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-xl bg-white/10 py-3 font-bold"
        >
          {messages.common.no}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="flex-1 rounded-xl bg-red-500 py-3 font-bold text-white"
        >
          {confirmLabel ?? messages.common.yes}
        </button>
      </div>
    </OverlayModalShell>
  );
}

export function PremiumModal({
  open,
  onClose,
  onActivate,
  message,
}: PremiumModalProps) {
  const messages = useAppMessages();

  return (
    <OverlayModalShell
      open={open}
      onClose={onClose}
      overlayClassName="z-[120] bg-black/95"
      panelClassName="flex max-h-[90vh] w-full max-w-md flex-col overflow-y-auto rounded-3xl border border-amber-300/30 p-6 shadow-[0_0_20px_rgba(251,191,36,0.35)]"
    >
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex h-16 w-16 animate-bounce items-center justify-center rounded-full bg-[linear-gradient(90deg,#f59e0b,#fbbf24,#f59e0b)] text-white shadow-[0_0_20px_rgba(251,191,36,0.4)]">
          <Crown className="h-7 w-7" />
        </div>
        <h2 className="premium-text text-2xl font-bold">{messages.feedback.premiumTitle}</h2>
        <p className="mt-1 text-sm text-white/60">{message ?? messages.feedback.premiumMessage}</p>
      </div>
      <div className="mb-6 space-y-3">
        <FeatureRow icon={<Users className="h-4 w-4" />} label={messages.feedback.unlimitedProfiles} />
        <FeatureRow icon={<CircleHelp className="h-4 w-4" />} label={messages.feedback.unlimitedTasks} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <PlanButton
          title={messages.feedback.monthly}
          price={messages.settings.monthlyPrice}
          onClick={() => onActivate("monthly")}
        />
        <PlanButton
          title={messages.feedback.yearly}
          price={messages.settings.yearlyPrice}
          featured
          featuredLabel={messages.feedback.best}
          onClick={() => onActivate("yearly")}
        />
      </div>
    </OverlayModalShell>
  );
}

function FeatureRow({
  icon,
  label,
}: {
  icon: ReactNode;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/20 text-green-400">
        {icon}
      </div>
      <span className="text-sm font-bold text-white">{label}</span>
    </div>
  );
}

function PlanButton({
  title,
  price,
  featured = false,
  featuredLabel,
  onClick,
}: {
  title: string;
  price: string;
  featured?: boolean;
  featuredLabel?: string;
  onClick: () => boolean | Promise<boolean>;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        featured
          ? "relative rounded-2xl border-2 border-amber-300/50 bg-amber-300/10 p-4 text-center shadow-lg transition hover:scale-[1.02]"
          : "rounded-2xl border border-white/10 bg-white/5 p-4 text-center transition hover:border-[#ec4899] hover:bg-white/10"
      }
    >
      {featured ? (
        <div className="absolute right-0 top-[-8px] rounded-full bg-amber-300 px-2 py-0.5 text-[8px] font-bold uppercase text-black">
          {featuredLabel ?? "Best"}
        </div>
      ) : null}
      <span className={`mb-1 block text-xs uppercase tracking-[0.2em] ${featured ? "text-amber-300" : "text-white/50"}`}>
        {title}
      </span>
      <span className="block text-xl font-bold text-white">{price}</span>
    </button>
  );
}
