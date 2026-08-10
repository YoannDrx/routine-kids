"use server";

import { z } from "zod";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/config";
import { ensureHouseholdBaseline } from "@/lib/household-bootstrap";
import {
  getParentSecurityRecord,
  setParentStepUpCookie,
  verifyParentPin,
} from "@/lib/parent-security";
import { getCurrentAppLocale } from "@/lib/i18n.server";
import { getRequiredAdmin } from "@/lib/session";
import { getServerCopy } from "@/lib/server-copy";

export type ParentGateMutationResult = {
  status: "success" | "error";
  message: string;
  code?: "parent_pin_required" | "parent_pin_not_configured" | "invalid_pin";
};

export async function validateParentPinAction(input: {
  credential: string;
}): Promise<ParentGateMutationResult> {
  const locale = await getCurrentAppLocale();
  const copy = getServerCopy(locale);
  const credentialSchema = z.object({
    credential: z
      .string()
      .trim()
      .min(1, copy.validation.parentPinFourDigits)
      .max(128, copy.validation.parentPinFourDigits),
  });

  if (!isDatabaseConfigured()) {
    return {
      status: "error",
      message: copy.actions.dbNotConfiguredSecurity,
    };
  }

  const parsed = credentialSchema.safeParse(input);

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? copy.actions.invalidParentPin,
      code: "invalid_pin",
    };
  }

  const user = await getRequiredAdmin();
  await ensureHouseholdBaseline({
    userId: user.id,
    userName: user.name,
  });

  const settings = await getParentSecurityRecord(user.id);

  if (!settings) {
    return {
      status: "error",
      message: copy.actions.parentPinMissingConfig,
      code: "parent_pin_not_configured",
    };
  }

  if (!settings.adminPinHash) {
    try {
      const verified = await auth.api.verifyPassword({
        body: { password: parsed.data.credential },
        headers: await headers(),
      });

      if (!verified.status) {
        throw new Error("Password verification failed.");
      }
    } catch {
      return {
        status: "error",
        message: copy.actions.parentPinIncorrect,
        code: "invalid_pin",
      };
    }
  } else {
    if (!/^\d{4}$/.test(parsed.data.credential)) {
      return {
        status: "error",
        message: copy.validation.parentPinFourDigits,
        code: "invalid_pin",
      };
    }

    const pinValid = verifyParentPin(
      parsed.data.credential,
      settings.adminPinHash,
    );

    if (!pinValid) {
      return {
        status: "error",
        message: copy.actions.parentPinIncorrect,
        code: "invalid_pin",
      };
    }
  }

  await setParentStepUpCookie({
    userId: user.id,
    stepUpMinutes: settings.stepUpMinutes,
    securityVersion: settings.updatedAt.getTime(),
  });

  return {
    status: "success",
    message: copy.actions.parentAccessConfirmed,
  };
}
