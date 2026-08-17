import "server-only";

import { type Prisma } from "@prisma/client";

import { getDayKey } from "@/lib/day-key";
import {
  getJourneyStateFromStreak,
  getProfileStreakFromCompletedDays,
} from "@/lib/journey";

function scheduleDays(value: Prisma.JsonValue) {
  if (!Array.isArray(value)) return [0, 1, 2, 3, 4, 5, 6];
  const days = value
    .map(Number)
    .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6);
  return days.length ? [...new Set(days)] : [0, 1, 2, 3, 4, 5, 6];
}

export async function toggleTaskCompletion(input: {
  tx: Prisma.TransactionClient;
  householdId: string;
  timeZone: string;
  childProfileId: string;
  taskId: string;
  dayKey: string;
  completed: boolean;
  metadata?: Prisma.InputJsonValue;
}) {
  const currentDayKey = getDayKey(new Date(), input.timeZone);
  if (input.dayKey !== currentDayKey) {
    throw new Error("day_key_not_current");
  }

  const task = await input.tx.routineTask.findFirst({
    where: {
      id: input.taskId,
      routine: {
        householdId: input.householdId,
        childProfileId: input.childProfileId,
      },
    },
    select: { id: true },
  });
  if (!task) throw new Error("task_not_found");

  await Promise.all([
    input.tx.dayCompletion.deleteMany({
      where: { childProfileId: input.childProfileId, dayKey: input.dayKey },
    }),
    input.tx.taskCompletion.updateMany({
      where: {
        childProfileId: input.childProfileId,
        dayKey: input.dayKey,
        streakSnapshot: { not: null },
      },
      data: { streakSnapshot: null },
    }),
  ]);

  if (input.completed) {
    await input.tx.taskCompletion.upsert({
      where: {
        taskId_childProfileId_dayKey: {
          taskId: task.id,
          childProfileId: input.childProfileId,
          dayKey: input.dayKey,
        },
      },
      update: { completedAt: new Date(), metadata: input.metadata },
      create: {
        taskId: task.id,
        childProfileId: input.childProfileId,
        dayKey: input.dayKey,
        metadata: input.metadata,
      },
    });
  } else {
    await input.tx.taskCompletion.deleteMany({
      where: {
        taskId: task.id,
        childProfileId: input.childProfileId,
        dayKey: input.dayKey,
      },
    });
  }

  const routines = await input.tx.routine.findMany({
    where: {
      householdId: input.householdId,
      childProfileId: input.childProfileId,
      isArchived: false,
      period: { in: ["MORNING", "EVENING"] },
    },
    select: {
      id: true,
      tasks: {
        select: {
          id: true,
          scheduleDays: true,
          completions: {
            where: {
              childProfileId: input.childProfileId,
              dayKey: input.dayKey,
            },
            select: { id: true },
          },
        },
      },
    },
  });
  const weekday = new Date(`${input.dayKey}T12:00:00.000Z`).getUTCDay();
  const routineCounts = routines.map((routine) => {
    const activeTasks = routine.tasks.filter((item) =>
      scheduleDays(item.scheduleDays).includes(weekday),
    );
    return {
      routineId: routine.id,
      requiredTaskCount: activeTasks.length,
      completedTaskCount: activeTasks.filter((item) => item.completions.length > 0)
        .length,
    };
  });
  const activeCounts = routineCounts.filter((count) => count.requiredTaskCount > 0);
  const dayIsComplete =
    activeCounts.length > 0 &&
    activeCounts.every(
      (count) => count.completedTaskCount === count.requiredTaskCount,
    );

  const [snapshots, legacySnapshots] = await Promise.all([
    input.tx.dayCompletion.findMany({
      where: { childProfileId: input.childProfileId },
      distinct: ["dayKey"],
      select: { dayKey: true },
      take: 400,
      orderBy: { completedAt: "desc" },
    }),
    input.tx.taskCompletion.findMany({
      where: {
        childProfileId: input.childProfileId,
        streakSnapshot: { not: null },
      },
      distinct: ["dayKey"],
      select: { dayKey: true },
      take: 400,
      orderBy: { completedAt: "desc" },
    }),
  ]);
  const completedDays = new Set([
    ...snapshots.map((snapshot) => snapshot.dayKey),
    ...legacySnapshots.map((snapshot) => snapshot.dayKey),
  ]);
  if (dayIsComplete) completedDays.add(input.dayKey);
  const streak = getProfileStreakFromCompletedDays(
    [...completedDays],
    input.dayKey,
  );

  if (dayIsComplete) {
    await input.tx.taskCompletion.updateMany({
      where: { childProfileId: input.childProfileId, dayKey: input.dayKey },
      data: { streakSnapshot: streak },
    });
    await input.tx.dayCompletion.createMany({
      data: activeCounts.map((count) => ({
        householdId: input.householdId,
        childProfileId: input.childProfileId,
        routineId: count.routineId,
        dayKey: input.dayKey,
        timeZone: input.timeZone,
        requiredTaskCount: count.requiredTaskCount,
        completedTaskCount: count.completedTaskCount,
        streakSnapshot: streak,
      })),
      skipDuplicates: true,
    });
  }

  return getJourneyStateFromStreak(streak, completedDays.size);
}
