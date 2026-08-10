import "server-only";

import { createHash } from "node:crypto";
import { BillingProvider, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export function hashWebhookPayload(payload: string) {
  return createHash("sha256").update(payload).digest("hex");
}

export async function claimWebhookEvent(input: {
  provider: BillingProvider;
  externalEventId: string;
  payloadHash: string;
}) {
  try {
    await prisma.webhookEvent.create({
      data: { ...input, outcome: "PROCESSING" },
    });
    return true;
  } catch (error) {
    if (
      !(error instanceof Prisma.PrismaClientKnownRequestError) ||
      error.code !== "P2002"
    ) {
      throw error;
    }
  }

  const existing = await prisma.webhookEvent.findUnique({
    where: {
      provider_externalEventId: {
        provider: input.provider,
        externalEventId: input.externalEventId,
      },
    },
  });
  if (!existing) throw new Error("Webhook event claim disappeared.");
  if (existing.payloadHash && existing.payloadHash !== input.payloadHash) {
    throw new Error("A webhook event identifier was reused with another payload.");
  }

  const staleBefore = new Date(Date.now() - 5 * 60 * 1000);
  const retryable =
    existing.outcome === "FAILED" ||
    (existing.outcome === "PROCESSING" && existing.processedAt < staleBefore);
  if (!retryable) return false;

  const claimed = await prisma.webhookEvent.updateMany({
    where: {
      id: existing.id,
      outcome: existing.outcome,
      processedAt: existing.processedAt,
    },
    data: {
      payloadHash: input.payloadHash,
      outcome: "PROCESSING",
      processedAt: new Date(),
    },
  });
  return claimed.count === 1;
}

export async function finishWebhookEvent(input: {
  provider: BillingProvider;
  externalEventId: string;
  outcome: "SUCCEEDED" | "FAILED";
}) {
  await prisma.webhookEvent.updateMany({
    where: {
      provider: input.provider,
      externalEventId: input.externalEventId,
    },
    data: {
      outcome: input.outcome,
      processedAt: new Date(),
    },
  });
}
