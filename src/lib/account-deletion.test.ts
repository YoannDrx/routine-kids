import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  deletePrivateImages: vi.fn(),
  deleteRecord: vi.fn(),
  getSnapshot: vi.fn(),
  stripeCustomerDelete: vi.fn(),
  stripeSubscriptionCancel: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/account-data", () => ({
  collectHouseholdMediaReferences: () => [
    { reference: "rk-media:households/home/profile.webp" },
  ],
  deleteRoutineKidsAccountRecord: mocks.deleteRecord,
  getAccountDeletionSnapshot: mocks.getSnapshot,
}));
vi.mock("@/lib/media-storage", () => ({
  deletePrivateImages: mocks.deletePrivateImages,
}));
vi.mock("@/lib/stripe-billing", () => ({
  getStripeClient: () => ({
    customers: { del: mocks.stripeCustomerDelete },
    subscriptions: { cancel: mocks.stripeSubscriptionCancel },
  }),
}));

import {
  AccountDeletionError,
  deleteRoutineKidsAccount,
} from "@/lib/account-deletion";

describe("RoutineKids account deletion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.deletePrivateImages.mockResolvedValue(undefined);
  });

  it("stops before billing and data deletion when the household name differs", async () => {
    mocks.getSnapshot.mockResolvedValue({
      household: { name: "Famille Martin" },
      stripeCustomerId: "cus_family",
      subscription: null,
    });

    await expect(
      deleteRoutineKidsAccount({
        householdName: "Famille Durand",
        userId: "user-1",
      }),
    ).rejects.toEqual(new AccountDeletionError("household_name_mismatch"));

    expect(mocks.stripeCustomerDelete).not.toHaveBeenCalled();
    expect(mocks.deleteRecord).not.toHaveBeenCalled();
  });

  it("cancels Stripe first, then deletes account data and private media", async () => {
    mocks.getSnapshot.mockResolvedValue({
      household: { name: "Famille Martin" },
      stripeCustomerId: "cus_family",
      subscription: { stripeSubscriptionId: "sub_family" },
    });
    mocks.stripeCustomerDelete.mockResolvedValue({ deleted: true });
    mocks.deleteRecord.mockResolvedValue(undefined);

    await expect(
      deleteRoutineKidsAccount({
        householdName: "Famille Martin",
        userId: "user-1",
      }),
    ).resolves.toEqual({ cleanupPending: false });

    expect(mocks.stripeCustomerDelete).toHaveBeenCalledWith("cus_family");
    expect(mocks.stripeSubscriptionCancel).not.toHaveBeenCalled();
    expect(mocks.deleteRecord).toHaveBeenCalledWith("user-1");
    expect(mocks.deletePrivateImages).toHaveBeenCalledWith([
      "rk-media:households/home/profile.webp",
    ]);
  });
});
