import "server-only";

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin } from "better-auth/plugins";
import { after } from "next/server";

import {
  ensureServerEnv,
  getRequiredProductionSecret,
} from "@/lib/env.server";
import { ensureHouseholdBaseline } from "@/lib/household-bootstrap";
import {
  assertProductionEmailConfiguration,
  isTransactionalEmailConfigured,
  sendRoutineKidsAuthEmail,
} from "@/lib/email";
import { prisma } from "@/lib/prisma";

ensureServerEnv();
assertProductionEmailConfiguration();

const emailDeliveryConfigured = isTransactionalEmailConfigured();

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
  secret: getRequiredProductionSecret("BETTER_AUTH_SECRET"),
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
    requireEmailVerification: emailDeliveryConfigured,
    revokeSessionsOnPasswordReset: true,
    resetPasswordTokenExpiresIn: 60 * 60,
    sendResetPassword: async ({ user, url }) => {
      after(() =>
        sendRoutineKidsAuthEmail({
          kind: "reset-password",
          to: user.email,
          name: user.name,
          url,
        }),
      );
    },
  },
  emailVerification: emailDeliveryConfigured
    ? {
        sendOnSignUp: true,
        sendOnSignIn: true,
        expiresIn: 60 * 60,
        sendVerificationEmail: async ({ user, url }) => {
          after(() =>
            sendRoutineKidsAuthEmail({
              kind: "verify-email",
              to: user.email,
              name: user.name,
              url,
            }),
          );
        },
      }
    : undefined,
  rateLimit: {
    enabled: process.env.NODE_ENV === "production",
    storage: "database",
    customRules: {
      "/sign-in/email": {
        window: 60,
        max: 5,
      },
      "/sign-up/email": {
        window: 60 * 10,
        max: 5,
      },
      "/request-password-reset": {
        window: 60 * 10,
        max: 5,
      },
    },
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
