"use client";

import { useRouter } from "next/navigation";
import {
  startTransition,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  ArrowLeft,
  Book,
  CalendarDays,
  ChevronRight,
  Clock3,
  Crown,
  Globe,
  HardDrive,
  Info,
  Languages,
  Mail,
  Users,
  Volume2,
  VolumeX,
} from "lucide-react";

import { useAppMessages, useSetAppLocale } from "@/components/i18n/app-i18n-provider";
import { AlertModal, SuccessModal } from "@/components/board/feedback-modals";
import { FullScreenSheet } from "@/components/settings/full-screen-sheet";
import { OverlayModalShell } from "@/components/settings/overlay-modal-shell";
import { type RoutineKidsSettingsSnapshot } from "@/lib/settings";
import {
  ActivityWorkspaceModal,
  CrewWorkspaceModal,
  HouseholdWorkspaceModal,
  ImportWorkspaceModal,
  ParentSecurityWorkspaceModal,
  RoutinePlannerWorkspaceModal,
  TaskLibraryWorkspaceModal,
  ThemeWorkspaceModal,
} from "@/components/settings/parent-workspace-modals";
import { type ParentWorkspaceSnapshot } from "@/lib/parent-workspace";
import { type CreateChildProfileState } from "@/components/admin/create-profile-form-state";
import { type UpdateChildProfileThemeState } from "@/components/admin/profile-theme-form-state";
import { type UpdateHouseholdSettingsState } from "@/components/admin/household-settings-form-state";
import { type UpdateParentSecurityState } from "@/components/admin/parent-security-form-state";
import { type AdminWorkbenchMutationResult } from "@/components/admin/workbench-types";

type SettingsExperienceProps = {
  householdName?: string;
  open?: boolean;
  initialSettings?: RoutineKidsSettingsSnapshot;
  onCloseAction?: () => void;
  onOpenProfilesAction?: () => void;
  onOpenLibraryAction?: () => void;
  onOpenSchedulerAction?: () => void;
  onSettingsChangeAction?: (settings: RoutineKidsSettingsSnapshot) => void;
  onUpdateSettingsAction?: (input: {
    locale: "fr" | "en";
    soundsEnabled: boolean;
    morningStart: string;
    morningEnd: string;
    eveningStart: string;
    eveningEnd: string;
  }) => Promise<{
    status: "success" | "error";
    message: string;
  }>;
  onImportPrototypeAction?: (input: {
    snapshot: string;
  }) => Promise<{
    status: "success" | "error";
    message: string;
  }>;
  onActivatePremiumAction?: (input: {
    interval: "monthly" | "yearly";
  }) => Promise<{
    status: "success" | "error";
    message: string;
    checkoutUrl?: string;
  }>;
  onManageBillingAction?: () => Promise<{
    status: "success" | "error";
    message: string;
    checkoutUrl?: string;
  }>;
  parentWorkspace?: ParentWorkspaceSnapshot;
  onCreateProfileAction?: (
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

type SettingsModal =
  | null
  | "activity"
  | "crew"
  | "household"
  | "import"
  | "language"
  | "library"
  | "premium"
  | "about"
  | "privacy"
  | "periods"
  | "routine"
  | "security"
  | "themes";

export function SettingsExperience({
  open = true,
  initialSettings,
  onCloseAction,
  onOpenProfilesAction,
  onOpenLibraryAction,
  onOpenSchedulerAction,
  onSettingsChangeAction,
  onUpdateSettingsAction,
  onImportPrototypeAction,
  onActivatePremiumAction,
  onManageBillingAction,
  parentWorkspace,
  onCreateProfileAction,
  onUpdateHouseholdSettingsFormAction,
  onUpdateParentSecurityFormAction,
  onUpdateProfileThemeFormAction,
  onUpsertTaskTemplateWorkbenchAction,
  onDeleteTaskTemplateWorkbenchAction,
  onUpsertRoutineWorkbenchAction,
  onAssignRoutineTaskWorkbenchAction,
  onDeleteRoutineTaskWorkbenchAction,
}: SettingsExperienceProps) {
  const messages = useAppMessages();
  const setAppLocale = useSetAppLocale();
  const router = useRouter();
  const [activeModal, setActiveModal] = useState<SettingsModal>(null);
  const [settings, setSettings] = useState<RoutineKidsSettingsSnapshot>(
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
  const [mutationPending, setMutationPending] = useState(false);
  const [feedback, setFeedback] = useState<{
    status: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    if (!initialSettings) {
      return;
    }

    setSettings(initialSettings);
  }, [initialSettings]);

  const hasStandaloneWorkspace = Boolean(parentWorkspace);

  const closeSettings = () => {
    if (onCloseAction) {
      onCloseAction();
      return;
    }

    router.push("/");
  };

  async function runSettingsMutation(
    action:
      | (() => Promise<{
          status: "success" | "error";
          message: string;
          checkoutUrl?: string;
        }>)
      | undefined,
    fallbackMessage: string,
  ) {
    if (!action) {
      setFeedback({
        status: "error",
        message: fallbackMessage,
      });
      return {
        success: false,
        message: fallbackMessage,
      };
    }

    setMutationPending(true);
    setFeedback(null);

    try {
      const result = await action();

      setFeedback(result);

      if (result.status === "error") {
        return {
          success: false,
          message: result.message,
        };
      }

      router.refresh();

      return {
        success: true,
        message: result.message,
        checkoutUrl: result.checkoutUrl,
      };
    } catch {
      const message = messages.settings.saveError;
      setFeedback({
        status: "error",
        message,
      });
      return {
        success: false,
        message,
      };
    } finally {
      setMutationPending(false);
    }
  }

  async function persistSettings(
    nextSettings: RoutineKidsSettingsSnapshot,
    options?: {
      closeModal?: boolean;
    },
  ) {
    const mutation = await runSettingsMutation(
      onUpdateSettingsAction
        ? () =>
            onUpdateSettingsAction({
              locale: nextSettings.locale,
              soundsEnabled: nextSettings.soundsEnabled,
              morningStart: nextSettings.morningStart,
              morningEnd: nextSettings.morningEnd,
              eveningStart: nextSettings.eveningStart,
              eveningEnd: nextSettings.eveningEnd,
            })
        : undefined,
      messages.settings.connectToSave,
    );

    if (!mutation.success) {
      return false;
    }

    setSettings(nextSettings);
    setAppLocale(nextSettings.locale);
    onSettingsChangeAction?.(nextSettings);

    if (options?.closeModal) {
      setActiveModal(null);
    }

    return true;
  }

  async function activatePremium(interval: "monthly" | "yearly") {
    const mutation = await runSettingsMutation(
      onActivatePremiumAction
        ? () => onActivatePremiumAction({ interval })
        : undefined,
      messages.settings.connectToActivatePremium,
    );

    if (!mutation.success) {
      return false;
    }

    if (!mutation.checkoutUrl) {
      return false;
    }

    window.location.assign(mutation.checkoutUrl);
    return true;
  }

  async function manageBilling() {
    const mutation = await runSettingsMutation(
      onManageBillingAction,
      messages.settings.connectToActivatePremium,
    );

    if (!mutation.success || !mutation.checkoutUrl) return;
    window.location.assign(mutation.checkoutUrl);
  }

  return (
    <>
      <FullScreenSheet open={open}>
        <header className="sticky top-0 z-10 flex items-center gap-4 border-b border-white/10 bg-[#120d2b] p-4 shadow-md shrink-0">
          <button
            type="button"
            onClick={closeSettings}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 transition hover:bg-white/10"
            aria-label={messages.common.back}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h2 className="text-xl font-bold">{messages.settings.title}</h2>
        </header>

        <div className="mx-auto flex h-full w-full max-w-5xl flex-col overflow-hidden p-6">
          <div className="grid min-h-0 flex-1 gap-8 lg:grid-cols-2">
            <div className="flex flex-col gap-6">
              {settings.premiumActive ? (
                <div className="relative flex items-center justify-between gap-4 overflow-hidden rounded-2xl border border-amber-300/30 bg-gradient-to-r from-gray-800 to-gray-900 p-4">
                  <div className="absolute right-[-20px] top-[-20px] h-20 w-20 rounded-full bg-amber-300/10 blur-xl" />
                  <div className="z-10 flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-300/20 text-amber-300">
                      <Crown className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-amber-300">{messages.settings.premiumActive}</h3>
                      <p className="text-xs text-white/60">{messages.settings.premiumActiveSubtitle}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={mutationPending}
                    onClick={() => void manageBilling()}
                    className="relative z-10 rounded-full border border-amber-200/30 bg-amber-300/15 px-4 py-2 text-xs font-semibold text-amber-100 transition hover:bg-amber-300/25 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {messages.settings.manageSubscription}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={mutationPending}
                  onClick={() => setActiveModal("premium")}
                  className="group relative flex w-full cursor-pointer items-center justify-between overflow-hidden rounded-2xl border border-amber-300/30 bg-gradient-to-br from-gray-800 to-gray-900 p-6 text-left disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <div className="absolute right-[-40px] top-[-40px] h-24 w-24 rounded-full bg-amber-300/20 blur-2xl" />
                  <div className="relative z-10">
                    <h3 className="text-lg font-bold text-amber-300">
                      <Crown className="mr-2 inline h-5 w-5" />
                      {messages.settings.premiumUpsell}
                    </h3>
                    <p className="text-xs text-white/70">{messages.settings.premiumUpsellSubtitle}</p>
                  </div>
                  <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full bg-amber-300 font-bold text-black transition group-hover:scale-110">
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </button>
              )}

              <div>
                <h3 className="mb-3 ml-2 text-xs font-bold uppercase tracking-[0.22em] text-white/40">
                  {messages.settings.management}
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <SettingsCard
                    icon={<Users className="h-5 w-5" />}
                    iconClassName="bg-blue-500/20 text-blue-400"
                    title={messages.settings.crew}
                    subtitle={messages.settings.manage}
                    onClick={() => {
                      if (onOpenProfilesAction) {
                        onOpenProfilesAction();
                        return;
                      }

                      if (hasStandaloneWorkspace) {
                        setActiveModal("crew");
                        return;
                      }

                      setFeedback({
                        status: "error",
                        message: messages.settings.connectParentSpace,
                      });
                    }}
                  />
                  <SettingsCard
                    icon={<Book className="h-5 w-5" />}
                    iconClassName="bg-purple-500/20 text-purple-400"
                    title={messages.settings.library}
                    subtitle={messages.settings.tasks}
                    onClick={() => {
                      if (onOpenLibraryAction) {
                        onOpenLibraryAction();
                        return;
                      }

                      if (hasStandaloneWorkspace) {
                        setActiveModal("library");
                        return;
                      }

                      setFeedback({
                        status: "error",
                        message: messages.settings.connectParentSpace,
                      });
                    }}
                  />
                  <SettingsCard
                    icon={<CalendarDays className="h-5 w-5" />}
                    iconClassName="bg-pink-500/20 text-pink-300"
                    title={messages.settings.planner}
                    subtitle={messages.settings.auto}
                    onClick={() => {
                      if (onOpenSchedulerAction) {
                        onOpenSchedulerAction();
                        return;
                      }

                      if (hasStandaloneWorkspace) {
                        setActiveModal("routine");
                        return;
                      }

                      setFeedback({
                        status: "error",
                        message: messages.settings.connectParentSpace,
                      });
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="mb-3 ml-2 text-xs font-bold uppercase tracking-[0.22em] text-white/40">
                  {messages.settings.app}
                </h3>
                <div className="overflow-hidden rounded-2xl border border-white/5 bg-white/10">
                  <SettingsRow
                    icon={<Clock3 className="h-5 w-5" />}
                    iconClassName="bg-yellow-500/20 text-yellow-400"
                    title={messages.settings.schedule}
                    subtitle={messages.settings.scheduleSubtitle}
                    onClick={() => setActiveModal("periods")}
                  />
                  <SettingsRow
                    icon={settings.soundsEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                    iconClassName="bg-teal-500/20 text-teal-400"
                    title={messages.settings.sounds}
                    subtitle={settings.soundsEnabled ? messages.settings.soundsOn : messages.settings.soundsOff}
                    interactive={false}
                    trailing={
                      <button
                        type="button"
                        aria-label={
                          settings.soundsEnabled
                            ? messages.settings.soundsDisableAria
                            : messages.settings.soundsEnableAria
                        }
                        aria-pressed={settings.soundsEnabled}
                        onClick={(event) => {
                          event.stopPropagation();

                          const nextSettings = {
                            ...settings,
                            soundsEnabled: !settings.soundsEnabled,
                          };

                          startTransition(() => {
                            void persistSettings(nextSettings);
                          });
                        }}
                        className={`relative inline-flex h-7 w-12 items-center rounded-full border transition ${
                          settings.soundsEnabled
                            ? "border-emerald-300/30 bg-emerald-400/25"
                            : "border-white/10 bg-white/10"
                        }`}
                      >
                        <span
                          className={`inline-block h-5 w-5 rounded-full bg-white shadow transition ${
                            settings.soundsEnabled ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    }
                  />
                  <SettingsRow
                    icon={<Languages className="h-5 w-5" />}
                    iconClassName="bg-indigo-500/20 text-indigo-400"
                    title={messages.settings.language}
                    subtitle={messages.settings.languageDescription}
                    onClick={() => setActiveModal("language")}
                  />
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-white/5 bg-white/10">
                <SettingsRow
                  icon={<Info className="h-5 w-5" />}
                  iconClassName="bg-white/10 text-white/60"
                  title={messages.settings.about}
                  subtitle={messages.settings.aboutVersion}
                  onClick={() => setActiveModal("about")}
                />
              </div>
            </div>
          </div>
        </div>
      </FullScreenSheet>

      {feedback?.status === "error" ? (
        <AlertModal
          open
          message={feedback.message}
          onClose={() => setFeedback(null)}
        />
      ) : null}

      {feedback?.status === "success" ? (
        <SuccessModal
          open
          title={messages.board.successTitle}
          message={feedback.message}
          onClose={() => setFeedback(null)}
        />
      ) : null}

      <OverlayModalShell
        open={activeModal === "language"}
        onClose={() => setActiveModal(null)}
        panelClassName="w-full max-w-sm rounded-3xl p-6"
      >
        <h3 className="mb-6 text-xl font-bold">{messages.settings.chooseLanguage}</h3>
        <div className="space-y-3">
          <LanguageButton
            icon={<span aria-hidden="true" className="text-2xl leading-none">🇫🇷</span>}
            iconClassName="bg-white/10"
            label={messages.settings.french}
            onClick={() => {
              startTransition(() => {
                void persistSettings(
                  {
                    ...settings,
                    locale: "fr",
                  },
                  {
                    closeModal: true,
                  },
                );
              });
            }}
          />
          <LanguageButton
            icon={<span aria-hidden="true" className="text-2xl leading-none">🇬🇧</span>}
            iconClassName="bg-white/10"
            label={messages.settings.english}
            onClick={() => {
              startTransition(() => {
                void persistSettings(
                  {
                    ...settings,
                    locale: "en",
                  },
                  {
                    closeModal: true,
                  },
                );
              });
            }}
          />
        </div>
      </OverlayModalShell>

      <OverlayModalShell
        open={activeModal === "premium"}
        onClose={() => setActiveModal(null)}
        overlayClassName="bg-black/95"
        panelClassName="flex max-h-[90vh] w-full max-w-md flex-col overflow-y-auto rounded-3xl border border-amber-300/30 p-6 shadow-[0_0_20px_rgba(251,191,36,0.35)]"
      >
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-[linear-gradient(90deg,#f59e0b,#fbbf24,#f59e0b)] text-white shadow-[0_0_20px_rgba(251,191,36,0.4)]">
            <Crown className="h-7 w-7" />
          </div>
          <h2 className="premium-text text-2xl font-bold">{messages.feedback.premiumTitle}</h2>
          <p className="mt-1 text-sm text-white/60">{messages.feedback.premiumMessage}</p>
        </div>
        <div className="mb-6 space-y-3">
          <PremiumFeature icon={<Users className="h-4 w-4" />} label={messages.feedback.unlimitedProfiles} />
          <PremiumFeature icon={<Book className="h-4 w-4" />} label={messages.feedback.unlimitedTasks} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <PremiumPlan
            title={messages.feedback.monthly}
            price={messages.settings.monthlyPrice}
            onClick={() => activatePremium("monthly")}
          />
          <PremiumPlan
            title={messages.feedback.yearly}
            price={messages.settings.yearlyPrice}
            featured
            featuredLabel={messages.feedback.best}
            onClick={() => activatePremium("yearly")}
          />
        </div>
      </OverlayModalShell>

      <OverlayModalShell
        open={activeModal === "about"}
        onClose={() => setActiveModal(null)}
        panelClassName="w-full max-w-sm rounded-3xl border border-white/10 p-8 text-center"
      >
        <div className="logo-glow mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[linear-gradient(135deg,#ec4899,#f97316)] text-white">
          <Info className="h-8 w-8" />
        </div>
        <h3 className="mb-2 text-2xl font-bold">{messages.common.appName}</h3>
        <p className="mb-6 text-sm italic text-white/50">{messages.settings.aboutTagline}</p>
        <div className="space-y-2 border-t border-white/10 pt-6 text-xs text-white/40">
          <p>{messages.settings.versionLabel} 1.1.0</p>
          <p>{messages.settings.copyright}</p>
          <div className="mt-4 flex justify-center gap-4">
            <button
              type="button"
              onClick={() => setActiveModal("privacy")}
              className="underline transition hover:text-white"
            >
              {messages.settings.privacy}
            </button>
            <button
              type="button"
              onClick={() => {
                window.location.href = "mailto:support.routinekids@gmail.com";
              }}
              className="underline transition hover:text-white"
            >
              {messages.settings.support}
            </button>
          </div>
        </div>
      </OverlayModalShell>

      <OverlayModalShell
        open={activeModal === "privacy"}
        onClose={() => setActiveModal("about")}
        panelClassName="relative h-[80vh] w-full max-w-2xl overflow-y-auto rounded-3xl p-6 sm:p-8"
      >
        <div className="pr-10">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.24em] text-white/45">
            {messages.settings.privacy}
          </p>
          <h2 className="text-2xl font-bold sm:text-3xl">
            {messages.settings.privacyTitle}
          </h2>
          <p className="mt-2 text-xs text-white/45">
            {messages.settings.privacyUpdated}
          </p>
        </div>
        <div className="mt-6 space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm leading-7 text-white/70">
              {messages.settings.privacyIntro}
            </p>
          </div>

          <div className="grid gap-4">
            <PrivacySectionCard
              icon={<Info className="h-5 w-5" />}
              iconClassName="bg-white/10 text-white"
              title={messages.settings.privacyDataTitle}
              body={messages.settings.privacyDataBody}
            />
            <PrivacySectionCard
              icon={<HardDrive className="h-5 w-5" />}
              iconClassName="bg-white/10 text-white"
              title={messages.settings.privacyLocalTitle}
              body={messages.settings.privacyLocalBody}
            />
            <PrivacySectionCard
              icon={<Users className="h-5 w-5" />}
              iconClassName="bg-white/10 text-white"
              title={messages.settings.privacyThirdPartyTitle}
              body={messages.settings.privacyThirdPartyBody}
            />
            <PrivacySectionCard
              icon={<Globe className="h-5 w-5" />}
              iconClassName="bg-white/10 text-white"
              title={messages.settings.privacyTechnicalTitle}
              body={messages.settings.privacyTechnicalBody}
            />
            <PrivacySectionCard
              icon={<Mail className="h-5 w-5" />}
              iconClassName="bg-white/10 text-white"
              title={messages.settings.privacyContactTitle}
              body={
                <>
                  {messages.settings.privacyContactBody}{" "}
                  <a
                    href="mailto:support.routinekids@gmail.com"
                    className="text-cyan-200 underline decoration-cyan-200/60 underline-offset-4"
                  >
                    support.routinekids@gmail.com
                  </a>
                </>
              }
            />
          </div>

          <div className="border-t border-white/10 pt-4 text-center">
            <button
              type="button"
              onClick={() => setActiveModal("about")}
              className="rounded-xl border border-white/20 bg-white/5 px-6 py-3 font-bold text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              {messages.settings.closeDocument}
            </button>
          </div>
        </div>
      </OverlayModalShell>

      <OverlayModalShell
        open={activeModal === "periods"}
        onClose={() => setActiveModal(null)}
        panelClassName="w-full max-w-md rounded-3xl p-6"
      >
        <h3 className="mb-4 text-xl font-bold">{messages.settings.schedule}</h3>
        <div className="space-y-4">
          <PeriodRow
            title={messages.board.morning}
            start={settings.morningStart}
            end={settings.morningEnd}
            onStartChange={(value) =>
              setSettings((current) => ({
                ...current,
                morningStart: value,
              }))
            }
            onEndChange={(value) =>
              setSettings((current) => ({
                ...current,
                morningEnd: value,
              }))
            }
          />
          <PeriodRow
            title={messages.board.evening}
            start={settings.eveningStart}
            end={settings.eveningEnd}
            onStartChange={(value) =>
              setSettings((current) => ({
                ...current,
                eveningStart: value,
              }))
            }
            onEndChange={(value) =>
              setSettings((current) => ({
                ...current,
                eveningEnd: value,
              }))
            }
          />
          <button
            type="button"
            disabled={mutationPending}
            onClick={() => {
              startTransition(() => {
                void persistSettings(settings, {
                  closeModal: true,
                });
              });
            }}
            className="w-full rounded-xl bg-[linear-gradient(90deg,#ec4899,#f97316)] py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {mutationPending ? messages.common.saving : messages.common.save}
          </button>
        </div>
      </OverlayModalShell>

      {parentWorkspace &&
      onCreateProfileAction &&
      onUpdateProfileThemeFormAction ? (
        <CrewWorkspaceModal
          open={activeModal === "crew"}
          onClose={() => setActiveModal(null)}
          profiles={parentWorkspace.themeProfiles}
          themeOptions={parentWorkspace.themeOptions}
          onCreateProfileAction={onCreateProfileAction}
          onUpdateProfileThemeAction={onUpdateProfileThemeFormAction}
        />
      ) : null}

      {parentWorkspace && onUpdateHouseholdSettingsFormAction ? (
        <HouseholdWorkspaceModal
          open={activeModal === "household"}
          onClose={() => setActiveModal(null)}
          householdName={parentWorkspace.householdName}
          householdLocale={parentWorkspace.householdLocale}
          onUpdateHouseholdSettingsAction={onUpdateHouseholdSettingsFormAction}
        />
      ) : null}

      {parentWorkspace && onUpdateParentSecurityFormAction ? (
        <ParentSecurityWorkspaceModal
          open={activeModal === "security"}
          onClose={() => setActiveModal(null)}
          pinConfigured={parentWorkspace.parentSecurity.pinConfigured}
          stepUpMinutes={parentWorkspace.parentSecurity.stepUpMinutes}
          onUpdateParentSecurityAction={onUpdateParentSecurityFormAction}
        />
      ) : null}

      {parentWorkspace && onUpdateProfileThemeFormAction ? (
        <ThemeWorkspaceModal
          open={activeModal === "themes"}
          onClose={() => setActiveModal(null)}
          profiles={parentWorkspace.themeProfiles}
          themeOptions={parentWorkspace.themeOptions}
          onUpdateProfileThemeAction={onUpdateProfileThemeFormAction}
        />
      ) : null}

      {parentWorkspace &&
      onUpsertTaskTemplateWorkbenchAction &&
      onDeleteTaskTemplateWorkbenchAction ? (
        <TaskLibraryWorkspaceModal
          open={activeModal === "library"}
          onClose={() => setActiveModal(null)}
          templates={parentWorkspace.taskTemplates}
          onSaveAction={onUpsertTaskTemplateWorkbenchAction}
          onDeleteAction={onDeleteTaskTemplateWorkbenchAction}
        />
      ) : null}

      {parentWorkspace &&
      onUpsertRoutineWorkbenchAction &&
      onAssignRoutineTaskWorkbenchAction &&
      onDeleteRoutineTaskWorkbenchAction ? (
        <RoutinePlannerWorkspaceModal
          open={activeModal === "routine"}
          onClose={() => setActiveModal(null)}
          profiles={parentWorkspace.routineProfiles}
          templates={parentWorkspace.taskTemplates}
          onSaveRoutineAction={onUpsertRoutineWorkbenchAction}
          onAssignTaskAction={onAssignRoutineTaskWorkbenchAction}
          onDeleteTaskAction={onDeleteRoutineTaskWorkbenchAction}
        />
      ) : null}

      {parentWorkspace ? (
        <ImportWorkspaceModal
          open={activeModal === "import"}
          onClose={() => setActiveModal(null)}
          onImportAction={onImportPrototypeAction}
        />
      ) : null}

      {parentWorkspace ? (
        <ActivityWorkspaceModal
          open={activeModal === "activity"}
          onClose={() => setActiveModal(null)}
          rows={parentWorkspace.auditRows}
        />
      ) : null}
    </>
  );
}

function SettingsCard({
  icon,
  iconClassName,
  title,
  subtitle,
  onClick,
}: {
  icon: ReactNode;
  iconClassName: string;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="aspect-[4/3] rounded-2xl border border-white/5 bg-white/10 p-4 shadow-lg transition hover:border-[#ec4899] hover:bg-white/10"
    >
      <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
        <div className={`flex h-10 w-10 items-center justify-center rounded-full transition ${iconClassName}`}>
          {icon}
        </div>
        <div>
          <h4 className="text-sm font-bold">{title}</h4>
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/50">{subtitle}</p>
        </div>
      </div>
    </button>
  );
}

function SettingsRow({
  icon,
  iconClassName,
  title,
  subtitle,
  onClick,
  trailing,
  interactive = true,
}: {
  icon: ReactNode;
  iconClassName: string;
  title: string;
  subtitle: string;
  onClick?: () => void;
  trailing?: ReactNode;
  interactive?: boolean;
}) {
  const content = (
    <>
      <div className="flex items-center">
        <div className={`mr-4 flex h-10 w-10 items-center justify-center rounded-full ${iconClassName}`}>
          {icon}
        </div>
        <div>
          <h4 className="text-sm font-bold">{title}</h4>
          <p className="text-xs text-white/60">{subtitle}</p>
        </div>
      </div>
      {trailing ?? <ChevronRight className="h-4 w-4 text-white/30" />}
    </>
  );

  if (!interactive) {
    return (
      <div className="flex w-full items-center justify-between border-b border-white/5 p-4 text-left last:border-b-0">
        {content}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between border-b border-white/5 p-4 text-left transition last:border-b-0 hover:bg-white/5"
    >
      {content}
    </button>
  );
}

function PrivacySectionCard({
  icon,
  iconClassName,
  title,
  body,
}: {
  icon: ReactNode;
  iconClassName: string;
  title: string;
  body: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className={`flex h-10 w-10 items-center justify-center rounded-full ${iconClassName}`}>
        {icon}
      </div>
      <h3 className="mt-4 text-base font-bold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-white/70">{body}</p>
    </section>
  );
}

function LanguageButton({
  icon,
  iconClassName,
  label,
  onClick,
}: {
  icon: ReactNode;
  iconClassName: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-4 transition hover:border-[#ec4899]"
    >
      <div className={`flex h-10 w-10 items-center justify-center rounded-full ${iconClassName}`}>
        {icon}
      </div>
      <span className="font-bold">{label}</span>
    </button>
  );
}

function PremiumFeature({
  icon,
  label,
}: {
  icon: ReactNode;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/20 text-green-400">
        {icon}
      </div>
      <div className="text-sm font-bold text-white">{label}</div>
    </div>
  );
}

function PremiumPlan({
  title,
  price,
  featured = false,
  featuredLabel = "",
  onClick,
}: {
  title: string;
  price: string;
  featured?: boolean;
  featuredLabel?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        featured
          ? "relative rounded-2xl border-2 border-amber-300/50 bg-amber-300/10 p-4 text-center shadow-lg transition hover:scale-[1.02]"
          : "rounded-2xl border border-white/10 bg-white/5 p-4 text-center transition hover:border-[#ec4899] hover:bg-white/10"
      }
    >
      {featured ? (
        <div className="absolute right-0 top-[-8px] rounded-full bg-amber-300 px-2 py-0.5 text-[8px] font-bold uppercase text-black">
          {featuredLabel}
        </div>
      ) : null}
      <span className={`mb-1 block text-xs uppercase tracking-[0.2em] ${featured ? "text-amber-300" : "text-white/50"}`}>
        {title}
      </span>
      <span className="block text-xl font-bold text-white">{price}</span>
    </button>
  );
}

function PeriodRow({
  title,
  start,
  end,
  onStartChange,
  onEndChange,
}: {
  title: string;
  start: string;
  end: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
}) {
  const messages = useAppMessages();

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <h4 className="mb-3 text-sm font-bold">{title}</h4>
      <div className="grid grid-cols-2 gap-3">
        <label className="text-xs text-white/60">
          {messages.common.start}
          <input
            type="time"
            value={start}
            onChange={(event) => onStartChange(event.target.value)}
            className="mt-2 w-full rounded-xl border border-white/10 bg-[#120d2b] p-3 text-sm outline-none"
          />
        </label>
        <label className="text-xs text-white/60">
          {messages.common.end}
          <input
            type="time"
            value={end}
            onChange={(event) => onEndChange(event.target.value)}
            className="mt-2 w-full rounded-xl border border-white/10 bg-[#120d2b] p-3 text-sm outline-none"
          />
        </label>
      </div>
    </div>
  );
}
