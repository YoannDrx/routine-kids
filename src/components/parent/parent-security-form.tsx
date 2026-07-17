"use client";

import { useActionState } from "react";

import { useAppMessages } from "@/components/i18n/app-i18n-provider";
import {
  type UpdateParentSecurityState,
  updateParentSecurityInitialState,
} from "@/components/parent/parent-security-form-state";

type ParentSecurityFormProps = {
  action: (
    state: UpdateParentSecurityState,
    formData: FormData,
  ) => Promise<UpdateParentSecurityState>;
  pinConfigured: boolean;
  defaultStepUpMinutes: number;
};

export function ParentSecurityForm({
  action,
  pinConfigured,
  defaultStepUpMinutes,
}: ParentSecurityFormProps) {
  const messages = useAppMessages();
  const [state, formAction, isPending] = useActionState(
    action,
    updateParentSecurityInitialState,
  );

  return (
    <form action={formAction} className="rounded-[28px] border border-white/10 bg-black/15 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
            {messages.forms.parentSecurity}
          </p>
          <h3 className="mt-1 font-display text-2xl text-white">
            {messages.forms.parentPinTitle}
          </h3>
        </div>
        <span
          className={`rounded-full border px-3 py-1 text-xs font-semibold ${
            pinConfigured
              ? "border-emerald-300/20 bg-emerald-500/10 text-emerald-100"
              : "border-amber-300/20 bg-amber-500/10 text-amber-100"
          }`}
        >
          {pinConfigured ? messages.forms.pinActive : messages.forms.pinSetup}
        </span>
      </div>

      <p className="mt-4 text-sm leading-7 text-white/68">
        {pinConfigured
          ? messages.forms.pinActiveDescription
          : messages.forms.pinMissingDescription}
      </p>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {pinConfigured ? (
          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-white/80">
              {messages.forms.currentPin}
            </span>
            <input
            name="currentPin"
            type="password"
            inputMode="numeric"
            autoComplete="off"
            maxLength={4}
            placeholder={messages.forms.pinPlaceholder}
            className="h-12 rounded-2xl border border-white/10 bg-white/6 px-4 text-white outline-none transition focus:border-[#69d6ff]"
          />
            {state.fieldErrors?.currentPin ? (
              <span className="text-sm text-rose-200">
                {state.fieldErrors.currentPin}
              </span>
            ) : null}
          </label>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-4 text-sm text-white/60">
            {messages.forms.noPinActive}
          </div>
        )}

        <label className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-white/80">
            {messages.forms.trustDuration}
          </span>
          <select
            name="stepUpMinutes"
            defaultValue={String(defaultStepUpMinutes)}
            className="h-12 rounded-2xl border border-white/10 bg-white/6 px-4 text-white outline-none transition focus:border-[#8cf26b]"
          >
            <option value="10" className="bg-[#101223]">
              {messages.forms.tenMinutes}
            </option>
            <option value="15" className="bg-[#101223]">
              {messages.forms.fifteenMinutes}
            </option>
            <option value="30" className="bg-[#101223]">
              {messages.forms.thirtyMinutes}
            </option>
            <option value="60" className="bg-[#101223]">
              {messages.forms.sixtyMinutes}
            </option>
          </select>
          {state.fieldErrors?.stepUpMinutes ? (
            <span className="text-sm text-rose-200">
              {state.fieldErrors.stepUpMinutes}
            </span>
          ) : null}
        </label>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-white/80">
            {pinConfigured ? messages.forms.newPin : messages.forms.parentPin}
          </span>
          <input
            required={!pinConfigured}
            name="newPin"
            type="password"
            inputMode="numeric"
            autoComplete="off"
            maxLength={4}
            placeholder={messages.forms.pinPlaceholder}
            className="h-12 rounded-2xl border border-white/10 bg-white/6 px-4 text-white outline-none transition focus:border-[#ff6fb5]"
          />
          {state.fieldErrors?.newPin ? (
            <span className="text-sm text-rose-200">{state.fieldErrors.newPin}</span>
          ) : null}
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-white/80">
            {messages.forms.confirmation}
          </span>
          <input
            required={!pinConfigured}
            name="confirmPin"
            type="password"
            inputMode="numeric"
            autoComplete="off"
            maxLength={4}
            placeholder={messages.forms.pinPlaceholder}
            className="h-12 rounded-2xl border border-white/10 bg-white/6 px-4 text-white outline-none transition focus:border-[#ff9c4a]"
          />
          {state.fieldErrors?.confirmPin ? (
            <span className="text-sm text-rose-200">
              {state.fieldErrors.confirmPin}
            </span>
          ) : null}
        </label>
      </div>

      {state.message ? (
        <p
          className={`mt-4 rounded-2xl px-4 py-3 text-sm ${
            state.status === "success"
              ? "border border-emerald-300/20 bg-emerald-500/10 text-emerald-100"
              : "border border-rose-300/20 bg-rose-500/10 text-rose-100"
          }`}
        >
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="mt-4 h-12 rounded-2xl bg-[linear-gradient(90deg,#ff6fb5,#ff9c4a)] px-5 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? messages.common.saving : messages.forms.saveParentPin}
      </button>
    </form>
  );
}
