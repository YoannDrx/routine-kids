import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { queryRaw, findUnique, deleteMany } = vi.hoisted(() => ({
  queryRaw: vi.fn(),
  findUnique: vi.fn(),
  deleteMany: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $queryRaw: queryRaw,
    rateLimit: { findUnique, deleteMany },
  },
}));

import {
  claimParentStepUpAttempt,
  getParentStepUpRetryAfterSeconds,
  parentStepUpAttemptWindowMs,
  resetParentStepUpAttempts,
} from "@/lib/parent-step-up-rate-limit";

describe("parent step-up rate limiting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows an atomically claimed attempt", async () => {
    queryRaw.mockResolvedValue([{ count: 5, lastRequest: BigInt(1_000) }]);

    await expect(claimParentStepUpAttempt("user_1")).resolves.toEqual({
      allowed: true,
      retryAfterSeconds: parentStepUpAttemptWindowMs / 1_000,
    });
    expect(findUnique).not.toHaveBeenCalled();
  });

  it("returns a bounded retry delay after the attempt budget is exhausted", async () => {
    const now = Date.now();
    vi.spyOn(Date, "now").mockReturnValue(now);
    queryRaw.mockResolvedValue([]);
    findUnique.mockResolvedValue({ lastRequest: BigInt(now - 60_000) });

    await expect(claimParentStepUpAttempt("user_1")).resolves.toEqual({
      allowed: false,
      retryAfterSeconds: 540,
    });
    vi.restoreAllMocks();
  });

  it("resets the shared budget after successful verification", async () => {
    deleteMany.mockResolvedValue({ count: 1 });
    await resetParentStepUpAttempts("user_1");
    expect(deleteMany).toHaveBeenCalledWith({
      where: { key: "parent-step-up:user_1" },
    });
  });

  it("never emits a zero or negative Retry-After value", () => {
    expect(getParentStepUpRetryAfterSeconds(BigInt(1_000), BigInt(2_000_000))).toBe(1);
  });
});
