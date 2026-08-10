import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getApiUser } from "@/lib/api-session";
import { prisma } from "@/lib/prisma";
import { toggleTaskCompletion } from "@/lib/task-completion-service";

const completionMutationSchema = z.object({
  mutationId: z.string().trim().min(8).max(128),
  deviceId: z.string().trim().min(1).max(128).optional(),
  childProfileId: z.string().trim().min(1),
  taskId: z.string().trim().min(1),
  dayKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  completed: z.boolean(),
});

export async function POST(request: Request) {
  const user = await getApiUser(request);
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const parsed = completionMutationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_request", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const household = await tx.household.findFirst({
        where: {
          OR: [
            { ownerUserId: user.id },
            { members: { some: { userId: user.id } } },
          ],
        },
        select: { id: true, timeZone: true },
      });
      if (!household) throw new Error("household_not_found");

      const existingMutation = await tx.clientMutation.findUnique({
        where: { id: parsed.data.mutationId },
        select: { householdId: true, actorUserId: true, resultMetadata: true },
      });
      if (existingMutation) {
        if (
          existingMutation.householdId !== household.id ||
          existingMutation.actorUserId !== user.id
        ) {
          throw new Error("mutation_id_conflict");
        }
        return { duplicate: true, result: existingMutation.resultMetadata };
      }

      const journey = await toggleTaskCompletion({
        tx,
        householdId: household.id,
        timeZone: household.timeZone,
        taskId: parsed.data.taskId,
        childProfileId: parsed.data.childProfileId,
        dayKey: parsed.data.dayKey,
        completed: parsed.data.completed,
        metadata: {
          source: "api-v1",
          mutationId: parsed.data.mutationId,
          deviceId: parsed.data.deviceId ?? null,
        },
      });

      const metadata: Prisma.InputJsonValue = {
        taskId: parsed.data.taskId,
        childProfileId: parsed.data.childProfileId,
        dayKey: parsed.data.dayKey,
        completed: parsed.data.completed,
        streak: journey.streak,
      };
      await tx.clientMutation.create({
        data: {
          id: parsed.data.mutationId,
          householdId: household.id,
          actorUserId: user.id,
          deviceId: parsed.data.deviceId,
          mutationType: "TASK_COMPLETION_TOGGLED",
          resultMetadata: metadata,
        },
      });

      return { duplicate: false, result: metadata };
    });

    return NextResponse.json(result, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json({ duplicate: true });
    }

    const code = error instanceof Error ? error.message : "mutation_failed";
    const status = code === "task_not_found" || code === "household_not_found" ? 404 : 409;
    return NextResponse.json({ error: code }, { status });
  }
}
