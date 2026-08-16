import { NextResponse } from "next/server";
import { z } from "zod";

import { getApiParentContext } from "@/lib/api-parent-context";
import { prisma } from "@/lib/prisma";
import { upsertTaskTemplate } from "@/lib/task-template-service";

const templateSchema = z.object({
  templateId: z.string().cuid().optional(),
  title: z.string().trim().min(1).max(60),
  shortLabel: z.string().trim().min(1).max(24),
  icon: z.string().trim().min(1).max(40).default("sparkles"),
  color: z.string().trim().max(20).nullable().optional(),
  durationMinutes: z.number().int().min(1).max(120).default(5),
});

export async function GET(request: Request) {
  const context = await getApiParentContext(request);
  if ("error" in context) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  const templates = await prisma.taskTemplate.findMany({
    where: { householdId: context.household.id },
    orderBy: [{ isBuiltIn: "desc" }, { title: "asc" }],
    select: {
      id: true,
      title: true,
      shortLabel: true,
      icon: true,
      color: true,
      durationMinutes: true,
      isBuiltIn: true,
    },
  });
  return NextResponse.json({ templates });
}

export async function POST(request: Request) {
  const context = await getApiParentContext(request);
  if ("error" in context) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }
  const parsed = templateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_template" }, { status: 400 });
  }

  const template = await upsertTaskTemplate({
    householdId: context.household.id,
    actorUserId: context.user.id,
    ...parsed.data,
    locale: context.household.locale === "en" ? "en" : "fr",
  });
  return NextResponse.json({ template }, { status: template.created ? 201 : 200 });
}
