import "server-only";

import { PrismaClient } from "@prisma/client";

import { ensureServerEnv } from "@/lib/env.server";

declare global {
  var __routineKidsPrisma__: PrismaClient | undefined;
}

ensureServerEnv();

export const prisma =
  globalThis.__routineKidsPrisma__ ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__routineKidsPrisma__ = prisma;
}
