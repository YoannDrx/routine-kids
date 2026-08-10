import { NotificationPlatform } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getApiUser } from "@/lib/api-session";
import { prisma } from "@/lib/prisma";

const deviceSchema = z.object({
  deviceId: z.string().trim().min(8).max(128),
  platform: z.enum([NotificationPlatform.WEB, NotificationPlatform.IOS]),
  locale: z.enum(["fr", "en"]).default("fr"),
  notificationsEnabled: z.boolean().default(false),
  pushTokenHash: z.string().trim().max(256).optional(),
});

export async function POST(request: Request) {
  const user = await getApiUser(request);
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const parsed = deviceSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const household = await prisma.household.findFirst({
    where: {
      OR: [
        { ownerUserId: user.id },
        { members: { some: { userId: user.id } } },
      ],
    },
    select: { id: true },
  });
  if (!household) {
    return NextResponse.json({ error: "household_not_found" }, { status: 404 });
  }

  await prisma.deviceRegistration.upsert({
    where: { userId_deviceId: { userId: user.id, deviceId: parsed.data.deviceId } },
    update: {
      householdId: household.id,
      platform: parsed.data.platform,
      locale: parsed.data.locale,
      notificationsEnabled: parsed.data.notificationsEnabled,
      pushTokenHash: parsed.data.pushTokenHash,
      lastSeenAt: new Date(),
    },
    create: {
      householdId: household.id,
      userId: user.id,
      ...parsed.data,
    },
  });

  return NextResponse.json({ registered: true });
}
