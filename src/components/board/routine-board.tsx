"use client";

import { useRouter } from "next/navigation";
import { Crown, Medal, Moon, Plus, Settings2, Sun } from "lucide-react";
import { startTransition, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { useAppMessages } from "@/components/i18n/app-i18n-provider";
import { DayCompleteCelebration } from "@/components/board/day-complete-celebration";
import { ProfileRow } from "@/components/board/profile-row";
import { ParentalGateModal } from "@/components/board/parental-gate-modal";
import { AlertModal, ConfirmModal, PremiumModal, SuccessModal } from "@/components/board/feedback-modals";
import { JourneyModal } from "@/components/board/journey-modal";
import {
  type EditableProfileInput,
  ProfileEditorModal,
  ProfileManagerModal,
  QuickEditAvatarModal,
} from "@/components/board/profile-modals";
import { useRoutineSounds } from "@/components/board/use-routine-sounds";
import {
  AutoAssignConfirmModal,
  AutoAssignOfferModal,
  type LibraryContext,
  SchedulerModal,
  TaskLibraryModal,
} from "@/components/board/task-modals";
import { SettingsExperience } from "@/components/settings/settings-experience";
import { getDayKey } from "@/lib/day-key";
import { getIntlLocale } from "@/lib/i18n";
import {
  type BoardMode,
  type BoardProfile,
  type BoardTask,
} from "@/lib/data/prototype-seed";
import { type JourneyState } from "@/lib/journey";
import { type RoutineKidsSettingsSnapshot } from "@/lib/settings";
import { type ParentWorkspaceSnapshot } from "@/lib/parent-workspace";
import { type CreateChildProfileState } from "@/components/admin/create-profile-form-state";
import { type UpdateChildProfileThemeState } from "@/components/admin/profile-theme-form-state";
import { type UpdateHouseholdSettingsState } from "@/components/admin/household-settings-form-state";
import { type UpdateParentSecurityState } from "@/components/admin/parent-security-form-state";
import { type AdminWorkbenchMutationResult } from "@/components/admin/workbench-types";

type BoardMutationResult = {
  status: "success" | "error";
  message: string;
  profileId?: string;
  code?: "parent_pin_required" | "parent_pin_not_configured" | "invalid_pin";
  checkoutUrl?: string;
};

type BoardToggleResult = {
  childProfileId: string;
  streak: number;
  journey: JourneyState;
};

type RoutineBoardProps = {
  profiles: BoardProfile[];
  libraryTasks: BoardTask[];
  householdName?: string;
  signedIn?: boolean;
  signInHref?: string;
  signUpHref?: string;
  pricingHref?: string;
  settings?: RoutineKidsSettingsSnapshot;
  onToggleTaskAction?: (input: {
    childProfileId: string;
    taskId: string;
    dayKey?: string;
    completed: boolean;
  }) => Promise<BoardToggleResult>;
  onCreateProfileAction?: (input: {
    name: string;
    age: number;
    avatar: string;
    photoUrl?: string | null;
    headline?: string;
  }) => Promise<BoardMutationResult>;
  onUpdateProfileAction?: (input: {
    childProfileId: string;
    name: string;
    age: number;
    avatar: string;
    photoUrl?: string | null;
    headline?: string;
  }) => Promise<BoardMutationResult>;
  onDeleteProfileAction?: (input: {
    childProfileId: string;
  }) => Promise<BoardMutationResult>;
  onUpsertTaskTemplateAction?: (input: {
    templateId?: string;
    title: string;
    shortLabel: string;
    icon: string;
    imageUrl?: string | null;
    color?: string | null;
    durationMinutes: number;
  }) => Promise<BoardMutationResult>;
  onDeleteTaskTemplateAction?: (input: {
    templateId: string;
  }) => Promise<BoardMutationResult>;
  onAssignTaskTemplateAction?: (input: {
    childProfileId: string;
    templateId: string;
    period: "morning" | "evening" | "both";
    scheduleDays?: number[];
  }) => Promise<BoardMutationResult>;
  onAssignManyTaskTemplatesAction?: (input: {
    childProfileId: string;
    templateIds: string[];
    period: "morning" | "evening" | "both";
    scheduleDays?: number[];
  }) => Promise<BoardMutationResult>;
  onDeleteRoutineTaskAction?: (input: {
    childProfileId: string;
    routineTaskId: string;
  }) => Promise<BoardMutationResult>;
  onReorderRoutineTasksAction?: (input: {
    childProfileId: string;
    period: "morning" | "evening";
    orderedTaskIds: string[];
  }) => Promise<BoardMutationResult>;
  onDeleteRoutineTaskDayAction?: (input: {
    childProfileId: string;
    routineTaskId: string;
    day: number;
  }) => Promise<BoardMutationResult>;
  onUpdateSettingsAction?: (input: {
    locale: "fr" | "en";
    soundsEnabled: boolean;
    morningStart: string;
    morningEnd: string;
    eveningStart: string;
    eveningEnd: string;
  }) => Promise<BoardMutationResult>;
  onImportPrototypeAction?: (input: {
    snapshot: string;
  }) => Promise<{
    status: "success" | "error";
    message: string;
  }>;
  onActivatePremiumAction?: (input: {
    interval: "monthly" | "yearly";
  }) => Promise<BoardMutationResult>;
  onManageBillingAction?: () => Promise<BoardMutationResult>;
  parentWorkspace?: ParentWorkspaceSnapshot;
  onCreateProfileFormAction?: (
    state: CreateChildProfileState,
    formData: FormData,
  ) => Promise<CreateChildProfileState>;
  onUpdateHouseholdSettingsFormAction?: (
    state: UpdateHouseholdSettingsState,
    formData: FormData,
  ) => Promise<UpdateHouseholdSettingsState>;
  onUpdateParentSecurityFormAction?: (
    state: UpdateParentSecurityState,
    formData: FormData,
  ) => Promise<UpdateParentSecurityState>;
  onUpdateProfileThemeFormAction?: (
    state: UpdateChildProfileThemeState,
    formData: FormData,
  ) => Promise<UpdateChildProfileThemeState>;
  onUpsertTaskTemplateWorkbenchAction?: (input: {
    templateId?: string;
    title: string;
    shortLabel: string;
    icon: string;
    durationMinutes: number;
  }) => Promise<AdminWorkbenchMutationResult>;
  onDeleteTaskTemplateWorkbenchAction?: (input: {
    templateId: string;
  }) => Promise<AdminWorkbenchMutationResult>;
  onUpsertRoutineWorkbenchAction?: (input: {
    childProfileId: string;
    period: "morning" | "evening";
    title: string;
  }) => Promise<AdminWorkbenchMutationResult>;
  onAssignRoutineTaskWorkbenchAction?: (input: {
    childProfileId: string;
    period: "morning" | "evening";
    templateId: string;
  }) => Promise<AdminWorkbenchMutationResult>;
  onDeleteRoutineTaskWorkbenchAction?: (input: {
    childProfileId: string;
    routineTaskId: string;
  }) => Promise<AdminWorkbenchMutationResult>;
};

type ConfirmState = {
  title: string;
  message: string;
  confirmLabel?: string;
};

type GatePurpose = { type: "settings" };

type AutoAssignSuggestion = BoardTask & {
  recommendedPeriod: BoardMode | "both";
};

type PremiumIntent =
  | null
  | {
      type: "auto-assign";
      profileId: string;
    };

const fullWeekScheduleDays = [0, 1, 2, 3, 4, 5, 6] as const;

function getAutoAssignScheduleDays(task: BoardTask) {
  if (task.category === "school") {
    return [1, 2, 3, 4, 5];
  }

  if (task.category === "school_prep") {
    return [0, 1, 2, 3, 4];
  }

  return [...fullWeekScheduleDays];
}

function createCompletedState(profiles: BoardProfile[]) {
  return Object.fromEntries(
    profiles.map((profile) => [
      profile.id,
      {
        morning: new Set(profile.completedTaskIdsByMode.morning),
        evening: new Set(profile.completedTaskIdsByMode.evening),
      },
    ]),
  ) as Record<string, Record<BoardMode, Set<string>>>;
}

function createCompletedOrderState(profiles: BoardProfile[]) {
  return Object.fromEntries(
    profiles.map((profile) => [
      profile.id,
      {
        morning: [...profile.completedTaskIdsByMode.morning],
        evening: [...profile.completedTaskIdsByMode.evening],
      },
    ]),
  ) as Record<string, Record<BoardMode, string[]>>;
}

function createTaskState(profiles: BoardProfile[]) {
  return Object.fromEntries(
    profiles.map((profile) => [
      profile.id,
      {
        morning: [...profile.tasksByMode.morning],
        evening: [...profile.tasksByMode.evening],
      },
    ]),
  ) as Record<string, Record<BoardMode, BoardTask[]>>;
}

function isTaskScheduledForDay(task: BoardTask, weekday: number) {
  const scheduleDays = task.scheduleDays;

  if (!scheduleDays || scheduleDays.length === 0) {
    return true;
  }

  return scheduleDays.includes(weekday);
}

function getScheduledTasksForMode(
  tasksByMode: Record<BoardMode, BoardTask[]>,
  mode: BoardMode,
  weekday: number,
) {
  return tasksByMode[mode].filter((task) => isTaskScheduledForDay(task, weekday));
}

function isModeComplete(
  tasksByMode: Record<BoardMode, BoardTask[]>,
  completedByMode: Record<BoardMode, Set<string>>,
  mode: BoardMode,
  weekday: number,
) {
  const tasks = getScheduledTasksForMode(tasksByMode, mode, weekday);

  return tasks.length > 0 && tasks.every((task) => completedByMode[mode].has(task.id));
}

function isDayComplete(
  tasksByMode: Record<BoardMode, BoardTask[]>,
  completedByMode: Record<BoardMode, Set<string>>,
  weekday: number,
) {
  const morningTasks = getScheduledTasksForMode(tasksByMode, "morning", weekday);
  const eveningTasks = getScheduledTasksForMode(tasksByMode, "evening", weekday);

  return (
    morningTasks.length + eveningTasks.length > 0
    && morningTasks.every((task) => completedByMode.morning.has(task.id))
    && eveningTasks.every((task) => completedByMode.evening.has(task.id))
  );
}

function reorderVisibleTasksInMode(
  tasks: BoardTask[],
  weekday: number,
  completedTaskIds: Set<string>,
  orderedVisibleTaskIds: string[],
) {
  const visibleTasks = tasks.filter(
    (task) =>
      isTaskScheduledForDay(task, weekday) &&
      !completedTaskIds.has(task.id),
  );

  if (visibleTasks.length !== orderedVisibleTaskIds.length) {
    return tasks;
  }

  const visibleTaskById = new Map(visibleTasks.map((task) => [task.id, task]));

  if (orderedVisibleTaskIds.some((taskId) => !visibleTaskById.has(taskId))) {
    return tasks;
  }

  const reorderedVisibleTasks = orderedVisibleTaskIds
    .map((taskId) => visibleTaskById.get(taskId))
    .filter((task): task is BoardTask => Boolean(task));
  let visibleIndex = 0;

  return tasks.map((task) => {
    if (!isTaskScheduledForDay(task, weekday) || completedTaskIds.has(task.id)) {
      return task;
    }

    const reorderedTask = reorderedVisibleTasks[visibleIndex];
    visibleIndex += 1;

    return reorderedTask ?? task;
  });
}

export function RoutineBoard({
  profiles,
  libraryTasks,
  householdName,
  signedIn,
  signInHref = "/sign-in?callbackUrl=/settings",
  signUpHref = "/sign-up?callbackUrl=/settings",
  pricingHref = "/pricing",
  settings,
  onToggleTaskAction,
  onCreateProfileAction,
  onUpdateProfileAction,
  onDeleteProfileAction,
  onUpsertTaskTemplateAction,
  onDeleteTaskTemplateAction,
  onAssignTaskTemplateAction,
  onAssignManyTaskTemplatesAction,
  onDeleteRoutineTaskAction,
  onReorderRoutineTasksAction,
  onDeleteRoutineTaskDayAction,
  onUpdateSettingsAction,
  onImportPrototypeAction,
  onActivatePremiumAction,
  onManageBillingAction,
  parentWorkspace,
  onCreateProfileFormAction,
  onUpdateHouseholdSettingsFormAction,
  onUpdateParentSecurityFormAction,
  onUpdateProfileThemeFormAction,
  onUpsertTaskTemplateWorkbenchAction,
  onDeleteTaskTemplateWorkbenchAction,
  onUpsertRoutineWorkbenchAction,
  onAssignRoutineTaskWorkbenchAction,
  onDeleteRoutineTaskWorkbenchAction,
}: RoutineBoardProps) {
  const messages = useAppMessages();
  const router = useRouter();
  const hasAuthenticatedParent =
    signedIn ??
    Boolean(
      onCreateProfileAction ||
        onUpdateSettingsAction ||
        parentWorkspace,
    );
  const [mode, setMode] = useState<BoardMode>("morning");
  const [modeOverrideActive, setModeOverrideActive] = useState(false);
  const [lastDetectedMode, setLastDetectedMode] = useState<BoardMode | null>(null);
  const [now, setNow] = useState<Date | null>(null);
  const [deleteModeProfileId, setDeleteModeProfileId] = useState<string | null>(null);
  const [premiumActive, setPremiumActive] = useState(settings?.premiumActive ?? false);
  const [boardSettings, setBoardSettings] = useState<RoutineKidsSettingsSnapshot>(
    settings ?? {
      locale: "fr",
      soundsEnabled: true,
      morningStart: "06:00",
      morningEnd: "12:00",
      eveningStart: "18:00",
      eveningEnd: "21:00",
      premiumActive: false,
    },
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [premiumOpen, setPremiumOpen] = useState(false);
  const [premiumReason, setPremiumReason] = useState<string | null>(null);
  const [, setPremiumIntent] = useState<PremiumIntent>(null);
  const [journeyOpen, setJourneyOpen] = useState(false);
  const [profileManagerOpen, setProfileManagerOpen] = useState(false);
  const [schedulerOpen, setSchedulerOpen] = useState(false);
  const [parentalGateOpen, setParentalGateOpen] = useState(false);
  const [gatePurpose, setGatePurpose] = useState<GatePurpose | null>(null);
  const [quickEditProfileId, setQuickEditProfileId] = useState<string | null>(null);
  const [libraryContext, setLibraryContext] = useState<LibraryContext | null>(null);
  const [autoAssignProfileId, setAutoAssignProfileId] = useState<string | null>(null);
  const [autoAssignProfileSnapshot, setAutoAssignProfileSnapshot] = useState<{
    id: string;
    name: string;
    age: number;
  } | null>(null);
  const [autoAssignOfferOpen, setAutoAssignOfferOpen] = useState(false);
  const [autoAssignConfirmOpen, setAutoAssignConfirmOpen] = useState(false);
  const [autoAssignSuggestions, setAutoAssignSuggestions] = useState<AutoAssignSuggestion[]>([]);
  const [profileEditorState, setProfileEditorState] = useState<{
    mode: "create" | "edit";
    profileId?: string;
  } | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [successState, setSuccessState] = useState<{
    title: string;
    message: string;
  } | null>(null);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [profileMutationPending, setProfileMutationPending] = useState(false);
  const [profileMutationError, setProfileMutationError] = useState<string | null>(null);
  const [taskMutationPending, setTaskMutationPending] = useState(false);
  const [taskMutationError, setTaskMutationError] = useState<string | null>(null);
  const [dayCelebration, setDayCelebration] = useState<{
    key: number;
    profileName: string;
  } | null>(null);
  const [localProfiles, setLocalProfiles] = useState<BoardProfile[]>(profiles);
  const [completedByProfile, setCompletedByProfile] = useState(() =>
    createCompletedState(profiles),
  );
  const [completedOrderByProfile, setCompletedOrderByProfile] = useState(() =>
    createCompletedOrderState(profiles),
  );
  const [tasksByProfile, setTasksByProfile] = useState(() => createTaskState(profiles));
  const confirmActionRef = useRef<(() => void | Promise<void>) | null>(null);
  const lastProfileMutationRef = useRef<BoardMutationResult | null>(null);
  const sounds = useRoutineSounds(boardSettings.soundsEnabled);

  useEffect(() => {
    setNow(new Date());
    const interval = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    setLocalProfiles(profiles);
    setCompletedByProfile(createCompletedState(profiles));
    setCompletedOrderByProfile(createCompletedOrderState(profiles));
    setTasksByProfile(createTaskState(profiles));
  }, [profiles]);

  useEffect(() => {
    if (!dayCelebration) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setDayCelebration(null);
    }, 6100);

    return () => window.clearTimeout(timeout);
  }, [dayCelebration]);

  useEffect(() => {
    setPremiumActive(settings?.premiumActive ?? false);
  }, [settings?.premiumActive]);

  useEffect(() => {
    if (!settings) {
      return;
    }

    setBoardSettings(settings);
  }, [settings]);

  useEffect(() => {
    if (!now) {
      return;
    }

    const parseMinutes = (value: string) => {
      const [hours, minutes] = value.split(":").map(Number);

      if (Number.isNaN(hours) || Number.isNaN(minutes)) {
        return null;
      }

      return hours * 60 + minutes;
    };

    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const morningStartMinutes = parseMinutes(boardSettings.morningStart);
    const morningEndMinutes = parseMinutes(boardSettings.morningEnd);
    const eveningStartMinutes = parseMinutes(boardSettings.eveningStart);
    const eveningEndMinutes = parseMinutes(boardSettings.eveningEnd);
    let detectedMode: BoardMode | null = null;

    if (
      morningStartMinutes !== null &&
      morningEndMinutes !== null &&
      currentMinutes >= morningStartMinutes &&
      currentMinutes < morningEndMinutes
    ) {
      detectedMode = "morning";
    }
    else if (
      eveningStartMinutes !== null &&
      eveningEndMinutes !== null &&
      currentMinutes >= eveningStartMinutes &&
      currentMinutes < eveningEndMinutes
    ) {
      detectedMode = "evening";
    }

    if (!detectedMode) {
      return;
    }

    if (detectedMode !== lastDetectedMode) {
      setLastDetectedMode(detectedMode);
      setMode(detectedMode);
      setModeOverrideActive(false);
      return;
    }

    if (!modeOverrideActive && mode !== detectedMode) {
      setMode(detectedMode);
    }
  }, [
    boardSettings.eveningEnd,
    boardSettings.eveningStart,
    lastDetectedMode,
    boardSettings.morningEnd,
    boardSettings.morningStart,
    mode,
    modeOverrideActive,
    now,
  ]);

  const formattedTime = useMemo(
    () => {
      if (!now) {
        return "00:00";
      }

      return new Intl.DateTimeFormat(getIntlLocale(boardSettings.locale), {
        hour: "2-digit",
        minute: "2-digit",
      }).format(now);
    },
    [boardSettings.locale, now],
  );

  const formattedDay = useMemo(
    () => {
      if (!now) {
        return "...";
      }

      return new Intl.DateTimeFormat(getIntlLocale(boardSettings.locale), {
        weekday: "short",
        month: "short",
        day: "numeric",
      }).format(now);
    },
    [boardSettings.locale, now],
  );

  const maxStreak = useMemo(
    () => Math.max(...localProfiles.map((profile) => profile.streak), 0),
    [localProfiles],
  );
  const currentWeekday = now?.getDay() ?? 0;

  const quickEditProfile =
    localProfiles.find((profile) => profile.id === quickEditProfileId) ?? null;
  const editorProfile =
    profileEditorState?.profileId
      ? localProfiles.find((profile) => profile.id === profileEditorState.profileId) ?? null
      : null;

  const showSuccess = (title: string, message: string) => {
    sounds.playSuccess();
    setSuccessState({ title, message });
  };

  const openPremiumUpsell = (reason?: string, intent?: PremiumIntent) => {
    setPremiumReason(reason ?? null);
    setPremiumIntent(intent ?? null);
    setPremiumOpen(true);
  };

  const navigateTo = (href: string) => {
    startTransition(() => {
      router.push(href);
    });
  };

  const continueAfterGate = (purpose: GatePurpose | null) => {
    if (purpose?.type === "settings") {
      setSettingsOpen(true);
    }
  };

  const openParentalGate = (purpose: GatePurpose) => {
    setGatePurpose(purpose);
    setParentalGateOpen(true);
    setProfileMutationError(null);
    setTaskMutationError(null);
  };

  const openAutoAssignConfirm = (
    profileId: string,
    options?: {
      bypassPremium?: boolean;
    },
  ) => {
    const profile =
      localProfiles.find((candidate) => candidate.id === profileId)
      ?? (autoAssignProfileSnapshot?.id === profileId ? autoAssignProfileSnapshot : null);

    if (!profile) {
      setAlertMessage(messages.board.chooseCrewMember);
      return false;
    }

    if (!options?.bypassPremium && !premiumActive) {
      setAutoAssignProfileId(profileId);
      setAutoAssignOfferOpen(false);
      openPremiumUpsell(messages.library.magicPremiumMessage, {
        type: "auto-assign",
        profileId,
      });
      return false;
    }

    const suggestions = libraryTasks
      .filter((task): task is AutoAssignSuggestion => {
        if (task.autoAssignEnabled === false || !task.recommendedPeriod) {
          return false;
        }

        if (task.minAge !== null && task.minAge !== undefined && profile.age < task.minAge) {
          return false;
        }

        if (task.maxAge !== null && task.maxAge !== undefined && profile.age > task.maxAge) {
          return false;
        }

        return true;
      })

    if (suggestions.length === 0) {
      setAlertMessage(messages.library.noTasksFoundForAge);
      return false;
    }

    setAutoAssignProfileId(profileId);
    setAutoAssignProfileSnapshot({
      id: profile.id,
      name: profile.name,
      age: profile.age,
    });
    setAutoAssignSuggestions(suggestions);
    setAutoAssignConfirmOpen(true);
    setAutoAssignOfferOpen(false);
    setTaskMutationError(null);
    return true;
  };

  const countNewAssignmentsForMode = (
    profileId: string,
    period: BoardMode,
    templateIds: string[],
  ) => {
    const existingTemplateIds = new Set(
      (tasksByProfile[profileId]?.[period] ?? []).map((task) => task.templateId ?? task.id),
    );

    return templateIds.filter((templateId) => !existingTemplateIds.has(templateId)).length;
  };

  const closeConfirm = () => {
    setConfirmState(null);
    confirmActionRef.current = null;
  };

  const requestConfirm = (
    state: ConfirmState,
    onConfirm: () => void | Promise<void>,
  ) => {
    confirmActionRef.current = onConfirm;
    setConfirmState(state);
  };

  async function runProfileMutation(
    action: (() => Promise<BoardMutationResult>) | undefined,
    fallbackMessage: string,
  ) {
    if (!action) {
      lastProfileMutationRef.current = null;
      setProfileMutationError(null);
      setAlertMessage(fallbackMessage);
      return false;
    }

    setProfileMutationPending(true);
    setProfileMutationError(null);
    lastProfileMutationRef.current = null;

    try {
      const result = await action();

      if (result.status === "error") {
        sounds.playError();
        setProfileMutationError(result.message);
        return false;
      }

      lastProfileMutationRef.current = result;
      showSuccess(messages.board.successTitle, result.message);
      router.refresh();
      return true;
    } catch {
      sounds.playError();
      setProfileMutationError(messages.board.saveError);
      return false;
    } finally {
      setProfileMutationPending(false);
    }
  }

  async function runTaskMutation(
    action: (() => Promise<BoardMutationResult>) | undefined,
    fallbackMessage: string,
  ) {
    if (!action) {
      setTaskMutationError(null);
      setAlertMessage(fallbackMessage);
      return false;
    }

    setTaskMutationPending(true);
    setTaskMutationError(null);

    try {
      const result = await action();

      if (result.status === "error") {
        sounds.playError();
        setTaskMutationError(result.message);
        return false;
      }

      showSuccess(messages.board.successTitle, result.message);
      router.refresh();
      return true;
    } catch {
      sounds.playError();
      setTaskMutationError(messages.board.saveError);
      return false;
    } finally {
      setTaskMutationPending(false);
    }
  }

  const saveProfile = async (input: EditableProfileInput) => {
    if (!input.name.trim()) {
      setAlertMessage(messages.profile.nameRequired);
      return;
    }

    const isCreate = profileEditorState?.mode === "create" || !input.id;
    const mutationSucceeded = isCreate
      ? await runProfileMutation(
          onCreateProfileAction
            ? () =>
                onCreateProfileAction({
                  name: input.name,
                  age: input.age,
                  avatar: input.avatar,
                  photoUrl: input.photoUrl,
                  headline: input.headline,
                })
            : undefined,
          messages.board.connectToCreateProfile,
        )
      : await runProfileMutation(
          onUpdateProfileAction
            ? () =>
                onUpdateProfileAction({
                  childProfileId: input.id!,
                  name: input.name,
                  age: input.age,
                  avatar: input.avatar,
                  photoUrl: input.photoUrl,
                  headline: input.headline,
                })
            : undefined,
          messages.board.connectToEditProfile,
        );

    if (!mutationSucceeded) {
      return;
    }

    const createdProfileId = isCreate ? lastProfileMutationRef.current?.profileId ?? null : null;

    setProfileEditorState(null);
    setQuickEditProfileId(null);
    setProfileManagerOpen(false);
    setProfileMutationError(null);

    if (createdProfileId) {
      setAutoAssignProfileId(createdProfileId);
      setAutoAssignProfileSnapshot({
        id: createdProfileId,
        name: input.name,
        age: input.age,
      });
      setSuccessState(null);
      setAutoAssignOfferOpen(true);
    }
  };

  const handleSchedulerApply = async (input: {
    profileId: string;
    taskIds: string[];
    period: BoardMode | "both";
    scheduleDays?: number[];
  }) => {
    if (!premiumActive) {
      const profileTasks = tasksByProfile[input.profileId];
      const morningCount = profileTasks?.morning.length ?? 0;
      const eveningCount = profileTasks?.evening.length ?? 0;
      const nextMorningAssignments = countNewAssignmentsForMode(
        input.profileId,
        "morning",
        input.taskIds,
      );
      const nextEveningAssignments = countNewAssignmentsForMode(
        input.profileId,
        "evening",
        input.taskIds,
      );
      const exceedsMorning =
        (input.period === "morning" || input.period === "both") &&
        morningCount + nextMorningAssignments > 4;
      const exceedsEvening =
        (input.period === "evening" || input.period === "both") &&
        eveningCount + nextEveningAssignments > 4;

      if (exceedsMorning || exceedsEvening) {
        openPremiumUpsell(messages.feedback.taskLimitMessage);
        return false;
      }
    }

    const mutationSucceeded = await runTaskMutation(
      onAssignManyTaskTemplatesAction
        ? () =>
            onAssignManyTaskTemplatesAction({
              childProfileId: input.profileId,
              templateIds: input.taskIds,
              period: input.period,
              scheduleDays: input.scheduleDays,
            })
        : undefined,
      messages.board.connectToPlanTasks,
    );

    if (mutationSucceeded) {
      setSchedulerOpen(false);
      setTaskMutationError(null);
    }

    return mutationSucceeded;
  };

  const handleSchedulerRemoveDay = async (input: {
    profileId: string;
    routineTaskId: string;
    day: number;
  }) => {
    const taskWillBeDeleted = (tasksByProfile[input.profileId]?.morning ?? [])
      .concat(tasksByProfile[input.profileId]?.evening ?? [])
      .some(
        (task) =>
          task.id === input.routineTaskId &&
          Array.isArray(task.scheduleDays) &&
          task.scheduleDays.length === 1 &&
          task.scheduleDays[0] === input.day,
      );

    const mutationSucceeded = await runTaskMutation(
      onDeleteRoutineTaskDayAction
        ? () =>
            onDeleteRoutineTaskDayAction({
              childProfileId: input.profileId,
              routineTaskId: input.routineTaskId,
              day: input.day,
            })
        : undefined,
      messages.board.connectToDeleteTask,
    );

    if (!mutationSucceeded) {
      return false;
    }

    setTasksByProfile((current) => {
      const profileModes = current[input.profileId];

      if (!profileModes) {
        return current;
      }

      const updateModeTasks = (tasks: BoardTask[]) =>
        tasks.flatMap((task) => {
          if (task.id !== input.routineTaskId) {
            return [task];
          }

          const currentDays =
            task.scheduleDays && task.scheduleDays.length > 0
              ? [...task.scheduleDays]
              : [0, 1, 2, 3, 4, 5, 6];
          const nextDays = currentDays.filter((day) => day !== input.day);

          if (nextDays.length === 0) {
            return [];
          }

          return [
            {
              ...task,
              scheduleDays: nextDays,
            },
          ];
        });

      return {
        ...current,
        [input.profileId]: {
          morning: updateModeTasks(profileModes.morning),
          evening: updateModeTasks(profileModes.evening),
        },
      };
    });

    if (taskWillBeDeleted) {
      setCompletedByProfile((current) => {
        const profileModes = current[input.profileId];

        if (!profileModes) {
          return current;
        }

        const nextMorning = new Set(profileModes.morning);
        const nextEvening = new Set(profileModes.evening);
        nextMorning.delete(input.routineTaskId);
        nextEvening.delete(input.routineTaskId);

        return {
          ...current,
          [input.profileId]: {
            morning: nextMorning,
            evening: nextEvening,
          },
        };
      });

      setCompletedOrderByProfile((current) => {
        const profileModes = current[input.profileId];

        if (!profileModes) {
          return current;
        }

        return {
          ...current,
          [input.profileId]: {
            morning: profileModes.morning.filter((taskId) => taskId !== input.routineTaskId),
            evening: profileModes.evening.filter((taskId) => taskId !== input.routineTaskId),
          },
        };
      });
    }

    setTaskMutationError(null);
    return true;
  };

  const handleConfirmAutoAssign = async (selectedTaskIds: string[]) => {
    if (!autoAssignProfileId) {
      setAlertMessage(messages.board.chooseCrewMember);
      return false;
    }

    if (selectedTaskIds.length === 0) {
      setAlertMessage(messages.library.magicTasksEmptySelection);
      return false;
    }

    if (!onAssignManyTaskTemplatesAction) {
      setTaskMutationError(null);
      setAlertMessage(messages.board.connectToPlanTasks);
      return false;
    }

    const profileTasks = tasksByProfile[autoAssignProfileId];
    const existingTemplateIdsByMode = {
      morning: new Set((profileTasks?.morning ?? []).map((task) => task.templateId).filter(Boolean)),
      evening: new Set((profileTasks?.evening ?? []).map((task) => task.templateId).filter(Boolean)),
    };
    const groups = new Map<
      string,
      {
        period: BoardMode | "both";
        scheduleDays: number[];
        templateIds: string[];
      }
    >();
    let addedCount = 0;

    for (const task of autoAssignSuggestions.filter((entry) =>
      selectedTaskIds.includes(entry.id),
    )) {
      const templateId = task.templateId ?? task.id;
      const periods =
        task.recommendedPeriod === "both"
          ? (["morning", "evening"] as const)
          : ([task.recommendedPeriod] as const);
      const scheduleDays = getAutoAssignScheduleDays(task);

      for (const period of periods) {
        if (existingTemplateIdsByMode[period].has(templateId)) {
          continue;
        }

        existingTemplateIdsByMode[period].add(templateId);
        addedCount += 1;

        const groupKey = `${period}:${scheduleDays.join(",")}`;
        const currentGroup = groups.get(groupKey);

        if (currentGroup) {
          currentGroup.templateIds.push(templateId);
          continue;
        }

        groups.set(groupKey, {
          period,
          scheduleDays,
          templateIds: [templateId],
        });
      }
    }

    setTaskMutationPending(true);
    setTaskMutationError(null);

    try {
      for (const group of groups.values()) {
        const result = await onAssignManyTaskTemplatesAction({
          childProfileId: autoAssignProfileId,
          templateIds: group.templateIds,
          period: group.period,
          scheduleDays: group.scheduleDays,
        });

        if (result.status === "error") {
          sounds.playError();
          setTaskMutationError(result.message);
          return false;
        }
      }

      setAutoAssignConfirmOpen(false);
      setAutoAssignOfferOpen(false);
      setAutoAssignProfileId(null);
      setAutoAssignProfileSnapshot(null);
      setAutoAssignSuggestions([]);
      setPremiumIntent(null);
      setTaskMutationError(null);
      sounds.playSuccess();
      setAlertMessage(messages.library.smartTasksAdded(addedCount));
      router.refresh();
      return true;
    } catch {
      sounds.playError();
      setTaskMutationError(messages.board.saveError);
      return false;
    } finally {
      setTaskMutationPending(false);
    }
  };

  return (
    <>
      <div className="starfield landscape-board min-h-[100dvh] bg-[radial-gradient(circle_at_50%_0%,#2a1f52_0%,#0f0b24_100%)]">
        <div className="mx-auto flex min-h-[100dvh] w-full max-w-[1800px] flex-col">
          <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-white/5 bg-[#120d2b]/90 px-4 py-2 shadow-2xl backdrop-blur-md md:px-6">
            <div className="flex min-w-[180px] items-center gap-3">
              <div>
                <h1 className="font-display text-lg font-bold leading-none tracking-tight text-white">
                  Routine
                  <span className="bg-[linear-gradient(90deg,#ec4899,#f97316)] bg-clip-text text-transparent">
                    Kids
                  </span>
                </h1>
              </div>
            </div>

            <div className="pointer-events-none absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center select-none">
              <div className="font-mono text-lg font-bold leading-none tracking-[0.28em] text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]">
                {formattedTime}
              </div>
              <div className="mt-0.5 text-[8px] font-semibold uppercase tracking-[0.22em] text-white/40">
                {formattedDay}
              </div>
            </div>

            <div className="ml-auto flex items-center gap-3">
              {maxStreak > 0 ? (
                <button
                  type="button"
                  onClick={() => setJourneyOpen(true)}
                  className="streak-badge flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold text-white shadow-lg transition hover:scale-105"
                >
                  <span className="streak-flame text-sm">🔥</span>
                  <span>{maxStreak}</span>
                </button>
              ) : null}

              {premiumActive ? (
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-amber-300/50 bg-white/10 text-amber-300"
                  aria-label={messages.board.premiumBadge}
                >
                  <Medal className="h-4 w-4" />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (!hasAuthenticatedParent) {
                      navigateTo(pricingHref);
                      return;
                    }

                    openPremiumUpsell();
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[linear-gradient(90deg,#f59e0b,#fbbf24,#f59e0b)] text-white shadow-[0_0_20px_rgba(251,191,36,0.4)] transition hover:scale-110"
                  aria-label={messages.board.activatePremium}
                >
                  <Crown className="h-4 w-4" />
                </button>
              )}

              <div className="toggle-container flex items-center rounded-full p-1">
                <ModeButton
                  isActive={mode === "morning"}
                  icon={<Sun className="h-3 w-3" />}
                  label={messages.board.morning}
                  onClick={() => {
                    setMode("morning");
                    setModeOverrideActive(true);
                  }}
                />
                <ModeButton
                  isActive={mode === "evening"}
                  icon={<Moon className="h-3 w-3" />}
                  label={messages.board.evening}
                  onClick={() => {
                    setMode("evening");
                    setModeOverrideActive(true);
                  }}
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!hasAuthenticatedParent) {
                    navigateTo(signInHref);
                    return;
                  }

                  openParentalGate({ type: "settings" });
                }}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition hover:bg-white/10"
                aria-label={messages.board.settingsLabel}
              >
                <Settings2 className="h-4 w-4" />
              </button>
            </div>
          </header>

          <main className="relative flex-1 overflow-y-auto px-2 pb-10 pt-2 md:px-4">
            <div className="space-y-2">
              {localProfiles.length === 0 ? (
                <div className="px-3 pt-4">
                  <div className="mt-10 text-center text-sm italic text-white/30">
                    {messages.board.emptyBoard}
                  </div>
                </div>
              ) : null}

              {localProfiles.map((profile) => {
                const profileCompletedModes = completedByProfile[profile.id] ?? {
                  morning: new Set<string>(),
                  evening: new Set<string>(),
                };
                const profileTasksByMode = tasksByProfile[profile.id] ?? {
                  morning: [],
                  evening: [],
                };
                const completedSet = profileCompletedModes[mode];
                const tasks = profileTasksByMode[mode];
                const visibleTasks = getScheduledTasksForMode(
                  profileTasksByMode,
                  mode,
                  currentWeekday,
                );

                return (
                  <ProfileRow
                    key={`${profile.id}-${mode}-${visibleTasks.map((task) => task.id).join(",")}`}
                    profile={profile}
                    tasks={visibleTasks}
                    completedTaskIds={completedSet}
                    completedTaskOrderIds={
                      completedOrderByProfile[profile.id]?.[mode] ??
                      profile.completedTaskIdsByMode[mode]
                    }
                    isDeleteMode={deleteModeProfileId === profile.id}
                    onAvatarClick={() =>
                      setQuickEditProfileId(profile.id)
                    }
                    onToggleDeleteMode={() =>
                      deleteModeProfileId === profile.id
                        ? setDeleteModeProfileId(null)
                        : setDeleteModeProfileId(profile.id)
                    }
                    onAddTask={() =>
                      !premiumActive && tasks.length >= 4
                        ? openPremiumUpsell(messages.feedback.taskLimitMessage)
                        : setLibraryContext({
                            mode: "assign",
                            profileId: profile.id,
                            profileName: profile.name,
                            defaultMode: mode,
                          })
                    }
                    onRemoveTask={(taskId) => {
                      const task = tasks.find((candidate) => candidate.id === taskId);
                      const periodLabel =
                        mode === "morning"
                          ? messages.board.morning
                          : messages.board.evening;

                      requestConfirm(
                        {
                          title: messages.common.warning,
                          message: messages.board.removeTaskConfirm(
                            task?.label ?? messages.library.missionLabel,
                            periodLabel,
                          ),
                          confirmLabel: messages.common.yes,
                        },
                        async () => {
                          const mutationSucceeded = await runTaskMutation(
                            onDeleteRoutineTaskAction
                              ? () =>
                                  onDeleteRoutineTaskAction({
                                    childProfileId: profile.id,
                                    routineTaskId: taskId,
                                  })
                              : undefined,
                            messages.board.connectToDeleteTask,
                          );

                          if (!mutationSucceeded) {
                            return;
                          }

                          setTasksByProfile((current) => {
                            const profileModes = current[profile.id];

                            if (!profileModes) {
                              return current;
                            }

                            return {
                              ...current,
                              [profile.id]: {
                                ...profileModes,
                                [mode]: profileModes[mode].filter((entry) => entry.id !== taskId),
                              },
                            };
                          });

                          setCompletedByProfile((current) => {
                            const profileModes = current[profile.id];

                            if (!profileModes) {
                              return current;
                            }

                            const nextSet = new Set(profileModes[mode]);
                            nextSet.delete(taskId);

                            return {
                              ...current,
                              [profile.id]: {
                                ...profileModes,
                                [mode]: nextSet,
                              },
                            };
                          });

                          setCompletedOrderByProfile((current) => {
                            const profileModes = current[profile.id];

                            if (!profileModes) {
                              return current;
                            }

                            return {
                              ...current,
                              [profile.id]: {
                                ...profileModes,
                                [mode]: profileModes[mode].filter((entry) => entry !== taskId),
                              },
                            };
                          });
                        },
                      );
                    }}
                    onReorderTasks={async (orderedVisibleTaskIds) => {
                      const currentModeTasks = tasksByProfile[profile.id]?.[mode] ?? [];
                      const nextModeTasks = reorderVisibleTasksInMode(
                        currentModeTasks,
                        currentWeekday,
                        completedSet,
                        orderedVisibleTaskIds,
                      );

                      if (
                        nextModeTasks.length === currentModeTasks.length &&
                        nextModeTasks.every(
                          (task, index) => task.id === currentModeTasks[index]?.id,
                        )
                      ) {
                        return;
                      }

                      setTasksByProfile((current) => {
                        const profileModes = current[profile.id];

                        if (!profileModes) {
                          return current;
                        }

                        return {
                          ...current,
                          [profile.id]: {
                            ...profileModes,
                            [mode]: nextModeTasks,
                          },
                        };
                      });

                      if (!onReorderRoutineTasksAction) {
                        return;
                      }

                      const result = await onReorderRoutineTasksAction({
                        childProfileId: profile.id,
                        period: mode,
                        orderedTaskIds: nextModeTasks.map((task) => task.id),
                      });

                      if (result.status === "error") {
                        setTasksByProfile((current) => {
                          const profileModes = current[profile.id];

                          if (!profileModes) {
                            return current;
                          }

                          return {
                            ...current,
                            [profile.id]: {
                              ...profileModes,
                              [mode]: currentModeTasks,
                            },
                          };
                        });
                        sounds.playError();
                        setAlertMessage(result.message);
                      }
                    }}
                    onToggleTask={(taskId) => {
                      if (deleteModeProfileId === profile.id) {
                        return;
                      }

                      const previousCompletedOrderIds =
                        completedOrderByProfile[profile.id]?.[mode] ??
                        profile.completedTaskIdsByMode[mode] ??
                        [];
                      const nextSet = new Set(completedSet);
                      const nextCompleted = !nextSet.has(taskId);
                      const nextCompletedModes = {
                        morning: new Set(profileCompletedModes.morning),
                        evening: new Set(profileCompletedModes.evening),
                      };
                      const wasModeComplete = isModeComplete(
                        profileTasksByMode,
                        profileCompletedModes,
                        mode,
                        currentWeekday,
                      );
                      const wasDayComplete = isDayComplete(
                        profileTasksByMode,
                        profileCompletedModes,
                        currentWeekday,
                      );

                      if (nextCompleted) {
                        nextSet.add(taskId);
                      } else {
                        nextSet.delete(taskId);
                      }

                      nextCompletedModes[mode] = nextSet;

                      setCompletedByProfile((current) => ({
                        ...current,
                        [profile.id]: {
                          ...(current[profile.id] ?? {
                            morning: new Set<string>(),
                            evening: new Set<string>(),
                          }),
                          [mode]: nextSet,
                        },
                      }));

                      setCompletedOrderByProfile((current) => {
                        const profileModes = current[profile.id] ?? {
                          morning: [...profile.completedTaskIdsByMode.morning],
                          evening: [...profile.completedTaskIdsByMode.evening],
                        };
                        const nextOrder = profileModes[mode].filter((entry) => entry !== taskId);

                        return {
                          ...current,
                          [profile.id]: {
                            ...profileModes,
                            [mode]: nextCompleted ? [taskId, ...nextOrder] : nextOrder,
                          },
                        };
                      });

                      if (nextCompleted) {
                        const isModeNowComplete = isModeComplete(
                          profileTasksByMode,
                          nextCompletedModes,
                          mode,
                          currentWeekday,
                        );
                        const isDayNowComplete = isDayComplete(
                          profileTasksByMode,
                          nextCompletedModes,
                          currentWeekday,
                        );

                        if (isDayNowComplete && !wasDayComplete) {
                          sounds.playDayComplete();
                          setDayCelebration({
                            key: Date.now(),
                            profileName: profile.name,
                          });
                        } else if (isModeNowComplete && !wasModeComplete) {
                          sounds.playRoutineComplete();
                        } else {
                          sounds.playTaskComplete();
                        }
                      } else {
                        sounds.playTap();
                      }

                      if (onToggleTaskAction) {
                        startTransition(async () => {
                          try {
                            const result = await onToggleTaskAction({
                              childProfileId: profile.id,
                              taskId,
                              dayKey: getDayKey(),
                              completed: nextCompleted,
                            });

                            setLocalProfiles((current) =>
                              current.map((candidate) =>
                                candidate.id === result.childProfileId
                                  ? {
                                      ...candidate,
                                      streak: result.streak,
                                      journey: result.journey,
                                    }
                                  : candidate,
                              ),
                            );
                          } catch {
                            setCompletedByProfile((current) => {
                              const profileModes = current[profile.id] ?? {
                                morning: new Set<string>(),
                                evening: new Set<string>(),
                              };
                              const rollbackSet = new Set(profileModes[mode]);

                              if (nextCompleted) {
                                rollbackSet.delete(taskId);
                              } else {
                                rollbackSet.add(taskId);
                              }

                              return {
                                ...current,
                                [profile.id]: {
                                  ...profileModes,
                                  [mode]: rollbackSet,
                                },
                              };
                            });

                            setCompletedOrderByProfile((current) => {
                              const profileModes = current[profile.id] ?? {
                                morning: [...profile.completedTaskIdsByMode.morning],
                                evening: [...profile.completedTaskIdsByMode.evening],
                              };

                              return {
                                ...current,
                                [profile.id]: {
                                  ...profileModes,
                                  [mode]: previousCompletedOrderIds,
                                },
                              };
                            });
                          }
                        });
                      }
                    }}
                  />
                );
              })}

              <div className="px-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (!hasAuthenticatedParent) {
                      navigateTo(signUpHref);
                      return;
                    }

                    if (!premiumActive && localProfiles.length >= 1) {
                      openPremiumUpsell(messages.feedback.profileLimitMessage);
                      return;
                    }

                    setProfileEditorState({ mode: "create" });
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 bg-white/5 px-4 py-3 text-xs font-bold text-white/48 transition hover:bg-white/10 hover:text-white/84"
                >
                  <Plus className="h-4 w-4" />
                  <span>
                    {messages.board.addAstronaut}
                  </span>
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>

      <DayCompleteCelebration
        key={dayCelebration?.key ?? "day-complete-idle"}
        celebration={dayCelebration}
      />

      {settingsOpen && hasAuthenticatedParent ? (
        <SettingsExperience
          open={settingsOpen}
          householdName={householdName}
          initialSettings={
            boardSettings
              ? {
                  ...boardSettings,
                  premiumActive,
                }
              : undefined
          }
          onCloseAction={() => setSettingsOpen(false)}
          onSettingsChangeAction={setBoardSettings}
          onOpenProfilesAction={() => setProfileManagerOpen(true)}
          onOpenLibraryAction={() =>
            setLibraryContext({
              mode: "manage",
            })
          }
          onOpenSchedulerAction={() => setSchedulerOpen(true)}
          onUpdateSettingsAction={onUpdateSettingsAction}
          onImportPrototypeAction={onImportPrototypeAction}
          onActivatePremiumAction={onActivatePremiumAction}
          onManageBillingAction={onManageBillingAction}
          parentWorkspace={parentWorkspace}
          onCreateProfileAction={onCreateProfileFormAction}
          onUpdateHouseholdSettingsFormAction={onUpdateHouseholdSettingsFormAction}
          onUpdateParentSecurityFormAction={onUpdateParentSecurityFormAction}
          onUpdateProfileThemeFormAction={onUpdateProfileThemeFormAction}
          onUpsertTaskTemplateWorkbenchAction={onUpsertTaskTemplateWorkbenchAction}
          onDeleteTaskTemplateWorkbenchAction={onDeleteTaskTemplateWorkbenchAction}
          onUpsertRoutineWorkbenchAction={onUpsertRoutineWorkbenchAction}
          onAssignRoutineTaskWorkbenchAction={onAssignRoutineTaskWorkbenchAction}
          onDeleteRoutineTaskWorkbenchAction={onDeleteRoutineTaskWorkbenchAction}
        />
      ) : null}

      {premiumOpen ? (
        <PremiumModal
          open={premiumOpen}
          onClose={() => {
            setPremiumOpen(false);
            setPremiumReason(null);
            setPremiumIntent(null);
          }}
          message={premiumReason ?? undefined}
          onActivate={async (interval) => {
            if (!onActivatePremiumAction) {
              setAlertMessage(messages.board.connectToActivatePremium);
              return false;
            }

            const result = await onActivatePremiumAction({ interval });

            if (result.status === "error") {
              setAlertMessage(result.message);
              return false;
            }

            if (!result.checkoutUrl) {
              setAlertMessage(messages.board.saveError);
              return false;
            }

            window.location.assign(result.checkoutUrl);
            return true;
          }}
        />
      ) : null}

      {journeyOpen ? (
        <JourneyModal
          open={journeyOpen}
          profiles={localProfiles.map((profile) => ({
            ...profile,
            tasksByMode: tasksByProfile[profile.id] ?? profile.tasksByMode,
          }))}
          mode={mode}
          locale={boardSettings.locale}
          completedTaskIdsByProfile={completedByProfile}
          onClose={() => setJourneyOpen(false)}
        />
      ) : null}

      {profileManagerOpen ? (
        <ProfileManagerModal
          open={profileManagerOpen}
          profiles={localProfiles}
          isPending={profileMutationPending}
          onClose={() => {
            setProfileManagerOpen(false);
            setProfileMutationError(null);
          }}
          onCreateProfile={() => {
            if (!premiumActive && localProfiles.length >= 1) {
              openPremiumUpsell(messages.feedback.profileLimitMessage);
              return;
            }

            setProfileEditorState({ mode: "create" });
            setProfileManagerOpen(false);
          }}
          onEditProfile={(profileId) => {
            setProfileMutationError(null);
            setProfileManagerOpen(false);
            setProfileEditorState({ mode: "edit", profileId });
          }}
          onDeleteProfile={(profileId) => {
            const target = localProfiles.find((profile) => profile.id === profileId);

            requestConfirm(
              {
                title: messages.common.warning,
                message: messages.board.deleteProfileConfirm(target?.name ?? messages.profile.defaultName),
                confirmLabel: messages.common.yes,
              },
              async () => {
                const mutationSucceeded = await runProfileMutation(
                  onDeleteProfileAction
                    ? () =>
                        onDeleteProfileAction({
                          childProfileId: profileId,
                        })
                    : undefined,
                  messages.board.connectToDeleteProfile,
                );

                if (!mutationSucceeded) {
                  return;
                }

                setProfileManagerOpen(false);
                setQuickEditProfileId((current) =>
                  current === profileId ? null : current,
                );
                setProfileEditorState((current) =>
                  current?.profileId === profileId ? null : current,
                );
                setProfileMutationError(null);
              },
            );
          }}
        />
      ) : null}

      {quickEditProfile ? (
        <QuickEditAvatarModal
          key={quickEditProfile.id}
          open
          profile={quickEditProfile}
          isPending={profileMutationPending}
          errorMessage={profileMutationError}
          onClose={() => {
            setQuickEditProfileId(null);
            setProfileMutationError(null);
          }}
          onSave={async (input) => {
            const mutationSucceeded = await runProfileMutation(
              onUpdateProfileAction
                ? () =>
                    onUpdateProfileAction({
                      childProfileId: quickEditProfile.id,
                      name: quickEditProfile.name,
                      age: quickEditProfile.age,
                      headline: quickEditProfile.headline,
                      avatar: input.avatar,
                      photoUrl: input.photoUrl,
                    })
                : undefined,
              messages.board.connectToEditProfile,
            );

            if (!mutationSucceeded) {
              return;
            }

            setQuickEditProfileId(null);
            setProfileMutationError(null);
          }}
        />
      ) : null}

      {profileEditorState ? (
        <ProfileEditorModal
          key={`${profileEditorState.mode}-${profileEditorState.profileId ?? "new"}`}
          open
          profile={editorProfile}
          mode={profileEditorState.mode}
          isPending={profileMutationPending}
          errorMessage={profileMutationError}
          onClose={() => {
            setProfileEditorState(null);
            setProfileMutationError(null);
          }}
          onSave={saveProfile}
          onDelete={
            profileEditorState.mode === "edit" && editorProfile
              ? () =>
                  requestConfirm(
                    {
                      title: messages.common.warning,
                      message: messages.board.deleteProfileConfirm(editorProfile.name),
                      confirmLabel: messages.common.yes,
                    },
                    async () => {
                      const mutationSucceeded = await runProfileMutation(
                        onDeleteProfileAction
                          ? () =>
                              onDeleteProfileAction({
                                childProfileId: editorProfile.id,
                              })
                          : undefined,
                        messages.board.connectToDeleteProfile,
                      );

                      if (!mutationSucceeded) {
                        return;
                      }

                      setProfileEditorState(null);
                      setQuickEditProfileId((current) =>
                        current === editorProfile.id ? null : current,
                      );
                      setProfileMutationError(null);
                    },
                  )
              : undefined
          }
        />
      ) : null}

      {libraryContext ? (
        <TaskLibraryModal
          key={`${libraryContext.mode}-${libraryContext.profileId ?? "global"}`}
          open
          context={libraryContext}
          tasks={libraryTasks}
          isPending={taskMutationPending}
          errorMessage={taskMutationError}
          onClose={() => {
            setLibraryContext(null);
            setTaskMutationError(null);
          }}
          onSaveTask={async (task) => {
            const mutationSucceeded = await runTaskMutation(
              onUpsertTaskTemplateAction
                ? () =>
                    onUpsertTaskTemplateAction({
                      templateId: task.id.startsWith("custom-") ? undefined : task.id,
                      title: task.label,
                      shortLabel: task.shortLabel,
                      icon: task.icon,
                      imageUrl: task.imageUrl,
                      color: task.color,
                      durationMinutes: task.durationMinutes,
                    })
                : undefined,
              messages.board.connectToSaveTask,
            );

            if (mutationSucceeded) {
              setTaskMutationError(null);
            }

            return mutationSucceeded;
          }}
          onDeleteTask={async (task) => {
            const mutationSucceeded = await runTaskMutation(
              onDeleteTaskTemplateAction
                ? () =>
                    onDeleteTaskTemplateAction({
                      templateId: task.id,
                    })
                : undefined,
              messages.board.connectToSaveTask,
            );

            if (mutationSucceeded) {
              setTaskMutationError(null);
            }

            return mutationSucceeded;
          }}
          onAssignTask={async (task, period) => {
            if (!libraryContext.profileId) {
              setAlertMessage(messages.board.chooseCrewMember);
              return false;
            }

            const templateId = task.templateId ?? task.id;

            if (!premiumActive) {
              const profileTasks = tasksByProfile[libraryContext.profileId];
              const nextMorningAssignments =
                period === "morning" || period === "both"
                  ? countNewAssignmentsForMode(
                      libraryContext.profileId,
                      "morning",
                      [templateId],
                    )
                  : 0;
              const nextEveningAssignments =
                period === "evening" || period === "both"
                  ? countNewAssignmentsForMode(
                      libraryContext.profileId,
                      "evening",
                      [templateId],
                    )
                  : 0;
              const nextMorningCount =
                (profileTasks?.morning.length ?? 0) +
                nextMorningAssignments;
              const nextEveningCount =
                (profileTasks?.evening.length ?? 0) +
                nextEveningAssignments;

              if (nextMorningCount > 4 || nextEveningCount > 4) {
                openPremiumUpsell(messages.feedback.taskLimitMessage);
                return false;
              }
            }

            const mutationSucceeded = await runTaskMutation(
              onAssignTaskTemplateAction
                ? () =>
                    onAssignTaskTemplateAction({
                      childProfileId: libraryContext.profileId!,
                      templateId,
                      period,
                      scheduleDays:
                        libraryContext.mode === "scheduler_quick"
                          ? libraryContext.scheduleDays
                          : undefined,
                    })
                : undefined,
              messages.board.connectToAddTask,
            );

            if (mutationSucceeded) {
              setLibraryContext(null);
              setTaskMutationError(null);
            }

            return mutationSucceeded;
          }}
        />
      ) : null}

      {schedulerOpen ? (
        <SchedulerModal
          open
          profiles={localProfiles.map((profile) => ({
            ...profile,
            tasksByMode: tasksByProfile[profile.id] ?? profile.tasksByMode,
          }))}
          tasks={libraryTasks}
          isPending={taskMutationPending}
          errorMessage={taskMutationError}
          onClose={() => {
            setSchedulerOpen(false);
            setTaskMutationError(null);
          }}
          onRequestAutoAssign={(profileId) => {
            if (!profileId) {
              setAlertMessage(messages.board.chooseCrewMember);
              return;
            }

            openAutoAssignConfirm(profileId);
          }}
          onRequestQuickAdd={({ profileId, period, day }) => {
            if (!profileId) {
              setAlertMessage(messages.board.chooseCrewMember);
              return;
            }

            const profile = localProfiles.find((candidate) => candidate.id === profileId);

            setLibraryContext({
              mode: "scheduler_quick",
              profileId,
              profileName: profile?.name,
              defaultMode: period,
              scheduleDays: [day],
            });
            setTaskMutationError(null);
          }}
          onApply={handleSchedulerApply}
          onRemoveScheduledDay={handleSchedulerRemoveDay}
        />
      ) : null}

      <AutoAssignOfferModal
        open={autoAssignOfferOpen}
        pending={taskMutationPending}
        onClose={() => {
          setAutoAssignOfferOpen(false);
          setAutoAssignProfileId(null);
          setAutoAssignProfileSnapshot(null);
          setAutoAssignSuggestions([]);
        }}
        onConfirm={() => {
          if (!autoAssignProfileId) {
            setAlertMessage(messages.board.chooseCrewMember);
            return false;
          }

          return openAutoAssignConfirm(autoAssignProfileId);
        }}
      />

      <AutoAssignConfirmModal
        open={autoAssignConfirmOpen}
        profileName={
          autoAssignProfileId
            ? localProfiles.find((profile) => profile.id === autoAssignProfileId)?.name
              ?? autoAssignProfileSnapshot?.name
              ?? null
            : null
        }
        tasks={autoAssignSuggestions}
        pending={taskMutationPending}
        errorMessage={taskMutationError}
        onClose={() => {
          setAutoAssignConfirmOpen(false);
          setAutoAssignProfileId(null);
          setTaskMutationError(null);
          setAutoAssignProfileSnapshot(null);
          setAutoAssignSuggestions([]);
        }}
        onConfirm={handleConfirmAutoAssign}
      />

      {parentalGateOpen ? (
        <ParentalGateModal
          key={gatePurpose?.type ?? "parental-gate"}
          open
          onClose={() => {
            setParentalGateOpen(false);
            setGatePurpose(null);
          }}
          onSuccess={() => {
            setParentalGateOpen(false);
            continueAfterGate(gatePurpose);
            setGatePurpose(null);
          }}
        />
      ) : null}

      {alertMessage ? (
        <AlertModal
          open
          message={alertMessage}
          onClose={() => setAlertMessage(null)}
        />
      ) : null}

      {successState ? (
        <SuccessModal
          open
          title={successState.title}
          message={successState.message}
          onClose={() => setSuccessState(null)}
        />
      ) : null}

      {confirmState ? (
        <ConfirmModal
          open
          title={confirmState.title}
          message={confirmState.message}
          confirmLabel={confirmState.confirmLabel}
          onCancel={closeConfirm}
          onConfirm={async () => {
            const action = confirmActionRef.current;
            closeConfirm();
            await action?.();
          }}
        />
      ) : null}
    </>
  );
}

function ModeButton({
  isActive,
  icon,
  label,
  onClick,
}: {
  isActive: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        isActive
          ? "toggle-btn active flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-bold"
          : "toggle-btn flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-bold"
      }
    >
      {icon}
      {label}
    </button>
  );
}
