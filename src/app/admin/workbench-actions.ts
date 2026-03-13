"use server";

import { revalidatePath } from "next/cache";
import { RoutinePeriod } from "@prisma/client";
import { z } from "zod";

import { type AdminWorkbenchMutationResult } from "@/components/admin/workbench-types";
import { ensureHouseholdBaseline } from "@/lib/household-bootstrap";
import { getCurrentAppLocale } from "@/lib/i18n.server";
import { prisma } from "@/lib/prisma";
import {
  assignTaskTemplateToRoutine,
  deleteRoutineTaskFromProfile,
  upsertProfileRoutine,
} from "@/lib/routine-task-service";
import { getServerCopy } from "@/lib/server-copy";
import { getRequiredAdmin } from "@/lib/session";
import { deleteTaskTemplate, upsertTaskTemplate } from "@/lib/task-template-service";

function createTaskTemplateSchema(locale: "fr" | "en") {
  const copy = getServerCopy(locale);

  return z.object({
    templateId: z.string().trim().optional(),
    title: z
      .string()
      .trim()
      .min(2, copy.validation.titleMin)
      .max(60, copy.validation.titleTooLong),
    shortLabel: z
      .string()
      .trim()
      .min(1, copy.validation.shortLabelRequired)
      .max(20, copy.validation.shortLabelTooLong),
    icon: z.string().trim().min(1, copy.validation.chooseIcon),
    durationMinutes: z.coerce
      .number()
      .int()
      .min(1, copy.validation.durationMin)
      .max(60, copy.validation.durationMax),
  });
}

function createDeleteTaskTemplateSchema(locale: "fr" | "en") {
  const copy = getServerCopy(locale);

  return z.object({
    templateId: z.string().trim().min(1, copy.validation.templateNotFound),
  });
}

function createRoutineSchema(locale: "fr" | "en") {
  const copy = getServerCopy(locale);

  return z.object({
    childProfileId: z.string().trim().min(1, copy.validation.childProfileNotFound),
    period: z.enum(["morning", "evening"]),
    title: z
      .string()
      .trim()
      .min(2, copy.validation.titleMin)
      .max(60, copy.validation.titleTooLong),
  });
}

function createRoutineTaskSchema(locale: "fr" | "en") {
  const copy = getServerCopy(locale);

  return z.object({
    childProfileId: z.string().trim().min(1, copy.validation.childProfileNotFound),
    period: z.enum(["morning", "evening"]),
    templateId: z.string().trim().min(1, copy.validation.templateNotFound),
  });
}

function createDeleteRoutineTaskSchema(locale: "fr" | "en") {
  const copy = getServerCopy(locale);

  return z.object({
    childProfileId: z.string().trim().min(1, copy.validation.childProfileNotFound),
    routineTaskId: z.string().trim().min(1, copy.validation.routineTaskNotFound),
  });
}

async function getAdminActionContext(locale: "fr" | "en") {
  const user = await getRequiredAdmin();
  const copy = getServerCopy(locale);
  await ensureHouseholdBaseline({
    userId: user.id,
    userName: user.name,
  });

  const household = await prisma.household.findUnique({
    where: {
      ownerUserId: user.id,
    },
    select: {
      id: true,
    },
  });

  if (!household) {
    throw new Error(copy.actions.householdMissing);
  }

  return {
    user,
    household,
  };
}

function getRoutinePeriod(period: "morning" | "evening") {
  return period === "morning" ? RoutinePeriod.MORNING : RoutinePeriod.EVENING;
}

function revalidateAdminWorkbench() {
  revalidatePath("/");
  revalidatePath("/settings");
}

export async function upsertAdminTaskTemplateAction(input: {
  templateId?: string;
  title: string;
  shortLabel: string;
  icon: string;
  durationMinutes: number;
}): Promise<AdminWorkbenchMutationResult> {
  const locale = await getCurrentAppLocale();
  const copy = getServerCopy(locale);
  const parsed = createTaskTemplateSchema(locale).safeParse(input);

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? copy.actions.taskTemplateInvalid,
    };
  }

  try {
    const { user, household } = await getAdminActionContext(locale);
    const template = await upsertTaskTemplate({
      householdId: household.id,
      actorUserId: user.id,
      locale,
      templateId: parsed.data.templateId,
      title: parsed.data.title,
      shortLabel: parsed.data.shortLabel,
      icon: parsed.data.icon,
      durationMinutes: parsed.data.durationMinutes,
    });

    revalidateAdminWorkbench();

    return {
      status: "success",
      message: template.created
        ? copy.actions.taskTemplateAdded(template.title)
        : copy.actions.taskTemplateUpdated(template.title),
    };
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : copy.actions.taskTemplateSaveError,
    };
  }
}

export async function deleteAdminTaskTemplateAction(input: {
  templateId: string;
}): Promise<AdminWorkbenchMutationResult> {
  const locale = await getCurrentAppLocale();
  const copy = getServerCopy(locale);
  const parsed = createDeleteTaskTemplateSchema(locale).safeParse(input);

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? copy.actions.taskTemplateDeleteError,
    };
  }

  try {
    const { user, household } = await getAdminActionContext(locale);
    const deletedTemplate = await deleteTaskTemplate({
      householdId: household.id,
      actorUserId: user.id,
      locale,
      templateId: parsed.data.templateId,
    });

    revalidateAdminWorkbench();

    return {
      status: "success",
      message: copy.actions.taskTemplateDeleted(deletedTemplate.title),
    };
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : copy.actions.taskTemplateDeleteError,
    };
  }
}

export async function upsertAdminRoutineAction(input: {
  childProfileId: string;
  period: "morning" | "evening";
  title: string;
}): Promise<AdminWorkbenchMutationResult> {
  const locale = await getCurrentAppLocale();
  const copy = getServerCopy(locale);
  const parsed = createRoutineSchema(locale).safeParse(input);

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? copy.actions.routineInvalid,
    };
  }

  try {
    const { user, household } = await getAdminActionContext(locale);
    const routine = await upsertProfileRoutine({
      householdId: household.id,
      actorUserId: user.id,
      locale,
      childProfileId: parsed.data.childProfileId,
      period: getRoutinePeriod(parsed.data.period),
      title: parsed.data.title,
    });

    revalidateAdminWorkbench();

    return {
      status: "success",
      message: copy.actions.routineUpdated(routine.profileName, routine.title),
    };
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : copy.actions.routineSaveError,
    };
  }
}

export async function assignAdminRoutineTaskAction(input: {
  childProfileId: string;
  period: "morning" | "evening";
  templateId: string;
}): Promise<AdminWorkbenchMutationResult> {
  const locale = await getCurrentAppLocale();
  const copy = getServerCopy(locale);
  const parsed = createRoutineTaskSchema(locale).safeParse(input);

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? copy.actions.missionAssignError,
    };
  }

  try {
    const { user, household } = await getAdminActionContext(locale);
    const assignedTask = await assignTaskTemplateToRoutine({
      householdId: household.id,
      actorUserId: user.id,
      locale,
      childProfileId: parsed.data.childProfileId,
      templateId: parsed.data.templateId,
      period: getRoutinePeriod(parsed.data.period),
    });

    revalidateAdminWorkbench();

    return {
      status: "success",
      message: assignedTask.created
        ? copy.actions.missionAdded(assignedTask.title, assignedTask.profileName)
        : copy.actions.missionAlreadyPresent(assignedTask.title, assignedTask.profileName),
    };
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : copy.actions.missionAssignError,
    };
  }
}

export async function deleteAdminRoutineTaskAction(input: {
  childProfileId: string;
  routineTaskId: string;
}): Promise<AdminWorkbenchMutationResult> {
  const locale = await getCurrentAppLocale();
  const copy = getServerCopy(locale);
  const parsed = createDeleteRoutineTaskSchema(locale).safeParse(input);

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? copy.actions.missionDeleteError,
    };
  }

  try {
    const { user, household } = await getAdminActionContext(locale);
    const deletedTask = await deleteRoutineTaskFromProfile({
      householdId: household.id,
      actorUserId: user.id,
      locale,
      childProfileId: parsed.data.childProfileId,
      routineTaskId: parsed.data.routineTaskId,
    });

    revalidateAdminWorkbench();

    return {
      status: "success",
      message: copy.actions.missionRemoved(deletedTask.title),
    };
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : copy.actions.missionDeleteError,
    };
  }
}
