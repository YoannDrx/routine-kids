import {
  AgeBand,
  BillingPlan,
  Prisma,
  SubscriptionStatus,
  UiTone,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

export const householdOverviewInclude = {
  childProfiles: {
    include: {
      defaultTheme: true,
    },
    orderBy: {
      order: "asc" as const,
    },
  },
  suggestionPresets: true,
  themePacks: true,
} satisfies Prisma.HouseholdInclude;

export type HouseholdOverview = Prisma.HouseholdGetPayload<{
  include: typeof householdOverviewInclude;
}>;

export const householdBoardInclude = {
  taskTemplates: {
    orderBy: {
      title: "asc" as const,
    },
  },
  childProfiles: {
    orderBy: {
      order: "asc" as const,
    },
    include: {
      defaultTheme: true,
      dayCompletions: {
        distinct: ["dayKey"],
        orderBy: { completedAt: "desc" as const },
        take: 400,
        select: { dayKey: true },
      },
      routines: {
        where: {
          isArchived: false,
        },
        orderBy: {
          order: "asc" as const,
        },
        include: {
          tasks: {
            orderBy: {
              order: "asc" as const,
            },
            include: {
              completions: {
                orderBy: {
                  completedAt: "desc" as const,
                },
                take: 400,
              },
            },
          },
        },
      },
    },
  },
} satisfies Prisma.HouseholdInclude;

export type HouseholdBoardOverview = Prisma.HouseholdGetPayload<{
  include: typeof householdBoardInclude;
}>;

export function getAgeBandFromAge(age: number) {
  if (age <= 4) {
    return AgeBand.MINI;
  }

  if (age <= 6) {
    return AgeBand.GROWING;
  }

  return AgeBand.BIG;
}

export function getToneFromAge(age: number) {
  if (age <= 4) {
    return UiTone.OCEAN;
  }

  if (age <= 6) {
    return UiTone.SPACE;
  }

  return UiTone.JUNGLE;
}

export async function getHouseholdOverview(ownerUserId: string) {
  return prisma.household.findUnique({
    where: {
      ownerUserId,
    },
    include: householdOverviewInclude,
  });
}

export async function getHouseholdBoardOverview(ownerUserId: string) {
  return prisma.household.findUnique({
    where: {
      ownerUserId,
    },
    include: householdBoardInclude,
  });
}

export async function getHouseholdAdminAuditLog(ownerUserId: string, take = 30) {
  const household = await prisma.household.findUnique({
    where: {
      ownerUserId,
    },
    select: {
      id: true,
    },
  });

  if (!household) {
    return [];
  }

  return prisma.adminAuditLog.findMany({
    where: {
      householdId: household.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    take,
  });
}

export async function getOwnerSubscription(ownerUserId: string) {
  return prisma.subscription.findUnique({
    where: {
      referenceId: ownerUserId,
    },
    select: {
      plan: true,
      status: true,
      provider: true,
      environment: true,
      periodEnd: true,
      revokedAt: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
    },
  }) as Promise<{
    plan: BillingPlan;
    status: SubscriptionStatus | null;
    provider: import("@prisma/client").BillingProvider;
    environment: import("@prisma/client").BillingEnvironment;
    periodEnd: Date | null;
    revokedAt: Date | null;
    stripeCustomerId: string | null;
    stripeSubscriptionId: string | null;
  } | null>;
}
