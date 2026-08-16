import "server-only";

import type { Prisma } from "@prisma/client";

import { getDefaultRoutineSeeds } from "@/lib/default-routines";
import { getAgeBandFromAge, getToneFromAge } from "@/lib/household";
import { type AppLocale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { freePlanLimits } from "@/lib/product-entitlements";
import { getServerCopy } from "@/lib/server-copy";

type CreateChildProfileInput = {
  householdId: string;
  actorUserId: string;
  name: string;
  age: number;
  avatar: string;
  photoUrl?: string | null;
  headline: string | null;
  locale?: "fr" | "en";
};

type UpdateChildProfileInput = {
  householdId: string;
  actorUserId: string;
  childProfileId: string;
  name: string;
  age: number;
  avatar: string;
  photoUrl?: string | null;
  headline: string | null;
  locale?: "fr" | "en";
};

type UpdateChildProfileAvatarInput = {
  householdId: string;
  actorUserId: string;
  childProfileId: string;
  avatar: string;
  locale?: AppLocale;
};

type UpdateChildProfilePhotoInput = {
  householdId: string;
  actorUserId: string;
  childProfileId: string;
  photoUrl: string;
  locale?: AppLocale;
};

type RemoveChildProfilePhotoInput = {
  householdId: string;
  actorUserId: string;
  childProfileId: string;
  locale?: AppLocale;
};

type DeleteChildProfileInput = {
  householdId: string;
  actorUserId: string;
  childProfileId: string;
  locale?: AppLocale;
};

async function getNextProfileOrder(tx: Prisma.TransactionClient, householdId: string) {
  const lastProfile = await tx.childProfile.findFirst({
    where: {
      householdId,
    },
    orderBy: {
      order: "desc",
    },
    select: {
      order: true,
    },
  });

  return (lastProfile?.order ?? -1) + 1;
}

async function getOwnedProfileOrThrow(
  tx: Prisma.TransactionClient,
  householdId: string,
  childProfileId: string,
  locale: AppLocale = "fr",
) {
  const profile = await tx.childProfile.findFirst({
    where: {
      id: childProfileId,
      householdId,
    },
    select: {
      id: true,
      name: true,
      age: true,
      avatar: true,
      photoUrl: true,
      headline: true,
      defaultThemeId: true,
    },
  });

  if (!profile) {
    throw new Error(getServerCopy(locale).actions.profileNotInHousehold);
  }

  return profile;
}

export async function createChildProfileWithDefaults(
  input: CreateChildProfileInput,
) {
  return prisma.$transaction(async (tx) => {
    const nextOrder = await getNextProfileOrder(tx, input.householdId);

    const createdProfile = await tx.childProfile.create({
      data: {
        householdId: input.householdId,
        name: input.name,
        age: input.age,
        ageBand: getAgeBandFromAge(input.age),
        tone: getToneFromAge(input.age),
        avatar: input.avatar,
        photoUrl: input.photoUrl,
        headline: input.headline,
        order: nextOrder,
      },
      select: {
        id: true,
        name: true,
        age: true,
        tone: true,
      },
    });

    for (const [index, seed] of getDefaultRoutineSeeds({
      age: input.age,
      name: input.name,
      locale: input.locale,
      taskLimit: freePlanLimits.tasksPerRoutine,
    }).entries()) {
      await tx.routine.create({
        data: {
          householdId: input.householdId,
          childProfileId: createdProfile.id,
          title: seed.title,
          period: seed.period,
          ageMin: seed.ageMin,
          ageMax: seed.ageMax,
          order: index,
          tasks: {
            create: seed.tasks,
          },
        },
      });
    }

    await tx.household.update({
      where: {
        id: input.householdId,
      },
      data: {
        isOnboarded: true,
      },
    });

    await tx.activityLog.create({
      data: {
        householdId: input.householdId,
        childProfileId: createdProfile.id,
        eventType: "PROFILE_CREATED",
        title: `Profil ${input.name} cree`,
        metadata: {
          age: input.age,
          tone: createdProfile.tone,
        },
      },
    });

    await tx.adminAuditLog.create({
      data: {
        householdId: input.householdId,
        actorUserId: input.actorUserId,
        action: "PROFILE_CREATED",
        targetType: "ChildProfile",
        targetId: createdProfile.id,
        metadata: {
          name: input.name,
          age: input.age,
        },
      },
    });

    return createdProfile;
  });
}

export async function updateChildProfileDetails(
  input: UpdateChildProfileInput,
) {
  return prisma.$transaction(async (tx) => {
    const existingProfile = await getOwnedProfileOrThrow(
      tx,
      input.householdId,
      input.childProfileId,
      input.locale,
    );

    const updatedProfile = await tx.childProfile.update({
      where: {
        id: existingProfile.id,
      },
      data: {
        name: input.name,
        age: input.age,
        ageBand: getAgeBandFromAge(input.age),
        tone:
          existingProfile.defaultThemeId === null
            ? getToneFromAge(input.age)
            : undefined,
        avatar: input.avatar,
        photoUrl: input.photoUrl,
        headline: input.headline,
      },
      select: {
        id: true,
        name: true,
      },
    });

    const previousRoutineSeeds = (["fr", "en"] as const).flatMap((locale) =>
      getDefaultRoutineSeeds({
        age: existingProfile.age,
        name: existingProfile.name,
        locale,
      }),
    );
    const nextRoutineSeeds = getDefaultRoutineSeeds({
      age: input.age,
      name: input.name,
      locale: input.locale,
    });

    for (const seed of nextRoutineSeeds) {
      const previousTitles = previousRoutineSeeds
        .filter((candidate) => candidate.period === seed.period)
        .map((candidate) => candidate.title);
      await tx.routine.updateMany({
        where: {
          householdId: input.householdId,
          childProfileId: existingProfile.id,
          period: seed.period,
          title: { in: previousTitles },
        },
        data: {
          title: seed.title,
          ageMin: seed.ageMin,
          ageMax: seed.ageMax,
        },
      });
    }

    await tx.activityLog.create({
      data: {
        householdId: input.householdId,
        childProfileId: existingProfile.id,
        eventType: "PROFILE_UPDATED",
        title: `Profil ${input.name} mis a jour`,
        metadata: {
          previousName: existingProfile.name,
          age: input.age,
        },
      },
    });

    await tx.adminAuditLog.create({
      data: {
        householdId: input.householdId,
        actorUserId: input.actorUserId,
        action: "PROFILE_UPDATED",
        targetType: "ChildProfile",
        targetId: existingProfile.id,
        metadata: {
          previousName: existingProfile.name,
          name: input.name,
          age: input.age,
        },
      },
    });

    return {
      ...updatedProfile,
      previousPhotoUrl: existingProfile.photoUrl,
    };
  });
}

export async function updateChildProfileAvatar(
  input: UpdateChildProfileAvatarInput,
) {
  return prisma.$transaction(async (tx) => {
    const existingProfile = await getOwnedProfileOrThrow(
      tx,
      input.householdId,
      input.childProfileId,
      input.locale,
    );

    const updatedProfile = await tx.childProfile.update({
      where: {
        id: existingProfile.id,
      },
      data: {
        avatar: input.avatar,
        photoUrl: null,
      },
      select: {
        id: true,
        name: true,
        avatar: true,
      },
    });

    await tx.adminAuditLog.create({
      data: {
        householdId: input.householdId,
        actorUserId: input.actorUserId,
        action: "PROFILE_AVATAR_UPDATED",
        targetType: "ChildProfile",
        targetId: existingProfile.id,
        metadata: {
          name: existingProfile.name,
          avatar: input.avatar,
        },
      },
    });

    return {
      ...updatedProfile,
      previousPhotoUrl: existingProfile.photoUrl,
    };
  });
}

export async function updateChildProfilePhoto(
  input: UpdateChildProfilePhotoInput,
) {
  return prisma.$transaction(async (tx) => {
    const existingProfile = await getOwnedProfileOrThrow(
      tx,
      input.householdId,
      input.childProfileId,
      input.locale,
    );

    const updatedProfile = await tx.childProfile.update({
      where: {
        id: existingProfile.id,
      },
      data: {
        photoUrl: input.photoUrl,
      },
      select: {
        id: true,
        name: true,
        photoUrl: true,
      },
    });

    await tx.adminAuditLog.create({
      data: {
        householdId: input.householdId,
        actorUserId: input.actorUserId,
        action: "PROFILE_PHOTO_UPDATED",
        targetType: "ChildProfile",
        targetId: existingProfile.id,
        metadata: {
          name: existingProfile.name,
          hadPhoto: Boolean(existingProfile.photoUrl),
        },
      },
    });

    return {
      ...updatedProfile,
      previousPhotoUrl: existingProfile.photoUrl,
    };
  });
}

export async function removeChildProfilePhoto(
  input: RemoveChildProfilePhotoInput,
) {
  return prisma.$transaction(async (tx) => {
    const existingProfile = await getOwnedProfileOrThrow(
      tx,
      input.householdId,
      input.childProfileId,
      input.locale,
    );

    const updatedProfile = await tx.childProfile.update({
      where: {
        id: existingProfile.id,
      },
      data: {
        photoUrl: null,
      },
      select: {
        id: true,
        name: true,
      },
    });

    await tx.adminAuditLog.create({
      data: {
        householdId: input.householdId,
        actorUserId: input.actorUserId,
        action: "PROFILE_PHOTO_REMOVED",
        targetType: "ChildProfile",
        targetId: existingProfile.id,
        metadata: {
          name: existingProfile.name,
        },
      },
    });

    return {
      ...updatedProfile,
      previousPhotoUrl: existingProfile.photoUrl,
    };
  });
}

export async function deleteChildProfileCascade(
  input: DeleteChildProfileInput,
) {
  return prisma.$transaction(async (tx) => {
    const existingProfile = await getOwnedProfileOrThrow(
      tx,
      input.householdId,
      input.childProfileId,
      input.locale,
    );

    const previousTaskImages = await tx.routineTask.findMany({
      where: {
        routine: {
          householdId: input.householdId,
          childProfileId: existingProfile.id,
        },
        imageUrl: { not: null },
      },
      distinct: ["imageUrl"],
      select: { imageUrl: true },
    });

    await tx.adminAuditLog.create({
      data: {
        householdId: input.householdId,
        actorUserId: input.actorUserId,
        action: "PROFILE_DELETED",
        targetType: "ChildProfile",
        targetId: existingProfile.id,
        metadata: {
          name: existingProfile.name,
        },
      },
    });

    await tx.childProfile.delete({
      where: {
        id: existingProfile.id,
      },
    });

    const remainingProfiles = await tx.childProfile.findMany({
      where: {
        householdId: input.householdId,
      },
      orderBy: {
        order: "asc",
      },
      select: {
        id: true,
      },
    });

    await Promise.all(
      remainingProfiles.map((profile, index) =>
        tx.childProfile.update({
          where: {
            id: profile.id,
          },
          data: {
            order: index,
          },
        }),
      ),
    );

    return {
      id: existingProfile.id,
      name: existingProfile.name,
      previousPhotoUrl: existingProfile.photoUrl,
      previousTaskImageUrls: previousTaskImages.flatMap(({ imageUrl }) =>
        imageUrl ? [imageUrl] : [],
      ),
    };
  });
}
