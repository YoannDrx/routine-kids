import { describe, expect, it } from "vitest";

import { getDefaultRoutineSeeds } from "@/lib/default-routines";

describe("default routine seeds", () => {
  it("caps initial routines to the advertised free-plan limit", () => {
    const routines = getDefaultRoutineSeeds({
      age: 6,
      name: "Milo",
      taskLimit: 4,
    });

    expect(routines).toHaveLength(2);
    expect(routines.every((routine) => routine.tasks.length === 4)).toBe(true);
  });

  it("keeps the complete prototype set when no limit is requested", () => {
    const routines = getDefaultRoutineSeeds({ age: 6, name: "Milo" });

    expect(routines.some((routine) => routine.tasks.length > 4)).toBe(true);
  });
});
