import { RoutinePeriod } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getApiParentContext } from "@/lib/api-parent-context";
import { upsertProfileRoutine } from "@/lib/routine-task-service";

const routineSchema = z.object({
  childProfileId: z.string().cuid(),
  period: z.enum(RoutinePeriod),
  title: z.string().trim().min(1).max(60),
});

export async function POST(request: Request) {
  const context = await getApiParentContext(request);
  if ("error" in context) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }
  const parsed = routineSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_routine" }, { status: 400 });
  }

  try {
    const routine = await upsertProfileRoutine({
      householdId: context.household.id,
      actorUserId: context.user.id,
      ...parsed.data,
      locale: context.household.locale === "en" ? "en" : "fr",
    });
    return NextResponse.json({ routine });
  } catch {
    return NextResponse.json({ error: "profile_not_found" }, { status: 404 });
  }
}
