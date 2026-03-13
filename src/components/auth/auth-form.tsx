"use client";

import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";

import { useAppMessages } from "@/components/i18n/app-i18n-provider";
import { authClient } from "@/lib/auth-client";

type AuthFormProps = {
  mode: "sign-in" | "sign-up";
  callbackUrl?: string;
};

export function AuthForm({ mode, callbackUrl: rawCallbackUrl }: AuthFormProps) {
  const messages = useAppMessages();
  const router = useRouter();
  const callbackUrlParam = rawCallbackUrl ?? "/settings";
  const callbackUrl =
    callbackUrlParam.startsWith("/") && !callbackUrlParam.startsWith("//")
      ? callbackUrlParam
      : "/settings";

  const isSignup = mode === "sign-up";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsPending(true);

    try {
      if (isSignup) {
        const result = await authClient.signUp.email({
          name,
          email,
          password,
          callbackURL: callbackUrl,
        });

        if (result.error) {
          setError(result.error.message ?? messages.auth.signupError);
          return;
        }
      } else {
        const result = await authClient.signIn.email({
          email,
          password,
          callbackURL: callbackUrl,
          rememberMe: true,
        });

        if (result.error) {
          setError(result.error.message ?? messages.auth.signinError);
          return;
        }
      }

      startTransition(() => {
        router.push(callbackUrl as Route);
        router.refresh();
      });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="surface-panel flex w-full max-w-md flex-col gap-4 rounded-[32px] px-8 py-8"
    >
      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-[0.24em] text-white/45">
          {messages.auth.parentSpace}
        </span>
        <h1 className="font-display text-3xl text-white">
          {isSignup ? messages.auth.createHousehold : messages.auth.signIn}
        </h1>
        <p className="text-sm text-white/65">
          {isSignup
            ? messages.auth.signUpDescription
            : messages.auth.signInDescription}
        </p>
      </div>

      {isSignup ? (
        <label className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-white/80">{messages.auth.parentFirstName}</span>
          <input
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="h-14 rounded-2xl border border-white/10 bg-white/5 px-4 text-base text-white outline-none transition focus:border-[#ff6fb5]"
            placeholder="Camille"
          />
        </label>
      ) : null}

      <label className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-white/80">{messages.auth.email}</span>
        <input
          required
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="h-14 rounded-2xl border border-white/10 bg-white/5 px-4 text-base text-white outline-none transition focus:border-[#69d6ff]"
          placeholder="parent@routinekids.app"
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-white/80">{messages.auth.password}</span>
        <input
          required
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="h-14 rounded-2xl border border-white/10 bg-white/5 px-4 text-base text-white outline-none transition focus:border-[#8cf26b]"
          placeholder={messages.auth.passwordPlaceholder}
        />
      </label>

      {error ? (
        <p className="rounded-2xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="h-14 rounded-2xl bg-[linear-gradient(90deg,#ff6fb5,#ff9c4a)] px-5 text-base font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending
          ? messages.auth.wait
          : isSignup
            ? messages.auth.createParentAccount
            : messages.auth.openParentSettings}
      </button>

      <p className="text-sm text-white/60">
        {isSignup ? messages.auth.alreadyHaveAccount : messages.auth.noAccount}{" "}
        <Link
          href={
            isSignup
              ? `/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`
              : `/sign-up?callbackUrl=${encodeURIComponent(callbackUrl)}`
          }
          className="font-semibold text-[#8fd8ff] underline decoration-[#8fd8ff]/50 underline-offset-4"
        >
          {isSignup ? messages.auth.connectNow : messages.auth.createAccount}
        </Link>
      </p>
    </form>
  );
}
