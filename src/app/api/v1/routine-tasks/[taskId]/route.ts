import { NextResponse } from "next/server";
import { z } from "zod";

import { getApiParentContext } from "@/lib/api-parent-context";
import { deletePrivateImageIfUnreferenced } from "@/lib/media-storage";
import { deleteRoutineTaskFromProfile } from "@/lib/routine-task-service";

const deletionSchema = z.object({ childProfileId: z.string().cuid() });

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
