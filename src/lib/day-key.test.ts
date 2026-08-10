import { describe, expect, it } from "vitest";

import { getDayKey } from "@/lib/day-key";

describe("getDayKey", () => {
  it("uses the household time zone instead of the server time zone", () => {
    const instant = new Date("2026-08-09T22:30:00.000Z");

    expect(getDayKey(instant, "Europe/Paris")).toBe("2026-08-10");
    expect(getDayKey(instant, "America/New_York")).toBe("2026-08-09");
  });

  it("stays correct across daylight-saving transitions", () => {
    expect(
      getDayKey(new Date("2026-03-29T22:30:00.000Z"), "Europe/Paris"),
    ).toBe("2026-03-30");
    expect(
      getDayKey(new Date("2026-10-25T23:30:00.000Z"), "Europe/Paris"),
    ).toBe("2026-10-26");
  });
});
