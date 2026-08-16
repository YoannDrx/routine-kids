import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { startApiRequest } from "@/lib/api-observability";
import { prisma } from "@/lib/prisma";
import {
  getLocalPlanForStripeSubscription,
  getStripeBillingEnvironment,
  getStripeClient,
  getStripeSubscriptionProductId,
  getSubscriptionPeriod,
  toSubscriptionStatus,
} from "@/lib/stripe-billing";
import {
  claimWebhookEvent,
  finishWebhookEvent,
  hashWebhookPayload,
} from "@/lib/webhook-events";

export const runtime = "nodejs";

function getStripeId(value: string | { id: string } | null) {
  return typeof value === "string" ? value : value?.id ?? null;
}

async function resolveUserId(subscription: Stripe.Subscription) {
  const metadataUserId = subscription.metadata.userId || null;
  const stripeCustomerId = getStripeId(subscription.customer);
  const existingSubscription = await prisma.subscription.findFirst({
    where: {
      OR: [
        { stripeSubscriptionId: subscription.id },
        { stripeCustomerId: stripeCustomerId ?? undefined },
      ],
    },
    select: {
      referenceId: true,
    },
  });

  if (
    metadataUserId &&
    existingSubscription &&
    existingSubscription.referenceId !== metadataUserId
  ) {
    throw new Error("Stripe subscription ownership does not match metadata.");
  }

  const userId = metadataUserId ?? existingSubscription?.referenceId ?? null;
  if (!userId) {
    return null;
  }

  const [user, customerOwner] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, stripeCustomerId: true },
    }),
    stripeCustomerId
      ? prisma.user.findUnique({
          where: { stripeCustomerId },
          select: { id: true },
        })
      : null,
  ]);

  if (!user || (customerOwner && customerOwner.id !== userId)) {
    throw new Error("Stripe customer ownership could not be verified.");
  }

  if (
    user.stripeCustomerId &&
    stripeCustomerId &&
    user.stripeCustomerId !== stripeCustomerId
  ) {
    throw new Error("Stripe customer changed for an existing RoutineKids user.");
  }

  return userId;
}

async function syncSubscription(
  subscription: Stripe.Subscription,
  eventId: string,
  liveMode: boolean,
  providerEventAt: Date,
) {
  if (subscription.livemode !== liveMode) {
    throw new Error("Stripe event and subscription environments do not match.");
  }
  const userId = await resolveUserId(subscription);

  if (!userId) {
    throw new Error("Unable to associate the Stripe subscription with a user.");
  }

  const household = await prisma.household.findUnique({
    where: {
      ownerUserId: userId,
    },
    select: {
      id: true,
    },
  });
  const period = getSubscriptionPeriod(subscription);
  const status = toSubscriptionStatus(subscription.status);
  const stripeCustomerId = getStripeId(subscription.customer);
  const productId = getStripeSubscriptionProductId(subscription);
  const localPlan = getLocalPlanForStripeSubscription(subscription);

  if (localPlan !== "FREE" && !productId) {
    throw new Error("Stripe subscription does not use a configured RoutineKids price.");
  }

  await prisma.$transaction(async (transaction) => {
    const existing = await transaction.subscription.findUnique({
      where: { referenceId: userId },
      select: { lastProviderEventAt: true },
    });
    if (
      existing?.lastProviderEventAt &&
      existing.lastProviderEventAt > providerEventAt
    ) {
      return;
    }

    await transaction.subscription.upsert({
      where: {
        referenceId: userId,
      },
      update: {
        plan: localPlan,
        status,
        householdId: household?.id,
        provider: "STRIPE",
        environment: getStripeBillingEnvironment(liveMode),
        providerCustomerId: stripeCustomerId,
        providerSubscriptionId: subscription.id,
        productId,
        lastProviderEventAt: providerEventAt,
        stripeCustomerId,
        stripeSubscriptionId: subscription.id,
        periodStart: period.periodStart,
        periodEnd: period.periodEnd,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
      create: {
        id: `subscription_${userId}`,
        referenceId: userId,
        plan: localPlan,
        status,
        householdId: household?.id,
        provider: "STRIPE",
        environment: getStripeBillingEnvironment(liveMode),
        providerCustomerId: stripeCustomerId,
        providerSubscriptionId: subscription.id,
        productId,
        lastProviderEventAt: providerEventAt,
        stripeCustomerId,
        stripeSubscriptionId: subscription.id,
        periodStart: period.periodStart,
        periodEnd: period.periodEnd,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    });

    if (stripeCustomerId) {
      await transaction.user.update({
        where: { id: userId },
        data: { stripeCustomerId },
      });
    }

    if (household) {
      await transaction.adminAuditLog.create({
        data: {
          householdId: household.id,
          actorUserId: userId,
          action: "STRIPE_SUBSCRIPTION_SYNCED",
          targetType: "StripeEvent",
          targetId: eventId,
          metadata: {
            stripeSubscriptionId: subscription.id,
            status,
            plan: localPlan,
          },
        },
      });
    }
  });
}

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
  eventId: string,
  liveMode: boolean,
  providerEventAt: Date,
) {
  const userId = session.client_reference_id ?? session.metadata?.userId;
  const stripeSubscriptionId = getStripeId(session.subscription);
  const stripeCustomerId = getStripeId(session.customer);

  if (!userId || !stripeSubscriptionId) {
    throw new Error("Stripe Checkout is missing its internal reference.");
  }

  const stripe = getStripeClient();
  const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);

  if (subscription.livemode !== liveMode) {
    throw new Error("Stripe Checkout and subscription environments do not match.");
  }

  if (!subscription.metadata.userId) {
    subscription.metadata.userId = userId;
  }

  if (stripeCustomerId && !subscription.customer) {
    subscription.customer = stripeCustomerId;
  }

  await syncSubscription(subscription, eventId, liveMode, providerEventAt);
}

export async function POST(request: Request) {
  const log = startApiRequest(request, "/api/billing/stripe-webhook");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");

  if (!webhookSecret) {
    log.done(503, { outcome: "not_configured" });
    return NextResponse.json(
      { error: "Stripe webhook is not configured." },
      { status: 503 },
    );
  }

  if (!signature) {
    log.done(400, { outcome: "missing_signature" });
    return NextResponse.json(
      { error: "Missing Stripe signature." },
      { status: 400 },
    );
  }

  let event: Stripe.Event;
  let payload: string;

  try {
    payload = await request.text();
    event = getStripeClient().webhooks.constructEvent(
      payload,
      signature,
      webhookSecret,
    );
  } catch (error) {
    log.failed(error, 400, { outcome: "invalid_signature" });
    return NextResponse.json(
      { error: "Invalid Stripe signature." },
      { status: 400 },
    );
  }

  try {
    const claimed = await claimWebhookEvent({
      provider: "STRIPE",
      externalEventId: event.id,
      payloadHash: hashWebhookPayload(payload),
    });
    if (!claimed) {
      log.done(200, { outcome: "duplicate", provider: "stripe" });
      return NextResponse.json({ received: true, duplicate: true });
    }

    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(
          event.data.object,
          event.id,
          event.livemode,
          new Date(event.created * 1_000),
        );
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await syncSubscription(
          event.data.object,
          event.id,
          event.livemode,
          new Date(event.created * 1_000),
        );
        break;
      default:
        break;
    }

    await finishWebhookEvent({
      provider: "STRIPE",
      externalEventId: event.id,
      outcome: "SUCCEEDED",
    });
  } catch (error) {
    await finishWebhookEvent({
      provider: "STRIPE",
      externalEventId: event.id,
      outcome: "FAILED",
    });
    log.failed(error, 500, { outcome: "sync_failed", provider: "stripe" });
    return NextResponse.json(
      { error: "Stripe event could not be synchronized." },
      { status: 500 },
    );
  }

  log.done(200, { outcome: "succeeded", provider: "stripe" });
  return NextResponse.json({ received: true });
}
