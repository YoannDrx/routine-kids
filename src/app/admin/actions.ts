"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";

import { type CreateChildProfileState } from "@/components/admin/create-profile-form-state";
import { type UpdateChildProfileThemeState } from "@/components/admin/profile-theme-form-state";
import { type UpdateParentSecurityState } from "@/components/admin/parent-security-form-state";
import { type UpdateHouseholdSettingsState } from "@/components/admin/household-settings-form-state";
import { createChildProfileWithDefaults } from "@/lib/child-profile-service";
import { isDatabaseConfigured } from "@/lib/config";
import { ensureHouseholdBaseline } from "@/lib/household-bootstrap";
import {
  getHouseholdOverview,
  getToneFromAge,
} from "@/lib/household";
import {
  getParentSecurityRecord,
  hashParentPin,
  setParentStepUpCookie,
  verifyParentPin,
} from "@/lib/parent-security";
import { prisma } from "@/lib/prisma";
import { canCreateChildProfile } from "@/lib/product-entitlements";
import { getRequiredAdmin } from "@/lib/session";
import { localeCookieName } from "@/lib/i18n";
import { getCurrentAppLocale } from "@/lib/i18n.server";
import { getServerCopy } from "@/lib/server-copy";

function createChildProfileSchema(locale: "fr" | "en") {
  const copy = getServerCopy(locale);

  return z.object({
    name: z
      .string()
      .trim()
      .min(2, copy.validation.firstNameMin)
      .max(32, copy.validation.firstNameTooLong),
    age: z.coerce
      .number()
      .int()
      .min(2, copy.validation.ageMin)
      .max(12, copy.validation.ageMax),
    headline: z
      .string()
      .trim()
      .max(80, copy.validation.headlineTooLong)
      .optional()
      .or(z.literal("")),
    avatar: z
      .string()
      .trim()
      .max(16, copy.validation.avatarInvalid)
      .optional()
      .or(z.literal("")),
  });
}

function createUpdateHouseholdSettingsSchema(locale: "fr" | "en") {
  const copy = getServerCopy(locale);

  return z.object({
    name: z
      .string()
      .trim()
      .min(3, copy.validation.householdNameMin)
      .max(60, copy.validation.householdNameTooLong),
    locale: z.enum(["fr", "en"], {
      message: copy.validation.localeInvalid,
    }),
  });
}

function createUpdateChildProfileThemeSchema(locale: "fr" | "en") {
  const copy = getServerCopy(locale);

  return z.object({
    childProfileId: z.string().trim().min(1, copy.validation.childProfileNotFound),
    themePackId: z.string().trim().optional().or(z.literal("")),
  });
}

function createUpdateParentSecuritySchema(locale: "fr" | "en") {
  const copy = getServerCopy(locale);

  return z
    .object({
      currentPin: z.preprocess(
        (value) => (typeof value === "string" ? value : ""),
        z.string().trim().optional().or(z.literal("")),
      ),
      newPin: z.preprocess(
        (value) => (typeof value === "string" ? value : ""),
        z.string().trim().optional().or(z.literal("")),
      ),
      confirmPin: z.preprocess(
        (value) => (typeof value === "string" ? value : ""),
        z.string().trim().optional().or(z.literal("")),
      ),
      stepUpMinutes: z.coerce.number().int().min(10).max(60),
    })
    .superRefine((value, context) => {
      const hasNewPin = Boolean(value.newPin);
      const hasConfirmPin = Boolean(value.confirmPin);

      if (!hasNewPin && !hasConfirmPin) {
        return;
      }

      if (!/^\d{4}$/.test(value.newPin ?? "")) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["newPin"],
          message: copy.validation.newPinFourDigits,
        });
      }

      if ((value.newPin ?? "") !== (value.confirmPin ?? "")) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["confirmPin"],
          message: copy.validation.pinConfirmMismatch,
        });
      }
    });
}

export async function createChildProfileAction(
  _prevState: CreateChildProfileState,
  formData: FormData,
): Promise<CreateChildProfileState> {
  const locale = await getCurrentAppLocale();
  const copy = getServerCopy(locale);

  if (!isDatabaseConfigured()) {
    return {
      status: "error",
      message: copy.actions.dbNotConfiguredParentTools,
    };
  }

  const user = await getRequiredAdmin();
  await ensureHouseholdBaseline({
    userId: user.id,
    userName: user.name,
  });
  const parsed = createChildProfileSchema(locale).safeParse({
    name: formData.get("name"),
    age: formData.get("age"),
    headline: formData.get("headline"),
    avatar: formData.get("avatar"),
  });

  if (!parsed.success) {
    const flattened = parsed.error.flatten().fieldErrors;

    return {
      status: "error",
      message: copy.actions.profileFieldsInvalid,
      fieldErrors: {
        name: flattened.name?.[0],
        age: flattened.age?.[0],
        headline: flattened.headline?.[0],
      },
    };
  }

  const household = await getHouseholdOverview(user.id);

  if (!household) {
    return {
      status: "error",
      message: copy.actions.noHouseholdAttached,
    };
  }

  if (
    !(await canCreateChildProfile({
      userId: user.id,
      householdId: household.id,
    }))
  ) {
    return {
      status: "error",
      message: copy.actions.profileLimitReached,
    };
  }

  const name = parsed.data.name;
  const age = parsed.data.age;
  const avatar = parsed.data.avatar || "🚀";
  const headline = parsed.data.headline || null;

  await createChildProfileWithDefaults({
    householdId: household.id,
    actorUserId: user.id,
    name,
    age,
    avatar,
    headline,
    locale: household.locale === "en" ? "en" : "fr",
  });

  revalidatePath("/");
  revalidatePath("/settings");

  return {
    status: "success",
    message: copy.actions.profileAdded(name),
  };
}

export async function updateHouseholdSettingsAction(
  _prevState: UpdateHouseholdSettingsState,
  formData: FormData,
): Promise<UpdateHouseholdSettingsState> {
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

  const parsed = createUpdateHouseholdSettingsSchema(locale).safeParse({
    name: formData.get("name"),
    locale: formData.get("locale"),
  });

  if (!parsed.success) {
    const flattened = parsed.error.flatten().fieldErrors;

    return {
      status: "error",
      message: copy.actions.householdSettingsInvalid,
      fieldErrors: {
        name: flattened.name?.[0],
        locale: flattened.locale?.[0],
      },
    };
  }

  const household = await getHouseholdOverview(user.id);

  if (!household) {
    return {
      status: "error",
      message: copy.actions.householdMissing,
    };
  }

  const { name, locale: nextLocale } = parsed.data;

  await prisma.household.update({
    where: {
      id: household.id,
    },
    data: {
      name,
      locale: nextLocale,
    },
  });

  await prisma.adminAuditLog.create({
    data: {
      householdId: household.id,
      actorUserId: user.id,
      action: "HOUSEHOLD_UPDATED",
      targetType: "Household",
      targetId: household.id,
      metadata: {
        name,
        locale: nextLocale,
      },
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(localeCookieName, nextLocale, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });

  revalidatePath("/");
  revalidatePath("/settings");

  return {
    status: "success",
    message: copy.actions.householdSettingsUpdated,
  };
}

export async function updateChildProfileThemeAction(
  _prevState: UpdateChildProfileThemeState,
  formData: FormData,
): Promise<UpdateChildProfileThemeState> {
  const locale = await getCurrentAppLocale();
  const copy = getServerCopy(locale);

  if (!isDatabaseConfigured()) {
    return {
      status: "error",
      message: copy.actions.dbNotConfiguredThemes,
    };
  }

  const user = await getRequiredAdmin();
  await ensureHouseholdBaseline({
    userId: user.id,
    userName: user.name,
  });

  const parsed = createUpdateChildProfileThemeSchema(locale).safeParse({
    childProfileId: formData.get("childProfileId"),
    themePackId: formData.get("themePackId"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: copy.actions.themeChangeInvalid,
    };
  }

  const household = await getHouseholdOverview(user.id);

  if (!household) {
    return {
      status: "error",
      message: copy.actions.householdMissing,
    };
  }

  const profile = household.childProfiles.find(
    (item) => item.id === parsed.data.childProfileId,
  );

  if (!profile) {
    return {
      status: "error",
      message: copy.actions.profileNotInHousehold,
    };
  }

  const selectedThemeId = parsed.data.themePackId || null;
  const selectedTheme = selectedThemeId
    ? household.themePacks.find((theme) => theme.id === selectedThemeId)
    : null;

  if (selectedThemeId && !selectedTheme) {
    return {
      status: "error",
      message: copy.actions.themeNotFound,
    };
  }

  await prisma.childProfile.update({
    where: {
      id: profile.id,
    },
    data: {
      defaultThemeId: selectedTheme?.id ?? null,
      tone: selectedTheme?.tone ?? getToneFromAge(profile.age),
    },
  });

  await prisma.adminAuditLog.create({
    data: {
      householdId: household.id,
      actorUserId: user.id,
      action: "PROFILE_THEME_UPDATED",
      targetType: "ChildProfile",
      targetId: profile.id,
      metadata: {
        profileName: profile.name,
        themeId: selectedTheme?.id ?? null,
        themeSlug: selectedTheme?.slug ?? "auto",
      },
    },
  });

  revalidatePath("/");
  revalidatePath("/settings");

  return {
    status: "success",
    message: selectedTheme
      ? copy.actions.themeAssigned(profile.name, selectedTheme.name)
      : copy.actions.themeAuto(profile.name),
  };
}

export async function updateParentSecurityAction(
  _prevState: UpdateParentSecurityState,
  formData: FormData,
): Promise<UpdateParentSecurityState> {
  const locale = await getCurrentAppLocale();
  const copy = getServerCopy(locale);

  if (!isDatabaseConfigured()) {
    return {
      status: "error",
      message: copy.actions.dbNotConfiguredSecurity,
    };
  }

  const user = await getRequiredAdmin();
  await ensureHouseholdBaseline({
    userId: user.id,
    userName: user.name,
  });

  const parsed = createUpdateParentSecuritySchema(locale).safeParse({
    currentPin: formData.get("currentPin"),
    newPin: formData.get("newPin"),
    confirmPin: formData.get("confirmPin"),
    stepUpMinutes: formData.get("stepUpMinutes"),
  });

  if (!parsed.success) {
    const flattened = parsed.error.flatten().fieldErrors;

    return {
      status: "error",
      message: copy.actions.parentPinInvalidFields,
      fieldErrors: {
        currentPin: flattened.currentPin?.[0],
        newPin: flattened.newPin?.[0],
        confirmPin: flattened.confirmPin?.[0],
        stepUpMinutes: flattened.stepUpMinutes?.[0],
      },
    };
  }

  const household = await getHouseholdOverview(user.id);

  if (!household) {
    return {
      status: "error",
      message: copy.actions.householdMissing,
    };
  }

  const security = await getParentSecurityRecord(user.id);
  const newPin = parsed.data.newPin || null;

  if (security?.adminPinHash) {
    if (!parsed.data.currentPin) {
      return {
        status: "error",
        message: copy.actions.currentPinRequired,
        fieldErrors: {
          currentPin: copy.actions.currentPinFieldRequired,
        },
      };
    }

    const currentPinValid = verifyParentPin(
      parsed.data.currentPin,
      security.adminPinHash,
    );

    if (!currentPinValid) {
      return {
        status: "error",
        message: copy.actions.currentPinIncorrect,
        fieldErrors: {
          currentPin: copy.actions.currentPinFieldIncorrect,
        },
      };
    }
  } else if (!newPin) {
    return {
      status: "error",
      message: copy.actions.firstParentPinRequired,
      fieldErrors: {
        newPin: copy.actions.firstParentPinFieldRequired,
      },
    };
  }

  await prisma.parentSecuritySettings.update({
    where: {
      userId: user.id,
    },
    data: {
      adminPinHash: newPin ? hashParentPin(newPin) : security?.adminPinHash ?? null,
      stepUpMinutes: parsed.data.stepUpMinutes,
    },
  });

  await setParentStepUpCookie({
    userId: user.id,
    stepUpMinutes: parsed.data.stepUpMinutes,
  });

  await prisma.adminAuditLog.create({
    data: {
      householdId: household.id,
      actorUserId: user.id,
      action: "PARENT_SECURITY_UPDATED",
      targetType: "ParentSecuritySettings",
      targetId: user.id,
      metadata: {
        pinUpdated: Boolean(newPin),
        hadExistingPin: Boolean(security?.adminPinHash),
        stepUpMinutes: parsed.data.stepUpMinutes,
      },
    },
  });

  revalidatePath("/");
  revalidatePath("/settings");

  return {
    status: "success",
    message: newPin
      ? copy.actions.parentPinSaved
      : copy.actions.parentUnlockUpdated,
  };
}
