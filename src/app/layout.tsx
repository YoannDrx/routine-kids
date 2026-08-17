import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { Fredoka, Nunito } from "next/font/google";

import { AppI18nProvider } from "@/components/i18n/app-i18n-provider";
import { ServiceWorkerRegistration } from "@/components/pwa/service-worker-registration";
import { localeCookieName, normalizeAppLocale } from "@/lib/i18n";

import "./globals.css";

const displayFont = Fredoka({
  subsets: ["latin"],
  variable: "--font-display",
});

const bodyFont = Nunito({
  subsets: ["latin"],
  variable: "--font-body",
});

const baseUrl =
  process.env.NEXT_PUBLIC_APP_URL ??
  process.env.BETTER_AUTH_URL ??
  "http://localhost:3000";

export const metadata: Metadata = {
  title: {
    default: "RoutineKids",
    template: "%s | RoutineKids",
  },
  description:
    "Des routines visuelles et positives pour aider les enfants à gagner en autonomie, avec un espace parent sécurisé.",
  applicationName: "RoutineKids",
  category: "education",
  metadataBase: new URL(baseUrl),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "RoutineKids",
    description:
      "Des routines visuelles et positives pour aider les enfants à gagner en autonomie.",
    locale: "fr_FR",
    siteName: "RoutineKids",
    type: "website",
    url: "/",
  },
  appleWebApp: {
    capable: true,
    title: "RoutineKids",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#120d2b",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const locale = normalizeAppLocale(cookieStore.get(localeCookieName)?.value);

  return (
    <html lang={locale} className="h-full" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${displayFont.variable} ${bodyFont.variable} min-h-full bg-[var(--surface-page)] font-body text-white antialiased`}
      >
        <AppI18nProvider initialLocale={locale}>
          {children}
          <ServiceWorkerRegistration />
        </AppI18nProvider>
      </body>
    </html>
  );
}
