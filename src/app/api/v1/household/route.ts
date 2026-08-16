import { NextResponse } from "next/server";
import { z } from "zod";

import { getApiParentContext } from "@/lib/api-parent-context";
import { getApiUser } from "@/lib/api-session";
import { getDayKey } from "@/lib/day-key";
import { getParentSecurityRecord } from "@/lib/parent-security";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const householdSettingsFields = z.object({
  name: z.string().trim().min(1).max(60),
  locale: z.enum(["fr", "en"]),
  timeZone: z.string().trim().min(1).max(80),
  soundsEnabled: z.boolean(),
  morningStart: timeSchema,
  morningEnd: timeSchema,
  eveningStart: timeSchema,
  eveningEnd: timeSchema,
});

const completeHouseholdSettingsSchema = householdSettingsFields
  .refine((value) => value.morningStart < value.morningEnd, {
    message: "invalid_morning_range",
  })
  .refine((value) => value.eveningStart < value.eveningEnd, {
    message: "invalid_evening_range",
  });

const householdSettingsSchema = householdSettingsFields
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "empty_settings",
  });

function isValidTimeZone(value: string) {
  try {
    new Intl.DateTimeFormat("en", { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  const user = await getApiUser(request);
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const household = await prisma.household.findFirst({
    where: {
      OR: [
        { ownerUserId: user.id },
        { members: { some: { userId: user.id } } },
      ],
    },
    select: {
      id: true,
      name: true,
      locale: true,
      timeZone: true,
      soundsEnabled: true,
      morningStart: true,
      morningEnd: true,
      eveningStart: true,
      eveningEnd: true,
      subscription: {
        select: {
          plan: true,
          status: true,
          provider: true,
          environment: true,
          periodEnd: true,
          revokedAt: true,
        },
      },
      childProfiles: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          name: true,
          age: true,
          avatar: true,
          photoUrl: true,
          headline: true,
          routines: {
            where: { isArchived: false },
            orderBy: { order: "asc" },
            select: {
              id: true,
              title: true,
              period: true,
              tasks: {
                orderBy: { order: "asc" },
                select: {
                  id: true,
                  title: true,
                  shortLabel: true,
                  icon: true,
                  imageUrl: true,
                  color: true,
                  durationMinutes: true,
                  scheduleDays: true,
                  points: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!household) {
    return NextResponse.json({ error: "household_not_found" }, { status: 404 });
  }

  const dayKey = getDayKey(new Date(), household.timeZone);
  const [completions, parentSecurity] = await Promise.all([
    prisma.taskCompletion.findMany({
      where: {
        childProfile: { householdId: household.id },
        dayKey,
      },
      select: {
        taskId: true,
        childProfileId: true,
        completedAt: true,
      },
    }),
    getParentSecurityRecord(user.id),
  ]);

  return NextResponse.json(
    {
      apiVersion: 1,
      serverTime: new Date().toISOString(),
      dayKey,
      parentGate: { pinConfigured: Boolean(parentSecurity?.adminPinHash) },
      appAccountToken: await prisma.user
        .findUnique({ where: { id: user.id }, select: { appAccountToken: true } })
        .then((account) => account?.appAccountToken ?? null),
      household,
      completions,
    },
    {
      headers: {
        "Cache-Control": "private, no-store",
      },
    },
  );
}

export async function PATCH(request: Request) {
  const access = await getApiParentContext(request);
  if ("error" in access) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const parsed = householdSettingsSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_household_settings" }, { status: 400 });
  }
  const current = await prisma.household.findUnique({
    where: { id: access.household.id },
    select: {
      name: true,
      locale: true,
      timeZone: true,
      soundsEnabled: true,
      morningStart: true,
      morningEnd: true,
      eveningStart: true,
      eveningEnd: true,
    },
  });
  const normalized = completeHouseholdSettingsSchema.safeParse({
    ...current,
    ...parsed.data,
  });
  if (!normalized.success) {
    return NextResponse.json({ error: "invalid_household_settings" }, { status: 400 });
  }
  if (!isValidTimeZone(normalized.data.timeZone)) {
    return NextResponse.json({ error: "invalid_time_zone" }, { status: 400 });
  }

  const household = await prisma.$transaction(async (tx) => {
    const updated = await tx.household.update({
      where: { id: access.household.id },
      data: normalized.data,
      select: {
        id: true,
        name: true,
        locale: true,
        timeZone: true,
        soundsEnabled: true,
        morningStart: true,
        morningEnd: true,
        eveningStart: true,
        eveningEnd: true,
      },
    });
    await tx.adminAuditLog.create({
      data: {
        householdId: access.household.id,
        actorUserId: access.user.id,
        action: "HOUSEHOLD_APP_SETTINGS_UPDATED",
        targetType: "Household",
        targetId: access.household.id,
        metadata: normalized.data,
      },
    });
    return updated;
  });

  return NextResponse.json({ household });
}
