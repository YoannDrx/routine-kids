import "server-only";

import {
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import { cookies } from "next/headers";

import { ensureServerEnv } from "@/lib/env.server";
import { getCurrentAppLocale } from "@/lib/i18n.server";
import { prisma } from "@/lib/prisma";
import { getServerCopy } from "@/lib/server-copy";
import { type ParentSecuritySummary } from "@/lib/settings";

ensureServerEnv();

const parentStepUpCookieName = "routine-kids-parent-step-up";
const defaultStepUpMinutes = 15;

function getParentSecuritySecret() {
  return process.env.BETTER_AUTH_SECRET ?? "routine-kids-dev-secret-change-me";
}

function toBase64Url(buffer: Buffer) {
  return buffer.toString("base64url");
}

function fromBase64Url(value: string) {
  return Buffer.from(value, "base64url");
}

function signStepUpPayload(payload: string) {
  return createHmac("sha256", getParentSecuritySecret())
    .update(payload)
    .digest("base64url");
}

function encodeStepUpCookie(input: {
  userId: string;
  expiresAt: number;
}) {
  const payload = toBase64Url(
    Buffer.from(JSON.stringify(input), "utf8"),
  );

  return `${payload}.${signStepUpPayload(payload)}`;
}

function decodeStepUpCookie(
  value: string,
): {
  userId: string;
  expiresAt: number;
} | null {
  const [payload, signature] = value.split(".");

  if (!payload || !signature) {
    return null;
  }

  const expectedSignature = signStepUpPayload(payload);

  if (
    signature.length !== expectedSignature.length ||
    !timingSafeEqual(
      Buffer.from(signature, "utf8"),
      Buffer.from(expectedSignature, "utf8"),
    )
  ) {
    return null;
  }

  try {
    const decoded = JSON.parse(fromBase64Url(payload).toString("utf8")) as {
      userId?: string;
      expiresAt?: number;
    };

    if (
      typeof decoded.userId !== "string" ||
      typeof decoded.expiresAt !== "number"
    ) {
      return null;
    }

    return {
      userId: decoded.userId,
      expiresAt: decoded.expiresAt,
    };
  } catch {
    return null;
  }
}

export function hashParentPin(pin: string) {
  const salt = randomBytes(16);
  const derivedKey = scryptSync(pin, salt, 32);

  return `scrypt:${toBase64Url(salt)}:${toBase64Url(derivedKey)}`;
}

export function verifyParentPin(pin: string, storedHash: string | null | undefined) {
  if (!storedHash) {
    return false;
  }

  const [algorithm, saltValue, hashValue] = storedHash.split(":");

  if (algorithm !== "scrypt" || !saltValue || !hashValue) {
    return false;
  }

  const derivedKey = scryptSync(pin, fromBase64Url(saltValue), 32);
  const expectedKey = fromBase64Url(hashValue);

  if (derivedKey.length !== expectedKey.length) {
    return false;
  }

  return timingSafeEqual(derivedKey, expectedKey);
}

export async function getParentSecurityRecord(userId: string) {
  return prisma.parentSecuritySettings.findUnique({
    where: {
      userId,
    },
    select: {
      adminPinHash: true,
      stepUpMinutes: true,
    },
  });
}

export async function hasActiveParentStepUp(userId: string) {
  const cookieStore = await cookies();
  const rawValue = cookieStore.get(parentStepUpCookieName)?.value;

  if (!rawValue) {
    return false;
  }

  const decoded = decodeStepUpCookie(rawValue);

  if (!decoded) {
    return false;
  }

  return decoded.userId === userId && decoded.expiresAt > Date.now();
}

export async function setParentStepUpCookie(input: {
  userId: string;
  stepUpMinutes?: number;
}) {
  const cookieStore = await cookies();
  const expiresAt =
    Date.now() + (input.stepUpMinutes ?? defaultStepUpMinutes) * 60_000;

  cookieStore.set(parentStepUpCookieName, encodeStepUpCookie({
    userId: input.userId,
    expiresAt,
  }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(expiresAt),
  });
}

export async function clearParentStepUpCookie() {
  const cookieStore = await cookies();

  cookieStore.delete(parentStepUpCookieName);
}

export async function getParentSecuritySummary(
  userId: string,
): Promise<ParentSecuritySummary> {
  const settings = await getParentSecurityRecord(userId);
  const pinConfigured = Boolean(settings?.adminPinHash);

  return {
    pinConfigured,
    stepUpMinutes: settings?.stepUpMinutes ?? defaultStepUpMinutes,
    stepUpActive: pinConfigured ? await hasActiveParentStepUp(userId) : false,
  };
}

export async function getParentStepUpStatus(userId: string) {
  const copy = getServerCopy(await getCurrentAppLocale());
  const settings = await getParentSecurityRecord(userId);

  if (!settings?.adminPinHash) {
    return {
      ok: false as const,
      code: "parent_pin_not_configured" as const,
      message: copy.actions.parentPinMissingConfig,
    };
  }

  const unlocked = await hasActiveParentStepUp(userId);

  if (!unlocked) {
    return {
      ok: false as const,
      code: "parent_pin_required" as const,
      message: copy.actions.parentPinRequiredAction,
    };
  }

  return {
    ok: true as const,
    stepUpMinutes: settings.stepUpMinutes,
  };
}
