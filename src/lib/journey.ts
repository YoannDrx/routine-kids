import { getDayKey } from "@/lib/day-key";

export type JourneyPlanetId =
  | "start"
  | "moon"
  | "mars"
  | "jupiter"
  | "saturn"
  | "neptune"
  | "galaxy"
  | "nebula";

export type JourneyPlanet = {
  id: JourneyPlanetId;
  name: string;
  nameEn: string;
  color: string;
  streakNeeded: number;
  icon: "rocket" | "moon" | "circle" | "circle-dot" | "star" | "cloud";
};

export type JourneyState = {
  completedDayCount: number;
  streak: number;
  currentPlanetId: JourneyPlanetId;
  nextPlanetId: JourneyPlanetId | null;
  unlockedPlanetCount: number;
  progressToNextPercent: number;
};

type JourneyRoutineLike = {
  period: string;
  tasks: Array<{
    id: string;
    scheduleDays?: unknown;
    completions: Array<{
      dayKey: string;
      childProfileId: string;
      streakSnapshot?: number | null;
    }>;
  }>;
};

function normalizeScheduleDays(value: unknown) {
  if (!Array.isArray(value)) {
    return [0, 1, 2, 3, 4, 5, 6];
  }

  const normalizedDays = value
    .map((entry) => (typeof entry === "number" ? entry : Number(entry)))
    .filter((entry) => Number.isInteger(entry) && entry >= 0 && entry <= 6);

  return normalizedDays.length > 0
    ? [...new Set(normalizedDays)].sort((left, right) => left - right)
    : [0, 1, 2, 3, 4, 5, 6];
}

function getWeekdayFromDayKey(dayKey: string) {
  return new Date(`${dayKey}T12:00:00`).getDay();
}

export const JOURNEY_PLANETS: JourneyPlanet[] = [
  {
    id: "start",
    name: "Base Spatiale",
    nameEn: "Space Base",
    color: "#6366f1",
    streakNeeded: 0,
    icon: "rocket",
  },
  {
    id: "moon",
    name: "La Lune",
    nameEn: "The Moon",
    color: "#a3a3a3",
    streakNeeded: 3,
    icon: "moon",
  },
  {
    id: "mars",
    name: "Mars",
    nameEn: "Mars",
    color: "#ef4444",
    streakNeeded: 7,
    icon: "circle",
  },
  {
    id: "jupiter",
    name: "Jupiter",
    nameEn: "Jupiter",
    color: "#f97316",
    streakNeeded: 14,
    icon: "circle",
  },
  {
    id: "saturn",
    name: "Saturne",
    nameEn: "Saturn",
    color: "#eab308",
    streakNeeded: 21,
    icon: "circle-dot",
  },
  {
    id: "neptune",
    name: "Neptune",
    nameEn: "Neptune",
    color: "#3b82f6",
    streakNeeded: 30,
    icon: "circle",
  },
  {
    id: "galaxy",
    name: "Galaxie Lointaine",
    nameEn: "Far Galaxy",
    color: "#a855f7",
    streakNeeded: 50,
    icon: "star",
  },
  {
    id: "nebula",
    name: "Nebuleuse Secrete",
    nameEn: "Secret Nebula",
    color: "#ec4899",
    streakNeeded: 100,
    icon: "cloud",
  },
];

function getPreviousDayKey(dayKey: string) {
  const date = new Date(`${dayKey}T12:00:00`);
  date.setDate(date.getDate() - 1);
  return getDayKey(date);
}

export function getProfileStreakFromCompletedDays(
  completedDayKeys: string[],
  todayKey = getDayKey(),
) {
  if (completedDayKeys.length === 0) {
    return 0;
  }

  const uniqueSortedDays = [...new Set(completedDayKeys)].sort().reverse();
  const yesterdayKey = getPreviousDayKey(todayKey);
  let currentDayKey = uniqueSortedDays[0];

  if (currentDayKey !== todayKey && currentDayKey !== yesterdayKey) {
    return 0;
  }

  let streak = 0;

  for (const dayKey of uniqueSortedDays) {
    if (dayKey !== currentDayKey) {
      break;
    }

    streak += 1;
    currentDayKey = getPreviousDayKey(currentDayKey);
  }

  return streak;
}

export function getJourneyStateFromStreak(
  streak: number,
  completedDayCount = streak,
): JourneyState {
  let currentPlanet = JOURNEY_PLANETS[0];

  for (const planet of JOURNEY_PLANETS) {
    if (streak >= planet.streakNeeded) {
      currentPlanet = planet;
    }
  }

  const nextPlanet =
    JOURNEY_PLANETS.find((planet) => streak < planet.streakNeeded) ?? null;
  const unlockedPlanetCount = JOURNEY_PLANETS.filter(
    (planet) => streak >= planet.streakNeeded,
  ).length;

  const progressToNextPercent = nextPlanet
    ? currentPlanet.id === nextPlanet.id
      ? 0
      : Math.max(
          0,
          Math.min(
            100,
            Math.round(
              ((streak - currentPlanet.streakNeeded) /
                Math.max(
                  1,
                  nextPlanet.streakNeeded - currentPlanet.streakNeeded,
                )) *
                100,
            ),
          ),
        )
    : 100;

  return {
    completedDayCount,
    streak,
    currentPlanetId: currentPlanet.id,
    nextPlanetId: nextPlanet?.id ?? null,
    unlockedPlanetCount,
    progressToNextPercent,
  };
}

export function getCompletedDayKeysFromRoutines(
  routines: JourneyRoutineLike[],
  childProfileId: string,
  todayKey = getDayKey(),
) {
  const routineTasks = routines
    .filter(
      (routine) => routine.period === "MORNING" || routine.period === "EVENING",
    )
    .flatMap((routine) => routine.tasks);

  if (routineTasks.length === 0) {
    return [];
  }

  const completionMap = new Map<string, Set<string>>();
  const snapshottedCompletedDays = new Set<string>();

  for (const task of routineTasks) {
    for (const completion of task.completions) {
      if (completion.childProfileId !== childProfileId) {
        continue;
      }

      const completedTasks =
        completionMap.get(completion.dayKey) ?? new Set<string>();
      completedTasks.add(task.id);
      completionMap.set(completion.dayKey, completedTasks);

      if (
        completion.streakSnapshot !== null &&
        completion.streakSnapshot !== undefined
      ) {
        snapshottedCompletedDays.add(completion.dayKey);
      }
    }
  }

  const candidateDayKeys = new Set<string>([todayKey]);

  for (const dayKey of completionMap.keys()) {
    candidateDayKeys.add(dayKey);
  }

  const completedDayKeys = [...candidateDayKeys]
    .filter((dayKey) => {
      if (snapshottedCompletedDays.has(dayKey)) {
        return true;
      }

      const weekday = getWeekdayFromDayKey(dayKey);
      const activeTaskIds = routineTasks
        .filter((task) =>
          normalizeScheduleDays(task.scheduleDays).includes(weekday),
        )
        .map((task) => task.id);

      if (activeTaskIds.length === 0) {
        return false;
      }

      const completedTasks = completionMap.get(dayKey) ?? new Set<string>();
      return activeTaskIds.every((taskId) => completedTasks.has(taskId));
    })
    .sort();

  return completedDayKeys;
}

export function deriveJourneyStateFromRoutines(
  routines: JourneyRoutineLike[],
  childProfileId: string,
  todayKey = getDayKey(),
) {
  const completedDayKeys = getCompletedDayKeysFromRoutines(
    routines,
    childProfileId,
    todayKey,
  );

  const streak = getProfileStreakFromCompletedDays(completedDayKeys, todayKey);

  return getJourneyStateFromStreak(streak, completedDayKeys.length);
}

export function getJourneyPlanetById(planetId: JourneyPlanetId) {
  return (
    JOURNEY_PLANETS.find((planet) => planet.id === planetId) ??
    JOURNEY_PLANETS[0]
  );
}
