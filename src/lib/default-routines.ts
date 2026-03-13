import { RoutinePeriod } from "@prisma/client";

import {
  prototypeProfiles,
  type BoardMode,
  type BoardTask,
} from "@/lib/data/prototype-seed";

type ProfileSeedInput = {
  age: number;
  name: string;
  locale?: "fr" | "en";
};

export type DefaultRoutineSeed = {
  title: string;
  period: RoutinePeriod;
  ageMin: number;
  ageMax: number;
  tasks: Array<{
    title: string;
    shortLabel: string;
    icon: string;
    durationMinutes: number;
    points: number;
    rewardType: string | null;
    order: number;
  }>;
};

function serializeBoardTasks(tasks: BoardTask[]) {
  return tasks.map((task, index) => ({
    title: task.label,
    shortLabel: task.shortLabel,
    icon: task.icon,
    durationMinutes: task.durationMinutes,
    points: task.reward ? 2 : 1,
    rewardType: task.reward ? "celebration" : null,
    order: index,
  }));
}

function getPrototypeProfileForAge(age: number) {
  return prototypeProfiles.reduce((closest, current) => {
    const currentDistance = Math.abs(current.age - age);
    const bestDistance = Math.abs(closest.age - age);

    return currentDistance < bestDistance ? current : closest;
  }, prototypeProfiles[0]);
}

function getRoutineTitle(
  mode: BoardMode,
  profileName: string,
  locale: "fr" | "en" = "fr",
) {
  if (locale === "en") {
    return mode === "morning" ? `${profileName} Morning` : `${profileName} Evening`;
  }

  return mode === "morning" ? `Matin de ${profileName}` : `Soir de ${profileName}`;
}

function getRoutinePeriod(mode: BoardMode) {
  return mode === "morning" ? RoutinePeriod.MORNING : RoutinePeriod.EVENING;
}

export function getDefaultRoutineSeeds(profile: ProfileSeedInput): DefaultRoutineSeed[] {
  const prototype = getPrototypeProfileForAge(profile.age);

  return (["morning", "evening"] as const).map((mode) => ({
    title: getRoutineTitle(mode, profile.name, profile.locale),
    period: getRoutinePeriod(mode),
    ageMin: Math.max(2, profile.age - 1),
    ageMax: Math.min(12, profile.age + 1),
    tasks: serializeBoardTasks(prototype.tasksByMode[mode]),
  }));
}
