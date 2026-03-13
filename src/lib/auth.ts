import "server-only";

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin } from "better-auth/plugins";

import { ensureServerEnv } from "@/lib/env.server";
import { ensureHouseholdBaseline } from "@/lib/household-bootstrap";
import { prisma } from "@/lib/prisma";

ensureServerEnv();

const baseURL =
  process.env.BETTER_AUTH_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  "http://localhost:3000";

const trustedOrigins = Array.from(
  new Set([
    baseURL,
    process.env.NEXT_PUBLIC_APP_URL,
    "http://localhost:3000",
  ]).values(),
).filter((value): value is string => Boolean(value));

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET ?? "routine-kids-dev-secret-change-me",
  baseURL,
  trustedOrigins,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await ensureHouseholdBaseline({
            userId: user.id,
            userName: user.name,
          });
        },
      },
    },
  },
  emailAndPassword: {
    enabled: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 14,
  },
  advanced: {
    cookiePrefix: "routine-kids",
  },
  plugins: [
    admin({
      defaultRole: "admin",
    }),
  ],
});
