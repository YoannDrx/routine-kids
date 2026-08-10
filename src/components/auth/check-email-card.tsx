"use client";

import Link from "next/link";
import { useState } from "react";

import { useAppMessages } from "@/components/i18n/app-i18n-provider";
import { authClient } from "@/lib/auth-client";

export function CheckEmailCard({
  email,
  callbackUrl,
}: {
  email?: string;
  callbackUrl: string;
}) {
  const messages = useAppMessages();
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);

  const resend = async () => {
    if (!email) return;
    setPending(true);
    try {
      await authClient.sendVerificationEmail({ email, callbackURL: callbackUrl });
      setSent(true);
    } finally {
      setPending(false);
    }
  };

  return (
    <section className="surface-panel flex w-full max-w-md flex-col gap-4 rounded-[32px] px-8 py-8">
      <h1 className="font-display text-3xl text-white">
        {messages.auth.checkEmailTitle}
      </h1>
      <p className="text-sm leading-6 text-white/65">
        {messages.auth.checkEmailDescription}
      </p>
      {email ? <p className="font-semibold text-white">{email}</p> : null}
      {sent ? (
        <p role="status" className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          {messages.auth.verificationSent}
        </p>
      ) : (
        <button
          type="button"
          disabled={!email || pending}
          onClick={resend}
          className="h-14 rounded-2xl border border-white/15 bg-white/8 px-5 font-semibold text-white disabled:opacity-50"
        >
          {pending ? messages.auth.wait : messages.auth.resendVerification}
        </button>
      )}
      <Link
        href="/sign-in"
        className="text-sm font-semibold text-[#8fd8ff] underline decoration-[#8fd8ff]/50 underline-offset-4"
      >
        {messages.auth.backToSignIn}
      </Link>
    </section>
  );
}
