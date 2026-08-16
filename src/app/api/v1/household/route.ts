import { NextResponse } from "next/server";

import { getApiUser } from "@/lib/api-session";
import { getDayKey } from "@/lib/day-key";
import { getParentSecurityRecord } from "@/lib/parent-security";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

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
