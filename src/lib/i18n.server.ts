import "server-only";

import { cookies } from "next/headers";

import {
  getMessages,
  localeCookieName,
  normalizeAppLocale,
  type AppLocale,
} from "@/lib/i18n";

export async function getCurrentAppLocale(): Promise<AppLocale> {
  const cookieStore = await cookies();
  return normalizeAppLocale(cookieStore.get(localeCookieName)?.value);
}

export async function getCurrentAppMessages() {
  return getMessages(await getCurrentAppLocale());
}
