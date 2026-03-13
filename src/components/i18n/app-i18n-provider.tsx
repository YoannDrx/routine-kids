"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  getMessages,
  normalizeAppLocale,
  type AppLocale,
} from "@/lib/i18n";

type AppI18nContextValue = {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
};

const AppI18nContext = createContext<AppI18nContextValue | null>(null);

export function AppI18nProvider({
  initialLocale,
  children,
}: {
  initialLocale: AppLocale;
  children: ReactNode;
}) {
  const [locale, setLocale] = useState<AppLocale>(initialLocale);

  useEffect(() => {
    setLocale(initialLocale);
  }, [initialLocale]);

  const value = useMemo(
    () => ({
      locale,
      setLocale: (nextLocale: AppLocale) => {
        setLocale(normalizeAppLocale(nextLocale));
      },
    }),
    [locale],
  );

  return (
    <AppI18nContext.Provider value={value}>
      {children}
    </AppI18nContext.Provider>
  );
}

export function useAppLocale() {
  const context = useContext(AppI18nContext);

  if (!context) {
    throw new Error("useAppLocale must be used inside AppI18nProvider.");
  }

  return context.locale;
}

export function useSetAppLocale() {
  const context = useContext(AppI18nContext);

  if (!context) {
    throw new Error("useSetAppLocale must be used inside AppI18nProvider.");
  }

  return context.setLocale;
}

export function useAppMessages() {
  return getMessages(useAppLocale());
}
