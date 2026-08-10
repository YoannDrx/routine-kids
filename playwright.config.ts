import { defineConfig, devices } from "@playwright/test";

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
      RESEND_API_KEY: process.env.RESEND_API_KEY ?? "re_e2e_build_only",
      EMAIL_FROM: process.env.EMAIL_FROM ?? "RoutineKids <e2e@example.com>",
    },
  },
});
