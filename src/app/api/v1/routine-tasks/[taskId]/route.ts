import { NextResponse } from "next/server";
import { z } from "zod";

import { getApiParentContext } from "@/lib/api-parent-context";
import { deletePrivateImageIfUnreferenced } from "@/lib/media-storage";
import {
  deleteRoutineTaskFromProfile,
  updateRoutineTaskScheduleForProfile,
} from "@/lib/routine-task-service";

const deletionSchema = z.object({ childProfileId: z.string().cuid() });
const scheduleSchema = z.object({
  childProfileId: z.string().cuid(),
  scheduleDays: z.array(z.number().int().min(0).max(6)).min(1).max(7),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ taskId: string }> },
) {
  const access = await getApiParentContext(request);
  if ("error" in access) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }
  const parsed = scheduleSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_schedule" }, { status: 400 });
  }
  const { taskId } = await context.params;

  try {
    const task = await updateRoutineTaskScheduleForProfile({
      householdId: access.household.id,
      actorUserId: access.user.id,
      childProfileId: parsed.data.childProfileId,
      routineTaskId: taskId,
      scheduleDays: parsed.data.scheduleDays,
      locale: access.household.locale === "en" ? "en" : "fr",
    });
    return NextResponse.json({ task });
  } catch {
    return NextResponse.json({ error: "routine_task_not_found" }, { status: 404 });
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ taskId: string }> },
) {
  const access = await getApiParentContext(request);
  if ("error" in access) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }
  const parsed = deletionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_assignment" }, { status: 400 });
  }
  const { taskId } = await context.params;

  try {
    const deleted = await deleteRoutineTaskFromProfile({
      householdId: access.household.id,
      actorUserId: access.user.id,
      childProfileId: parsed.data.childProfileId,
      routineTaskId: taskId,
      locale: access.household.locale === "en" ? "en" : "fr",
    });
    await deletePrivateImageIfUnreferenced(deleted.previousImageUrl).catch(() => undefined);
    return NextResponse.json({ deleted: true });
  } catch {
    return NextResponse.json({ error: "routine_task_not_found" }, { status: 404 });
  }
}
