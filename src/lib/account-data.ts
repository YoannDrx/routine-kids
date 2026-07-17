import "server-only";

import { get } from "@vercel/blob";

import { getPrivateMediaPathname } from "@/lib/private-media";
import { prisma } from "@/lib/prisma";

export const routineKidsExportVersion = "1.0";

export function collectHouseholdMediaReferences(household: {
  childProfiles: Array<{
    photoUrl: string | null;
    routines: Array<{ tasks: Array<{ imageUrl: string | null }> }>;
  }>;
  taskTemplates: Array<{ imageUrl: string | null }>;
}) {
  const references = [
    ...household.childProfiles.map((profile) => profile.photoUrl),
    ...household.childProfiles.flatMap((profile) =>
      profile.routines.flatMap((routine) =>
        routine.tasks.map((task) => task.imageUrl),
      ),
    ),
    ...household.taskTemplates.map((template) => template.imageUrl),
  ];

  return [...new Set(references.filter((value): value is string => Boolean(value)))]
    .map((reference) => ({
      reference,
      pathname: getPrivateMediaPathname(reference),
    }));
}

async function exportPrivateMedia(reference: string, pathname: string) {
  try {
    const result = await get(pathname, { access: "private" });

    if (!result || result.statusCode !== 200) {
      return { reference, pathname, status: "unavailable" as const };
    }

    const bytes = await new Response(result.stream).arrayBuffer();

    return {
      reference,
      pathname,
      status: "included" as const,
      contentType: result.blob.contentType,
      size: result.blob.size,
      base64: Buffer.from(bytes).toString("base64"),
    };
  } catch {
    return { reference, pathname, status: "unavailable" as const };
  }
}

export async function createRoutineKidsAccountExport(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      emailVerified: true,
      image: true,
      createdAt: true,
      updatedAt: true,
      subscription: {
        select: {
          plan: true,
          status: true,
          periodStart: true,
          periodEnd: true,
          cancelAtPeriodEnd: true,
        },
      },
      securitySettings: {
        select: {
          stepUpMinutes: true,
          passkeyEnabled: true,
          twoFactorEnabled: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      household: {
        include: {
          childProfiles: {
            include: {
              routines: {
                include: {
                  tasks: {
                    include: { completions: true },
                    orderBy: { order: "asc" },
                  },
                },
                orderBy: { order: "asc" },
              },
              taskCompletions: { orderBy: { completedAt: "asc" } },
            },
            orderBy: { order: "asc" },
          },
          taskTemplates: { orderBy: { createdAt: "asc" } },
          activityLogs: { orderBy: { createdAt: "asc" } },
          adminAuditLogs: { orderBy: { createdAt: "asc" } },
          suggestionPresets: { orderBy: { createdAt: "asc" } },
          themePacks: { orderBy: { createdAt: "asc" } },
        },
      },
    },
  });

  if (!user?.household) return null;

  const mediaReferences = collectHouseholdMediaReferences(user.household);
  const media = await Promise.all(
    mediaReferences.map(({ reference, pathname }) =>
      pathname
        ? exportPrivateMedia(reference, pathname)
        : Promise.resolve({
            reference,
            pathname: null,
            status: "external-reference" as const,
          }),
    ),
  );

  return {
    schema: "routinekids-account-export",
    version: routineKidsExportVersion,
    exportedAt: new Date().toISOString(),
    account: {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      image: user.image,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      subscription: user.subscription,
      security: user.securitySettings,
    },
    household: user.household,
    media,
  };
}

export async function getAccountDeletionSnapshot(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      stripeCustomerId: true,
      subscription: {
        select: { stripeSubscriptionId: true },
      },
      household: {
        select: {
          id: true,
          name: true,
          childProfiles: {
            select: {
              photoUrl: true,
              routines: {
                select: { tasks: { select: { imageUrl: true } } },
              },
            },
          },
          taskTemplates: { select: { imageUrl: true } },
        },
      },
    },
  });
}

export async function deleteRoutineKidsAccountRecord(userId: string) {
  await prisma.user.delete({ where: { id: userId } });
}
