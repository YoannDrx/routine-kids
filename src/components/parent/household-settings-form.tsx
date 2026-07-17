"use client";

import { useActionState } from "react";

import { useAppMessages } from "@/components/i18n/app-i18n-provider";
import {
  updateHouseholdSettingsInitialState,
  type UpdateHouseholdSettingsState,
} from "@/components/parent/household-settings-form-state";

type HouseholdSettingsFormProps = {
  action: (
    state: UpdateHouseholdSettingsState,
    formData: FormData,
  ) => Promise<UpdateHouseholdSettingsState>;
  defaultName: string;
  defaultLocale: string;
};

export function HouseholdSettingsForm({
  action,
  defaultName,
  defaultLocale,
}: HouseholdSettingsFormProps) {
  const messages = useAppMessages();
  const [state, formAction, isPending] = useActionState(
    action,
    updateHouseholdSettingsInitialState,
  );

  return (
    <form action={formAction} className="rounded-[28px] border border-white/10 bg-black/15 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
            {messages.forms.householdSettings}
          </p>
          <h3 className="mt-1 font-display text-2xl text-white">
            {messages.forms.householdNameLanguage}
          </h3>
        </div>
        <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs font-semibold text-white/60">
          {messages.forms.serverAction}
        </span>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-white/80">{messages.forms.householdName}</span>
          <input
            required
            name="name"
            defaultValue={defaultName}
            className="h-12 rounded-2xl border border-white/10 bg-white/6 px-4 text-white outline-none transition focus:border-[#69d6ff]"
            placeholder={messages.forms.householdNamePlaceholder}
          />
          {state.fieldErrors?.name ? (
            <span className="text-sm text-rose-200">{state.fieldErrors.name}</span>
          ) : null}
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-white/80">{messages.forms.language}</span>
          <select
            name="locale"
            defaultValue={defaultLocale}
            className="h-12 rounded-2xl border border-white/10 bg-white/6 px-4 text-white outline-none transition focus:border-[#8cf26b]"
          >
            <option value="fr" className="bg-[#101223]">
              {messages.settings.french}
            </option>
            <option value="en" className="bg-[#101223]">
              {messages.settings.english}
            </option>
          </select>
          {state.fieldErrors?.locale ? (
            <span className="text-sm text-rose-200">{state.fieldErrors.locale}</span>
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
        className="mt-4 h-12 rounded-2xl bg-[linear-gradient(90deg,#69d6ff,#8cf26b)] px-5 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? messages.common.saving : messages.forms.saveHousehold}
      </button>
    </form>
  );
}
