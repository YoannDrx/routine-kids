"use server";

import { z } from "zod";

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
  pin: string;
}): Promise<ParentGateMutationResult> {
  const locale = await getCurrentAppLocale();
  const copy = getServerCopy(locale);
  const pinSchema = z.object({
    pin: z
      .string()
      .trim()
      .regex(/^\d{4}$/, copy.validation.parentPinFourDigits),
  });

  if (!isDatabaseConfigured()) {
    return {
      status: "error",
      message: copy.actions.dbNotConfiguredSecurity,
    };
  }

  const parsed = pinSchema.safeParse(input);

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

  if (!settings?.adminPinHash) {
    return {
      status: "error",
      message: copy.actions.parentPinMissingConfig,
      code: "parent_pin_not_configured",
    };
  }

  const pinValid = verifyParentPin(parsed.data.pin, settings.adminPinHash);

  if (!pinValid) {
    return {
      status: "error",
      message: copy.actions.parentPinIncorrect,
      code: "invalid_pin",
    };
  }

  await setParentStepUpCookie({
    userId: user.id,
    stepUpMinutes: settings.stepUpMinutes,
  });

  return {
    status: "success",
    message: copy.actions.parentAccessConfirmed,
  };
}
