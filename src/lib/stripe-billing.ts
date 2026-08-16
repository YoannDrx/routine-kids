import "server-only";

import {
  BillingEnvironment,
  BillingPlan,
  SubscriptionStatus,
} from "@prisma/client";
import Stripe from "stripe";

import { ensureServerEnv } from "@/lib/env.server";

ensureServerEnv();

export type FamilyBillingInterval = "monthly" | "yearly";

export const familyPriceConfiguration = {
  monthly: { amount: 499, currency: "eur", interval: "month" },
  yearly: { amount: 3_999, currency: "eur", interval: "year" },
} as const;

let stripeClient: Stripe | null = null;

export function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured.");
  }

  stripeClient ??= new Stripe(secretKey, {
    apiVersion: "2026-07-29.dahlia",
  });
  return stripeClient;
}

export function getFamilyPriceId(interval: FamilyBillingInterval) {
  const key =
    interval === "monthly"
      ? "STRIPE_FAMILY_PLUS_MONTHLY_PRICE_ID"
      : "STRIPE_FAMILY_PLUS_YEARLY_PRICE_ID";
  const priceId = process.env[key];

  if (!priceId) {
    throw new Error(`${key} is not configured.`);
  }

  return priceId;
}

export async function getValidatedFamilyPrice(
  interval: FamilyBillingInterval,
) {
  const stripe = getStripeClient();
  const price = await stripe.prices.retrieve(getFamilyPriceId(interval));
  const expected = familyPriceConfiguration[interval];

  if (
    !price.active ||
    price.type !== "recurring" ||
    price.recurring?.interval !== expected.interval ||
    price.currency !== expected.currency ||
    price.unit_amount !== expected.amount
  ) {
    throw new Error(`The ${interval} Family Plus price is invalid.`);
  }

  return price;
}

export function getAppUrl() {
  const configuredUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? process.env.BETTER_AUTH_URL;

  if (!configuredUrl) {
    throw new Error("NEXT_PUBLIC_APP_URL is not configured.");
  }

  return configuredUrl.replace(/\/$/, "");
}

export function getStripeBillingEnvironment(liveMode: boolean) {
  return liveMode
    ? BillingEnvironment.PRODUCTION
    : BillingEnvironment.TEST;
}

export function toSubscriptionStatus(status: Stripe.Subscription.Status) {
  switch (status) {
    case "active":
      return SubscriptionStatus.ACTIVE;
    case "trialing":
      return SubscriptionStatus.TRIALING;
    case "past_due":
    case "unpaid":
      return SubscriptionStatus.PAST_DUE;
    case "canceled":
    case "incomplete_expired":
      return SubscriptionStatus.CANCELED;
    case "incomplete":
    case "paused":
      return SubscriptionStatus.INCOMPLETE;
  }
}

export function getSubscriptionPeriod(subscription: Stripe.Subscription) {
  const periods = subscription.items.data.map((item) => ({
    start: item.current_period_start,
    end: item.current_period_end,
  }));
  const periodStart = periods.length
    ? Math.min(...periods.map((period) => period.start))
    : null;
  const periodEnd = periods.length
    ? Math.max(...periods.map((period) => period.end))
    : null;

  return {
    periodStart: periodStart ? new Date(periodStart * 1000) : null,
    periodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
  };
}

export function getLocalPlanForStripeSubscription(
  subscription: Stripe.Subscription,
) {
  if (toSubscriptionStatus(subscription.status) === SubscriptionStatus.CANCELED) {
    return BillingPlan.FREE;
  }

  const configuredPriceIds = new Set(
    [
      process.env.STRIPE_FAMILY_PLUS_MONTHLY_PRICE_ID,
      process.env.STRIPE_FAMILY_PLUS_YEARLY_PRICE_ID,
    ].filter((priceId): priceId is string => Boolean(priceId)),
  );
  const subscriptionPriceIds = subscription.items?.data.map(
    (item) => item.price.id,
  ) ?? [];

  if (
    configuredPriceIds.size === 0 ||
    !subscriptionPriceIds.some((priceId) => configuredPriceIds.has(priceId))
  ) {
    return BillingPlan.FREE;
  }

  return BillingPlan.FAMILY_PLUS;
}

export function getStripeSubscriptionProductId(
  subscription: Stripe.Subscription,
) {
  return subscription.items?.data.find((item) =>
    [
      process.env.STRIPE_FAMILY_PLUS_MONTHLY_PRICE_ID,
      process.env.STRIPE_FAMILY_PLUS_YEARLY_PRICE_ID,
    ].includes(item.price.id),
  )?.price.id ?? null;
}
