import "server-only";

import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export const parentStepUpAttemptWindowMs = 10 * 60_000;
export const parentStepUpMaximumAttempts = 5;

type RateLimitRow = {
  count: number;
  lastRequest: bigint;
};

export function getParentStepUpRetryAfterSeconds(
  lastRequest: bigint,
  now = BigInt(Date.now()),
) {
  const remainingMs =
    lastRequest + BigInt(parentStepUpAttemptWindowMs) - now;
  return Math.max(1, Math.ceil(Number(remainingMs) / 1_000));
}

export async function claimParentStepUpAttempt(userId: string) {
  const key = `parent-step-up:${userId}`;
  const now = BigInt(Date.now());
  const windowStart = now - BigInt(parentStepUpAttemptWindowMs);
  const rows = await prisma.$queryRaw<RateLimitRow[]>(Prisma.sql`
    INSERT INTO "RateLimit" ("id", "key", "count", "lastRequest")
    VALUES (${randomUUID()}, ${key}, 1, ${now})
    ON CONFLICT ("key") DO UPDATE
    SET
      "count" = CASE
        WHEN "RateLimit"."lastRequest" < ${windowStart} THEN 1
        ELSE "RateLimit"."count" + 1
      END,
      "lastRequest" = ${now}
    WHERE
      "RateLimit"."lastRequest" < ${windowStart}
      OR "RateLimit"."count" < ${parentStepUpMaximumAttempts}
    RETURNING "count", "lastRequest"
  `);

  const claimed = rows[0];
  if (claimed) {
    return {
      allowed: claimed.count <= parentStepUpMaximumAttempts,
      retryAfterSeconds: parentStepUpAttemptWindowMs / 1_000,
    };
  }

  const current = await prisma.rateLimit.findUnique({ where: { key } });
  return {
    allowed: false,
    retryAfterSeconds: current
      ? getParentStepUpRetryAfterSeconds(current.lastRequest, now)
      : parentStepUpAttemptWindowMs / 1_000,
  };
}

export async function resetParentStepUpAttempts(userId: string) {
  await prisma.rateLimit.deleteMany({
    where: { key: `parent-step-up:${userId}` },
  });
}
