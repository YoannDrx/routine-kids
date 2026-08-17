import { describe, expect, it } from "vitest";

import { getBoardProfilesFromBoardOverview } from "@/lib/board-data";
import type { HouseholdBoardOverview } from "@/lib/household";

describe("getBoardProfilesFromBoardOverview", () => {
  it("does not expose prototype missions when a live profile has no routine", () => {
    const household = {
      id: "household-1",
      childProfiles: [
        {
          id: "child-1",
          name: "Camille",
          age: 6,
          avatar: "🚀",
          photoUrl: null,
          headline: null,
          tone: "SPACE",
          defaultTheme: null,
          routines: [],
        },
      ],
      taskTemplates: [],
    } as unknown as HouseholdBoardOverview;

    const [profile] = getBoardProfilesFromBoardOverview(
      household,
      "2026-07-17",
    );

    expect(profile.tasksByMode.morning).toEqual([]);
    expect(profile.tasksByMode.evening).toEqual([]);
  });
});
