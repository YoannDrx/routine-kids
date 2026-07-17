import "server-only";

import { type RoutinePeriod } from "@prisma/client";

import { getOwnerSubscription } from "@/lib/household";
import { prisma } from "@/lib/prisma";
import { isPremiumSubscription } from "@/lib/settings";

export const freePlanLimits = {
  childProfiles: 1,
  tasksPerRoutine: 4,
} as const;

export async function getProductEntitlement(userId: string) {
  const subscription = await getOwnerSubscription(userId);

  return {
    isPremium: isPremiumSubscription(
      subscription?.plan,
      subscription?.status,
    ),
  };
}

export async function canCreateChildProfile(params: {
  userId: string;
  householdId: string;
}) {
  const entitlement = await getProductEntitlement(params.userId);

  if (entitlement.isPremium) {
    return true;
  }

  const profileCount = await prisma.childProfile.count({
    where: {
      householdId: params.householdId,
    },
  });

  return profileCount < freePlanLimits.childProfiles;
}

export async function canAssignTemplatesToPeriods(params: {
  userId: string;
  householdId: string;
  childProfileId: string;
  templateIds: string[];
  periods: RoutinePeriod[];
}) {
  const entitlement = await getProductEntitlement(params.userId);

  if (entitlement.isPremium) {
    return true;
  }

  const uniqueTemplateIds = [...new Set(params.templateIds)];
  const routines = await prisma.routine.findMany({
    where: {
      householdId: params.householdId,
      childProfileId: params.childProfileId,
      period: {
        in: params.periods,
      },
      isArchived: false,
    },
    select: {
      tasks: {
        select: {
          templateId: true,
        },
      },
    },
  });

  return routines.every((routine) => {
    const existingTemplateIds = new Set(
      routine.tasks.map((task) => task.templateId).filter(Boolean),
    );
    const newTemplateCount = uniqueTemplateIds.filter(
      (templateId) => !existingTemplateIds.has(templateId),
    ).length;

    return (
      routine.tasks.length + newTemplateCount <= freePlanLimits.tasksPerRoutine
    );
  });
}
