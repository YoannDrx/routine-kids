import "server-only";

import { RoutinePeriod } from "@prisma/client";

import { getDefaultRoutineSeeds } from "@/lib/default-routines";
import { prisma } from "@/lib/prisma";
import { getServerCopy } from "@/lib/server-copy";
import { type AppLocale } from "@/lib/i18n";

type EnsureRoutineInput = {
  householdId: string;
  childProfileId: string;
  period: RoutinePeriod;
  locale?: AppLocale;
};

const defaultScheduleDays = [0, 1, 2, 3, 4, 5, 6] as const;

function normalizeScheduleDays(days?: number[] | null, allowEmpty = false) {
  if (!days || days.length === 0) {
    return allowEmpty ? [] : [...defaultScheduleDays];
  }

  const normalizedDays = days
    .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6)
    .sort((left, right) => left - right);

  if (normalizedDays.length === 0) {
    return allowEmpty ? [] : [...defaultScheduleDays];
  }

  return normalizedDays.length > 0
    ? [...new Set(normalizedDays)]
    : allowEmpty
      ? []
      : [...defaultScheduleDays];
}

function mergeScheduleDays(current: unknown, next?: number[] | null) {
  const currentDays = Array.isArray(current)
    ? normalizeScheduleDays(current.filter((day): day is number => typeof day === "number"))
    : [...defaultScheduleDays];
  const nextDays = normalizeScheduleDays(next);

  return [...new Set([...currentDays, ...nextDays])].sort((left, right) => left - right);
}

async function ensureOwnedProfile(
  householdId: string,
  childProfileId: string,
  locale: AppLocale = "fr",
) {
  const profile = await prisma.childProfile.findFirst({
    where: {
      id: childProfileId,
      householdId,
    },
    select: {
      id: true,
      name: true,
      age: true,
    },
  });

  if (!profile) {
    throw new Error(getServerCopy(locale).actions.profileNotInHousehold);
  }

  return profile;
}

async function ensureRoutineForProfilePeriod(input: EnsureRoutineInput) {
  const existingRoutine = await prisma.routine.findFirst({
    where: {
      householdId: input.householdId,
      childProfileId: input.childProfileId,
      period: input.period,
      isArchived: false,
    },
    orderBy: {
      order: "asc",
    },
    select: {
      id: true,
    },
  });

  if (existingRoutine) {
    return existingRoutine.id;
  }

  const profile = await ensureOwnedProfile(
    input.householdId,
    input.childProfileId,
    input.locale,
  );
  const seed = getDefaultRoutineSeeds({
    age: profile.age,
    name: profile.name,
    locale: input.locale,
  }).find((candidate) => candidate.period === input.period);

  if (!seed) {
    throw new Error(getServerCopy(input.locale ?? "fr").actions.routineSaveError);
  }

  const createdRoutine = await prisma.routine.create({
    data: {
      householdId: input.householdId,
      childProfileId: input.childProfileId,
      title: seed.title,
      period: seed.period,
      ageMin: seed.ageMin,
      ageMax: seed.ageMax,
      order: 0,
    },
    select: {
      id: true,
    },
  });

  return createdRoutine.id;
}

export async function assignTaskTemplateToRoutine(input: {
  householdId: string;
  actorUserId: string;
  childProfileId: string;
  templateId: string;
  period: RoutinePeriod;
  scheduleDays?: number[];
  locale?: AppLocale;
}) {
  const profile = await ensureOwnedProfile(
    input.householdId,
    input.childProfileId,
    input.locale,
  );
  const routineId = await ensureRoutineForProfilePeriod({
    householdId: input.householdId,
    childProfileId: input.childProfileId,
    period: input.period,
    locale: input.locale,
  });

  const template = await prisma.taskTemplate.findFirst({
    where: {
      id: input.templateId,
      householdId: input.householdId,
    },
    select: {
      id: true,
      title: true,
      shortLabel: true,
      icon: true,
      imageUrl: true,
      color: true,
      durationMinutes: true,
    },
  });

  if (!template) {
    throw new Error(getServerCopy(input.locale ?? "fr").validation.templateNotFound);
  }

  const existingTask = await prisma.routineTask.findFirst({
    where: {
      routineId,
      templateId: template.id,
      title: template.title,
    },
    select: {
      id: true,
      scheduleDays: true,
    },
  });

  if (existingTask) {
    const nextScheduleDays = mergeScheduleDays(existingTask.scheduleDays, input.scheduleDays);
    const currentDays = Array.isArray(existingTask.scheduleDays)
      ? normalizeScheduleDays(
          existingTask.scheduleDays.filter((day): day is number => typeof day === "number"),
        )
      : [...defaultScheduleDays];
    const scheduleChanged =
      nextScheduleDays.length !== currentDays.length
      || nextScheduleDays.some((day, index) => day !== currentDays[index]);

    if (scheduleChanged) {
      await prisma.routineTask.update({
        where: {
          id: existingTask.id,
        },
        data: {
          scheduleDays: nextScheduleDays,
        },
      });
    }

    return {
      id: existingTask.id,
      title: template.title,
      created: scheduleChanged,
      profileName: profile.name,
    };
  }

  const lastTask = await prisma.routineTask.findFirst({
    where: {
      routineId,
    },
    orderBy: {
      order: "desc",
    },
    select: {
      order: true,
    },
  });

  const createdTask = await prisma.routineTask.create({
    data: {
      routineId,
      templateId: template.id,
      title: template.title,
      shortLabel: template.shortLabel,
      icon: template.icon,
      imageUrl: template.imageUrl,
      color: template.color,
      scheduleDays: normalizeScheduleDays(input.scheduleDays),
      durationMinutes: template.durationMinutes,
      order: (lastTask?.order ?? -1) + 1,
    },
    select: {
      id: true,
      title: true,
    },
  });

  await prisma.adminAuditLog.create({
    data: {
      householdId: input.householdId,
      actorUserId: input.actorUserId,
      action: "ROUTINE_TASK_ASSIGNED",
      targetType: "RoutineTask",
      targetId: createdTask.id,
      metadata: {
        childProfileId: input.childProfileId,
        childName: profile.name,
        period: input.period,
        title: createdTask.title,
        scheduleDays: normalizeScheduleDays(input.scheduleDays),
      },
    },
  });

  return {
    id: createdTask.id,
    title: createdTask.title,
    created: true,
    profileName: profile.name,
  };
}

export async function assignManyTaskTemplatesToRoutine(input: {
  householdId: string;
  actorUserId: string;
  childProfileId: string;
  templateIds: string[];
  period: RoutinePeriod;
  scheduleDays?: number[];
  locale?: AppLocale;
}) {
  const results = [];

  for (const templateId of input.templateIds) {
    results.push(
      await assignTaskTemplateToRoutine({
        householdId: input.householdId,
        actorUserId: input.actorUserId,
        childProfileId: input.childProfileId,
        templateId,
        period: input.period,
        scheduleDays: input.scheduleDays,
        locale: input.locale,
      }),
    );
  }

  return results;
}

export async function upsertProfileRoutine(input: {
  householdId: string;
  actorUserId: string;
  childProfileId: string;
  period: RoutinePeriod;
  title: string;
  locale?: AppLocale;
}) {
  const profile = await ensureOwnedProfile(
    input.householdId,
    input.childProfileId,
    input.locale,
  );
  const routineId = await ensureRoutineForProfilePeriod({
    householdId: input.householdId,
    childProfileId: input.childProfileId,
    period: input.period,
    locale: input.locale,
  });

  const previousRoutine = await prisma.routine.findUnique({
    where: {
      id: routineId,
    },
    select: {
      id: true,
      title: true,
    },
  });

  if (!previousRoutine) {
    throw new Error(getServerCopy(input.locale ?? "fr").actions.routineSaveError);
  }

  const updatedRoutine = await prisma.routine.update({
    where: {
      id: routineId,
    },
    data: {
      title: input.title,
    },
    select: {
      id: true,
      title: true,
      period: true,
    },
  });

  await prisma.adminAuditLog.create({
    data: {
      householdId: input.householdId,
      actorUserId: input.actorUserId,
      action: "ROUTINE_UPDATED",
      targetType: "Routine",
      targetId: updatedRoutine.id,
      metadata: {
        childProfileId: input.childProfileId,
        childName: profile.name,
        period: updatedRoutine.period,
        previousTitle: previousRoutine.title,
        title: updatedRoutine.title,
      },
    },
  });

  return {
    id: updatedRoutine.id,
    title: updatedRoutine.title,
    profileName: profile.name,
  };
}

export async function deleteRoutineTaskFromProfile(input: {
  householdId: string;
  actorUserId: string;
  childProfileId: string;
  routineTaskId: string;
  locale?: AppLocale;
}) {
  const task = await prisma.routineTask.findFirst({
    where: {
      id: input.routineTaskId,
      routine: {
        householdId: input.householdId,
        childProfileId: input.childProfileId,
      },
    },
    select: {
      id: true,
      title: true,
      routineId: true,
    },
  });

  if (!task) {
    throw new Error(getServerCopy(input.locale ?? "fr").actions.missionDeleteError);
  }

  await prisma.routineTask.delete({
    where: {
      id: task.id,
    },
  });

  const siblingTasks = await prisma.routineTask.findMany({
    where: {
      routineId: task.routineId,
    },
    orderBy: {
      order: "asc",
    },
    select: {
      id: true,
    },
  });

  await Promise.all(
    siblingTasks.map((siblingTask, index) =>
      prisma.routineTask.update({
        where: {
          id: siblingTask.id,
        },
        data: {
          order: index,
        },
      }),
    ),
  );

  await prisma.adminAuditLog.create({
    data: {
      householdId: input.householdId,
      actorUserId: input.actorUserId,
      action: "ROUTINE_TASK_DELETED",
      targetType: "RoutineTask",
      targetId: task.id,
      metadata: {
        childProfileId: input.childProfileId,
        title: task.title,
      },
    },
  });

  return {
    id: task.id,
    title: task.title,
  };
}

export async function removeRoutineTaskDayFromProfile(input: {
  householdId: string;
  actorUserId: string;
  childProfileId: string;
  routineTaskId: string;
  day: number;
  locale?: AppLocale;
}) {
  const task = await prisma.routineTask.findFirst({
    where: {
      id: input.routineTaskId,
      routine: {
        householdId: input.householdId,
        childProfileId: input.childProfileId,
      },
    },
    select: {
      id: true,
      title: true,
      scheduleDays: true,
      routineId: true,
    },
  });

  if (!task) {
    throw new Error(getServerCopy(input.locale ?? "fr").actions.missionDeleteError);
  }

  const nextDays = normalizeScheduleDays(
    (Array.isArray(task.scheduleDays)
      ? task.scheduleDays.filter((day): day is number => typeof day === "number")
      : [...defaultScheduleDays]).filter((day) => day !== input.day),
    true,
  );

  if (nextDays.length === defaultScheduleDays.length) {
    return {
      id: task.id,
      title: task.title,
      deleted: false,
      remainingDays: nextDays,
    };
  }

  if (nextDays.length === 0) {
    await prisma.routineTask.delete({
      where: {
        id: task.id,
      },
    });

    const siblingTasks = await prisma.routineTask.findMany({
      where: {
        routineId: task.routineId,
      },
      orderBy: {
        order: "asc",
      },
      select: {
        id: true,
      },
    });

    await Promise.all(
      siblingTasks.map((siblingTask, index) =>
        prisma.routineTask.update({
          where: {
            id: siblingTask.id,
          },
          data: {
            order: index,
          },
        }),
      ),
    );
  } else {
    await prisma.routineTask.update({
      where: {
        id: task.id,
      },
      data: {
        scheduleDays: nextDays,
      },
    });
  }

  await prisma.adminAuditLog.create({
    data: {
      householdId: input.householdId,
      actorUserId: input.actorUserId,
      action: "ROUTINE_TASK_DAY_REMOVED",
      targetType: "RoutineTask",
      targetId: task.id,
      metadata: {
        childProfileId: input.childProfileId,
        title: task.title,
        day: input.day,
        deleted: nextDays.length === 0,
        remainingDays: nextDays,
      },
    },
  });

  return {
    id: task.id,
    title: task.title,
    deleted: nextDays.length === 0,
    remainingDays: nextDays,
  };
}

export async function reorderRoutineTasksForProfile(input: {
  householdId: string;
  actorUserId: string;
  childProfileId: string;
  period: RoutinePeriod;
  orderedTaskIds: string[];
  locale?: AppLocale;
}) {
  const locale = input.locale ?? "fr";
  const copy = getServerCopy(locale);
  const profile = await ensureOwnedProfile(
    input.householdId,
    input.childProfileId,
    locale,
  );

  const routine = await prisma.routine.findFirst({
    where: {
      householdId: input.householdId,
      childProfileId: input.childProfileId,
      period: input.period,
      isArchived: false,
    },
    select: {
      id: true,
    },
  });

  if (!routine) {
    throw new Error(copy.actions.routineSaveError);
  }

  const routineTasks = await prisma.routineTask.findMany({
    where: {
      routineId: routine.id,
    },
    orderBy: {
      order: "asc",
    },
    select: {
      id: true,
      title: true,
    },
  });

  if (
    routineTasks.length !== input.orderedTaskIds.length ||
    routineTasks.length === 0
  ) {
    throw new Error(copy.actions.routineSaveError);
  }

  const currentIds = routineTasks.map((task) => task.id).sort();
  const nextIds = [...input.orderedTaskIds].sort();
  const hasSameTaskSet = currentIds.every((taskId, index) => taskId === nextIds[index]);

  if (!hasSameTaskSet) {
    throw new Error(copy.actions.routineSaveError);
  }

  const orderChanged = input.orderedTaskIds.some(
    (taskId, index) => routineTasks[index]?.id !== taskId,
  );

  if (!orderChanged) {
    return {
      profileName: profile.name,
      movedCount: 0,
    };
  }

  await prisma.$transaction(
    input.orderedTaskIds.map((taskId, index) =>
      prisma.routineTask.update({
        where: {
          id: taskId,
        },
        data: {
          order: index,
        },
      }),
    ),
  );

  await prisma.adminAuditLog.create({
    data: {
      householdId: input.householdId,
      actorUserId: input.actorUserId,
      action: "ROUTINE_TASKS_REORDERED",
      targetType: "Routine",
      targetId: routine.id,
      metadata: {
        childProfileId: input.childProfileId,
        childName: profile.name,
        period: input.period,
        orderedTaskIds: input.orderedTaskIds,
      },
    },
  });

  return {
    profileName: profile.name,
    movedCount: input.orderedTaskIds.length,
  };
}
