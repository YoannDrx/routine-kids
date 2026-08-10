import "server-only";

import { BillingPlan, RoutinePeriod, type Prisma } from "@prisma/client";

import { boardAvatarChoices } from "@/lib/data/board-library";
import { getDefaultRoutineSeeds } from "@/lib/default-routines";
import { getAgeBandFromAge, getToneFromAge } from "@/lib/household";
import {
  buildPrototypeImportPreview,
  parsePrototypeRoutineKidsData,
  type PrototypeImportPreview,
} from "@/lib/prototype/import";
import { prisma } from "@/lib/prisma";

type ImportPrototypeSnapshotInput = {
  householdId: string;
  actorUserId: string;
  currentPlan: BillingPlan;
  snapshot: string;
  locale?: "fr" | "en";
};

type ImportedTemplateRef = {
  id: string;
  title: string;
  shortLabel: string | null;
  icon: string | null;
  imageUrl: string | null;
  color?: string | null;
};

export type PrototypeImportSummary = PrototypeImportPreview & {
  importedCompletionRows: number;
};

const prototypeIconMap = new Map<string, string>([
  ["fa-tooth", "sparkles"],
  ["fa-bath", "bath"],
  ["fa-shirt", "shirt"],
  ["fa-moon", "moon"],
  ["fa-pencil", "brush"],
  ["fa-box-open", "star"],
  ["fa-school", "school"],
  ["fa-bed", "bed"],
  ["fa-hands-bubbles", "sparkles"],
  ["fa-glass-water", "glass-water"],
  ["fa-cat", "heart"],
  ["fa-dog", "heart"],
  ["fa-plant-wilt", "droplets"],
  ["fa-utensils", "apple"],
  ["fa-sink", "droplets"],
  ["fa-trash-can", "sparkles"],
  ["fa-shoe-prints", "footprints"],
  ["fa-vest", "shirt"],
  ["fa-shapes", "star"],
  ["fa-book", "book-open"],
  ["fa-book-open", "book-open"],
  ["fa-music", "star"],
  ["fa-person-running", "rocket"],
  ["fa-toilet", "bath"],
  ["fa-scissors", "brush"],
  ["fa-capsules", "sparkles"],
  ["fa-glasses", "sparkles"],
  ["fa-cookie-bite", "sun"],
  ["fa-apple-whole", "apple"],
  ["fa-carrot", "apple"],
  ["fa-heart", "heart"],
  ["fa-bottle-water", "glass-water"],
  ["fa-socks", "footprints"],
]);

function normalizeTitle(value: string) {
  return value.trim().toLowerCase();
}

function buildShortLabel(title: string) {
  const firstWord = title.trim().split(/\s+/)[0] ?? title.trim();
  return firstWord.slice(0, 12);
}

function pickPrototypeIcon(icon: string | null | undefined, title: string) {
  if (icon && prototypeIconMap.has(icon)) {
    return prototypeIconMap.get(icon)!;
  }

  const normalizedTitle = normalizeTitle(title);

  if (
    normalizedTitle.includes("eau") ||
    normalizedTitle.includes("water") ||
    normalizedTitle.includes("gourde")
  ) {
    return "glass-water";
  }

  if (
    normalizedTitle.includes("fruit") ||
    normalizedTitle.includes("apple") ||
    normalizedTitle.includes("carrot") ||
    normalizedTitle.includes("cookie")
  ) {
    return "apple";
  }

  if (
    normalizedTitle.includes("lecture") ||
    normalizedTitle.includes("book") ||
    normalizedTitle.includes("histoire")
  ) {
    return "book-open";
  }

  if (
    normalizedTitle.includes("ecole") ||
    normalizedTitle.includes("school") ||
    normalizedTitle.includes("sac")
  ) {
    return "school";
  }

  if (
    normalizedTitle.includes("dorm") ||
    normalizedTitle.includes("sleep") ||
    normalizedTitle.includes("bed")
  ) {
    return "bed";
  }

  if (
    normalizedTitle.includes("douche") ||
    normalizedTitle.includes("bath") ||
    normalizedTitle.includes("toilet")
  ) {
    return "bath";
  }

  if (
    normalizedTitle.includes("chauss") ||
    normalizedTitle.includes("shoe") ||
    normalizedTitle.includes("sock")
  ) {
    return "footprints";
  }

  if (
    normalizedTitle.includes("bross") ||
    normalizedTitle.includes("hair") ||
    normalizedTitle.includes("cut")
  ) {
    return "brush";
  }

  if (
    normalizedTitle.includes("mains") ||
    normalizedTitle.includes("hands") ||
    normalizedTitle.includes("dent")
  ) {
    return "sparkles";
  }

  if (
    normalizedTitle.includes("run") ||
    normalizedTitle.includes("sport") ||
    normalizedTitle.includes("move")
  ) {
    return "rocket";
  }

  return "star";
}

function normalizePrototypeAvatar(avatar: string, age: number) {
  if (avatar.startsWith("data:image")) {
    return {
      avatar: boardAvatarChoices[age % boardAvatarChoices.length] ?? "🧑‍🚀",
      photoUrl: avatar,
    };
  }

  if (avatar.includes("robot")) {
    return { avatar: "🤖", photoUrl: null };
  }

  if (avatar.includes("cat")) {
    return { avatar: "🐱", photoUrl: null };
  }

  if (avatar.includes("dog")) {
    return { avatar: "🐶", photoUrl: null };
  }

  if (avatar.includes("dragon")) {
    return { avatar: "🐲", photoUrl: null };
  }

  if (avatar.includes("ghost")) {
    return { avatar: "👻", photoUrl: null };
  }

  return { avatar: "🧑‍🚀", photoUrl: null };
}

function isValidDayKey(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function plusOneDay(dayKey: string) {
  const atMiddayUtc = new Date(`${dayKey}T12:00:00.000Z`);
  atMiddayUtc.setUTCDate(atMiddayUtc.getUTCDate() + 1);
  return atMiddayUtc.toISOString().slice(0, 10);
}

function getStreakSnapshots(dayKeys: string[]) {
  const sorted = [...new Set(dayKeys.filter(isValidDayKey))].sort();
  const streakByDay = new Map<string, number>();
  let previousDayKey: string | null = null;
  let streak = 0;

  for (const dayKey of sorted) {
    streak = previousDayKey && plusOneDay(previousDayKey) === dayKey ? streak + 1 : 1;
    streakByDay.set(dayKey, streak);
    previousDayKey = dayKey;
  }

  return streakByDay;
}

async function upsertImportedTemplates(
  tx: Prisma.TransactionClient,
  householdId: string,
  taskLibrary: ReturnType<typeof parsePrototypeRoutineKidsData>["taskLibrary"],
) {
  await tx.taskTemplate.deleteMany({
    where: {
      householdId,
      isBuiltIn: false,
    },
  });

  const existingTemplates = await tx.taskTemplate.findMany({
    where: {
      householdId,
    },
    select: {
      id: true,
      title: true,
      shortLabel: true,
      icon: true,
      imageUrl: true,
      color: true,
      isBuiltIn: true,
      durationMinutes: true,
    },
  });

  const templateByTitle = new Map(
    existingTemplates.map((template) => [normalizeTitle(template.title), template]),
  );
  const importedTemplateByLegacyId = new Map<number, ImportedTemplateRef>();

  for (const item of taskLibrary) {
    const normalizedTitle = normalizeTitle(item.title);
    const existingTemplate = templateByTitle.get(normalizedTitle);
    const templateData = {
      householdId,
      title: item.title,
      shortLabel: existingTemplate?.shortLabel ?? buildShortLabel(item.title),
      icon: existingTemplate?.icon ?? pickPrototypeIcon(item.icon, item.title),
      durationMinutes: existingTemplate?.durationMinutes ?? null,
      imageUrl: item.image ?? existingTemplate?.imageUrl ?? null,
      color: item.color ?? null,
      category: item.category ?? null,
      minAge: item.minAge ?? null,
      maxAge: item.maxAge ?? null,
      autoAssignEnabled: item.auto ?? true,
      recommendationMeta: {
        source: "prototype-import",
        prototypeId: item.id,
        titleEn: item.title_en ?? null,
        defaultPeriod: item.defaultPeriod ?? null,
        color: item.color ?? null,
        category: item.category ?? null,
      },
    } satisfies Prisma.TaskTemplateUncheckedCreateInput;

    const template = existingTemplate
      ? await tx.taskTemplate.update({
          where: {
            id: existingTemplate.id,
          },
          data: {
            title: templateData.title,
            shortLabel: templateData.shortLabel,
            icon: templateData.icon,
            durationMinutes: templateData.durationMinutes,
            imageUrl: templateData.imageUrl,
            color: templateData.color,
            category: templateData.category,
            minAge: templateData.minAge,
            maxAge: templateData.maxAge,
            autoAssignEnabled: templateData.autoAssignEnabled,
            recommendationMeta: templateData.recommendationMeta,
          },
          select: {
            id: true,
            title: true,
            shortLabel: true,
            icon: true,
            imageUrl: true,
            color: true,
          },
        })
      : await tx.taskTemplate.create({
          data: {
            ...templateData,
            isBuiltIn: false,
          },
          select: {
            id: true,
            title: true,
            shortLabel: true,
            icon: true,
            imageUrl: true,
            color: true,
          },
        });

    templateByTitle.set(normalizedTitle, {
      ...template,
      isBuiltIn: existingTemplate?.isBuiltIn ?? false,
      durationMinutes: templateData.durationMinutes,
    });
    importedTemplateByLegacyId.set(item.id, template);
  }

  return importedTemplateByLegacyId;
}

async function ensureFallbackImportedTemplate(
  tx: Prisma.TransactionClient,
  householdId: string,
  legacyTaskId: number,
  importedTemplateByLegacyId: Map<number, ImportedTemplateRef>,
) {
  const existing = importedTemplateByLegacyId.get(legacyTaskId);

  if (existing) {
    return existing;
  }

  const created = await tx.taskTemplate.create({
    data: {
      householdId,
      title: `Mission ${legacyTaskId}`,
      shortLabel: `M${legacyTaskId}`,
      icon: "star",
      autoAssignEnabled: false,
      isBuiltIn: false,
      recommendationMeta: {
        source: "prototype-import",
        prototypeId: legacyTaskId,
        missingFromLibrary: true,
      },
    },
    select: {
      id: true,
      title: true,
      shortLabel: true,
      icon: true,
      imageUrl: true,
      color: true,
    },
  });

  importedTemplateByLegacyId.set(legacyTaskId, created);

  return created;
}

export async function importPrototypeSnapshotToHousehold(
  input: ImportPrototypeSnapshotInput,
) {
  const data = parsePrototypeRoutineKidsData(JSON.parse(input.snapshot));
  const preview = buildPrototypeImportPreview(data);

  if (preview.profileCount === 0 && preview.templateCount === 0) {
    return null;
  }

  if (input.currentPlan === BillingPlan.FREE) {
    if (data.profiles.length > 1) {
      throw new Error("The Free plan can import only one child profile.");
    }

    const exceedsTaskLimit = data.profiles.some((profile) => {
      const morningTasks = profile.assignedTasks.filter(
        (assignment) => assignment.period === "morning",
      ).length;
      const eveningTasks = profile.assignedTasks.filter(
        (assignment) => assignment.period === "evening",
      ).length;

      return morningTasks > 4 || eveningTasks > 4;
    });

    if (exceedsTaskLimit) {
      throw new Error("The Free plan can import only four tasks per routine.");
    }
  }

  return prisma.$transaction(async (tx) => {
    await tx.activityLog.deleteMany({
      where: {
        householdId: input.householdId,
      },
    });

    await tx.childProfile.deleteMany({
      where: {
        householdId: input.householdId,
      },
    });

    const importedTemplateByLegacyId = await upsertImportedTemplates(
      tx,
      input.householdId,
      data.taskLibrary,
    );

    const allCompletionRows: Prisma.TaskCompletionCreateManyInput[] = [];

    for (const [profileIndex, profile] of data.profiles.entries()) {
      const locale = data.language ?? input.locale ?? "fr";
      const normalizedAvatar = normalizePrototypeAvatar(profile.avatar, profile.age);
      const createdProfile = await tx.childProfile.create({
        data: {
          householdId: input.householdId,
          name: profile.name,
          age: profile.age,
          ageBand: getAgeBandFromAge(profile.age),
          tone: getToneFromAge(profile.age),
          avatar: normalizedAvatar.avatar,
          photoUrl: normalizedAvatar.photoUrl,
          headline: null,
          order: profileIndex,
        },
        select: {
          id: true,
          name: true,
        },
      });

      const routineSeedByPeriod = new Map(
        getDefaultRoutineSeeds({
          age: profile.age,
          name: profile.name,
          locale,
        }).map((seed) => [seed.period, seed]),
      );

      const routineByPeriod = new Map<"morning" | "evening", string>();
      const routineTaskByLegacyKey = new Map<string, string>();
      const routineTaskIdsByPeriod = new Map<"morning" | "evening", string[]>([
        ["morning", []],
        ["evening", []],
      ]);

      for (const period of ["morning", "evening"] as const) {
        const periodEnum =
          period === "morning" ? RoutinePeriod.MORNING : RoutinePeriod.EVENING;
        const seed = routineSeedByPeriod.get(periodEnum);

        const routine = await tx.routine.create({
          data: {
            householdId: input.householdId,
            childProfileId: createdProfile.id,
            title:
              seed?.title
              ?? (period === "morning"
                ? locale === "en"
                  ? "Morning routine"
                  : "Routine du matin"
                : locale === "en"
                  ? "Evening routine"
                  : "Routine du soir"),
            period: periodEnum,
            ageMin: seed?.ageMin ?? Math.max(profile.age - 1, 2),
            ageMax: seed?.ageMax ?? profile.age + 1,
            order: period === "morning" ? 0 : 1,
          },
          select: {
            id: true,
          },
        });

        routineByPeriod.set(period, routine.id);

        const assignmentsForPeriod = profile.assignedTasks.filter(
          (assignment) => assignment.period === period,
        );
        const seenTaskIds = new Set<number>();

        for (const [taskIndex, assignment] of assignmentsForPeriod.entries()) {
          if (seenTaskIds.has(assignment.taskId)) {
            continue;
          }

          seenTaskIds.add(assignment.taskId);
          const template = await ensureFallbackImportedTemplate(
            tx,
            input.householdId,
            assignment.taskId,
            importedTemplateByLegacyId,
          );
          const createdTask = await tx.routineTask.create({
            data: {
              routineId: routine.id,
              templateId: template.id,
              title: template.title,
              shortLabel: template.shortLabel,
              icon: template.icon,
              imageUrl: template.imageUrl,
              color: template.color ?? null,
              scheduleDays: assignment.days ?? [0, 1, 2, 3, 4, 5, 6],
              order: taskIndex,
            },
            select: {
              id: true,
            },
          });

          routineTaskByLegacyKey.set(`${assignment.taskId}_${period}`, createdTask.id);
          routineTaskIdsByPeriod.get(period)?.push(createdTask.id);
        }
      }

      const streakByDay = getStreakSnapshots(profile.streakHistory);

      for (const [dayKey, streakSnapshot] of streakByDay.entries()) {
        for (const period of ["morning", "evening"] as const) {
          const taskIds = routineTaskIdsByPeriod.get(period) ?? [];

          for (const taskId of taskIds) {
            allCompletionRows.push({
              taskId,
              childProfileId: createdProfile.id,
              dayKey,
              completedAt: new Date(`${dayKey}T12:00:00.000Z`),
              streakSnapshot,
              metadata: {
                source: "prototype-import",
                importedFrom: "streakHistory",
              },
            });
          }
        }
      }

      const currentCompletionDayKey =
        data.lastResetDate && isValidDayKey(data.lastResetDate)
          ? data.lastResetDate
          : new Date().toISOString().slice(0, 10);

      for (const completedKey of profile.completedKeys) {
        const routineTaskId = routineTaskByLegacyKey.get(completedKey);

        if (!routineTaskId) {
          continue;
        }

        allCompletionRows.push({
          taskId: routineTaskId,
          childProfileId: createdProfile.id,
          dayKey: currentCompletionDayKey,
          completedAt: new Date(`${currentCompletionDayKey}T12:00:00.000Z`),
          streakSnapshot: streakByDay.get(currentCompletionDayKey) ?? null,
          metadata: {
            source: "prototype-import",
            importedFrom: "completedKeys",
          },
        });
      }
    }

    if (allCompletionRows.length > 0) {
      await tx.taskCompletion.createMany({
        data: allCompletionRows,
        skipDuplicates: true,
      });
    }

    await tx.household.update({
      where: {
        id: input.householdId,
      },
      data: {
        locale: data.language ?? input.locale ?? "fr",
        soundsEnabled: data.soundOn,
        morningStart: data.periods.mStart,
        morningEnd: data.periods.mEnd,
        eveningStart: data.periods.eStart,
        eveningEnd: data.periods.eEnd,
        isOnboarded: data.profiles.length > 0,
      },
    });

    await tx.activityLog.create({
      data: {
        householdId: input.householdId,
        eventType: "PROTOTYPE_IMPORTED",
        title:
          (input.locale ?? "fr") === "en"
            ? "Prototype snapshot imported"
            : "Snapshot prototype importe",
        metadata: {
          profiles: preview.profileCount,
          templates: preview.templateCount,
          assignments: preview.assignmentCount,
          completions: allCompletionRows.length,
        },
      },
    });

    await tx.adminAuditLog.create({
      data: {
        householdId: input.householdId,
        actorUserId: input.actorUserId,
        action: "PROTOTYPE_IMPORTED",
        targetType: "Household",
        targetId: input.householdId,
        metadata: {
          profiles: preview.profileCount,
          templates: preview.templateCount,
          assignments: preview.assignmentCount,
          completions: allCompletionRows.length,
          legacyPremiumIgnored: data.isPremium,
          language: data.language ?? "unset",
        },
      },
    });

    return {
      ...preview,
      importedCompletionRows: allCompletionRows.length,
    } satisfies PrototypeImportSummary;
  });
}
