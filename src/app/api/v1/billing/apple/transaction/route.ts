import { BillingPlan, SubscriptionStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { startApiRequest } from "@/lib/api-observability";
import {
  getAppleProductIds,
  isActiveAppleTransaction,
  verifyAppleTransaction,
} from "@/lib/apple-billing";
import { getApiUser } from "@/lib/api-session";
import { getParentStepUpStatus } from "@/lib/parent-security";
import { prisma } from "@/lib/prisma";

const transactionSchema = z.object({
  signedTransaction: z.string().trim().min(100).max(100_000),
});

export const runtime = "nodejs";

export async function POST(request: Request) {
  const log = startApiRequest(request, "/api/v1/billing/apple/transaction");
  const user = await getApiUser(request);
  if (!user) {
    log.done(401, { outcome: "unauthorized" });
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const parsed = transactionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    log.done(400, { outcome: "invalid_request" });
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const parentAccess = await getParentStepUpStatus(user.id);
  if (!parentAccess.ok) {
    log.done(403, { outcome: "parent_step_up_required" });
    return NextResponse.json(
      { error: "parent_step_up_required" },
      { status: 403 },
    );
  }

  try {
    const [{ environment, transaction }, account, household] = await Promise.all([
      verifyAppleTransaction(parsed.data.signedTransaction),
      prisma.user.findUnique({
        where: { id: user.id },
        select: { appAccountToken: true },
      }),
      prisma.household.findFirst({
        where: {
          OR: [
            { ownerUserId: user.id },
            { members: { some: { userId: user.id } } },
          ],
        },
        select: { id: true },
      }),
    ]);

    if (!account || !household) {
      log.done(404, { outcome: "household_not_found" });
      return NextResponse.json({ error: "household_not_found" }, { status: 404 });
    }
    if (
      !transaction.appAccountToken ||
      transaction.appAccountToken.toLowerCase() !== account.appAccountToken.toLowerCase()
    ) {
      log.done(403, { outcome: "account_token_mismatch" });
      return NextResponse.json({ error: "account_token_mismatch" }, { status: 403 });
    }
    if (!transaction.productId || !getAppleProductIds().has(transaction.productId)) {
      log.done(400, { outcome: "unknown_product" });
      return NextResponse.json({ error: "unknown_product" }, { status: 400 });
    }
    if (!transaction.originalTransactionId || !transaction.transactionId) {
      log.done(400, { outcome: "incomplete_transaction" });
      return NextResponse.json({ error: "incomplete_transaction" }, { status: 400 });
    }

    const existingOwner = await prisma.subscription.findUnique({
      where: { originalTransactionId: transaction.originalTransactionId },
      select: { referenceId: true },
    });
    if (existingOwner && existingOwner.referenceId !== user.id) {
      log.done(409, { outcome: "transaction_already_owned" });
      return NextResponse.json({ error: "transaction_already_owned" }, { status: 409 });
    }

    const active = isActiveAppleTransaction(transaction);
    await prisma.subscription.upsert({
      where: { referenceId: user.id },
      update: {
        householdId: household.id,
        provider: "APPLE",
        environment: environment === "Production" ? "PRODUCTION" : "TEST",
        providerCustomerId: account.appAccountToken,
        providerSubscriptionId: transaction.originalTransactionId,
        originalTransactionId: transaction.originalTransactionId,
        productId: transaction.productId,
        plan: active ? BillingPlan.FAMILY_PLUS : BillingPlan.FREE,
        status: active ? SubscriptionStatus.ACTIVE : SubscriptionStatus.CANCELED,
        periodStart: transaction.purchaseDate
          ? new Date(transaction.purchaseDate)
          : null,
        periodEnd: transaction.expiresDate ? new Date(transaction.expiresDate) : null,
        revokedAt: transaction.revocationDate
          ? new Date(transaction.revocationDate)
          : null,
        lastProviderEventAt: transaction.signedDate
          ? new Date(transaction.signedDate)
          : new Date(),
      },
      create: {
        id: `subscription_${user.id}`,
        referenceId: user.id,
        householdId: household.id,
        provider: "APPLE",
        environment: environment === "Production" ? "PRODUCTION" : "TEST",
        providerCustomerId: account.appAccountToken,
        providerSubscriptionId: transaction.originalTransactionId,
        originalTransactionId: transaction.originalTransactionId,
        productId: transaction.productId,
        plan: active ? BillingPlan.FAMILY_PLUS : BillingPlan.FREE,
        status: active ? SubscriptionStatus.ACTIVE : SubscriptionStatus.CANCELED,
        periodStart: transaction.purchaseDate
          ? new Date(transaction.purchaseDate)
          : null,
        periodEnd: transaction.expiresDate ? new Date(transaction.expiresDate) : null,
        revokedAt: transaction.revocationDate
          ? new Date(transaction.revocationDate)
          : null,
        lastProviderEventAt: transaction.signedDate
          ? new Date(transaction.signedDate)
          : new Date(),
      },
    });

    log.done(200, { active, outcome: "succeeded", provider: "apple" });
    return NextResponse.json({ active, plan: active ? "FAMILY_PLUS" : "FREE" });
  } catch (error) {
    log.failed(error, 400, { outcome: "verification_failed", provider: "apple" });
    return NextResponse.json({ error: "transaction_verification_failed" }, { status: 400 });
  }
}
