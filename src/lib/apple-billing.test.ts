import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  getAppleProductIds,
  isActiveAppleTransaction,
  toAppleSubscriptionStatus,
} from "@/lib/apple-billing";

describe("RoutineKids Apple billing", () => {
  it("only accepts configured StoreKit products that have not expired", () => {
    process.env.APPLE_FAMILY_PLUS_MONTHLY_PRODUCT_ID = "family.monthly";
    process.env.APPLE_FAMILY_PLUS_YEARLY_PRODUCT_ID = "family.yearly";

    expect(getAppleProductIds()).toEqual(
      new Set(["family.monthly", "family.yearly"]),
    );
    expect(
      isActiveAppleTransaction({
        productId: "family.monthly",
        expiresDate: Date.now() + 60_000,
      }),
    ).toBe(true);
    expect(
      isActiveAppleTransaction({
        productId: "unknown",
        expiresDate: Date.now() + 60_000,
      }),
    ).toBe(false);
    expect(
      isActiveAppleTransaction({
        productId: "family.monthly",
        expiresDate: Date.now() - 1,
      }),
    ).toBe(false);
  });

  it("maps App Store subscription states conservatively", () => {
    expect(toAppleSubscriptionStatus(1)).toBe("ACTIVE");
    expect(toAppleSubscriptionStatus(3)).toBe("PAST_DUE");
    expect(toAppleSubscriptionStatus(4)).toBe("PAST_DUE");
    expect(toAppleSubscriptionStatus(2)).toBe("CANCELED");
    expect(toAppleSubscriptionStatus(undefined)).toBe("CANCELED");
  });
});
