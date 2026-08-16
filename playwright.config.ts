import { defineConfig, devices } from "@playwright/test";

const authenticatedTestMode = process.env.E2E_AUTHENTICATED === "true";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://127.0.0.1:3010",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "ipad-landscape",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1024, height: 768 },
      },
    },
    {
      name: "large-landscape",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1366, height: 1024 },
      },
    },
  ],
  webServer: {
    command: "pnpm build && pnpm start --port 3010",
    url: "http://127.0.0.1:3010",
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      ...process.env,
      NEXT_PUBLIC_APP_URL: "http://127.0.0.1:3010",
      BETTER_AUTH_URL: "http://127.0.0.1:3010",
      VERCEL_ENV: "preview",
      ROUTINEKIDS_INSECURE_TEST_COOKIES: "true",
      RESEND_API_KEY: "",
      EMAIL_FROM: "",
      STRIPE_SECRET_KEY: authenticatedTestMode
        ? "sk_test_routinekids_ci_placeholder"
        : process.env.STRIPE_SECRET_KEY ?? "",
      STRIPE_WEBHOOK_SECRET: authenticatedTestMode
        ? "whsec_routinekids_ci_webhook_secret"
        : process.env.STRIPE_WEBHOOK_SECRET ?? "",
      STRIPE_FAMILY_PLUS_MONTHLY_PRICE_ID:
        authenticatedTestMode
          ? "price_routinekids_ci_monthly"
          : process.env.STRIPE_FAMILY_PLUS_MONTHLY_PRICE_ID ?? "",
      STRIPE_FAMILY_PLUS_YEARLY_PRICE_ID:
        authenticatedTestMode
          ? "price_routinekids_ci_yearly"
          : process.env.STRIPE_FAMILY_PLUS_YEARLY_PRICE_ID ?? "",
    },
  },
});
