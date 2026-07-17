import "server-only";

import { BillingPlan, SubscriptionStatus } from "@prisma/client";
import Stripe from "stripe";

import { ensureServerEnv } from "@/lib/env.server";

ensureServerEnv();

export type FamilyBillingInterval = "monthly" | "yearly";

let stripeClient: Stripe | null = null;

export function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured.");
  }

  stripeClient ??= new Stripe(secretKey, {
    apiVersion: "2026-06-24.dahlia",
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

  if (
    !price.active ||
    price.type !== "recurring" ||
    price.recurring?.interval !== (interval === "monthly" ? "month" : "year") ||
    price.currency !== "eur"
  ) {
    throw new Error(`The ${interval} Family Premium price is invalid.`);
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
  return toSubscriptionStatus(subscription.status) === SubscriptionStatus.CANCELED
    ? BillingPlan.FREE
    : BillingPlan.FAMILY_PLUS;
}
