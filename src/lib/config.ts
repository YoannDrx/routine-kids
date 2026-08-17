import "server-only";

import { ensureServerEnv } from "@/lib/env.server";

const requiredSetupEnv = [
  "DATABASE_URL",
  "DIRECT_URL",
  "BETTER_AUTH_SECRET",
] as const;

const requiredCommercialProductionEnv = [
  ...requiredSetupEnv,
  "NEXT_PUBLIC_APP_URL",
  "BLOB_READ_WRITE_TOKEN",
  "RESEND_API_KEY",
  "EMAIL_FROM",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_BILLING_PORTAL_CONFIGURATION_ID",
  "STRIPE_FAMILY_PLUS_MONTHLY_PRICE_ID",
  "STRIPE_FAMILY_PLUS_YEARLY_PRICE_ID",
  "APPLE_APP_BUNDLE_ID",
  "APPLE_APP_ID",
  "APPLE_FAMILY_PLUS_MONTHLY_PRODUCT_ID",
  "APPLE_FAMILY_PLUS_YEARLY_PRODUCT_ID",
  "APPLE_ROOT_CERTIFICATES_BASE64",
] as const;

ensureServerEnv();

export function getMissingSetupEnv() {
  return requiredSetupEnv.filter((key) => !process.env[key]);
}

export function isDatabaseConfigured() {
  return getMissingSetupEnv().length === 0;
}

export function isVercelProduction() {
  return process.env.VERCEL_ENV === "production";
}

export function getMissingCommercialProductionEnv() {
  if (!isVercelProduction()) {
    return [];
  }

  return requiredCommercialProductionEnv.filter(
    (key) => !process.env[key]?.trim(),
  );
}
