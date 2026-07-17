import { BillingPlan, SubscriptionStatus } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/env.server", () => ({ ensureServerEnv: vi.fn() }));

import {
  getLocalPlanForStripeSubscription,
  getSubscriptionPeriod,
  toSubscriptionStatus,
} from "@/lib/stripe-billing";

describe("RoutineKids Stripe billing", () => {
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
    expect(
      getLocalPlanForStripeSubscription({ status: "active" } as never),
    ).toBe(BillingPlan.FAMILY_PLUS);
    expect(
      getLocalPlanForStripeSubscription({ status: "canceled" } as never),
    ).toBe(BillingPlan.FREE);
  });
});
