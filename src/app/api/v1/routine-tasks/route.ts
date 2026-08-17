import { RoutinePeriod } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getApiParentContext } from "@/lib/api-parent-context";
import { canAssignTemplatesToPeriods } from "@/lib/product-entitlements";
import { assignTaskTemplateToRoutine } from "@/lib/routine-task-service";

const assignmentSchema = z.object({
  childProfileId: z.string().cuid(),
  templateId: z.string().cuid(),
  period: z.enum(RoutinePeriod),
  scheduleDays: z.array(z.number().int().min(0).max(6)).max(7).optional(),
});

export async function POST(request: Request) {
  const context = await getApiParentContext(request);
  if ("error" in context) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }
  const parsed = assignmentSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_assignment" }, { status: 400 });
  }

  const allowed = await canAssignTemplatesToPeriods({
    userId: context.user.id,
    householdId: context.household.id,
    childProfileId: parsed.data.childProfileId,
    templateIds: [parsed.data.templateId],
    periods: [parsed.data.period],
  });
  if (!allowed) {
    return NextResponse.json({ error: "routine_task_limit_reached" }, { status: 409 });
  }

  try {
    const task = await assignTaskTemplateToRoutine({
      householdId: context.household.id,
      actorUserId: context.user.id,
      ...parsed.data,
      locale: context.household.locale === "en" ? "en" : "fr",
    });
    return NextResponse.json({ task }, { status: task.created ? 201 : 200 });
  } catch {
    return NextResponse.json({ error: "profile_or_template_not_found" }, { status: 404 });
  }
}
