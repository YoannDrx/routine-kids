import {
  BillingPlan,
  Prisma,
  RoutinePeriod,
  UiTone,
} from "@prisma/client";

import {
  prototypeProfiles,
  type BoardTask,
} from "@/lib/data/prototype-seed";
import { getBuiltInTaskTemplateSeeds } from "@/lib/data/board-library";
import { getDefaultRoutineSeeds } from "@/lib/default-routines";
import { prisma } from "@/lib/prisma";
import { themePacks } from "@/lib/theme/packs";

type HouseholdBootstrapInput = {
  userId: string;
  userName: string;
};

const builtInThemeSeeds = [
  {
    slug: "space-academy",
    name: themePacks["space-academy"].name,
    tone: UiTone.SPACE,
    description: themePacks["space-academy"].description,
    accentColor: themePacks["space-academy"].accent,
    surfaceColor: "#140b31",
  },
  {
    slug: "ocean-quest",
    name: themePacks["ocean-quest"].name,
    tone: UiTone.OCEAN,
    description: themePacks["ocean-quest"].description,
    accentColor: themePacks["ocean-quest"].accent,
    surfaceColor: "#0d2037",
  },
  {
    slug: "jungle-camp",
    name: themePacks["jungle-camp"].name,
    tone: UiTone.JUNGLE,
    description: themePacks["jungle-camp"].description,
    accentColor: themePacks["jungle-camp"].accent,
    surfaceColor: "#122718",
  },
] satisfies Array<{
  slug: string;
  name: string;
  tone: UiTone;
  description: string;
  accentColor: string;
  surfaceColor: string;
}>;

const builtInPresetSeeds = [
  {
    title: "Pack matin doux",
    description:
      "3 a 5 actions courtes, vocabulaire simple et progression calme pour les 3-4 ans.",
    ageMin: 3,
    ageMax: 4,
    period: RoutinePeriod.MORNING,
    tone: UiTone.OCEAN,
    tasks: serializePrototypeTasks("luna", "morning"),
  },
  {
    title: "Pack autonomie ecole",
    description:
      "Routine rapide pour le depart ecole avec focus sur le sac, la tenue et le lancement.",
    ageMin: 5,
    ageMax: 6,
    period: RoutinePeriod.MORNING,
    tone: UiTone.SPACE,
    tasks: serializePrototypeTasks("milo", "morning"),
  },
  {
    title: "Pack soir focus",
    description:
      "Lecture, hygiene et retour au calme pour les routines du soir plus autonomes.",
    ageMin: 7,
    ageMax: 8,
    period: RoutinePeriod.EVENING,
    tone: UiTone.JUNGLE,
    tasks: serializePrototypeTasks("leo", "evening"),
  },
] satisfies Array<{
  title: string;
  description: string;
  ageMin: number;
  ageMax: number;
  period: RoutinePeriod;
  tone: UiTone;
  tasks: Prisma.InputJsonValue;
}>;

const builtInTaskTemplateSeeds = getBuiltInTaskTemplateSeeds().map((task) => ({
  title: task.label,
  shortLabel: task.shortLabel,
  icon: task.icon,
  imageUrl: task.imageUrl ?? null,
  color: task.color ?? null,
  category: task.category ?? null,
  minAge: task.minAge ?? null,
  maxAge: task.maxAge ?? null,
  recommendedPeriod: task.recommendedPeriod ?? null,
  autoAssignEnabled: task.autoAssignEnabled ?? true,
  durationMinutes: task.durationMinutes,
}));

function serializePrototypeTasks(
  profileId: string,
  mode: "morning" | "evening",
): Prisma.InputJsonValue {
  const profile = prototypeProfiles.find((item) => item.id === profileId);

  if (!profile) {
    return [];
  }

  return serializeBoardTasks(profile.tasksByMode[mode]) satisfies Prisma.InputJsonValue;
}

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

async function ensureProfileRoutineBaseline(
  tx: Prisma.TransactionClient,
  input: {
    householdId: string;
    childProfileId: string;
    profileName: string;
    age: number;
    existingRoutines: Array<{ period: RoutinePeriod }>;
  },
) {
  const existingPeriods = new Set(
    input.existingRoutines.map((routine) => routine.period),
  );
  const missingRoutineSeeds = getDefaultRoutineSeeds({
    age: input.age,
    name: input.profileName,
  }).filter((seed) => !existingPeriods.has(seed.period));

  for (const [index, seed] of missingRoutineSeeds.entries()) {
    await tx.routine.create({
      data: {
        householdId: input.householdId,
        childProfileId: input.childProfileId,
        title: seed.title,
        period: seed.period,
        ageMin: seed.ageMin,
        ageMax: seed.ageMax,
        order: input.existingRoutines.length + index,
        tasks: {
          create: seed.tasks,
        },
      },
    });
  }
}

function getDefaultHouseholdName(userName: string) {
  const trimmedName = userName.trim();

  if (!trimmedName) {
    return "Famille RoutineKids";
  }

  const firstName = trimmedName.split(/\s+/)[0];

  return `Famille ${firstName}`;
}

export async function ensureHouseholdBaseline({
  userId,
  userName,
}: HouseholdBootstrapInput) {
  return prisma.$transaction(async (tx) => {
    let household = await tx.household.findUnique({
      where: {
        ownerUserId: userId,
      },
      select: {
        id: true,
        name: true,
      },
    });

    let createdHousehold = false;

    if (!household) {
      household = await tx.household.create({
        data: {
          name: getDefaultHouseholdName(userName),
          ownerUserId: userId,
        },
        select: {
          id: true,
          name: true,
        },
      });
      createdHousehold = true;
    }

    await tx.parentSecuritySettings.upsert({
      where: {
        userId,
      },
      update: {},
      create: {
        userId,
      },
    });

    await tx.householdMember.upsert({
      where: {
        householdId_userId: {
          householdId: household.id,
          userId,
        },
      },
      update: {
        role: "OWNER",
      },
      create: {
        householdId: household.id,
        userId,
        role: "OWNER",
      },
    });

    await tx.subscription.upsert({
      where: {
        referenceId: userId,
      },
      update: {
        householdId: household.id,
      },
      create: {
        id: `free_${userId}`,
        plan: BillingPlan.FREE,
        referenceId: userId,
        householdId: household.id,
        status: "ACTIVE",
      },
    });

    const existingThemeSlugs = new Set(
      (
        await tx.themePack.findMany({
          where: {
            householdId: household.id,
            isBuiltIn: true,
          },
          select: {
            slug: true,
          },
        })
      ).map((theme) => theme.slug),
    );

    const missingThemes = builtInThemeSeeds.filter(
      (theme) => !existingThemeSlugs.has(theme.slug),
    );

    if (missingThemes.length > 0) {
      await tx.themePack.createMany({
        data: missingThemes.map((theme) => ({
          householdId: household.id,
          ...theme,
          isPremium: false,
          isBuiltIn: true,
        })),
      });
    }

    const existingPresetKeys = new Set(
      (
        await tx.routineSuggestionPreset.findMany({
          where: {
            householdId: household.id,
          },
          select: {
            title: true,
            period: true,
          },
        })
      ).map((preset) => `${preset.title}:${preset.period}`),
    );

    const missingPresets = builtInPresetSeeds.filter(
      (preset) => !existingPresetKeys.has(`${preset.title}:${preset.period}`),
    );

    if (missingPresets.length > 0) {
      await tx.routineSuggestionPreset.createMany({
        data: missingPresets.map((preset) => ({
          householdId: household.id,
          ...preset,
        })),
      });
    }

    const childProfiles = await tx.childProfile.findMany({
      where: {
        householdId: household.id,
      },
      select: {
        id: true,
        name: true,
        age: true,
        routines: {
          where: {
            isArchived: false,
          },
          select: {
            period: true,
          },
        },
      },
    });

    const existingBuiltInTemplates = new Set(
      (
        await tx.taskTemplate.findMany({
          where: {
            householdId: household.id,
            isBuiltIn: true,
          },
          select: {
            title: true,
          },
        })
      ).map((template) => template.title.toLowerCase()),
    );

    const missingTemplates = builtInTaskTemplateSeeds.filter(
      (template) => !existingBuiltInTemplates.has(template.title.toLowerCase()),
    );

    if (missingTemplates.length > 0) {
      await tx.taskTemplate.createMany({
        data: missingTemplates.map((template) => ({
          householdId: household.id,
          title: template.title,
          shortLabel: template.shortLabel,
          icon: template.icon,
          imageUrl: template.imageUrl ?? null,
          color: template.color ?? null,
          category: template.category ?? null,
          minAge: template.minAge ?? null,
          maxAge: template.maxAge ?? null,
          recommendationMeta: template.recommendedPeriod
            ? {
                defaultPeriod: template.recommendedPeriod,
              }
            : Prisma.JsonNull,
          durationMinutes: template.durationMinutes,
          isBuiltIn: true,
          autoAssignEnabled: template.autoAssignEnabled ?? true,
        })),
      });
    }

    for (const childProfile of childProfiles) {
      await ensureProfileRoutineBaseline(tx, {
        householdId: household.id,
        childProfileId: childProfile.id,
        profileName: childProfile.name,
        age: childProfile.age,
        existingRoutines: childProfile.routines,
      });
    }

    if (createdHousehold) {
      await tx.adminAuditLog.create({
        data: {
          householdId: household.id,
          actorUserId: userId,
          action: "HOUSEHOLD_CREATED",
          targetType: "Household",
          targetId: household.id,
          metadata: {
            source: "auth-signup",
            seededThemes: builtInThemeSeeds.length,
            seededPresets: builtInPresetSeeds.length,
            seededTaskTemplates: builtInTaskTemplateSeeds.length,
          },
        },
      });
    }

    return household.id;
  });
}
