import type { HouseholdBoardOverview } from "@/lib/household";
import {
  prototypeProfiles,
  type BoardTask,
  type TaskIconName,
} from "@/lib/data/prototype-seed";

export const boardAvatarChoices = [
  "🧑‍🚀",
  "🚀",
  "🦊",
  "🐻",
  "🐼",
  "🐯",
  "🦁",
  "🐸",
  "🐬",
  "🦄",
  "🐙",
  "🐶",
];

export const boardTaskIconOptions: TaskIconName[] = [
  "shirt",
  "sparkles",
  "footprints",
  "glass-water",
  "apple",
  "school",
  "book-open",
  "bath",
  "moon",
  "bed",
  "heart",
  "rocket",
  "star",
  "sun",
  "droplets",
  "brush",
];

const boardTaskColorClassMap = {
  "bg-blue-500": "#3b82f6",
  "bg-cyan-500": "#06b6d4",
  "bg-purple-500": "#a855f7",
  "bg-green-500": "#22c55e",
  "bg-red-500": "#ef4444",
  "bg-yellow-500": "#eab308",
  "bg-gray-500": "#6b7280",
  "bg-slate-500": "#64748b",
  "bg-amber-500": "#f59e0b",
  "bg-pink-500": "#ec4899",
  "bg-orange-500": "#f97316",
  "bg-teal-500": "#14b8a6",
  "bg-indigo-500": "#6366f1",
} satisfies Record<string, string>;

function isBoardTaskColorClass(
  value: string,
): value is keyof typeof boardTaskColorClassMap {
  return value in boardTaskColorClassMap;
}

export const boardTaskColorOptions = [
  "#3b82f6",
  "#a855f7",
  "#ec4899",
  "#f97316",
  "#22c55e",
  "#eab308",
  "#ef4444",
  "#14b8a6",
  "#6366f1",
  "#6b7280",
];

export function resolveBoardTaskColor(color: string | null | undefined) {
  if (!color) {
    return null;
  }

  return isBoardTaskColorClass(color) ? boardTaskColorClassMap[color] : color;
}

function normalizeTaskLookupKey(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/['’]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

type BoardTaskFallbackMeta = {
  recommendedPeriod?: BoardTask["recommendedPeriod"];
  minAge?: number | null;
  maxAge?: number | null;
  autoAssignEnabled?: boolean;
  category?: string | null;
};

const prototypeLibraryFallbackMeta = new Map<string, BoardTaskFallbackMeta>([
  ["petit dej", { recommendedPeriod: "morning", minAge: 3 }],
  ["nourrir le chat", { recommendedPeriod: "both", minAge: 5 }],
  ["fruits", { recommendedPeriod: "both", minAge: 2 }],
  ["gourde", { recommendedPeriod: "morning", minAge: 4, category: "school" }],
  ["lecture", { recommendedPeriod: "evening", minAge: 4 }],
  ["lunettes", { recommendedPeriod: "morning", minAge: 3 }],
  ["sport", { recommendedPeriod: "both", minAge: 5 }],
  ["sac decole", { recommendedPeriod: "evening", minAge: 5, category: "school_prep" }],
]);

for (const profile of prototypeProfiles) {
  for (const mode of ["morning", "evening"] as const) {
    for (const task of profile.tasksByMode[mode]) {
      const key = normalizeTaskLookupKey(task.label);
      const existing = prototypeLibraryFallbackMeta.get(key);
      const nextRecommendedPeriod =
        existing?.recommendedPeriod && existing.recommendedPeriod !== mode
          ? "both"
          : existing?.recommendedPeriod ?? mode;

      prototypeLibraryFallbackMeta.set(key, {
        recommendedPeriod: nextRecommendedPeriod,
        minAge:
          existing?.minAge === null || existing?.minAge === undefined
            ? profile.age
            : Math.min(existing.minAge, profile.age),
        maxAge:
          existing?.maxAge === null || existing?.maxAge === undefined
            ? profile.age
            : Math.max(existing.maxAge, profile.age),
        autoAssignEnabled: existing?.autoAssignEnabled ?? !task.reward,
        category: existing?.category ?? null,
      });
    }
  }
}

function getFallbackTaskMeta(label: string): BoardTaskFallbackMeta | null {
  return prototypeLibraryFallbackMeta.get(normalizeTaskLookupKey(label)) ?? null;
}

export const boardLibrarySeed: BoardTask[] = [
  { id: "library-breakfast", label: "Petit dej", shortLabel: "Fuel", icon: "sun", durationMinutes: 10, isBuiltIn: true },
  { id: "library-cat", label: "Nourrir le chat", shortLabel: "Cat", icon: "heart", durationMinutes: 2, isBuiltIn: true },
  { id: "library-fruits", label: "Fruits", shortLabel: "Fruits", icon: "apple", durationMinutes: 2, isBuiltIn: true },
  { id: "library-water-bottle", label: "Gourde", shortLabel: "Bottle", icon: "glass-water", durationMinutes: 1, isBuiltIn: true },
  { id: "library-story", label: "Lecture", shortLabel: "Story", icon: "book-open", durationMinutes: 8, isBuiltIn: true },
  { id: "library-glasses", label: "Lunettes", shortLabel: "Glasses", icon: "sparkles", durationMinutes: 1, isBuiltIn: true },
  { id: "library-sport", label: "Sport", shortLabel: "Sport", icon: "heart", durationMinutes: 10, isBuiltIn: true },
  { id: "library-bag", label: "Sac d'ecole", shortLabel: "Bag", icon: "school", durationMinutes: 2, isBuiltIn: true },
];

export function isTaskIconName(value: string | null | undefined): value is TaskIconName {
  return boardTaskIconOptions.includes((value ?? "") as TaskIconName);
}

export function getBuiltInTaskTemplateSeeds() {
  const taskMap = new Map<string, BoardTask>();

  for (const task of boardLibrarySeed) {
    taskMap.set(task.label.toLowerCase(), task);
  }

  for (const profile of prototypeProfiles) {
    for (const mode of ["morning", "evening"] as const) {
      for (const task of profile.tasksByMode[mode]) {
        taskMap.set(task.label.toLowerCase(), { ...task, isBuiltIn: true });
      }
    }
  }

  return [...taskMap.values()]
    .map((task) => {
      const fallbackMeta = getFallbackTaskMeta(task.label);

      return {
        ...task,
        recommendedPeriod: task.recommendedPeriod ?? fallbackMeta?.recommendedPeriod ?? null,
        minAge: task.minAge ?? fallbackMeta?.minAge ?? null,
        maxAge: task.maxAge ?? fallbackMeta?.maxAge ?? null,
        autoAssignEnabled: task.autoAssignEnabled ?? fallbackMeta?.autoAssignEnabled ?? true,
        category: task.category ?? fallbackMeta?.category ?? null,
        isBuiltIn: true,
      };
    })
    .sort((taskA, taskB) =>
    taskA.label.localeCompare(taskB.label, "fr"),
    );
}

function getRecommendedPeriod(
  recommendationMeta: unknown,
): BoardTask["recommendedPeriod"] {
  if (!recommendationMeta || typeof recommendationMeta !== "object") {
    return null;
  }

  const defaultPeriod = (recommendationMeta as { defaultPeriod?: unknown }).defaultPeriod;

  return defaultPeriod === "morning" ||
    defaultPeriod === "evening" ||
    defaultPeriod === "both"
    ? defaultPeriod
    : null;
}

export function mapTaskTemplateToBoardTask(template: {
  id: string;
  title: string;
  shortLabel: string | null;
  icon: string | null;
  durationMinutes: number | null;
  imageUrl?: string | null;
  color?: string | null;
  category?: string | null;
  minAge: number | null;
  maxAge: number | null;
  autoAssignEnabled?: boolean | null;
  recommendationMeta?: unknown;
  isBuiltIn?: boolean | null;
}) {
  const fallbackMeta = getFallbackTaskMeta(template.title);

  return {
    id: template.id,
    templateId: template.id,
    label: template.title,
    shortLabel: template.shortLabel ?? template.title,
    icon: isTaskIconName(template.icon) ? template.icon : "sparkles",
    imageUrl: template.imageUrl ?? null,
    color: template.color ?? null,
    scheduleDays: null,
    recommendedPeriod:
      getRecommendedPeriod(template.recommendationMeta)
      ?? fallbackMeta?.recommendedPeriod
      ?? null,
    category: template.category ?? fallbackMeta?.category ?? null,
    minAge: template.minAge ?? fallbackMeta?.minAge ?? null,
    maxAge: template.maxAge ?? fallbackMeta?.maxAge ?? null,
    autoAssignEnabled: template.autoAssignEnabled ?? fallbackMeta?.autoAssignEnabled ?? true,
    durationMinutes: template.durationMinutes ?? 3,
    isBuiltIn: Boolean(template.isBuiltIn),
  } satisfies BoardTask;
}

export function getBoardLibraryTasksFromHousehold(
  household: HouseholdBoardOverview | null,
) {
  if (!household) {
    return [];
  }

  return household.taskTemplates
    .map((template) =>
      mapTaskTemplateToBoardTask({
        id: template.id,
        title: template.title,
        shortLabel: template.shortLabel,
        icon: template.icon,
        durationMinutes: template.durationMinutes,
        imageUrl: template.imageUrl,
        color: template.color,
        category: template.category,
        minAge: template.minAge,
        maxAge: template.maxAge,
        autoAssignEnabled: template.autoAssignEnabled,
        recommendationMeta: template.recommendationMeta,
        isBuiltIn: template.isBuiltIn,
      }),
    )
    .sort((taskA, taskB) => taskA.label.localeCompare(taskB.label, "fr"));
}

export function getPrototypeBoardLibraryTasks() {
  return getBuiltInTaskTemplateSeeds();
}
