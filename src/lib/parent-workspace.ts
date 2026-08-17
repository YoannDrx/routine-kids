import "server-only";

import { RoutinePeriod } from "@prisma/client";

import {
  getHouseholdAdminAuditLog,
  getHouseholdBoardOverview,
  getHouseholdOverview,
} from "@/lib/household";
import { getParentSecuritySummary } from "@/lib/parent-security";

export type ParentWorkspaceThemeOption = {
  id: string;
  name: string;
  slug: string;
};

export type ParentWorkspaceThemeProfile = {
  id: string;
  name: string;
  age: number;
  avatar: string;
  photoUrl: string | null;
  currentThemeId: string | null;
};

export type ParentWorkspaceTaskTemplate = {
  id: string;
  title: string;
  shortLabel: string | null;
  icon: string | null;
  durationMinutes: number | null;
  isBuiltIn: boolean;
};

export type ParentWorkspaceRoutineTask = {
  id: string;
  title: string;
  shortLabel: string | null;
  icon: string | null;
  order: number;
  scheduleDays: number[];
};

export type ParentWorkspaceRoutine = {
  id: string;
  title: string;
  period: "MORNING" | "EVENING";
  tasks: ParentWorkspaceRoutineTask[];
};

export type ParentWorkspaceRoutineProfile = {
  id: string;
  name: string;
  age: number;
  avatar: string;
  photoUrl: string | null;
  routines: ParentWorkspaceRoutine[];
};

export type ParentWorkspaceAuditRow = {
  id: string;
  at: string;
  action: string;
  target: string;
  details: string;
};

export type ParentWorkspaceSnapshot = {
  householdName: string;
  householdLocale: "fr" | "en";
  parentSecurity: {
    pinConfigured: boolean;
    stepUpMinutes: number;
    stepUpActive: boolean;
  };
  themeOptions: ParentWorkspaceThemeOption[];
  themeProfiles: ParentWorkspaceThemeProfile[];
  taskTemplates: ParentWorkspaceTaskTemplate[];
  routineProfiles: ParentWorkspaceRoutineProfile[];
  auditRows: ParentWorkspaceAuditRow[];
};

function formatAuditMetadata(
  metadata: unknown,
  targetId: string | null,
  locale: "fr" | "en",
) {
  if (metadata && typeof metadata === "object") {
    const pairs = Object.entries(metadata as Record<string, unknown>).slice(0, 3);

    if (pairs.length > 0) {
      return pairs.map(([key, value]) => `${key}: ${String(value)}`).join(" · ");
    }
  }

  if (targetId) {
    return locale === "en" ? `Target ID: ${targetId}` : `ID cible : ${targetId}`;
  }

  return locale === "en" ? "No additional details." : "Aucun detail supplementaire.";
}

function normalizeWorkspaceScheduleDays(value: unknown) {
  if (!Array.isArray(value)) {
    return [0, 1, 2, 3, 4, 5, 6];
  }

  const normalizedDays = value
    .map((entry) => (typeof entry === "number" ? entry : Number(entry)))
    .filter((entry) => Number.isInteger(entry) && entry >= 0 && entry <= 6);

  if (normalizedDays.length === 0) {
    return [0, 1, 2, 3, 4, 5, 6];
  }

  return [...new Set(normalizedDays)].sort((left, right) => left - right);
}

export async function getParentWorkspaceSnapshot(ownerUserId: string) {
  const [household, boardHousehold, auditEvents, parentSecurity] = await Promise.all([
    getHouseholdOverview(ownerUserId),
    getHouseholdBoardOverview(ownerUserId),
    getHouseholdAdminAuditLog(ownerUserId, 20),
    getParentSecuritySummary(ownerUserId),
  ]);

  if (!household || !boardHousehold) {
    return null;
  }

  const locale = household.locale === "en" ? "en-US" : "fr-FR";
  const appLocale = household.locale === "en" ? "en" : "fr";

  return {
    householdName: household.name,
    householdLocale: appLocale,
    parentSecurity,
    themeOptions: [...household.themePacks]
      .sort((themeA, themeB) => themeA.name.localeCompare(themeB.name, locale))
      .map((theme) => ({
        id: theme.id,
        name: theme.name,
        slug: theme.slug,
      })),
    themeProfiles: household.childProfiles.map((profile) => ({
      id: profile.id,
      name: profile.name,
      age: profile.age,
      avatar: profile.avatar ?? "🚀",
      photoUrl: profile.photoUrl,
      currentThemeId: profile.defaultThemeId ?? null,
    })),
    taskTemplates: boardHousehold.taskTemplates.map((template) => ({
      id: template.id,
      title: template.title,
      shortLabel: template.shortLabel,
      icon: template.icon,
      durationMinutes: template.durationMinutes,
      isBuiltIn: template.isBuiltIn,
    })),
    routineProfiles: boardHousehold.childProfiles.map((profile) => ({
      id: profile.id,
      name: profile.name,
      age: profile.age,
      avatar: profile.avatar ?? "🚀",
      photoUrl: profile.photoUrl,
      routines: profile.routines
        .filter(
          (routine) =>
            routine.period === RoutinePeriod.MORNING ||
            routine.period === RoutinePeriod.EVENING,
        )
        .map((routine) => ({
          id: routine.id,
          title: routine.title,
          period:
            routine.period === RoutinePeriod.MORNING ? "MORNING" : "EVENING",
          tasks: routine.tasks.map((task) => ({
            id: task.id,
            title: task.title,
            shortLabel: task.shortLabel,
            icon: task.icon,
            order: task.order,
            scheduleDays: normalizeWorkspaceScheduleDays(task.scheduleDays),
          })),
        })),
    })),
    auditRows: auditEvents.map((event) => ({
      id: event.id,
      at: new Intl.DateTimeFormat(locale, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(event.createdAt),
      action: event.action,
      target: event.targetType,
      details: formatAuditMetadata(event.metadata, event.targetId, appLocale),
    })),
  } satisfies ParentWorkspaceSnapshot;
}
