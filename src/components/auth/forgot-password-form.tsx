"use client";

import Link from "next/link";
import { useState } from "react";

import { useAppMessages } from "@/components/i18n/app-i18n-provider";
import { authClient } from "@/lib/auth-client";

export function ForgotPasswordForm() {
  const messages = useAppMessages();
  const [email, setEmail] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsPending(true);
    // Render the same response immediately for every address to avoid an
    // account-enumeration timing signal. Better Auth handles delivery server-side.
    setSent(true);
    setIsPending(false);
    void authClient.requestPasswordReset({
      email,
      redirectTo: "/reset-password",
    });
  };

  return (
    <form
      onSubmit={submit}
      className="surface-panel flex w-full max-w-md flex-col gap-4 rounded-[32px] px-8 py-8"
    >
      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-[0.24em] text-white/45">
          {messages.auth.parentSpace}
        </span>
        <h1 className="font-display text-3xl text-white">
          {messages.auth.forgotPasswordTitle}
        </h1>
        <p className="text-sm leading-6 text-white/65">
          {messages.auth.forgotPasswordDescription}
        </p>
      </div>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-white/80">
          {messages.auth.email}
        </span>
        <input
          required
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="h-14 rounded-2xl border border-white/10 bg-white/5 px-4 text-base text-white outline-none transition focus:border-[#69d6ff]"
          placeholder={messages.auth.emailPlaceholder}
        />
      </label>

      {sent ? (
        <p role="status" className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          {messages.auth.resetLinkSent}
        </p>
      ) : (
        <button
          type="submit"
          disabled={isPending}
          className="h-14 rounded-2xl bg-[linear-gradient(90deg,#ff6fb5,#ff9c4a)] px-5 font-semibold text-white disabled:opacity-60"
        >
          {isPending ? messages.auth.wait : messages.auth.sendResetLink}
        </button>
      )}

      <Link
        href="/sign-in"
        className="text-sm font-semibold text-[#8fd8ff] underline decoration-[#8fd8ff]/50 underline-offset-4"
      >
        {messages.auth.backToSignIn}
      </Link>
    </form>
  );
}
