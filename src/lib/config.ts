import "server-only";

import { ensureServerEnv } from "@/lib/env.server";

const requiredSetupEnv = [
  "DATABASE_URL",
  "DIRECT_URL",
  "BETTER_AUTH_SECRET",
] as const;

ensureServerEnv();

export function getMissingSetupEnv() {
  return requiredSetupEnv.filter((key) => !process.env[key]);
}

export function isDatabaseConfigured() {
  return getMissingSetupEnv().length === 0;
}
