import { NextResponse } from "next/server";
import { z } from "zod";

import { startApiRequest } from "@/lib/api-observability";
import { getApiUser } from "@/lib/api-session";
import { auth } from "@/lib/auth";
import {
  getParentSecurityRecord,
  setParentStepUpCookie,
  verifyParentPin,
} from "@/lib/parent-security";
import {
  claimParentStepUpAttempt,
  resetParentStepUpAttempts,
} from "@/lib/parent-step-up-rate-limit";

const stepUpSchema = z.object({
  credential: z.string().trim().min(1).max(128),
});

export async function POST(request: Request) {
  const log = startApiRequest(request, "/api/v1/parent/step-up");
  const user = await getApiUser(request);
  if (!user) {
    log.done(401, { outcome: "unauthorized" });
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const parsed = stepUpSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    log.done(400, { outcome: "invalid_request" });
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const attempt = await claimParentStepUpAttempt(user.id);
  if (!attempt.allowed) {
    log.done(429, { outcome: "rate_limited" });
    return NextResponse.json(
      { error: "too_many_attempts" },
      {
        status: 429,
        headers: { "Retry-After": String(attempt.retryAfterSeconds) },
      },
    );
  }

  const settings = await getParentSecurityRecord(user.id);
  if (!settings) {
    log.done(404, { outcome: "security_not_configured" });
    return NextResponse.json(
      { error: "parent_security_not_configured" },
      { status: 404 },
    );
  }

  let verified = false;
  if (settings.adminPinHash) {
    verified =
      /^\d{4}$/.test(parsed.data.credential) &&
      verifyParentPin(parsed.data.credential, settings.adminPinHash);
  } else {
    try {
      const result = await auth.api.verifyPassword({
        body: { password: parsed.data.credential },
        headers: request.headers,
      });
      verified = result.status;
    } catch {
      verified = false;
    }
  }

  if (!verified) {
    log.done(403, { outcome: "invalid_credential" });
    return NextResponse.json({ error: "invalid_credential" }, { status: 403 });
  }

  await Promise.all([
    setParentStepUpCookie({
      userId: user.id,
      stepUpMinutes: settings.stepUpMinutes,
      securityVersion: settings.updatedAt.getTime(),
    }),
    resetParentStepUpAttempts(user.id),
  ]);

  log.done(200, { outcome: "verified" });
  return NextResponse.json({ verified: true });
}
