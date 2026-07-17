"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";

import { isDatabaseConfigured } from "@/lib/config";
import { ensureHouseholdBaseline } from "@/lib/household-bootstrap";
import {
  getHouseholdOverview,
  getOwnerSubscription,
} from "@/lib/household";
import { prisma } from "@/lib/prisma";
import { getRequiredAdmin } from "@/lib/session";
import { isPremiumSubscription, isSupportedLocale } from "@/lib/settings";
import { localeCookieName } from "@/lib/i18n";
import { getCurrentAppLocale } from "@/lib/i18n.server";
import {
  importPrototypeSnapshotToHousehold,
  type PrototypeImportSummary,
} from "@/lib/prototype/import-service";
import { getServerCopy } from "@/lib/server-copy";
import {
  collectHouseholdMediaReferences,
  deleteRoutineKidsAccountRecord,
  getAccountDeletionSnapshot,
} from "@/lib/account-data";
import { deletePrivateImages } from "@/lib/media-storage";
import {
  getAppUrl,
  getStripeClient,
  getValidatedFamilyPrice,
  type FamilyBillingInterval,
} from "@/lib/stripe-billing";

function createBoardSettingsSchema(locale: "fr" | "en") {
  const copy = getServerCopy(locale);
  const timeField = z
    .string()
    .trim()
    .regex(/^\d{2}:\d{2}$/, copy.validation.timeFormat);

  return z.object({
    locale: z.enum(["fr", "en"], {
      message: copy.validation.localeInvalid,
    }),
    soundsEnabled: z.boolean(),
    morningStart: timeField,
    morningEnd: timeField,
    eveningStart: timeField,
    eveningEnd: timeField,
  });
}

const premiumPlanSchema = z.object({
  interval: z.enum(["monthly", "yearly"]),
});

export type SettingsMutationResult = {
  status: "success" | "error";
  message: string;
  code?: "parent_pin_required" | "parent_pin_not_configured";
  checkoutUrl?: string;
  deleted?: boolean;
  cleanupPending?: boolean;
};

export type PrototypeImportMutationResult = {
  status: "success" | "error";
  message: string;
  summary?: PrototypeImportSummary;
};

function revalidateSettingsSurfaces() {
  revalidatePath("/");
  revalidatePath("/settings");
}

export async function updateBoardSettingsAction(input: {
  locale: "fr" | "en";
  soundsEnabled: boolean;
  morningStart: string;
  morningEnd: string;
  eveningStart: string;
  eveningEnd: string;
}): Promise<SettingsMutationResult> {
  const locale = await getCurrentAppLocale();
  const copy = getServerCopy(locale);

  if (!isDatabaseConfigured()) {
    return {
      status: "error",
      message: copy.actions.dbNotConfiguredSettings,
    };
  }

  const user = await getRequiredAdmin();
  await ensureHouseholdBaseline({
    userId: user.id,
    userName: user.name,
  });

  const household = await getHouseholdOverview(user.id);

  if (!household) {
    return {
      status: "error",
      message: copy.actions.householdMissing,
    };
  }

  const boardSettingsSchema = createBoardSettingsSchema(locale);
  const partialBoardSettingsSchema = boardSettingsSchema.partial();
  const parsed = partialBoardSettingsSchema.safeParse(input);

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? copy.actions.settingsInvalid,
    };
  }

  const mergedSettings = {
    locale: parsed.data.locale
      ?? (isSupportedLocale(household.locale) ? household.locale : "fr"),
    soundsEnabled: parsed.data.soundsEnabled ?? household.soundsEnabled,
    morningStart: parsed.data.morningStart ?? household.morningStart,
    morningEnd: parsed.data.morningEnd ?? household.morningEnd,
    eveningStart: parsed.data.eveningStart ?? household.eveningStart,
    eveningEnd: parsed.data.eveningEnd ?? household.eveningEnd,
  };

  const normalized = boardSettingsSchema.safeParse(mergedSettings);

  if (!normalized.success) {
    return {
      status: "error",
      message: normalized.error.issues[0]?.message ?? copy.actions.mergedSettingsInvalid,
    };
  }

  await prisma.$transaction([
    prisma.household.update({
      where: {
        id: household.id,
      },
      data: normalized.data,
    }),
    prisma.adminAuditLog.create({
      data: {
        householdId: household.id,
        actorUserId: user.id,
        action: "HOUSEHOLD_APP_SETTINGS_UPDATED",
        targetType: "Household",
        targetId: household.id,
        metadata: normalized.data,
      },
    }),
  ]);

  const cookieStore = await cookies();
  cookieStore.set(localeCookieName, normalized.data.locale, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });

  revalidateSettingsSurfaces();

  return {
    status: "success",
    message: copy.actions.settingsSaved,
  };
}

export async function activateBoardPremiumAction(input: {
  interval: FamilyBillingInterval;
}): Promise<SettingsMutationResult> {
  const locale = await getCurrentAppLocale();
  const copy = getServerCopy(locale);

  if (!isDatabaseConfigured()) {
    return {
      status: "error",
      message: copy.actions.dbNotConfiguredPremium,
    };
  }

  const parsed = premiumPlanSchema.safeParse(input);

  if (!parsed.success) {
    return {
      status: "error",
      message: copy.actions.invalidPremiumPlan,
    };
  }

  const user = await getRequiredAdmin();
  await ensureHouseholdBaseline({
    userId: user.id,
    userName: user.name,
  });

  const household = await getHouseholdOverview(user.id);
  const subscription = await getOwnerSubscription(user.id);

  if (!household || !subscription) {
    return {
      status: "error",
      message: copy.actions.premiumLoadError,
    };
  }

  try {
    const stripe = getStripeClient();
    const appUrl = getAppUrl();
    const price = await getValidatedFamilyPrice(parsed.data.interval);

    if (
      isPremiumSubscription(subscription.plan, subscription.status) &&
      subscription.stripeCustomerId
    ) {
      const portal = await stripe.billingPortal.sessions.create({
        customer: subscription.stripeCustomerId,
        return_url: `${appUrl}/settings?billing=portal-return`,
      });

      return {
        status: "success",
        message: copy.actions.premiumMonthlyActivated,
        checkoutUrl: portal.url,
      };
    }

    const checkout = await stripe.checkout.sessions.create({
      mode: "subscription",
      client_reference_id: user.id,
      customer: subscription.stripeCustomerId ?? undefined,
      customer_email: subscription.stripeCustomerId ? undefined : user.email,
      line_items: [
        {
          price: price.id,
          quantity: 1,
        },
      ],
      allow_promotion_codes: true,
      success_url: `${appUrl}/settings?billing=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/settings?billing=cancelled`,
      metadata: {
        userId: user.id,
        householdId: household.id,
        billingInterval: parsed.data.interval,
      },
      subscription_data: {
        metadata: {
          userId: user.id,
          householdId: household.id,
        },
      },
    });

    if (!checkout.url) {
      throw new Error("Stripe Checkout did not return a redirect URL.");
    }

    await prisma.adminAuditLog.create({
      data: {
        householdId: household.id,
        actorUserId: user.id,
        action: "STRIPE_CHECKOUT_CREATED",
        targetType: "Subscription",
        targetId: user.id,
        metadata: {
          checkoutSessionId: checkout.id,
          billingInterval: parsed.data.interval,
          previousPlan: subscription.plan,
        },
      },
    });

    return {
      status: "success",
      message: copy.actions.premiumMonthlyActivated,
      checkoutUrl: checkout.url,
    };
  } catch {
    return {
      status: "error",
      message: copy.actions.premiumLoadError,
    };
  }
}

export async function openBillingPortalAction(): Promise<SettingsMutationResult> {
  const locale = await getCurrentAppLocale();
  const copy = getServerCopy(locale);

  if (!isDatabaseConfigured()) {
    return {
      status: "error",
      message: copy.actions.dbNotConfiguredPremium,
    };
  }

  const user = await getRequiredAdmin();
  const subscription = await getOwnerSubscription(user.id);

  if (!subscription?.stripeCustomerId) {
    return {
      status: "error",
      message: copy.actions.premiumLoadError,
    };
  }

  try {
    const portal = await getStripeClient().billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${getAppUrl()}/settings?billing=portal-return`,
    });

    return {
      status: "success",
      message: copy.actions.premiumMonthlyActivated,
      checkoutUrl: portal.url,
    };
  } catch {
    return {
      status: "error",
      message: copy.actions.premiumLoadError,
    };
  }
}

export async function importPrototypeSnapshotAction(input: {
  snapshot: string;
}): Promise<PrototypeImportMutationResult> {
  const locale = await getCurrentAppLocale();
  const copy = getServerCopy(locale);

  if (!isDatabaseConfigured()) {
    return {
      status: "error",
      message: copy.actions.dbNotConfiguredParentTools,
    };
  }

  if (!input.snapshot.trim()) {
    return {
      status: "error",
      message: copy.actions.prototypeImportEmpty,
    };
  }

  const user = await getRequiredAdmin();
  await ensureHouseholdBaseline({
    userId: user.id,
    userName: user.name,
  });

  const [household, subscription] = await Promise.all([
    getHouseholdOverview(user.id),
    getOwnerSubscription(user.id),
  ]);

  if (!household || !subscription) {
    return {
      status: "error",
      message: copy.actions.householdMissing,
    };
  }

  try {
    const summary = await importPrototypeSnapshotToHousehold({
      householdId: household.id,
      actorUserId: user.id,
      currentPlan: subscription.plan,
      snapshot: input.snapshot,
      locale,
    });

    if (!summary) {
      return {
        status: "error",
        message: copy.actions.prototypeImportEmpty,
      };
    }

    const nextLocale =
      summary.language === "en" || summary.language === "fr"
        ? summary.language
        : household.locale === "en"
          ? "en"
          : "fr";
    const cookieStore = await cookies();
    cookieStore.set(localeCookieName, nextLocale, {
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
    });

    revalidateSettingsSurfaces();

    return {
      status: "success",
      message: copy.actions.prototypeImported(
        summary.profileCount,
        summary.templateCount,
      ),
      summary,
    };
  } catch {
    return {
      status: "error",
      message: copy.actions.prototypeImportInvalid,
    };
  }
}

export async function deleteRoutineKidsAccountAction(input: {
  householdName: string;
  confirmation: string;
}): Promise<SettingsMutationResult> {
  const locale = await getCurrentAppLocale();
  const copy = getServerCopy(locale);
  const parsed = z.object({
    householdName: z.string().trim().min(1).max(60),
    confirmation: z.literal("DELETE"),
  }).safeParse(input);

  if (!parsed.success) {
    return { status: "error", message: copy.actions.accountDeleteConfirmationInvalid };
  }

  const user = await getRequiredAdmin();
  const snapshot = await getAccountDeletionSnapshot(user.id);

  if (!snapshot?.household) {
    return { status: "error", message: copy.actions.householdMissing };
  }

  if (parsed.data.householdName !== snapshot.household.name) {
    return { status: "error", message: copy.actions.accountDeleteHouseholdMismatch };
  }

  try {
    if (snapshot.stripeCustomerId) {
      const stripe = getStripeClient();
      await stripe.customers.del(snapshot.stripeCustomerId);
    } else if (snapshot.subscription?.stripeSubscriptionId) {
      const stripe = getStripeClient();
      await stripe.subscriptions.cancel(snapshot.subscription.stripeSubscriptionId);
    }
  } catch {
    return { status: "error", message: copy.actions.accountDeleteBillingError };
  }

  const mediaReferences = collectHouseholdMediaReferences(snapshot.household)
    .map(({ reference }) => reference);

  await deleteRoutineKidsAccountRecord(user.id);

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

  return {
    status: "success",
    message: cleanupPending
      ? copy.actions.accountDeletedCleanupPending
      : copy.actions.accountDeleted,
    deleted: true,
    cleanupPending,
  };
}
