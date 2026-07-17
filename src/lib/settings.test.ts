import { BillingPlan, SubscriptionStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { isPremiumSubscription } from "@/lib/settings";

describe("RoutineKids product entitlements", () => {
  it("allows active and trialing premium plans", () => {
    expect(
      isPremiumSubscription(BillingPlan.FAMILY_PLUS, SubscriptionStatus.ACTIVE),
    ).toBe(true);
    expect(
      isPremiumSubscription(
        BillingPlan.FAMILY_PLUS,
        SubscriptionStatus.TRIALING,
      ),
    ).toBe(true);
  });

  it("blocks free, past-due and canceled access", () => {
    expect(
      isPremiumSubscription(BillingPlan.FREE, SubscriptionStatus.ACTIVE),
    ).toBe(false);
    expect(
      isPremiumSubscription(
        BillingPlan.FAMILY_PLUS,
        SubscriptionStatus.PAST_DUE,
      ),
    ).toBe(false);
    expect(
      isPremiumSubscription(
        BillingPlan.FAMILY_PLUS,
        SubscriptionStatus.CANCELED,
      ),
    ).toBe(false);
  });
});
