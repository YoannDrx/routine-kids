import { z } from "zod";

const prototypeAssignmentSchema = z.object({
  taskId: z.number(),
  period: z.enum(["morning", "evening"]),
  days: z.array(z.number().int().min(0).max(6)).optional(),
});

const prototypeProfileSchema = z.object({
  id: z.number(),
  name: z.string(),
  age: z.number().int().min(2).max(12),
  avatar: z.string(),
  assignedTasks: z.array(prototypeAssignmentSchema),
  completedKeys: z.array(z.string()),
  streakHistory: z.array(z.string()).default([]),
});

const prototypeTaskLibraryItemSchema = z.object({
  id: z.number(),
  title: z.string(),
  title_en: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  image: z.string().nullable().optional(),
  minAge: z.number().optional(),
  maxAge: z.number().optional(),
  defaultPeriod: z.enum(["morning", "evening", "both"]).optional(),
  category: z.string().optional(),
  auto: z.boolean().optional(),
});

export const prototypeRoutineKidsDataSchema = z.object({
  profiles: z.array(prototypeProfileSchema).default([]),
  taskLibrary: z.array(prototypeTaskLibraryItemSchema).default([]),
  isPremium: z.boolean().default(false),
  soundOn: z.boolean().default(true),
  periods: z
    .object({
      mStart: z.string(),
      mEnd: z.string(),
      eStart: z.string(),
      eEnd: z.string(),
    })
    .default({
      mStart: "06:00",
      mEnd: "12:00",
      eStart: "18:00",
      eEnd: "21:00",
    }),
  language: z.enum(["fr", "en"]).nullable().optional(),
  lastResetDate: z.string().nullable().optional(),
});

export type PrototypeRoutineKidsData = z.infer<typeof prototypeRoutineKidsDataSchema>;

export type PrototypeImportPreview = {
  profileCount: number;
  templateCount: number;
  assignmentCount: number;
  completionCount: number;
  legacyPremiumIgnored: boolean;
  language: "fr" | "en" | "unset";
};

export function parsePrototypeRoutineKidsData(raw: unknown) {
  return prototypeRoutineKidsDataSchema.parse(raw);
}

export function buildPrototypeImportPreview(
  data: PrototypeRoutineKidsData,
): PrototypeImportPreview {
  return {
    profileCount: data.profiles.length,
    templateCount: data.taskLibrary.length,
    assignmentCount: data.profiles.reduce(
      (sum, profile) => sum + profile.assignedTasks.length,
      0,
    ),
    completionCount: data.profiles.reduce(
      (sum, profile) => sum + profile.completedKeys.length,
      0,
    ),
    // Legacy premium state is client-controlled and is never imported.
    legacyPremiumIgnored: data.isPremium,
    language: data.language ?? "unset",
  };
}

export function readPrototypeImportPreviewFromStorage(
  storage: Storage,
): PrototypeImportPreview | null {
  const raw = storage.getItem("routineKidsData");

  if (!raw) {
    return null;
  }

  const parsed = parsePrototypeRoutineKidsData(JSON.parse(raw));
  return buildPrototypeImportPreview(parsed);
}
