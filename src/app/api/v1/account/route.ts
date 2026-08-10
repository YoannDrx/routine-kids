import { NextResponse } from "next/server";
import { z } from "zod";

import {
  AccountDeletionError,
  deleteRoutineKidsAccount,
} from "@/lib/account-deletion";
import { startApiRequest } from "@/lib/api-observability";
import { getApiUser } from "@/lib/api-session";
import {
  clearParentStepUpCookie,
  getParentStepUpStatus,
} from "@/lib/parent-security";

const deletionSchema = z.object({
  confirmation: z.literal("DELETE"),
  householdName: z.string().trim().min(1).max(60),
});

export const runtime = "nodejs";

export async function DELETE(request: Request) {
  const log = startApiRequest(request, "/api/v1/account");
  const user = await getApiUser(request);

  if (!user) {
    log.done(401, { outcome: "unauthorized" });
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const parsed = deletionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    log.done(400, { outcome: "invalid_request" });
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const parentAccess = await getParentStepUpStatus(user.id);
  if (!parentAccess.ok) {
    log.done(403, { outcome: "parent_step_up_required" });
    return NextResponse.json(
      { error: "parent_step_up_required" },
      { status: 403 },
    );
  }

  try {
    const result = await deleteRoutineKidsAccount({
      householdName: parsed.data.householdName,
      userId: user.id,
    });
    await clearParentStepUpCookie();
    log.done(200, {
      cleanupPending: result.cleanupPending,
      outcome: "deleted",
    });
    return NextResponse.json({ deleted: true, ...result });
  } catch (error) {
    const code =
      error instanceof AccountDeletionError ? error.code : "account_delete_failed";
    const status = code === "household_not_found" ? 404 : 409;
    log.failed(error, status, { outcome: code });
    return NextResponse.json({ error: code }, { status });
  }
}
