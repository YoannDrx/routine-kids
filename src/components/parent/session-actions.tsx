"use client";

import { useRouter } from "next/navigation";

import { useAppMessages } from "@/components/i18n/app-i18n-provider";
import { signOut } from "@/lib/auth-client";

export function SessionActions() {
  const messages = useAppMessages();
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={async () => {
        await signOut();
        router.push("/");
        router.refresh();
      }}
      className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
    >
      {messages.forms.signOut}
    </button>
  );
}
