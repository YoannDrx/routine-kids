"use client";

import { CreateProfileForm } from "@/components/parent/create-profile-form";
import { HouseholdSettingsForm } from "@/components/parent/household-settings-form";
import { ParentSecurityForm } from "@/components/parent/parent-security-form";
import { ProfileThemeForm } from "@/components/parent/profile-theme-form";
import { PrototypeImportCard } from "@/components/parent/prototype-import-card";
import { RoutineWorkbench } from "@/components/parent/routine-workbench";
import { TaskTemplateWorkbench } from "@/components/parent/task-template-workbench";
import { useAppMessages } from "@/components/i18n/app-i18n-provider";
import { OverlayModalShell } from "@/components/settings/overlay-modal-shell";
import { ProfileAvatar } from "@/components/shared/profile-avatar";
import {
  type ParentWorkspaceAuditRow,
  type ParentWorkspaceRoutineProfile,
  type ParentWorkspaceTaskTemplate,
  type ParentWorkspaceThemeOption,
  type ParentWorkspaceThemeProfile,
} from "@/lib/parent-workspace";
import {
  type CreateChildProfileState,
} from "@/components/parent/create-profile-form-state";
import {
  type UpdateChildProfileThemeState,
} from "@/components/parent/profile-theme-form-state";
import {
  type UpdateHouseholdSettingsState,
} from "@/components/parent/household-settings-form-state";
import {
  type UpdateParentSecurityState,
} from "@/components/parent/parent-security-form-state";
import { type ParentWorkbenchMutationResult } from "@/components/parent/workbench-types";

type CrewWorkspaceModalProps = {
  open: boolean;
  onClose: () => void;
  profiles: ParentWorkspaceThemeProfile[];
  themeOptions: ParentWorkspaceThemeOption[];
  onCreateProfileAction: (
    state: CreateChildProfileState,
    formData: FormData,
  ) => Promise<CreateChildProfileState>;
  onUpdateProfileThemeAction: (
    state: UpdateChildProfileThemeState,
    formData: FormData,
  ) => Promise<UpdateChildProfileThemeState>;
};

type HouseholdWorkspaceModalProps = {
  open: boolean;
  onClose: () => void;
  householdName: string;
  householdLocale: string;
  onUpdateHouseholdSettingsAction: (
    state: UpdateHouseholdSettingsState,
    formData: FormData,
  ) => Promise<UpdateHouseholdSettingsState>;
};

type ParentSecurityWorkspaceModalProps = {
  open: boolean;
  onClose: () => void;
  pinConfigured: boolean;
  stepUpMinutes: number;
  onUpdateParentSecurityAction: (
    state: UpdateParentSecurityState,
    formData: FormData,
  ) => Promise<UpdateParentSecurityState>;
};

type ThemeWorkspaceModalProps = {
  open: boolean;
  onClose: () => void;
  profiles: ParentWorkspaceThemeProfile[];
  themeOptions: ParentWorkspaceThemeOption[];
  onUpdateProfileThemeAction: (
    state: UpdateChildProfileThemeState,
    formData: FormData,
  ) => Promise<UpdateChildProfileThemeState>;
};

type TaskLibraryWorkspaceModalProps = {
  open: boolean;
  onClose: () => void;
  templates: ParentWorkspaceTaskTemplate[];
  onSaveAction: (input: {
    templateId?: string;
    title: string;
    shortLabel: string;
    icon: string;
    durationMinutes: number;
  }) => Promise<ParentWorkbenchMutationResult>;
  onDeleteAction: (input: {
    templateId: string;
  }) => Promise<ParentWorkbenchMutationResult>;
};

type RoutinePlannerWorkspaceModalProps = {
  open: boolean;
  onClose: () => void;
  profiles: ParentWorkspaceRoutineProfile[];
  templates: ParentWorkspaceTaskTemplate[];
  onSaveRoutineAction: (input: {
    childProfileId: string;
    period: "morning" | "evening";
    title: string;
  }) => Promise<ParentWorkbenchMutationResult>;
  onAssignTaskAction: (input: {
    childProfileId: string;
    period: "morning" | "evening";
    templateId: string;
  }) => Promise<ParentWorkbenchMutationResult>;
  onDeleteTaskAction: (input: {
    childProfileId: string;
    routineTaskId: string;
  }) => Promise<ParentWorkbenchMutationResult>;
};

type ImportWorkspaceModalProps = {
  open: boolean;
  onClose: () => void;
  onImportAction?: (input: {
    snapshot: string;
  }) => Promise<{
    status: "success" | "error";
    message: string;
  }>;
};

type ActivityWorkspaceModalProps = {
  open: boolean;
  onClose: () => void;
  rows: ParentWorkspaceAuditRow[];
};

function ModalTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-4 pr-10">
      <h3 className="text-xl font-bold text-white">{title}</h3>
      {subtitle ? (
        <p className="mt-1 text-sm text-white/55">{subtitle}</p>
      ) : null}
    </div>
  );
}

export function CrewWorkspaceModal({
  open,
  onClose,
  profiles,
  themeOptions,
  onCreateProfileAction,
  onUpdateProfileThemeAction,
}: CrewWorkspaceModalProps) {
  const messages = useAppMessages();

  return (
    <OverlayModalShell
      open={open}
      onClose={onClose}
      panelClassName="flex h-[88vh] w-full max-w-4xl flex-col rounded-3xl p-5 sm:p-6"
    >
      <ModalTitle
        title={messages.workspace.crewTitle}
        subtitle={messages.workspace.crewDescription}
      />

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        <div className="grid gap-4">
          {profiles.length > 0 ? (
            profiles.map((profile) => (
              <article
                key={profile.id}
                className="rounded-[28px] border border-white/10 bg-white/6 p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-black/25 text-2xl text-white">
                    <ProfileAvatar
                      avatar={profile.avatar}
                      photoUrl={profile.photoUrl}
                      alt={profile.name}
                      emojiClassName="text-2xl"
                    />
                  </div>
                  <div>
                    <h4 className="font-display text-2xl text-white">
                      {profile.name}
                    </h4>
                    <p className="text-sm text-white/55">
                      {messages.workspace.ageYears(profile.age)}
                    </p>
                  </div>
                </div>

                <ProfileThemeForm
                  action={onUpdateProfileThemeAction}
                  childProfileId={profile.id}
                  currentThemeId={profile.currentThemeId}
                  options={themeOptions}
                />
              </article>
            ))
          ) : (
            <div className="rounded-[28px] border border-dashed border-white/10 bg-black/10 p-6 text-sm text-white/62">
              {messages.workspace.noProfiles}
            </div>
          )}

          <CreateProfileForm action={onCreateProfileAction} />
        </div>
      </div>
    </OverlayModalShell>
  );
}

export function HouseholdWorkspaceModal({
  open,
  onClose,
  householdName,
  householdLocale,
  onUpdateHouseholdSettingsAction,
}: HouseholdWorkspaceModalProps) {
  const messages = useAppMessages();

  return (
    <OverlayModalShell
      open={open}
      onClose={onClose}
      panelClassName="flex h-[80vh] w-full max-w-3xl flex-col rounded-3xl p-6"
    >
      <ModalTitle
        title={messages.workspace.householdTitle}
        subtitle={messages.workspace.householdDescription}
      />
      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        <HouseholdSettingsForm
          action={onUpdateHouseholdSettingsAction}
          defaultName={householdName}
          defaultLocale={householdLocale}
        />
      </div>
    </OverlayModalShell>
  );
}

export function ParentSecurityWorkspaceModal({
  open,
  onClose,
  pinConfigured,
  stepUpMinutes,
  onUpdateParentSecurityAction,
}: ParentSecurityWorkspaceModalProps) {
  const messages = useAppMessages();

  return (
    <OverlayModalShell
      open={open}
      onClose={onClose}
      panelClassName="flex h-[80vh] w-full max-w-3xl flex-col rounded-3xl p-6"
    >
      <ModalTitle
        title={messages.workspace.securityTitle}
        subtitle={messages.workspace.securityDescription}
      />
      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        <ParentSecurityForm
          action={onUpdateParentSecurityAction}
          pinConfigured={pinConfigured}
          defaultStepUpMinutes={stepUpMinutes}
        />
      </div>
    </OverlayModalShell>
  );
}

export function ThemeWorkspaceModal({
  open,
  onClose,
  profiles,
  themeOptions,
  onUpdateProfileThemeAction,
}: ThemeWorkspaceModalProps) {
  const messages = useAppMessages();

  return (
    <OverlayModalShell
      open={open}
      onClose={onClose}
      panelClassName="flex h-[82vh] w-full max-w-5xl flex-col rounded-3xl p-6"
    >
      <ModalTitle
        title={messages.workspace.themesTitle}
        subtitle={messages.workspace.themesDescription}
      />
      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        <div className="grid gap-4 md:grid-cols-2">
          {profiles.map((profile) => (
            <article
              key={profile.id}
              className="rounded-[28px] border border-white/10 bg-white/6 p-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-black/25 text-2xl text-white">
                  <ProfileAvatar
                    avatar={profile.avatar}
                    photoUrl={profile.photoUrl}
                    alt={profile.name}
                    emojiClassName="text-2xl"
                  />
                </div>
                <div>
                  <h4 className="font-display text-2xl text-white">
                    {profile.name}
                  </h4>
                  <p className="text-sm text-white/55">{messages.workspace.ageYears(profile.age)}</p>
                </div>
              </div>

              <ProfileThemeForm
                action={onUpdateProfileThemeAction}
                childProfileId={profile.id}
                currentThemeId={profile.currentThemeId}
                options={themeOptions}
              />
            </article>
          ))}
        </div>
      </div>
    </OverlayModalShell>
  );
}

export function TaskLibraryWorkspaceModal({
  open,
  onClose,
  templates,
  onSaveAction,
  onDeleteAction,
}: TaskLibraryWorkspaceModalProps) {
  const messages = useAppMessages();

  return (
    <OverlayModalShell
      open={open}
      onClose={onClose}
      panelClassName="flex h-[88vh] w-full max-w-5xl flex-col rounded-3xl p-5 sm:p-6"
    >
      <ModalTitle
        title={messages.workspace.templatesTitle}
        subtitle={messages.workspace.templatesDescription}
      />
      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        <TaskTemplateWorkbench
          templates={templates}
          onSaveAction={onSaveAction}
          onDeleteAction={onDeleteAction}
        />
      </div>
    </OverlayModalShell>
  );
}

export function RoutinePlannerWorkspaceModal({
  open,
  onClose,
  profiles,
  templates,
  onSaveRoutineAction,
  onAssignTaskAction,
  onDeleteTaskAction,
}: RoutinePlannerWorkspaceModalProps) {
  const messages = useAppMessages();

  return (
    <OverlayModalShell
      open={open}
      onClose={onClose}
      panelClassName="flex h-[88vh] w-full max-w-5xl flex-col rounded-3xl p-5 sm:p-6"
    >
      <ModalTitle
        title={messages.workspace.routinesTitle}
        subtitle={messages.workspace.routinesDescription}
      />
      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        <RoutineWorkbench
          profiles={profiles}
          templates={templates.map((template) => ({
            id: template.id,
            title: template.title,
            shortLabel: template.shortLabel,
          }))}
          onSaveRoutineAction={onSaveRoutineAction}
          onAssignTaskAction={onAssignTaskAction}
          onDeleteTaskAction={onDeleteTaskAction}
        />
      </div>
    </OverlayModalShell>
  );
}

export function ImportWorkspaceModal({
  open,
  onClose,
  onImportAction,
}: ImportWorkspaceModalProps) {
  const messages = useAppMessages();

  return (
    <OverlayModalShell
      open={open}
      onClose={onClose}
      panelClassName="flex h-[76vh] w-full max-w-3xl flex-col rounded-3xl p-6"
    >
      <ModalTitle
        title={messages.workspace.importTitle}
        subtitle={messages.workspace.importDescription}
      />
      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        <PrototypeImportCard onImportAction={onImportAction} />
      </div>
    </OverlayModalShell>
  );
}

export function ActivityWorkspaceModal({
  open,
  onClose,
  rows,
}: ActivityWorkspaceModalProps) {
  const messages = useAppMessages();

  return (
    <OverlayModalShell
      open={open}
      onClose={onClose}
      panelClassName="flex h-[82vh] w-full max-w-5xl flex-col rounded-3xl p-6"
    >
      <ModalTitle
        title={messages.workspace.activityTitle}
        subtitle={messages.workspace.activityDescription}
      />
      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        {rows.length > 0 ? (
          <div className="overflow-hidden rounded-[28px] border border-white/10">
            <table className="min-w-full border-collapse">
              <thead className="bg-white/6">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                    {messages.workspace.activityDate}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                    {messages.workspace.activityAction}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                    {messages.workspace.activityTarget}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                    {messages.workspace.activityDetails}
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-t border-white/10 bg-black/10"
                  >
                    <td className="px-4 py-4 text-sm text-white/62">{row.at}</td>
                    <td className="px-4 py-4">
                      <span className="rounded-full border border-white/10 bg-white/8 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white">
                        {row.action}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm font-semibold text-white">
                      {row.target}
                    </td>
                    <td className="px-4 py-4 text-sm leading-6 text-white/62">
                      {row.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-[28px] border border-dashed border-white/10 bg-black/10 p-6 text-sm text-white/62">
            {messages.workspace.activityEmpty}
          </div>
        )}
      </div>
    </OverlayModalShell>
  );
}
