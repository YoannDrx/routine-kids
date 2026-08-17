import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { getApiUser, findFirst, getParentStepUpStatus } = vi.hoisted(() => ({
  getApiUser: vi.fn(),
  findFirst: vi.fn(),
  getParentStepUpStatus: vi.fn(),
}));

vi.mock("@/lib/api-session", () => ({ getApiUser }));
vi.mock("@/lib/parent-security", () => ({ getParentStepUpStatus }));
vi.mock("@/lib/prisma", () => ({
  prisma: { householdMember: { findFirst } },
}));

import { getApiParentContext } from "@/lib/api-parent-context";

describe("native parent API authorization", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects unauthenticated requests before querying a household", async () => {
    getApiUser.mockResolvedValue(null);
    await expect(getApiParentContext(new Request("https://example.test"))).resolves.toEqual({
      error: "unauthorized",
      status: 401,
    });
    expect(findFirst).not.toHaveBeenCalled();
  });

  it("scopes access to the authenticated user's parent membership", async () => {
    getApiUser.mockResolvedValue({ id: "user-a" });
    findFirst.mockResolvedValue({
      role: "PARENT",
      household: { id: "household-a", locale: "fr" },
    });
    getParentStepUpStatus.mockResolvedValue({ ok: true, stepUpMinutes: 15 });

    await expect(getApiParentContext(new Request("https://example.test"))).resolves.toMatchObject({
      user: { id: "user-a" },
      household: { id: "household-a" },
      role: "PARENT",
    });
    expect(findFirst).toHaveBeenCalledWith({
      where: {
        userId: "user-a",
        role: { in: ["OWNER", "PARENT"] },
      },
      select: expect.any(Object),
    });
  });

  it("does not grant caregiver or foreign-household access", async () => {
    getApiUser.mockResolvedValue({ id: "user-b" });
    findFirst.mockResolvedValue(null);

    await expect(getApiParentContext(new Request("https://example.test"))).resolves.toEqual({
      error: "forbidden",
      status: 403,
    });
    expect(getParentStepUpStatus).not.toHaveBeenCalled();
  });

  it("requires a current parental step-up for every mutation", async () => {
    getApiUser.mockResolvedValue({ id: "user-a" });
    findFirst.mockResolvedValue({
      role: "OWNER",
      household: { id: "household-a", locale: "fr" },
    });
    getParentStepUpStatus.mockResolvedValue({
      ok: false,
      code: "parent_pin_required",
    });

    await expect(getApiParentContext(new Request("https://example.test"))).resolves.toEqual({
      error: "parent_pin_required",
      status: 403,
    });
  });
});
