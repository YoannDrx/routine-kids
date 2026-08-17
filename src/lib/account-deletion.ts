import "server-only";

import {
  collectHouseholdMediaReferences,
  deleteRoutineKidsAccountRecord,
  getAccountDeletionSnapshot,
} from "@/lib/account-data";
import { deletePrivateImages } from "@/lib/media-storage";
import { getStripeClient } from "@/lib/stripe-billing";

export type AccountDeletionFailureCode =
  | "household_not_found"
  | "household_name_mismatch"
  | "billing_cleanup_failed";

export class AccountDeletionError extends Error {
  constructor(readonly code: AccountDeletionFailureCode) {
    super(code);
    this.name = "AccountDeletionError";
  }
}

export async function deleteRoutineKidsAccount(input: {
  userId: string;
  householdName: string;
}) {
  const snapshot = await getAccountDeletionSnapshot(input.userId);

  if (!snapshot?.household) {
    throw new AccountDeletionError("household_not_found");
  }

  if (input.householdName !== snapshot.household.name) {
    throw new AccountDeletionError("household_name_mismatch");
  }

  try {
    if (snapshot.stripeCustomerId) {
      await getStripeClient().customers.del(snapshot.stripeCustomerId);
    } else if (snapshot.subscription?.stripeSubscriptionId) {
      await getStripeClient().subscriptions.cancel(
        snapshot.subscription.stripeSubscriptionId,
      );
    }
  } catch {
    throw new AccountDeletionError("billing_cleanup_failed");
  }

  const mediaReferences = collectHouseholdMediaReferences(snapshot.household).map(
    ({ reference }) => reference,
  );

  await deleteRoutineKidsAccountRecord(input.userId);

  let cleanupPending = false;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await deletePrivateImages(mediaReferences);
      cleanupPending = false;
      break;
    } catch {
      cleanupPending = true;
    }
  }

  if (cleanupPending) {
    console.error("routinekids_account_media_cleanup_failed", {
      mediaCount: mediaReferences.length,
    });
  }

  return { cleanupPending };
}
