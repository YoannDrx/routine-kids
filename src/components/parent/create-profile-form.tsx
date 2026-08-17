"use client";

import { useActionState } from "react";

import { useAppMessages } from "@/components/i18n/app-i18n-provider";
import {
  createChildProfileInitialState,
  type CreateChildProfileState,
} from "@/components/parent/create-profile-form-state";

type CreateProfileFormProps = {
  action: (
    state: CreateChildProfileState,
    formData: FormData,
  ) => Promise<CreateChildProfileState>;
};

const avatarOptions = ["🚀", "🦊", "🧑‍🚀", "🐼", "🐙", "🦁"];

export function CreateProfileForm({ action }: CreateProfileFormProps) {
  const messages = useAppMessages();
  const [state, formAction, isPending] = useActionState(
    action,
    createChildProfileInitialState,
  );

  return (
    <form action={formAction} className="rounded-[28px] border border-white/10 bg-black/15 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
            {messages.forms.parentSpace}
          </p>
          <h3 className="mt-1 font-display text-2xl text-white">
            {messages.forms.addChildProfile}
          </h3>
        </div>
        <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs font-semibold text-white/60">
          {messages.forms.serverAction}
        </span>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-white/80">{messages.forms.childFirstName}</span>
          <input
            required
            name="name"
            placeholder={messages.forms.profileNamePlaceholder}
            className="h-12 rounded-2xl border border-white/10 bg-white/6 px-4 text-white outline-none transition focus:border-[#ff6fb5]"
          />
          {state.fieldErrors?.name ? (
            <span className="text-sm text-rose-200">{state.fieldErrors.name}</span>
          ) : null}
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-white/80">{messages.forms.age}</span>
          <input
            required
            name="age"
            type="number"
            min={2}
            max={12}
            defaultValue={5}
            className="h-12 rounded-2xl border border-white/10 bg-white/6 px-4 text-white outline-none transition focus:border-[#69d6ff]"
          />
          {state.fieldErrors?.age ? (
            <span className="text-sm text-rose-200">{state.fieldErrors.age}</span>
          ) : null}
        </label>
      </div>

      <label className="mt-4 flex flex-col gap-2">
        <span className="text-sm font-semibold text-white/80">{messages.forms.headline}</span>
        <input
          name="headline"
          placeholder={messages.forms.headlinePlaceholder}
          className="h-12 rounded-2xl border border-white/10 bg-white/6 px-4 text-white outline-none transition focus:border-[#8cf26b]"
        />
        {state.fieldErrors?.headline ? (
          <span className="text-sm text-rose-200">{state.fieldErrors.headline}</span>
        ) : null}
      </label>

      <div className="mt-4">
        <div className="text-sm font-semibold text-white/80">{messages.forms.initialAvatar}</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {avatarOptions.map((avatar) => (
            <label
              key={avatar}
              className="flex cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-2 text-sm font-semibold text-white/72"
            >
              <input
                type="radio"
                name="avatar"
                value={avatar}
                defaultChecked={avatar === "🚀"}
                className="accent-[#ff6fb5]"
              />
              <span>{avatar}</span>
            </label>
          ))}
        </div>
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
        {isPending ? messages.forms.creating : messages.forms.createProfile}
      </button>
    </form>
  );
}
