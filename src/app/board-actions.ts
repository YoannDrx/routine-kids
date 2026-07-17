"use server";

import { revalidatePath } from "next/cache";
import { RoutinePeriod } from "@prisma/client";
import { z } from "zod";

import {
  createChildProfileWithDefaults,
  deleteChildProfileCascade,
  removeChildProfilePhoto,
  updateChildProfileAvatar,
  updateChildProfileDetails,
  updateChildProfilePhoto,
} from "@/lib/child-profile-service";
import { getDayKey } from "@/lib/day-key";
import { ensureHouseholdBaseline } from "@/lib/household-bootstrap";
import { getCurrentAppLocale } from "@/lib/i18n.server";
import {
  deriveJourneyStateFromRoutines,
  getCompletedDayKeysFromRoutines,
} from "@/lib/journey";
import { prisma } from "@/lib/prisma";
import {
  canAssignTemplatesToPeriods,
  canCreateChildProfile,
} from "@/lib/product-entitlements";
import {
  assignTaskTemplatesToPeriods,
  deleteRoutineTaskFromProfile,
  reorderRoutineTasksForProfile,
  removeRoutineTaskDayFromProfile,
} from "@/lib/routine-task-service";
import { getServerCopy } from "@/lib/server-copy";
import { getRequiredAdmin, getRequiredUser } from "@/lib/session";
import {
  deleteTaskTemplate,
  upsertTaskTemplate,
} from "@/lib/task-template-service";

function createToggleBoardTaskSchema(locale: "fr" | "en") {
  const copy = getServerCopy(locale);

  return z.object({
    childProfileId: z
      .string()
      .trim()
      .min(1, copy.validation.childProfileNotFound),
    taskId: z.string().trim().min(1, copy.validation.routineTaskNotFound),
    dayKey: z.string().trim().min(1, copy.validation.routineTaskNotFound),
    completed: z.boolean(),
  });
}

function createBoardProfileSchema(locale: "fr" | "en") {
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
    avatar: z
      .string()
      .trim()
      .min(1, copy.validation.avatarInvalid)
      .max(16, copy.validation.avatarInvalid),
    photoUrl: z
      .union([
        z
          .string()
          .trim()
          .startsWith("data:image/", copy.validation.photoInvalid)
          .max(1_500_000, copy.validation.photoTooLarge),
        z.literal(""),
        z.null(),
        z.undefined(),
      ])
      .transform((value) =>
        typeof value === "string" && value.length > 0 ? value : null,
      ),
    headline: z
      .string()
      .trim()
      .max(80, copy.validation.headlineTooLong)
      .optional()
      .or(z.literal("")),
  });
}

function createUpdateBoardProfileSchema(locale: "fr" | "en") {
  const copy = getServerCopy(locale);

  return createBoardProfileSchema(locale).extend({
    childProfileId: z
      .string()
      .trim()
      .min(1, copy.validation.childProfileNotFound),
  });
}

function createUpdateBoardProfileAvatarSchema(locale: "fr" | "en") {
  const copy = getServerCopy(locale);

  return z.object({
    childProfileId: z
      .string()
      .trim()
      .min(1, copy.validation.childProfileNotFound),
    avatar: z
      .string()
      .trim()
      .min(1, copy.validation.avatarInvalid)
      .max(16, copy.validation.avatarInvalid),
  });
}

function createUpdateBoardProfilePhotoSchema(locale: "fr" | "en") {
  const copy = getServerCopy(locale);

  return z.object({
    childProfileId: z
      .string()
      .trim()
      .min(1, copy.validation.childProfileNotFound),
    photoUrl: z
      .string()
      .trim()
      .startsWith("data:image/", copy.validation.photoInvalid)
      .max(1_500_000, copy.validation.photoTooLarge),
  });
}

function createDeleteBoardProfileSchema(locale: "fr" | "en") {
  const copy = getServerCopy(locale);

  return z.object({
    childProfileId: z
      .string()
      .trim()
      .min(1, copy.validation.childProfileNotFound),
  });
}

function createTaskTemplateSchema(locale: "fr" | "en") {
  const copy = getServerCopy(locale);
  const photoField = z
    .union([
      z
        .string()
        .trim()
        .startsWith("data:image/", copy.validation.photoInvalid)
        .max(1_500_000, copy.validation.photoTooLarge),
      z.literal(""),
      z.null(),
      z.undefined(),
    ])
    .transform((value) =>
      typeof value === "string" && value.length > 0 ? value : null,
    );

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
    imageUrl: photoField.optional(),
    color: z
      .string()
      .trim()
      .max(32, copy.validation.photoInvalid)
      .optional()
      .or(z.literal("")),
    durationMinutes: z.coerce
      .number()
      .int()
      .min(1, copy.validation.durationMin)
      .max(60, copy.validation.durationMax),
  });
}

function createAssignTemplateSchema(locale: "fr" | "en") {
  const copy = getServerCopy(locale);

  return z.object({
    childProfileId: z
      .string()
      .trim()
      .min(1, copy.validation.childProfileNotFound),
    templateId: z.string().trim().min(1, copy.validation.templateNotFound),
    period: z.enum(["morning", "evening", "both"]),
    scheduleDays: z.array(z.number().int().min(0).max(6)).optional(),
  });
}

function createAssignManyTemplatesSchema(locale: "fr" | "en") {
  const copy = getServerCopy(locale);

  return z.object({
    childProfileId: z
      .string()
      .trim()
      .min(1, copy.validation.childProfileNotFound),
    templateIds: z
      .array(z.string().trim().min(1))
      .min(1, copy.validation.chooseMission),
    period: z.enum(["morning", "evening", "both"]),
    scheduleDays: z.array(z.number().int().min(0).max(6)).optional(),
  });
}

function createDeleteRoutineTaskSchema(locale: "fr" | "en") {
  const copy = getServerCopy(locale);

  return z.object({
    childProfileId: z
      .string()
      .trim()
      .min(1, copy.validation.childProfileNotFound),
    routineTaskId: z
      .string()
      .trim()
      .min(1, copy.validation.routineTaskNotFound),
  });
}

function createDeleteRoutineTaskDaySchema(locale: "fr" | "en") {
  const copy = getServerCopy(locale);

  return z.object({
    childProfileId: z
      .string()
      .trim()
      .min(1, copy.validation.childProfileNotFound),
    routineTaskId: z
      .string()
      .trim()
      .min(1, copy.validation.routineTaskNotFound),
    day: z.number().int().min(0).max(6),
  });
}

function createReorderRoutineTasksSchema(locale: "fr" | "en") {
  const copy = getServerCopy(locale);

  return z.object({
    childProfileId: z
      .string()
      .trim()
      .min(1, copy.validation.childProfileNotFound),
    period: z.enum(["morning", "evening"]),
    orderedTaskIds: z
      .array(z.string().trim().min(1, copy.validation.routineTaskNotFound))
      .min(1, copy.validation.chooseMission),
  });
}

function createDeleteTaskTemplateSchema(locale: "fr" | "en") {
  const copy = getServerCopy(locale);

  return z.object({
    templateId: z.string().trim().min(1, copy.validation.templateNotFound),
  });
}

export type BoardProfileMutationResult = {
  status: "success" | "error";
  message: string;
  profileId?: string;
  code?: "parent_pin_required" | "parent_pin_not_configured";
};

export type BoardTaskMutationResult = {
  status: "success" | "error";
  message: string;
  code?: "parent_pin_required" | "parent_pin_not_configured";
};

export type BoardTaskToggleResult = {
  childProfileId: string;
  streak: number;
  journey: ReturnType<typeof deriveJourneyStateFromRoutines>;
};

type BoardAdminAccess =
  | {
      user: Awaited<ReturnType<typeof getRequiredAdmin>>;
      household: {
        id: string;
        locale: "fr" | "en";
      };
    }
  | {
      error: BoardProfileMutationResult | BoardTaskMutationResult;
    };

async function getRequiredAdminHousehold(
  locale: "fr" | "en",
): Promise<BoardAdminAccess> {
  const copy = getServerCopy(locale);
  const user = await getRequiredAdmin();
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
      locale: true,
    },
  });

  if (!household) {
    return {
      error: {
        status: "error" as const,
        message: copy.actions.householdMissing,
      },
    };
  }

  return {
    user,
    household: {
      id: household.id,
      locale: household.locale === "en" ? "en" : "fr",
    },
  };
}

function revalidateBoardSurfaces() {
  revalidatePath("/");
  revalidatePath("/settings");
}

function getRoutinePeriod(period: "morning" | "evening") {
  return period === "morning" ? RoutinePeriod.MORNING : RoutinePeriod.EVENING;
}

function getRoutinePeriods(period: "morning" | "evening" | "both") {
  if (period === "both") {
    return [RoutinePeriod.MORNING, RoutinePeriod.EVENING] as const;
  }

  return [getRoutinePeriod(period)] as const;
}

export async function toggleBoardTaskAction(input: {
  childProfileId: string;
  taskId: string;
  dayKey?: string;
  completed: boolean;
}): Promise<BoardTaskToggleResult> {
  const locale = await getCurrentAppLocale();
  const copy = getServerCopy(locale);
  const user = await getRequiredUser();
  const parsed = createToggleBoardTaskSchema(locale).safeParse({
    ...input,
    dayKey: input.dayKey ?? getDayKey(),
  });

  if (!parsed.success) {
    throw new Error(
      parsed.error.issues[0]?.message ?? copy.actions.missionAssignError,
    );
  }

  const { profileId, journey } = await prisma.$transaction(async (tx) => {
    const household = await tx.household.findUnique({
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

    const task = await tx.routineTask.findFirst({
      where: {
        id: parsed.data.taskId,
        routine: {
          householdId: household.id,
          childProfileId: parsed.data.childProfileId,
        },
      },
      select: {
        id: true,
      },
    });

    if (!task) {
      throw new Error(copy.actions.missionDeleteError);
    }

    await tx.taskCompletion.updateMany({
      where: {
        childProfileId: parsed.data.childProfileId,
        dayKey: parsed.data.dayKey,
        streakSnapshot: {
          not: null,
        },
      },
      data: {
        streakSnapshot: null,
      },
    });

    if (parsed.data.completed) {
      await tx.taskCompletion.upsert({
        where: {
          taskId_childProfileId_dayKey: {
            taskId: parsed.data.taskId,
            childProfileId: parsed.data.childProfileId,
            dayKey: parsed.data.dayKey,
          },
        },
        update: {
          completedAt: new Date(),
        },
        create: {
          taskId: parsed.data.taskId,
          childProfileId: parsed.data.childProfileId,
          dayKey: parsed.data.dayKey,
        },
      });
    } else {
      await tx.taskCompletion.deleteMany({
        where: {
          taskId: parsed.data.taskId,
          childProfileId: parsed.data.childProfileId,
          dayKey: parsed.data.dayKey,
        },
      });
    }

    const profile = await tx.childProfile.findFirst({
      where: {
        id: parsed.data.childProfileId,
        householdId: household.id,
      },
      select: {
        id: true,
        routines: {
          where: {
            isArchived: false,
          },
          include: {
            tasks: {
              include: {
                completions: {
                  select: {
                    dayKey: true,
                    childProfileId: true,
                    streakSnapshot: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!profile) {
      throw new Error(copy.actions.profileNotInHousehold);
    }

    const nextJourney = deriveJourneyStateFromRoutines(
      profile.routines,
      profile.id,
      parsed.data.dayKey,
    );
    const dayIsComplete = getCompletedDayKeysFromRoutines(
      profile.routines,
      profile.id,
      parsed.data.dayKey,
    ).includes(parsed.data.dayKey);

    if (dayIsComplete) {
      await tx.taskCompletion.updateMany({
        where: {
          childProfileId: parsed.data.childProfileId,
          dayKey: parsed.data.dayKey,
        },
        data: {
          streakSnapshot: nextJourney.streak,
        },
      });
    }

    return {
      profileId: profile.id,
      journey: nextJourney,
    };
  });

  revalidatePath("/");

  return {
    childProfileId: profileId,
    streak: journey.streak,
    journey,
  };
}

export async function createBoardProfileAction(input: {
  name: string;
  age: number;
  avatar: string;
  photoUrl?: string | null;
  headline?: string;
}): Promise<BoardProfileMutationResult> {
  const locale = await getCurrentAppLocale();
  const copy = getServerCopy(locale);
  const parsed = createBoardProfileSchema(locale).safeParse(input);

  if (!parsed.success) {
    return {
      status: "error",
      message:
        parsed.error.issues[0]?.message ?? copy.actions.profileFieldsInvalid,
    };
  }

  const access = await getRequiredAdminHousehold(locale);

  if ("error" in access) {
    return access.error;
  }

  const { user, household } = access;

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

  const profile = await createChildProfileWithDefaults({
    householdId: household.id,
    actorUserId: user.id,
    name: parsed.data.name,
    age: parsed.data.age,
    avatar: parsed.data.avatar,
    photoUrl: parsed.data.photoUrl,
    headline: parsed.data.headline || null,
    locale: household.locale,
  });

  revalidateBoardSurfaces();

  return {
    status: "success",
    message: copy.actions.profileAdded(parsed.data.name),
    profileId: profile.id,
  };
}

export async function updateBoardProfileAction(input: {
  childProfileId: string;
  name: string;
  age: number;
  avatar: string;
  photoUrl?: string | null;
  headline?: string;
}): Promise<BoardProfileMutationResult> {
  const locale = await getCurrentAppLocale();
  const copy = getServerCopy(locale);
  const parsed = createUpdateBoardProfileSchema(locale).safeParse(input);

  if (!parsed.success) {
    return {
      status: "error",
      message:
        parsed.error.issues[0]?.message ?? copy.actions.profileFieldsInvalid,
    };
  }

  const access = await getRequiredAdminHousehold(locale);

  if ("error" in access) {
    return access.error;
  }

  const { user, household } = access;

  await updateChildProfileDetails({
    householdId: household.id,
    actorUserId: user.id,
    childProfileId: parsed.data.childProfileId,
    name: parsed.data.name,
    age: parsed.data.age,
    avatar: parsed.data.avatar,
    photoUrl: parsed.data.photoUrl,
    headline: parsed.data.headline || null,
    locale: household.locale,
  });

  revalidateBoardSurfaces();

  return {
    status: "success",
    message: copy.actions.profileUpdated(parsed.data.name),
  };
}

export async function updateBoardProfileAvatarAction(input: {
  childProfileId: string;
  avatar: string;
}): Promise<BoardProfileMutationResult> {
  const locale = await getCurrentAppLocale();
  const copy = getServerCopy(locale);
  const parsed = createUpdateBoardProfileAvatarSchema(locale).safeParse(input);

  if (!parsed.success) {
    return {
      status: "error",
      message:
        parsed.error.issues[0]?.message ?? copy.actions.profileFieldsInvalid,
    };
  }

  const access = await getRequiredAdminHousehold(locale);

  if ("error" in access) {
    return access.error;
  }

  const { user, household } = access;

  await updateChildProfileAvatar({
    householdId: household.id,
    actorUserId: user.id,
    childProfileId: parsed.data.childProfileId,
    avatar: parsed.data.avatar,
    locale: household.locale,
  });

  revalidateBoardSurfaces();

  return {
    status: "success",
    message: copy.actions.profileAvatarUpdated,
  };
}

export async function updateBoardProfilePhotoAction(input: {
  childProfileId: string;
  photoUrl: string;
}): Promise<BoardProfileMutationResult> {
  const locale = await getCurrentAppLocale();
  const copy = getServerCopy(locale);
  const parsed = createUpdateBoardProfilePhotoSchema(locale).safeParse(input);

  if (!parsed.success) {
    return {
      status: "error",
      message:
        parsed.error.issues[0]?.message ?? copy.actions.profileFieldsInvalid,
    };
  }

  const access = await getRequiredAdminHousehold(locale);

  if ("error" in access) {
    return access.error;
  }

  const { user, household } = access;

  await updateChildProfilePhoto({
    householdId: household.id,
    actorUserId: user.id,
    childProfileId: parsed.data.childProfileId,
    photoUrl: parsed.data.photoUrl,
    locale: household.locale,
  });

  revalidateBoardSurfaces();

  return {
    status: "success",
    message: copy.actions.profilePhotoUpdated,
  };
}

export async function removeBoardProfilePhotoAction(input: {
  childProfileId: string;
}): Promise<BoardProfileMutationResult> {
  const locale = await getCurrentAppLocale();
  const copy = getServerCopy(locale);
  const parsed = createDeleteBoardProfileSchema(locale).safeParse(input);

  if (!parsed.success) {
    return {
      status: "error",
      message:
        parsed.error.issues[0]?.message ?? copy.actions.profilePhotoRemoved,
    };
  }

  const access = await getRequiredAdminHousehold(locale);

  if ("error" in access) {
    return access.error;
  }

  const { user, household } = access;

  await removeChildProfilePhoto({
    householdId: household.id,
    actorUserId: user.id,
    childProfileId: parsed.data.childProfileId,
    locale: household.locale,
  });

  revalidateBoardSurfaces();

  return {
    status: "success",
    message: copy.actions.profilePhotoRemoved,
  };
}

export async function deleteBoardProfileAction(input: {
  childProfileId: string;
}): Promise<BoardProfileMutationResult> {
  const locale = await getCurrentAppLocale();
  const copy = getServerCopy(locale);
  const parsed = createDeleteBoardProfileSchema(locale).safeParse(input);

  if (!parsed.success) {
    return {
      status: "error",
      message:
        parsed.error.issues[0]?.message ?? copy.actions.profileFieldsInvalid,
    };
  }

  const access = await getRequiredAdminHousehold(locale);

  if ("error" in access) {
    return access.error;
  }

  const { user, household } = access;
  const deletedProfile = await deleteChildProfileCascade({
    householdId: household.id,
    actorUserId: user.id,
    childProfileId: parsed.data.childProfileId,
    locale: household.locale,
  });

  revalidateBoardSurfaces();

  return {
    status: "success",
    message: copy.actions.profileDeleted(deletedProfile.name),
  };
}

export async function upsertBoardTaskTemplateAction(input: {
  templateId?: string;
  title: string;
  shortLabel: string;
  icon: string;
  imageUrl?: string | null;
  color?: string | null;
  durationMinutes: number;
}): Promise<BoardTaskMutationResult> {
  const locale = await getCurrentAppLocale();
  const copy = getServerCopy(locale);
  const parsed = createTaskTemplateSchema(locale).safeParse(input);

  if (!parsed.success) {
    return {
      status: "error",
      message:
        parsed.error.issues[0]?.message ?? copy.actions.taskTemplateInvalid,
    };
  }

  const access = await getRequiredAdminHousehold(locale);

  if ("error" in access) {
    return access.error;
  }

  const { user, household } = access;
  const template = await upsertTaskTemplate({
    householdId: household.id,
    actorUserId: user.id,
    locale: household.locale,
    templateId: parsed.data.templateId,
    title: parsed.data.title,
    shortLabel: parsed.data.shortLabel,
    icon: parsed.data.icon,
    imageUrl: parsed.data.imageUrl,
    color: parsed.data.color || null,
    durationMinutes: parsed.data.durationMinutes,
  });

  revalidateBoardSurfaces();

  return {
    status: "success",
    message: template.created
      ? copy.actions.taskTemplateAdded(template.title)
      : copy.actions.taskTemplateUpdated(template.title),
  };
}

export async function deleteBoardTaskTemplateAction(input: {
  templateId: string;
}): Promise<BoardTaskMutationResult> {
  const locale = await getCurrentAppLocale();
  const copy = getServerCopy(locale);
  const parsed = createDeleteTaskTemplateSchema(locale).safeParse(input);

  if (!parsed.success) {
    return {
      status: "error",
      message:
        parsed.error.issues[0]?.message ?? copy.actions.taskTemplateDeleteError,
    };
  }

  const access = await getRequiredAdminHousehold(locale);

  if ("error" in access) {
    return access.error;
  }

  const { user, household } = access;
  const deletedTemplate = await deleteTaskTemplate({
    householdId: household.id,
    actorUserId: user.id,
    templateId: parsed.data.templateId,
    locale: household.locale,
  });

  revalidateBoardSurfaces();

  return {
    status: "success",
    message: copy.actions.taskTemplateDeleted(deletedTemplate.title),
  };
}

export async function assignBoardTaskTemplateAction(input: {
  childProfileId: string;
  templateId: string;
  period: "morning" | "evening" | "both";
  scheduleDays?: number[];
}): Promise<BoardTaskMutationResult> {
  const locale = await getCurrentAppLocale();
  const copy = getServerCopy(locale);
  const parsed = createAssignTemplateSchema(locale).safeParse(input);

  if (!parsed.success) {
    return {
      status: "error",
      message:
        parsed.error.issues[0]?.message ?? copy.actions.missionAssignError,
    };
  }

  const access = await getRequiredAdminHousehold(locale);

  if ("error" in access) {
    return access.error;
  }

  const { user, household } = access;
  const periods = getRoutinePeriods(parsed.data.period);

  if (
    !(await canAssignTemplatesToPeriods({
      userId: user.id,
      householdId: household.id,
      childProfileId: parsed.data.childProfileId,
      templateIds: [parsed.data.templateId],
      periods: [...periods],
    }))
  ) {
    return {
      status: "error",
      message: copy.actions.routineTaskLimitReached,
    };
  }

  const assignedTasks = await assignTaskTemplatesToPeriods({
    householdId: household.id,
    actorUserId: user.id,
    childProfileId: parsed.data.childProfileId,
    templateIds: [parsed.data.templateId],
    periods: [...periods],
    scheduleDays: parsed.data.scheduleDays,
    locale: household.locale,
  });

  revalidateBoardSurfaces();

  const createdCount = assignedTasks.filter((task) => task.created).length;
  const firstTask = assignedTasks[0];

  if (!firstTask) {
    return {
      status: "error",
      message: copy.actions.missionAssignError,
    };
  }

  return {
    status: "success",
    message:
      parsed.data.period === "both"
        ? createdCount > 0
          ? copy.actions.missionAddedBoth(
              firstTask.title,
              firstTask.profileName,
            )
          : copy.actions.missionAlreadyPresentBoth(
              firstTask.title,
              firstTask.profileName,
            )
        : createdCount > 0
          ? copy.actions.missionAdded(firstTask.title, firstTask.profileName)
          : copy.actions.missionAlreadyPresent(
              firstTask.title,
              firstTask.profileName,
            ),
  };
}

export async function assignManyBoardTaskTemplatesAction(input: {
  childProfileId: string;
  templateIds: string[];
  period: "morning" | "evening" | "both";
  scheduleDays?: number[];
}): Promise<BoardTaskMutationResult> {
  const locale = await getCurrentAppLocale();
  const copy = getServerCopy(locale);
  const parsed = createAssignManyTemplatesSchema(locale).safeParse(input);

  if (!parsed.success) {
    return {
      status: "error",
      message:
        parsed.error.issues[0]?.message ?? copy.actions.missionAssignError,
    };
  }

  const access = await getRequiredAdminHousehold(locale);

  if ("error" in access) {
    return access.error;
  }

  const { user, household } = access;
  const periods = getRoutinePeriods(parsed.data.period);

  if (
    !(await canAssignTemplatesToPeriods({
      userId: user.id,
      householdId: household.id,
      childProfileId: parsed.data.childProfileId,
      templateIds: parsed.data.templateIds,
      periods: [...periods],
    }))
  ) {
    return {
      status: "error",
      message: copy.actions.routineTaskLimitReached,
    };
  }

  const assignedTasks = await assignTaskTemplatesToPeriods({
    householdId: household.id,
    actorUserId: user.id,
    childProfileId: parsed.data.childProfileId,
    templateIds: parsed.data.templateIds,
    periods: [...periods],
    scheduleDays: parsed.data.scheduleDays,
    locale: household.locale,
  });

  revalidateBoardSurfaces();

  const createdCount = assignedTasks.filter((task) => task.created).length;
  const profileName =
    assignedTasks[0]?.profileName ??
    (household.locale === "en" ? "this profile" : "ce profil");

  return {
    status: "success",
    message:
      parsed.data.period === "both"
        ? createdCount > 0
          ? copy.actions.missionsScheduledBoth(profileName)
          : copy.actions.missionsAlreadyScheduledBoth(profileName)
        : createdCount > 0
          ? copy.actions.missionsScheduled(profileName, createdCount)
          : copy.actions.missionsAlreadyScheduled(profileName),
  };
}

export async function deleteBoardRoutineTaskAction(input: {
  childProfileId: string;
  routineTaskId: string;
}): Promise<BoardTaskMutationResult> {
  const locale = await getCurrentAppLocale();
  const copy = getServerCopy(locale);
  const parsed = createDeleteRoutineTaskSchema(locale).safeParse(input);

  if (!parsed.success) {
    return {
      status: "error",
      message:
        parsed.error.issues[0]?.message ?? copy.actions.missionDeleteError,
    };
  }

  const access = await getRequiredAdminHousehold(locale);

  if ("error" in access) {
    return access.error;
  }

  const { user, household } = access;
  const deletedTask = await deleteRoutineTaskFromProfile({
    householdId: household.id,
    actorUserId: user.id,
    childProfileId: parsed.data.childProfileId,
    routineTaskId: parsed.data.routineTaskId,
    locale: household.locale,
  });

  revalidateBoardSurfaces();

  return {
    status: "success",
    message: copy.actions.missionRemoved(deletedTask.title),
  };
}

export async function deleteBoardRoutineTaskDayAction(input: {
  childProfileId: string;
  routineTaskId: string;
  day: number;
}): Promise<BoardTaskMutationResult> {
  const locale = await getCurrentAppLocale();
  const copy = getServerCopy(locale);
  const parsed = createDeleteRoutineTaskDaySchema(locale).safeParse(input);

  if (!parsed.success) {
    return {
      status: "error",
      message:
        parsed.error.issues[0]?.message ?? copy.actions.missionDeleteError,
    };
  }

  const access = await getRequiredAdminHousehold(locale);

  if ("error" in access) {
    return access.error;
  }

  const { user, household } = access;
  const deletedTask = await removeRoutineTaskDayFromProfile({
    householdId: household.id,
    actorUserId: user.id,
    childProfileId: parsed.data.childProfileId,
    routineTaskId: parsed.data.routineTaskId,
    day: parsed.data.day,
    locale: household.locale,
  });

  revalidateBoardSurfaces();

  return {
    status: "success",
    message: copy.actions.missionRemoved(deletedTask.title),
  };
}

export async function reorderBoardRoutineTasksAction(input: {
  childProfileId: string;
  period: "morning" | "evening";
  orderedTaskIds: string[];
}): Promise<BoardTaskMutationResult> {
  const locale = await getCurrentAppLocale();
  const copy = getServerCopy(locale);
  const parsed = createReorderRoutineTasksSchema(locale).safeParse(input);

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? copy.actions.routineSaveError,
    };
  }

  const access = await getRequiredAdminHousehold(locale);

  if ("error" in access) {
    return access.error;
  }

  const { user, household } = access;

  const reorderedRoutine = await reorderRoutineTasksForProfile({
    householdId: household.id,
    actorUserId: user.id,
    childProfileId: parsed.data.childProfileId,
    period: getRoutinePeriod(parsed.data.period),
    orderedTaskIds: parsed.data.orderedTaskIds,
    locale: household.locale,
  });

  revalidateBoardSurfaces();

  return {
    status: "success",
    message: copy.actions.routineTasksReordered(reorderedRoutine.profileName),
  };
}
