import { describe, expect, it } from "vitest";

import {
  createPrivateMediaReference,
  getPrivateMediaPathname,
  isPrivateMediaOwnedByHousehold,
  resolveMediaUrl,
} from "@/lib/private-media";

describe("private media references", () => {
  const pathname = "households/house 1/profiles/avatar.jpg";
  const reference = `rk-media:${pathname}`;

  it("creates an opaque reference and resolves it through the authenticated route", () => {
    expect(createPrivateMediaReference(pathname)).toBe(reference);
    expect(getPrivateMediaPathname(reference)).toBe(pathname);
    expect(resolveMediaUrl(reference)).toBe(
      "/api/media/households/house%201/profiles/avatar.jpg",
    );
  });

  it("keeps legacy and empty values compatible", () => {
    expect(resolveMediaUrl("data:image/png;base64,AAAA")).toBe(
      "data:image/png;base64,AAAA",
    );
    expect(resolveMediaUrl(null)).toBeNull();
  });

  it("rejects traversal and enforces household ownership", () => {
    expect(() =>
      createPrivateMediaReference("households/house-1/../secret.jpg"),
    ).toThrow("invalid_private_media_path");
    expect(isPrivateMediaOwnedByHousehold(reference, "house 1")).toBe(true);
    expect(isPrivateMediaOwnedByHousehold(reference, "house-2")).toBe(false);
  });
});
