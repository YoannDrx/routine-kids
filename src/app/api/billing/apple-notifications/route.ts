import { BillingPlan, SubscriptionStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { startApiRequest } from "@/lib/api-observability";
import {
  getAppleProductIds,
  toAppleSubscriptionStatus,
  verifyAppleNotification,
  verifyAppleTransaction,
} from "@/lib/apple-billing";
import { prisma } from "@/lib/prisma";
import {
  claimWebhookEvent,
  finishWebhookEvent,
  hashWebhookPayload,
} from "@/lib/webhook-events";

const notificationSchema = z.object({
  signedPayload: z.string().trim().min(100).max(200_000),
});

export const runtime = "nodejs";

export async function POST(request: Request) {
  const log = startApiRequest(request, "/api/billing/apple-notifications");
  const rawPayload = await request.text();
  let decodedPayload: unknown = null;
  try {
    decodedPayload = JSON.parse(rawPayload || "null");
  } catch {
    log.done(400, { outcome: "invalid_json", provider: "apple" });
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }
  const parsed = notificationSchema.safeParse(
    decodedPayload,
  );
  if (!parsed.success) {
    log.done(400, { outcome: "invalid_request", provider: "apple" });
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  let eventId: string | undefined;
  try {
    const { notification, environment } = await verifyAppleNotification(
      parsed.data.signedPayload,
    );
    eventId = notification.notificationUUID;
    if (!eventId) throw new Error("notification_id_missing");

    const claimed = await claimWebhookEvent({
      provider: "APPLE",
      externalEventId: eventId,
      payloadHash: hashWebhookPayload(rawPayload),
    });
    if (!claimed) {
      log.done(200, { outcome: "duplicate", provider: "apple" });
      return NextResponse.json({ received: true, duplicate: true });
    }

    const signedTransaction = notification.data?.signedTransactionInfo;
    if (signedTransaction) {
      const verified = await verifyAppleTransaction(signedTransaction);
      const transaction = verified.transaction;
      if (
        transaction.originalTransactionId &&
        transaction.productId &&
        getAppleProductIds().has(transaction.productId)
      ) {
        const status = toAppleSubscriptionStatus(notification.data?.status);
        await prisma.subscription.updateMany({
          where: {
            provider: "APPLE",
            originalTransactionId: transaction.originalTransactionId,
          },
          data: {
            environment: environment === "Production" ? "PRODUCTION" : "TEST",
            productId: transaction.productId,
            plan:
              status === SubscriptionStatus.ACTIVE ||
              status === SubscriptionStatus.PAST_DUE
                ? BillingPlan.FAMILY_PLUS
                : BillingPlan.FREE,
            status,
            periodEnd: transaction.expiresDate
              ? new Date(transaction.expiresDate)
              : null,
            revokedAt: transaction.revocationDate
              ? new Date(transaction.revocationDate)
              : null,
            lastProviderEventAt: notification.signedDate
              ? new Date(notification.signedDate)
              : new Date(),
          },
        });
      }
    }

    await finishWebhookEvent({
      provider: "APPLE",
      externalEventId: eventId,
      outcome: "SUCCEEDED",
    });

    log.done(200, { outcome: "succeeded", provider: "apple" });
    return NextResponse.json({ received: true });
  } catch (error) {
    if (eventId) {
      await finishWebhookEvent({
        provider: "APPLE",
        externalEventId: eventId,
        outcome: "FAILED",
      });
    }
    log.failed(error, 400, { outcome: "verification_failed", provider: "apple" });
    return NextResponse.json({ error: "notification_verification_failed" }, { status: 400 });
  }
}
