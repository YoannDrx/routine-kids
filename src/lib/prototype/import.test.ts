import { describe, expect, it } from "vitest";

import {
  buildPrototypeImportPreview,
  parsePrototypeRoutineKidsData,
} from "@/lib/prototype/import";

const validSnapshot = {
  profiles: [
    {
      id: 1,
      name: "Lina",
      age: 7,
      avatar: "robot",
      assignedTasks: [
        { taskId: 1, period: "morning" },
        { taskId: 2, period: "evening", days: [1, 2, 3] },
      ],
      completedKeys: ["1_morning"],
      streakHistory: ["2026-08-09"],
    },
  ],
  taskLibrary: [
    { id: 1, title: "Se brosser les dents" },
    { id: 2, title: "Lire une histoire" },
  ],
  isPremium: true,
};

describe("prototype import validation", () => {
  it("never trusts the legacy client-side Premium flag", () => {
    const parsed = parsePrototypeRoutineKidsData(validSnapshot);

    expect(parsed.isPremium).toBe(true);
    expect(buildPrototypeImportPreview(parsed)).toMatchObject({
      profileCount: 1,
      templateCount: 2,
      assignmentCount: 2,
      completionCount: 1,
      legacyPremiumIgnored: true,
    });
  });

  it.each([1, 13])("rejects an unsupported child age (%s)", (age) => {
    expect(() =>
      parsePrototypeRoutineKidsData({
        ...validSnapshot,
        profiles: [{ ...validSnapshot.profiles[0], age }],
      }),
    ).toThrow();
  });

  it("rejects schedule days outside the weekly range", () => {
    expect(() =>
      parsePrototypeRoutineKidsData({
        ...validSnapshot,
        profiles: [
          {
            ...validSnapshot.profiles[0],
            assignedTasks: [{ taskId: 1, period: "morning", days: [7] }],
          },
        ],
      }),
    ).toThrow();
  });
});
