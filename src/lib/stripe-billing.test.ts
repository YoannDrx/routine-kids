import { BillingPlan, SubscriptionStatus } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/env.server", () => ({ ensureServerEnv: vi.fn() }));

import {
  familyPriceConfiguration,
  getLocalPlanForStripeSubscription,
  getSubscriptionPeriod,
  toSubscriptionStatus,
} from "@/lib/stripe-billing";

describe("RoutineKids Stripe billing", () => {
  it("locks the public Family Plus prices against legacy catalog values", () => {
    expect(familyPriceConfiguration).toEqual({
      monthly: { amount: 499, currency: "eur", interval: "month" },
      yearly: { amount: 3_999, currency: "eur", interval: "year" },
    });
  });

  it("maps Stripe statuses to explicit product states", () => {
    expect(toSubscriptionStatus("active")).toBe(SubscriptionStatus.ACTIVE);
    expect(toSubscriptionStatus("trialing")).toBe(SubscriptionStatus.TRIALING);
    expect(toSubscriptionStatus("past_due")).toBe(
      SubscriptionStatus.PAST_DUE,
    );
    expect(toSubscriptionStatus("unpaid")).toBe(
      SubscriptionStatus.PAST_DUE,
    );
    expect(toSubscriptionStatus("canceled")).toBe(
      SubscriptionStatus.CANCELED,
    );
    expect(toSubscriptionStatus("incomplete")).toBe(
      SubscriptionStatus.INCOMPLETE,
    );
  });

  it("uses the complete item range for multi-item subscriptions", () => {
    const period = getSubscriptionPeriod({
      items: {
        data: [
          { current_period_start: 200, current_period_end: 500 },
          { current_period_start: 100, current_period_end: 600 },
        ],
      },
    } as never);

    expect(period.periodStart).toEqual(new Date(100_000));
    expect(period.periodEnd).toEqual(new Date(600_000));
  });

  it("grants Family Premium only while the subscription is not canceled", () => {
    process.env.STRIPE_FAMILY_PLUS_MONTHLY_PRICE_ID = "price_family_monthly";
    expect(
      getLocalPlanForStripeSubscription({
        status: "active",
        items: { data: [{ price: { id: "price_family_monthly" } }] },
      } as never),
    ).toBe(BillingPlan.FAMILY_PLUS);
    expect(
      getLocalPlanForStripeSubscription({
        status: "canceled",
        items: { data: [{ price: { id: "price_family_monthly" } }] },
      } as never),
    ).toBe(BillingPlan.FREE);
    expect(
      getLocalPlanForStripeSubscription({
        status: "active",
        items: { data: [{ price: { id: "price_unknown" } }] },
      } as never),
    ).toBe(BillingPlan.FREE);
  });
});
