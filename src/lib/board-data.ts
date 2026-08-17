import { Prisma, RoutinePeriod, UiTone } from "@prisma/client";

import { getDayKey } from "@/lib/day-key";
import type {
  HouseholdBoardOverview,
  HouseholdOverview,
} from "@/lib/household";
import {
  prototypeProfiles,
  type BoardMode,
  type BoardProfile,
  type BoardTask,
  type TaskIconName,
} from "@/lib/data/prototype-seed";
import {
  deriveJourneyStateFromRoutines,
  getCompletedDayKeysFromRoutines,
  getJourneyStateFromStreak,
  getProfileStreakFromCompletedDays,
} from "@/lib/journey";
import { themePacks, type ThemeId } from "@/lib/theme/packs";

function isThemeId(value: string): value is ThemeId {
  return value in themePacks;
}

function getPrototypeProfileForAge(age: number) {
  return prototypeProfiles.reduce((closest, current) => {
    const currentDistance = Math.abs(current.age - age);
    const bestDistance = Math.abs(closest.age - age);

    return currentDistance < bestDistance ? current : closest;
  }, prototypeProfiles[0]);
}

function getThemeIdForProfile(
  slug: string | null | undefined,
  tone: UiTone,
  age: number,
): ThemeId {
  if (slug && isThemeId(slug)) {
    return slug;
  }

  if (tone === UiTone.OCEAN) {
    return "ocean-quest";
  }

  if (tone === UiTone.JUNGLE) {
    return "jungle-camp";
  }

  if (age <= 4) {
    return "ocean-quest";
  }

  if (age >= 7) {
    return "jungle-camp";
  }

  return "space-academy";
}

function isTaskIconName(
  value: string | null | undefined,
): value is TaskIconName {
  return (
    value === "shirt" ||
    value === "sparkles" ||
    value === "footprints" ||
    value === "glass-water" ||
    value === "apple" ||
    value === "school" ||
    value === "book-open" ||
    value === "bath" ||
    value === "moon" ||
    value === "bed" ||
    value === "heart" ||
    value === "rocket" ||
    value === "star" ||
    value === "sun" ||
    value === "droplets" ||
    value === "brush"
  );
}

export function normalizeBoardTaskScheduleDays(
  value: Prisma.JsonValue | null | undefined,
) {
  if (!Array.isArray(value)) {
    return [0, 1, 2, 3, 4, 5, 6];
  }

  const normalizedDays = value
    .map((entry) => (typeof entry === "number" ? entry : Number(entry)))
    .filter((entry) => Number.isInteger(entry) && entry >= 0 && entry <= 6);

  if (normalizedDays.length === 0) {
    return [0, 1, 2, 3, 4, 5, 6];
  }

  return [...new Set(normalizedDays)].sort((left, right) => left - right);
}

function getRoutineForMode(
  routines: HouseholdBoardOverview["childProfiles"][number]["routines"],
  mode: BoardMode,
) {
  const period =
    mode === "morning" ? RoutinePeriod.MORNING : RoutinePeriod.EVENING;

  return routines.find((routine) => routine.period === period);
}

function getCompletedTaskIdsForRoutine(
  routine:
    | HouseholdBoardOverview["childProfiles"][number]["routines"][number]
    | undefined,
  childProfileId: string,
  dayKey: string,
) {
  if (!routine) {
    return [];
  }

  return routine.tasks
    .flatMap((task) => {
      const completion = task.completions
        .filter(
          (entry) =>
            entry.dayKey === dayKey && entry.childProfileId === childProfileId,
        )
        .sort(
          (left, right) =>
            right.completedAt.getTime() - left.completedAt.getTime(),
        )[0];

      if (!completion) {
        return [];
      }

      return [
        {
          taskId: task.id,
          completedAt: completion.completedAt,
        },
      ];
    })
    .sort(
      (left, right) => right.completedAt.getTime() - left.completedAt.getTime(),
    )
    .map((entry) => entry.taskId);
}

function mapRoutineTasksToBoardTasks(
  routine:
    | HouseholdBoardOverview["childProfiles"][number]["routines"][number]
    | undefined,
  fallbackTasks: BoardTask[],
): BoardTask[] {
  if (!routine || routine.tasks.length === 0) {
    return [];
  }

  return routine.tasks.map((task, index) => {
    const fallback = fallbackTasks[index] ?? fallbackTasks[0];

    return {
      id: task.id,
      templateId: task.templateId ?? null,
      label: task.title,
      shortLabel: task.shortLabel ?? task.title,
      icon: isTaskIconName(task.icon)
        ? task.icon
        : (fallback?.icon ?? "sparkles"),
      imageUrl: task.imageUrl ?? null,
      color: task.color ?? null,
      scheduleDays: normalizeBoardTaskScheduleDays(task.scheduleDays),
      durationMinutes: task.durationMinutes ?? fallback?.durationMinutes ?? 1,
      reward: task.points > 1 || task.rewardType === "celebration",
    };
  });
}

export function getBoardProfilesFromHousehold(
  household: HouseholdOverview | null,
): BoardProfile[] {
  if (!household || household.childProfiles.length === 0) {
    return [];
  }

  return household.childProfiles.map((profile) => {
    const prototype = getPrototypeProfileForAge(profile.age);

    return {
      id: profile.id,
      name: profile.name,
      age: profile.age,
      avatar: profile.avatar ?? prototype.avatar,
      photoUrl: profile.photoUrl,
      headline: profile.headline ?? prototype.headline,
      streak: 0,
      journey: getJourneyStateFromStreak(0, 0),
      themeId: getThemeIdForProfile(
        profile.defaultTheme?.slug,
        profile.tone,
        profile.age,
      ),
      completedTaskIdsByMode: {
        morning: [],
        evening: [],
      },
      tasksByMode: prototype.tasksByMode,
    };
  });
}

export function getBoardProfilesFromBoardOverview(
  household: HouseholdBoardOverview | null,
  dayKey = getDayKey(),
): BoardProfile[] {
  if (!household || household.childProfiles.length === 0) {
    return [];
  }

  return household.childProfiles.map((profile) => {
    const prototype = getPrototypeProfileForAge(profile.age);
    const morningRoutine = getRoutineForMode(profile.routines, "morning");
    const eveningRoutine = getRoutineForMode(profile.routines, "evening");
    const immutableDayKeys = (profile.dayCompletions ?? []).map(
      (completion) => completion.dayKey,
    );
    const completedDayKeys = [
      ...new Set([
        ...immutableDayKeys,
        ...getCompletedDayKeysFromRoutines(profile.routines, profile.id, dayKey),
      ]),
    ];
    const journey =
      completedDayKeys.length > 0
        ? getJourneyStateFromStreak(
            getProfileStreakFromCompletedDays(completedDayKeys, dayKey),
            completedDayKeys.length,
          )
        : deriveJourneyStateFromRoutines(profile.routines, profile.id, dayKey);

    return {
      id: profile.id,
      name: profile.name,
      age: profile.age,
      avatar: profile.avatar ?? prototype.avatar,
      photoUrl: profile.photoUrl,
      headline: profile.headline ?? prototype.headline,
      streak: journey.streak,
      journey,
      themeId: getThemeIdForProfile(
        profile.defaultTheme?.slug,
        profile.tone,
        profile.age,
      ),
      completedTaskIdsByMode: {
        morning: getCompletedTaskIdsForRoutine(
          morningRoutine,
          profile.id,
          dayKey,
        ),
        evening: getCompletedTaskIdsForRoutine(
          eveningRoutine,
          profile.id,
          dayKey,
        ),
      },
      tasksByMode: {
        morning: mapRoutineTasksToBoardTasks(
          morningRoutine,
          prototype.tasksByMode.morning,
        ),
        evening: mapRoutineTasksToBoardTasks(
          eveningRoutine,
          prototype.tasksByMode.evening,
        ),
      },
    };
  });
}
