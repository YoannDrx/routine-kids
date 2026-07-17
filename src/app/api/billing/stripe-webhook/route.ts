import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { prisma } from "@/lib/prisma";
import {
  getLocalPlanForStripeSubscription,
  getStripeClient,
  getSubscriptionPeriod,
  toSubscriptionStatus,
} from "@/lib/stripe-billing";

export const runtime = "nodejs";

function getStripeId(value: string | { id: string } | null) {
  return typeof value === "string" ? value : value?.id ?? null;
}

async function resolveUserId(subscription: Stripe.Subscription) {
  if (subscription.metadata.userId) {
    return subscription.metadata.userId;
  }

  const existingSubscription = await prisma.subscription.findFirst({
    where: {
      OR: [
        { stripeSubscriptionId: subscription.id },
        { stripeCustomerId: getStripeId(subscription.customer) ?? undefined },
      ],
    },
    select: {
      referenceId: true,
    },
  });

  return existingSubscription?.referenceId ?? null;
}

async function syncSubscription(
  subscription: Stripe.Subscription,
  eventId: string,
) {
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

  await prisma.$transaction(async (transaction) => {
    if (household) {
      const processedEvent = await transaction.adminAuditLog.findFirst({
        where: {
          householdId: household.id,
          action: "STRIPE_SUBSCRIPTION_SYNCED",
          targetType: "StripeEvent",
          targetId: eventId,
        },
        select: { id: true },
      });

      if (processedEvent) return;
    }

    await transaction.subscription.upsert({
      where: {
        referenceId: userId,
      },
      update: {
        plan: getLocalPlanForStripeSubscription(subscription),
        status,
        stripeCustomerId,
        stripeSubscriptionId: subscription.id,
        periodStart: period.periodStart,
        periodEnd: period.periodEnd,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
      create: {
        id: `subscription_${userId}`,
        referenceId: userId,
        plan: getLocalPlanForStripeSubscription(subscription),
        status,
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
            plan: getLocalPlanForStripeSubscription(subscription),
          },
        },
      });
    }
  });
}

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
  eventId: string,
) {
  const userId = session.client_reference_id ?? session.metadata?.userId;
  const stripeSubscriptionId = getStripeId(session.subscription);
  const stripeCustomerId = getStripeId(session.customer);

  if (!userId || !stripeSubscriptionId) {
    throw new Error("Stripe Checkout is missing its internal reference.");
  }

  const stripe = getStripeClient();
  const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);

  if (!subscription.metadata.userId) {
    subscription.metadata.userId = userId;
  }

  if (stripeCustomerId && !subscription.customer) {
    subscription.customer = stripeCustomerId;
  }

  await syncSubscription(subscription, eventId);
}

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");

  if (!webhookSecret) {
    return NextResponse.json(
      { error: "Stripe webhook is not configured." },
      { status: 503 },
    );
  }

  if (!signature) {
    return NextResponse.json(
      { error: "Missing Stripe signature." },
      { status: 400 },
    );
  }

  let event: Stripe.Event;

  try {
    const payload = await request.text();
    event = getStripeClient().webhooks.constructEvent(
      payload,
      signature,
      webhookSecret,
    );
  } catch {
    return NextResponse.json(
      { error: "Invalid Stripe signature." },
      { status: 400 },
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object, event.id);
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await syncSubscription(event.data.object, event.id);
        break;
      default:
        break;
    }
  } catch {
    return NextResponse.json(
      { error: "Stripe event could not be synchronized." },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}
