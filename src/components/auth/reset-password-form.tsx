"use client";

import Link from "next/link";
import { useState } from "react";

import { useAppMessages } from "@/components/i18n/app-i18n-provider";
import { authClient } from "@/lib/auth-client";

export function ResetPasswordForm({ token }: { token?: string }) {
  const messages = useAppMessages();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(
    token ? null : messages.auth.invalidResetLink,
  );
  const [complete, setComplete] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;
    if (password !== confirmation) {
      setError(messages.auth.passwordMismatch);
      return;
    }

    setError(null);
    setIsPending(true);
    try {
      const result = await authClient.resetPassword({
        newPassword: password,
        token,
      });
      if (result.error) {
        setError(result.error.message ?? messages.auth.invalidResetLink);
        return;
      }
      setComplete(true);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="surface-panel flex w-full max-w-md flex-col gap-4 rounded-[32px] px-8 py-8"
    >
      <h1 className="font-display text-3xl text-white">
        {messages.auth.resetPasswordTitle}
      </h1>
      <p className="text-sm leading-6 text-white/65">
        {messages.auth.resetPasswordDescription}
      </p>

      {!complete && token ? (
        <>
          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-white/80">
              {messages.auth.newPassword}
            </span>
            <input
              required
              minLength={8}
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-14 rounded-2xl border border-white/10 bg-white/5 px-4 text-base text-white outline-none focus:border-[#8cf26b]"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-white/80">
              {messages.auth.confirmPassword}
            </span>
            <input
              required
              minLength={8}
              type="password"
              autoComplete="new-password"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              className="h-14 rounded-2xl border border-white/10 bg-white/5 px-4 text-base text-white outline-none focus:border-[#8cf26b]"
            />
          </label>
          <button
            type="submit"
            disabled={isPending}
            className="h-14 rounded-2xl bg-[linear-gradient(90deg,#ff6fb5,#ff9c4a)] px-5 font-semibold text-white disabled:opacity-60"
          >
            {isPending ? messages.auth.wait : messages.auth.resetPassword}
          </button>
        </>
      ) : null}

      {error ? (
        <p role="alert" className="rounded-2xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </p>
      ) : null}
      {complete ? (
        <p role="status" className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          {messages.auth.passwordResetSuccess}
        </p>
      ) : null}

      <Link
        href="/sign-in"
        className="text-sm font-semibold text-[#8fd8ff] underline decoration-[#8fd8ff]/50 underline-offset-4"
      >
        {messages.auth.backToSignIn}
      </Link>
    </form>
  );
}
