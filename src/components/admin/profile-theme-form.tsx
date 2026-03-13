"use client";

import { useActionState } from "react";

import { useAppMessages } from "@/components/i18n/app-i18n-provider";
import {
  updateChildProfileThemeInitialState,
  type UpdateChildProfileThemeState,
} from "@/components/admin/profile-theme-form-state";

type ThemeOption = {
  id: string;
  name: string;
  slug: string;
};

type ProfileThemeFormProps = {
  action: (
    state: UpdateChildProfileThemeState,
    formData: FormData,
  ) => Promise<UpdateChildProfileThemeState>;
  childProfileId: string;
  currentThemeId: string | null;
  options: ThemeOption[];
};

export function ProfileThemeForm({
  action,
  childProfileId,
  currentThemeId,
  options,
}: ProfileThemeFormProps) {
  const messages = useAppMessages();
  const [state, formAction, isPending] = useActionState(
    action,
    updateChildProfileThemeInitialState,
  );

  return (
    <form action={formAction} className="mt-4 rounded-[24px] border border-white/10 bg-black/20 p-4">
      <input type="hidden" name="childProfileId" value={childProfileId} />

      <div className="flex flex-wrap items-end gap-3">
        <label className="flex min-w-[220px] flex-1 flex-col gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
            {messages.forms.boardTheme}
          </span>
          <select
            name="themePackId"
            defaultValue={currentThemeId ?? ""}
            className="h-11 rounded-2xl border border-white/10 bg-white/6 px-4 text-sm font-semibold text-white outline-none transition focus:border-[#ff6fb5]"
          >
            <option value="" className="bg-[#101223]">
              {messages.forms.autoByAge}
            </option>
            {options.map((option) => (
              <option key={option.id} value={option.id} className="bg-[#101223]">
                {option.name}
              </option>
            ))}
          </select>
        </label>

        <button
          type="submit"
          disabled={isPending}
          className="h-11 rounded-2xl bg-[linear-gradient(90deg,#ff6fb5,#ff9c4a)] px-4 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? messages.forms.updatingShort : messages.common.apply}
        </button>
      </div>

      {state.message ? (
        <p
          className={`mt-3 text-sm ${
            state.status === "success" ? "text-emerald-100" : "text-rose-200"
          }`}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
