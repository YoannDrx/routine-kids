import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));

import { collectHouseholdMediaReferences } from "@/lib/account-data";

describe("RoutineKids account data lifecycle", () => {
  it("deduplicates every household media reference before export or deletion", () => {
    const profilePhoto = "rk-media:households/home-1/profiles/profile.webp";
    const taskPhoto = "rk-media:households/home-1/tasks/task.webp";

    expect(
      collectHouseholdMediaReferences({
        childProfiles: [
          {
            photoUrl: profilePhoto,
            routines: [
              {
                tasks: [
                  { imageUrl: taskPhoto },
                  { imageUrl: taskPhoto },
                  { imageUrl: null },
                ],
              },
            ],
          },
        ],
        taskTemplates: [{ imageUrl: taskPhoto }, { imageUrl: null }],
      }),
    ).toEqual([
      {
        reference: profilePhoto,
        pathname: "households/home-1/profiles/profile.webp",
      },
      {
        reference: taskPhoto,
        pathname: "households/home-1/tasks/task.webp",
      },
    ]);
  });

  it("keeps external legacy images visible in the manifest without treating them as private Blob paths", () => {
    expect(
      collectHouseholdMediaReferences({
        childProfiles: [
          { photoUrl: "data:image/png;base64,AAAA", routines: [] },
        ],
        taskTemplates: [],
      }),
    ).toEqual([
      {
        reference: "data:image/png;base64,AAAA",
        pathname: null,
      },
    ]);
  });
});
