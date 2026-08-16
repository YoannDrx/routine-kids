import {
  BillingEnvironment,
  BillingPlan,
  BillingProvider,
  SubscriptionStatus,
} from "@prisma/client";
import { describe, expect, it } from "vitest";

import { isPremiumSubscription } from "@/lib/settings";

const future = new Date("2026-09-01T00:00:00.000Z");
const now = new Date("2026-08-16T00:00:00.000Z");

function subscription(
  overrides: Partial<NonNullable<Parameters<typeof isPremiumSubscription>[0]>> = {},
) {
  return {
    plan: BillingPlan.FAMILY_PLUS,
    status: SubscriptionStatus.ACTIVE,
    provider: BillingProvider.STRIPE,
    environment: BillingEnvironment.PRODUCTION,
    periodEnd: future,
    revokedAt: null,
    ...overrides,
  };
}

describe("RoutineKids product entitlements", () => {
  it("allows verified active and trialing Family Plus subscriptions", () => {
    expect(
      isPremiumSubscription(subscription(), { now, productionRuntime: true }),
    ).toBe(true);
    expect(
      isPremiumSubscription(
        subscription({
          provider: BillingProvider.APPLE,
          environment: BillingEnvironment.TEST,
          status: SubscriptionStatus.TRIALING,
        }),
        { now, productionRuntime: true },
      ),
    ).toBe(true);
  });

  it("blocks free, legacy Family and provider-less subscriptions", () => {
    expect(
      isPremiumSubscription(subscription({ plan: BillingPlan.FREE }), {
        now,
        productionRuntime: true,
      }),
    ).toBe(false);
    expect(
      isPremiumSubscription(subscription({ plan: BillingPlan.FAMILY }), {
        now,
        productionRuntime: true,
      }),
    ).toBe(false);
    expect(
      isPremiumSubscription(subscription({ provider: BillingProvider.NONE }), {
        now,
        productionRuntime: true,
      }),
    ).toBe(false);
  });

  it("blocks invalid states, expired periods and revoked purchases", () => {
    for (const status of [
      SubscriptionStatus.PAST_DUE,
      SubscriptionStatus.CANCELED,
      SubscriptionStatus.INCOMPLETE,
    ]) {
      expect(
        isPremiumSubscription(subscription({ status }), {
          now,
          productionRuntime: true,
        }),
      ).toBe(false);
    }

    expect(
      isPremiumSubscription(
        subscription({ periodEnd: new Date("2026-08-15T23:59:59.000Z") }),
        { now, productionRuntime: true },
      ),
    ).toBe(false);
    expect(
      isPremiumSubscription(subscription({ revokedAt: now }), {
        now,
        productionRuntime: true,
      }),
    ).toBe(false);
  });

  it("never grants Stripe test entitlements in production", () => {
    const testSubscription = subscription({
      environment: BillingEnvironment.TEST,
    });

    expect(
      isPremiumSubscription(testSubscription, {
        now,
        productionRuntime: true,
      }),
    ).toBe(false);
    expect(
      isPremiumSubscription(testSubscription, {
        now,
        productionRuntime: false,
      }),
    ).toBe(true);
  });
});
