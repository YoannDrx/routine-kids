import type { ThemeId } from "@/lib/theme/packs";
import { getJourneyStateFromStreak, type JourneyState } from "@/lib/journey";

export type BoardMode = "morning" | "evening";

export type TaskIconName =
  | "shirt"
  | "sparkles"
  | "footprints"
  | "glass-water"
  | "apple"
  | "school"
  | "book-open"
  | "bath"
  | "moon"
  | "bed"
  | "heart"
  | "rocket"
  | "star"
  | "sun"
  | "droplets"
  | "brush";

export type BoardTask = {
  id: string;
  templateId?: string | null;
  label: string;
  shortLabel: string;
  icon: TaskIconName;
  imageUrl?: string | null;
  color?: string | null;
  scheduleDays?: number[] | null;
  recommendedPeriod?: BoardMode | "both" | null;
  category?: string | null;
  minAge?: number | null;
  maxAge?: number | null;
  autoAssignEnabled?: boolean;
  durationMinutes: number;
  reward?: boolean;
  isBuiltIn?: boolean;
};

export type BoardProfile = {
  id: string;
  name: string;
  age: number;
  avatar: string;
  photoUrl?: string | null;
  headline: string;
  streak: number;
  journey: JourneyState;
  themeId: ThemeId;
  completedTaskIdsByMode: Record<BoardMode, string[]>;
  tasksByMode: Record<BoardMode, BoardTask[]>;
};

export type SmartPresetPreview = {
  id: string;
  title: string;
  ageRange: string;
  period: string;
  tone: string;
  summary: string;
};

export type AuditPreview = {
  id: string;
  at: string;
  action: string;
  target: string;
  details: string;
};

export const prototypeProfiles: BoardProfile[] = [
  {
    id: "luna",
    name: "Luna",
    age: 4,
    avatar: "🦊",
    headline: "Routine douce avant la creche",
    streak: 6,
    journey: getJourneyStateFromStreak(6, 6),
    themeId: "ocean-quest",
    tasksByMode: {
      morning: [
        { id: "luna-dress", label: "S'habiller", shortLabel: "Tenue", icon: "shirt", durationMinutes: 4 },
        { id: "luna-hands", label: "Mains propres", shortLabel: "Mains", icon: "sparkles", durationMinutes: 2 },
        { id: "luna-water", label: "Boire de l'eau", shortLabel: "Eau", icon: "glass-water", durationMinutes: 1 },
        { id: "luna-shoes", label: "Chaussures", shortLabel: "Shoes", icon: "footprints", durationMinutes: 2 },
        { id: "luna-bag", label: "Petit sac", shortLabel: "Sac", icon: "school", durationMinutes: 2 },
      ],
      evening: [
        { id: "luna-bath", label: "Bain", shortLabel: "Bain", icon: "bath", durationMinutes: 8 },
        { id: "luna-brush", label: "Cheveux", shortLabel: "Hair", icon: "brush", durationMinutes: 3 },
        { id: "luna-drops", label: "Dents", shortLabel: "Dents", icon: "droplets", durationMinutes: 3 },
        { id: "luna-story", label: "Histoire", shortLabel: "Story", icon: "book-open", durationMinutes: 8 },
        { id: "luna-hug", label: "Calin", shortLabel: "Calin", icon: "heart", durationMinutes: 2, reward: true },
        { id: "luna-bed", label: "Dodo", shortLabel: "Dodo", icon: "bed", durationMinutes: 1 },
      ],
    },
    completedTaskIdsByMode: {
      morning: ["luna-hands", "luna-water", "luna-bag"],
      evening: ["luna-bath", "luna-story"],
    },
  },
  {
    id: "milo",
    name: "Milo",
    age: 6,
    avatar: "🧑‍🚀",
    headline: "Mode ecole avec mission rapide",
    streak: 13,
    journey: getJourneyStateFromStreak(13, 13),
    themeId: "space-academy",
    tasksByMode: {
      morning: [
        { id: "milo-shirt", label: "Tenue", shortLabel: "Tenue", icon: "shirt", durationMinutes: 4 },
        { id: "milo-brush", label: "Visage", shortLabel: "Visage", icon: "droplets", durationMinutes: 2 },
        { id: "milo-breakfast", label: "Petit dej", shortLabel: "Fuel", icon: "sun", durationMinutes: 12 },
        { id: "milo-shoes", label: "Chaussures", shortLabel: "Shoes", icon: "footprints", durationMinutes: 2 },
        { id: "milo-bag", label: "Sac d'ecole", shortLabel: "Sac", icon: "school", durationMinutes: 3 },
        { id: "milo-launch", label: "Pret pour partir", shortLabel: "Go", icon: "rocket", durationMinutes: 1, reward: true },
      ],
      evening: [
        { id: "milo-snack", label: "Gouter", shortLabel: "Snack", icon: "apple", durationMinutes: 10 },
        { id: "milo-read", label: "Lecture", shortLabel: "Read", icon: "book-open", durationMinutes: 10 },
        { id: "milo-bath", label: "Douche", shortLabel: "Wash", icon: "bath", durationMinutes: 8 },
        { id: "milo-dents", label: "Dents", shortLabel: "Dents", icon: "sparkles", durationMinutes: 3 },
        { id: "milo-stars", label: "Bravo", shortLabel: "Bravo", icon: "star", durationMinutes: 1, reward: true },
        { id: "milo-sleep", label: "Au lit", shortLabel: "Sleep", icon: "moon", durationMinutes: 1 },
      ],
    },
    completedTaskIdsByMode: {
      morning: ["milo-shirt", "milo-brush", "milo-bag"],
      evening: ["milo-snack", "milo-read", "milo-sleep"],
    },
  },
  {
    id: "leo",
    name: "Leo",
    age: 8,
    avatar: "🚀",
    headline: "Routine plus dense, autonomie en hausse",
    streak: 21,
    journey: getJourneyStateFromStreak(21, 21),
    themeId: "jungle-camp",
    tasksByMode: {
      morning: [
        { id: "leo-gear", label: "Tenue complete", shortLabel: "Tenue", icon: "shirt", durationMinutes: 5 },
        { id: "leo-water", label: "Verre d'eau", shortLabel: "Eau", icon: "glass-water", durationMinutes: 1 },
        { id: "leo-bag", label: "Sac", shortLabel: "Bag", icon: "school", durationMinutes: 3 },
        { id: "leo-notebook", label: "Cahier", shortLabel: "Book", icon: "book-open", durationMinutes: 2 },
        { id: "leo-shoes", label: "Chaussures", shortLabel: "Shoes", icon: "footprints", durationMinutes: 2 },
        { id: "leo-launch", label: "Mission ready", shortLabel: "Launch", icon: "rocket", durationMinutes: 1, reward: true },
      ],
      evening: [
        { id: "leo-snack", label: "Snack", shortLabel: "Snack", icon: "apple", durationMinutes: 10 },
        { id: "leo-sport", label: "Stretch", shortLabel: "Move", icon: "heart", durationMinutes: 8 },
        { id: "leo-shower", label: "Douche", shortLabel: "Wash", icon: "bath", durationMinutes: 8 },
        { id: "leo-read", label: "Lecture", shortLabel: "Read", icon: "book-open", durationMinutes: 12 },
        { id: "leo-teeth", label: "Dents", shortLabel: "Spark", icon: "sparkles", durationMinutes: 3 },
        { id: "leo-bed", label: "Lights off", shortLabel: "Sleep", icon: "bed", durationMinutes: 1 },
      ],
    },
    completedTaskIdsByMode: {
      morning: ["leo-gear", "leo-bag", "leo-launch"],
      evening: ["leo-snack", "leo-shower"],
    },
  },
];

export const smartPresets: SmartPresetPreview[] = [
  {
    id: "mini-morning",
    title: "Pack matin doux",
    ageRange: "3-4 ans",
    period: "Matin",
    tone: "Ocean Quest",
    summary: "3 a 5 actions courtes, vocabulaire simple, zero surcharge visuelle.",
  },
  {
    id: "school-launch",
    title: "Pack autonomie ecole",
    ageRange: "5-6 ans",
    period: "Matin",
    tone: "Space Academy",
    summary: "Routine courte avec feedback fort sur le depart et la preparation du sac.",
  },
  {
    id: "focus-evening",
    title: "Pack soir focus",
    ageRange: "7-8 ans",
    period: "Soir",
    tone: "Jungle Camp",
    summary: "Lecture, hygiene, rangement et retour au calme avec responsabilisation.",
  },
];

export const adminAuditPreview: AuditPreview[] = [
  {
    id: "audit-1",
    at: "March 12, 2026 - 15:20",
    action: "PROFILE_CREATED",
    target: "Luna",
    details: "Prototype import planned for the first admin onboarding flow.",
  },
  {
    id: "audit-2",
    at: "March 12, 2026 - 15:27",
    action: "ROADMAP_LOCKED",
    target: "routine-kids",
    details: "Migration direction validated: rebuild in-place with Next.js and Neon.",
  },
  {
    id: "audit-3",
    at: "March 12, 2026 - 15:34",
    action: "FOUNDATION_STARTED",
    target: "App Router",
    details: "New board shell, auth and Prisma foundation added to the repo.",
  },
];
