import { describe, expect, it } from "vitest";

import {
  deriveJourneyStateFromRoutines,
  getCompletedDayKeysFromRoutines,
} from "@/lib/journey";

const profileId = "child-1";

function routineWithTasks(
  tasks: Array<{
    id: string;
    scheduleDays?: number[];
    completions?: Array<{
      dayKey: string;
      streakSnapshot?: number | null;
    }>;
  }>,
) {
  return [
    {
      period: "MORNING",
      tasks: tasks.map((task) => ({
        id: task.id,
        scheduleDays: task.scheduleDays,
        completions: (task.completions ?? []).map((completion) => ({
          ...completion,
          childProfileId: profileId,
        })),
      })),
    },
  ];
}

describe("journey completion snapshots", () => {
  it("keeps a completed historical day stable after the routine changes", () => {
    const routines = routineWithTasks([
      {
        id: "original-task",
        completions: [{ dayKey: "2026-07-16", streakSnapshot: 1 }],
      },
      { id: "task-added-later" },
    ]);

    expect(
      getCompletedDayKeysFromRoutines(routines, profileId, "2026-07-17"),
    ).toContain("2026-07-16");
    expect(
      deriveJourneyStateFromRoutines(routines, profileId, "2026-07-17")
        .completedDayCount,
    ).toBe(1);
  });

  it("still requires every scheduled task when the day has no snapshot", () => {
    const routines = routineWithTasks([
      {
        id: "completed-task",
        completions: [{ dayKey: "2026-07-16", streakSnapshot: null }],
      },
      { id: "missing-task" },
    ]);

    expect(
      getCompletedDayKeysFromRoutines(routines, profileId, "2026-07-17"),
    ).not.toContain("2026-07-16");
  });

  it("ignores tasks that are not scheduled for the evaluated weekday", () => {
    const routines = routineWithTasks([
      {
        id: "thursday-task",
        scheduleDays: [4],
        completions: [{ dayKey: "2026-07-16" }],
      },
      { id: "friday-task", scheduleDays: [5] },
    ]);

    expect(
      getCompletedDayKeysFromRoutines(routines, profileId, "2026-07-17"),
    ).toContain("2026-07-16");
  });
});
