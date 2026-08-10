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
import { prisma } from "@/lib/prisma";

const stepUpSchema = z.object({
  credential: z.string().trim().min(1).max(128),
});

const attemptWindowMs = 10 * 60_000;
const maximumAttempts = 5;

async function claimAttempt(userId: string) {
  const key = `parent-step-up:${userId}`;
  const now = BigInt(Date.now());

  return prisma.$transaction(async (tx) => {
    const current = await tx.rateLimit.findUnique({ where: { key } });
    if (!current || now - current.lastRequest > BigInt(attemptWindowMs)) {
      await tx.rateLimit.upsert({
        where: { key },
        update: { count: 1, lastRequest: now },
        create: { key, count: 1, lastRequest: now },
      });
      return true;
    }
    if (current.count >= maximumAttempts) return false;

    await tx.rateLimit.update({
      where: { key },
      data: { count: { increment: 1 }, lastRequest: now },
    });
    return true;
  });
}

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

  if (!(await claimAttempt(user.id))) {
    log.done(429, { outcome: "rate_limited" });
    return NextResponse.json(
      { error: "too_many_attempts" },
      { status: 429, headers: { "Retry-After": "600" } },
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
    prisma.rateLimit.deleteMany({ where: { key: `parent-step-up:${user.id}` } }),
  ]);

  log.done(200, { outcome: "verified" });
  return NextResponse.json({ verified: true });
}
