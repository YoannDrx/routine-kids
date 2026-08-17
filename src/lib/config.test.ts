import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/env.server", () => ({ ensureServerEnv: vi.fn() }));

import {
  getMissingCommercialProductionEnv,
  isVercelProduction,
} from "@/lib/config";

const productionVariables = [
  "DATABASE_URL",
  "DIRECT_URL",
  "BETTER_AUTH_SECRET",
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

const originalEnvironment = { ...process.env };

afterEach(() => {
  for (const key of [...productionVariables, "VERCEL_ENV"] as const) {
    const originalValue = originalEnvironment[key];
    if (originalValue === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = originalValue;
    }
  }
});

describe("commercial production configuration", () => {
  it("does not gate local or preview runtimes", () => {
    process.env.VERCEL_ENV = "preview";
    for (const key of productionVariables) delete process.env[key];

    expect(isVercelProduction()).toBe(false);
    expect(getMissingCommercialProductionEnv()).toEqual([]);
  });

  it("reports every missing production integration without reading secret values", () => {
    process.env.VERCEL_ENV = "production";
    for (const key of productionVariables) process.env[key] = "configured";
    delete process.env.STRIPE_WEBHOOK_SECRET;
    delete process.env.STRIPE_BILLING_PORTAL_CONFIGURATION_ID;

    expect(isVercelProduction()).toBe(true);
    expect(getMissingCommercialProductionEnv()).toEqual([
      "STRIPE_WEBHOOK_SECRET",
      "STRIPE_BILLING_PORTAL_CONFIGURATION_ID",
    ]);
  });
});
