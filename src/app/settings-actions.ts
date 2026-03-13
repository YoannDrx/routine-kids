"use server";

import { BillingPlan } from "@prisma/client";
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
import { isSupportedLocale } from "@/lib/settings";
import { localeCookieName } from "@/lib/i18n";
import { getCurrentAppLocale } from "@/lib/i18n.server";
import {
  importPrototypeSnapshotToHousehold,
  type PrototypeImportSummary,
} from "@/lib/prototype/import-service";
import { getServerCopy } from "@/lib/server-copy";

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
  plan: z.enum(["family", "family_plus"]),
});

export type SettingsMutationResult = {
  status: "success" | "error";
  message: string;
  code?: "parent_pin_required" | "parent_pin_not_configured";
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

  await prisma.household.update({
    where: {
      id: household.id,
    },
    data: normalized.data,
  });

  await prisma.adminAuditLog.create({
    data: {
      householdId: household.id,
      actorUserId: user.id,
      action: "HOUSEHOLD_APP_SETTINGS_UPDATED",
      targetType: "Household",
      targetId: household.id,
      metadata: normalized.data,
    },
  });

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
  plan: "family" | "family_plus";
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

  const nextPlan =
    parsed.data.plan === "family" ? BillingPlan.FAMILY : BillingPlan.FAMILY_PLUS;

  await prisma.subscription.update({
    where: {
      referenceId: user.id,
    },
    data: {
      plan: nextPlan,
      status: "ACTIVE",
    },
  });

  await prisma.adminAuditLog.create({
    data: {
      householdId: household.id,
      actorUserId: user.id,
      action: "SUBSCRIPTION_PLAN_UPDATED",
      targetType: "Subscription",
      targetId: user.id,
      metadata: {
        previousPlan: subscription.plan,
        nextPlan,
        source: "settings-board",
      },
    },
  });

  revalidateSettingsSurfaces();

  return {
    status: "success",
    message:
      nextPlan === BillingPlan.FAMILY_PLUS
        ? copy.actions.premiumLifetimeActivated
        : copy.actions.premiumMonthlyActivated,
  };
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
