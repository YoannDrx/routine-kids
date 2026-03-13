"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { useAppMessages } from "@/components/i18n/app-i18n-provider";
import {
  AlertModal,
  ConfirmModal,
  PremiumModal,
  SuccessModal,
} from "@/components/board/feedback-modals";
import {
  type EditableProfileInput,
  ProfileEditorModal,
  ProfileManagerModal,
} from "@/components/board/profile-modals";
import {
  AutoAssignConfirmModal,
  AutoAssignOfferModal,
  type LibraryContext,
  SchedulerModal,
  TaskLibraryModal,
} from "@/components/board/task-modals";
import { SettingsExperience } from "@/components/settings/settings-experience";
import { type CreateChildProfileState } from "@/components/admin/create-profile-form-state";
import { type UpdateChildProfileThemeState } from "@/components/admin/profile-theme-form-state";
import { type UpdateHouseholdSettingsState } from "@/components/admin/household-settings-form-state";
import { type UpdateParentSecurityState } from "@/components/admin/parent-security-form-state";
import {
  type BoardMode,
  type BoardProfile,
  type BoardTask,
} from "@/lib/data/prototype-seed";
import { type ParentWorkspaceSnapshot } from "@/lib/parent-workspace";
import { type RoutineKidsSettingsSnapshot } from "@/lib/settings";

type SettingsBoardBridgeProps = {
  householdName?: string;
  initialSettings?: RoutineKidsSettingsSnapshot;
  profiles: BoardProfile[];
  libraryTasks: BoardTask[];
  parentWorkspace?: ParentWorkspaceSnapshot;
  onUpdateSettingsAction?: (input: {
    locale: "fr" | "en";
    soundsEnabled: boolean;
    morningStart: string;
    morningEnd: string;
    eveningStart: string;
    eveningEnd: string;
  }) => Promise<MutationResult>;
  onImportPrototypeAction?: (input: {
    snapshot: string;
  }) => Promise<{
    status: "success" | "error";
    message: string;
  }>;
  onActivatePremiumAction?: (input: {
    plan: "family" | "family_plus";
  }) => Promise<MutationResult>;
  onCreateProfileAction?: (input: {
    name: string;
    age: number;
    avatar: string;
    photoUrl?: string | null;
    headline?: string;
  }) => Promise<MutationResult>;
  onUpdateProfileAction?: (input: {
    childProfileId: string;
    name: string;
    age: number;
    avatar: string;
    photoUrl?: string | null;
    headline?: string;
  }) => Promise<MutationResult>;
  onDeleteProfileAction?: (input: {
    childProfileId: string;
  }) => Promise<MutationResult>;
  onUpsertTaskTemplateAction?: (input: {
    templateId?: string;
    title: string;
    shortLabel: string;
    icon: string;
    imageUrl?: string | null;
    color?: string | null;
    durationMinutes: number;
  }) => Promise<MutationResult>;
  onDeleteTaskTemplateAction?: (input: {
    templateId: string;
  }) => Promise<MutationResult>;
  onAssignTaskTemplateAction?: (input: {
    childProfileId: string;
    templateId: string;
    period: "morning" | "evening" | "both";
    scheduleDays?: number[];
  }) => Promise<MutationResult>;
  onAssignManyTaskTemplatesAction?: (input: {
    childProfileId: string;
    templateIds: string[];
    period: "morning" | "evening" | "both";
    scheduleDays?: number[];
  }) => Promise<MutationResult>;
  onDeleteRoutineTaskDayAction?: (input: {
    childProfileId: string;
    routineTaskId: string;
    day: number;
  }) => Promise<MutationResult>;
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
  onCreateProfileFormAction?: (
    state: CreateChildProfileState,
    formData: FormData,
  ) => Promise<CreateChildProfileState>;
};

type MutationResult = {
  status: "success" | "error";
  message: string;
  profileId?: string;
};

type ConfirmState = {
  title: string;
  message: string;
  confirmLabel?: string;
};

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

function getAutoAssignScheduleDays(task: BoardTask) {
  if (task.category === "school") {
    return [1, 2, 3, 4, 5];
  }

  if (task.category === "school_prep") {
    return [0, 1, 2, 3, 4];
  }

  return [...fullWeekScheduleDays];
}

export function SettingsBoardBridge({
  householdName,
  initialSettings,
  profiles,
  libraryTasks,
  parentWorkspace,
  onUpdateSettingsAction,
  onImportPrototypeAction,
  onActivatePremiumAction,
  onCreateProfileAction,
  onUpdateProfileAction,
  onDeleteProfileAction,
  onUpsertTaskTemplateAction,
  onDeleteTaskTemplateAction,
  onAssignTaskTemplateAction,
  onAssignManyTaskTemplatesAction,
  onDeleteRoutineTaskDayAction,
  onUpdateHouseholdSettingsFormAction,
  onUpdateParentSecurityFormAction,
  onUpdateProfileThemeFormAction,
  onCreateProfileFormAction,
}: SettingsBoardBridgeProps) {
  const messages = useAppMessages();
  const router = useRouter();
  const canOpenBoardManagement = Boolean(
    onCreateProfileAction ||
      onUpsertTaskTemplateAction ||
      onAssignManyTaskTemplatesAction,
  );
  const [boardSettings, setBoardSettings] = useState<RoutineKidsSettingsSnapshot>(
    initialSettings ?? {
      locale: "fr",
      soundsEnabled: true,
      morningStart: "06:00",
      morningEnd: "12:00",
      eveningStart: "18:00",
      eveningEnd: "21:00",
      premiumActive: false,
    },
  );
  const [premiumActive, setPremiumActive] = useState(
    initialSettings?.premiumActive ?? false,
  );
  const [localProfiles, setLocalProfiles] = useState(profiles);
  const [tasksByProfile, setTasksByProfile] = useState(() =>
    createTaskState(profiles),
  );
  const [profileManagerOpen, setProfileManagerOpen] = useState(false);
  const [schedulerOpen, setSchedulerOpen] = useState(false);
  const [libraryContext, setLibraryContext] = useState<LibraryContext | null>(null);
  const [profileEditorState, setProfileEditorState] = useState<{
    mode: "create" | "edit";
    profileId?: string;
  } | null>(null);
  const [profileMutationPending, setProfileMutationPending] = useState(false);
  const [profileMutationError, setProfileMutationError] = useState<string | null>(
    null,
  );
  const [taskMutationPending, setTaskMutationPending] = useState(false);
  const [taskMutationError, setTaskMutationError] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [successState, setSuccessState] = useState<{
    title: string;
    message: string;
  } | null>(null);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [premiumOpen, setPremiumOpen] = useState(false);
  const [premiumReason, setPremiumReason] = useState<string | null>(null);
  const [premiumIntent, setPremiumIntent] = useState<PremiumIntent>(null);
  const [autoAssignOfferOpen, setAutoAssignOfferOpen] = useState(false);
  const [autoAssignConfirmOpen, setAutoAssignConfirmOpen] = useState(false);
  const [autoAssignProfileId, setAutoAssignProfileId] = useState<string | null>(
    null,
  );
  const [autoAssignProfileSnapshot, setAutoAssignProfileSnapshot] = useState<{
    id: string;
    name: string;
    age: number;
  } | null>(null);
  const [autoAssignSuggestions, setAutoAssignSuggestions] = useState<
    AutoAssignSuggestion[]
  >([]);
  const confirmActionRef = useRef<(() => void | Promise<void>) | null>(null);
  const lastProfileMutationRef = useRef<MutationResult | null>(null);

  const settingsSnapshot = useMemo(
    () => ({
      ...boardSettings,
      premiumActive,
    }),
    [boardSettings, premiumActive],
  );

  useEffect(() => {
    setLocalProfiles(profiles);
    setTasksByProfile(createTaskState(profiles));
  }, [profiles]);

  useEffect(() => {
    if (!initialSettings) {
      return;
    }

    setBoardSettings(initialSettings);
    setPremiumActive(initialSettings.premiumActive);
  }, [initialSettings]);

  const editorProfile =
    profileEditorState?.profileId
      ? localProfiles.find((profile) => profile.id === profileEditorState.profileId) ??
        null
      : null;

  const showSuccess = (title: string, message: string) => {
    setSuccessState({ title, message });
  };

  const openPremiumUpsell = (reason?: string, intent?: PremiumIntent) => {
    setPremiumReason(reason ?? null);
    setPremiumIntent(intent ?? null);
    setPremiumOpen(true);
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

  const countNewAssignmentsForMode = (
    profileId: string,
    period: BoardMode,
    templateIds: string[],
  ) => {
    const existingTemplateIds = new Set(
      (tasksByProfile[profileId]?.[period] ?? []).map(
        (task) => task.templateId ?? task.id,
      ),
    );

    return templateIds.filter((templateId) => !existingTemplateIds.has(templateId))
      .length;
  };

  async function runProfileMutation(
    action: (() => Promise<MutationResult>) | undefined,
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
        setProfileMutationError(result.message);
        return false;
      }

      lastProfileMutationRef.current = result;
      showSuccess(messages.board.successTitle, result.message);
      router.refresh();
      return true;
    } catch {
      setProfileMutationError(messages.board.saveError);
      return false;
    } finally {
      setProfileMutationPending(false);
    }
  }

  async function runTaskMutation(
    action: (() => Promise<MutationResult>) | undefined,
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
        setTaskMutationError(result.message);
        return false;
      }

      showSuccess(messages.board.successTitle, result.message);
      router.refresh();
      return true;
    } catch {
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

    const createdProfileId = isCreate
      ? lastProfileMutationRef.current?.profileId ?? null
      : null;

    setProfileEditorState(null);
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

  const openAutoAssignConfirm = (
    profileId: string,
    options?: {
      bypassPremium?: boolean;
    },
  ) => {
    const profile =
      localProfiles.find((candidate) => candidate.id === profileId) ??
      (autoAssignProfileSnapshot?.id === profileId
        ? autoAssignProfileSnapshot
        : null);

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

    const suggestions = libraryTasks.filter(
      (task): task is AutoAssignSuggestion => {
        if (task.autoAssignEnabled === false || !task.recommendedPeriod) {
          return false;
        }

        if (
          task.minAge !== null &&
          task.minAge !== undefined &&
          profile.age < task.minAge
        ) {
          return false;
        }

        if (
          task.maxAge !== null &&
          task.maxAge !== undefined &&
          profile.age > task.maxAge
        ) {
          return false;
        }

        return true;
      },
    );

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
      morning: new Set(
        (profileTasks?.morning ?? [])
          .map((task) => task.templateId)
          .filter(Boolean),
      ),
      evening: new Set(
        (profileTasks?.evening ?? [])
          .map((task) => task.templateId)
          .filter(Boolean),
      ),
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
      setAlertMessage(messages.library.smartTasksAdded(addedCount));
      router.refresh();
      return true;
    } catch {
      setTaskMutationError(messages.board.saveError);
      return false;
    } finally {
      setTaskMutationPending(false);
    }
  };

  return (
    <>
      <SettingsExperience
        householdName={householdName}
        initialSettings={settingsSnapshot}
        onPremiumChangeAction={setPremiumActive}
        onSettingsChangeAction={setBoardSettings}
        onOpenProfilesAction={
          canOpenBoardManagement
            ? () => {
                setProfileManagerOpen(true);
              }
            : undefined
        }
        onOpenLibraryAction={
          canOpenBoardManagement
            ? () => {
                setLibraryContext({
                  mode: "manage",
                });
              }
            : undefined
        }
        onOpenSchedulerAction={
          canOpenBoardManagement
            ? () => {
                setSchedulerOpen(true);
              }
            : undefined
        }
        onUpdateSettingsAction={onUpdateSettingsAction}
        onImportPrototypeAction={onImportPrototypeAction}
        onActivatePremiumAction={onActivatePremiumAction}
        parentWorkspace={parentWorkspace}
        onCreateProfileAction={onCreateProfileFormAction}
        onUpdateHouseholdSettingsFormAction={onUpdateHouseholdSettingsFormAction}
        onUpdateParentSecurityFormAction={onUpdateParentSecurityFormAction}
        onUpdateProfileThemeFormAction={onUpdateProfileThemeFormAction}
      />

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
                message: messages.board.deleteProfileConfirm(
                  target?.name ?? messages.profile.defaultName,
                ),
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
                setProfileEditorState((current) =>
                  current?.profileId === profileId ? null : current,
                );
                setProfileMutationError(null);
              },
            );
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
                      message: messages.board.deleteProfileConfirm(
                        editorProfile.name,
                      ),
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
                (profileTasks?.morning.length ?? 0) + nextMorningAssignments;
              const nextEveningCount =
                (profileTasks?.evening.length ?? 0) + nextEveningAssignments;

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
          }}
          onApply={handleSchedulerApply}
          onRemoveScheduledDay={handleSchedulerRemoveDay}
        />
      ) : null}

      {autoAssignOfferOpen ? (
        <AutoAssignOfferModal
          open
          pending={taskMutationPending}
          onClose={() => {
            setAutoAssignOfferOpen(false);
            setAutoAssignProfileId(null);
            setAutoAssignProfileSnapshot(null);
          }}
          onConfirm={() => {
            if (!autoAssignProfileId) {
              setAlertMessage(messages.board.chooseCrewMember);
              return false;
            }

            return openAutoAssignConfirm(autoAssignProfileId);
          }}
        />
      ) : null}

      {autoAssignConfirmOpen ? (
        <AutoAssignConfirmModal
          open
          profileName={autoAssignProfileSnapshot?.name ?? null}
          tasks={autoAssignSuggestions}
          pending={taskMutationPending}
          errorMessage={taskMutationError}
          onClose={() => {
            setAutoAssignConfirmOpen(false);
            setAutoAssignSuggestions([]);
            setAutoAssignProfileId(null);
            setAutoAssignProfileSnapshot(null);
          }}
          onConfirm={handleConfirmAutoAssign}
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
          onActivate={async (plan) => {
            if (!onActivatePremiumAction) {
              setAlertMessage(messages.board.connectToActivatePremium);
              return false;
            }

            const result = await onActivatePremiumAction({ plan });

            if (result.status === "error") {
              setAlertMessage(result.message);
              return false;
            }

            const nextPremiumIntent = premiumIntent;
            setPremiumActive(true);
            setPremiumOpen(false);
            setPremiumReason(null);
            setPremiumIntent(null);

            if (nextPremiumIntent?.type === "auto-assign") {
              openAutoAssignConfirm(nextPremiumIntent.profileId, {
                bypassPremium: true,
              });
              router.refresh();
              return true;
            }

            showSuccess(messages.board.successTitle, result.message);
            router.refresh();
            return true;
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

            if (!action) {
              return;
            }

            await action();
          }}
        />
      ) : null}
    </>
  );
}
