import {
  assignBoardTaskTemplateAction,
  assignManyBoardTaskTemplatesAction,
  createBoardProfileAction,
  deleteBoardRoutineTaskDayAction,
  deleteBoardRoutineTaskAction,
  deleteBoardTaskTemplateAction,
  deleteBoardProfileAction,
  reorderBoardRoutineTasksAction,
  toggleBoardTaskAction,
  upsertBoardTaskTemplateAction,
  updateBoardProfileAction,
} from "@/app/board-actions";
import {
  activateBoardPremiumAction as activateBoardSubscriptionAction,
  importPrototypeSnapshotAction,
  updateBoardSettingsAction as updateBoardAppSettingsAction,
} from "@/app/settings-actions";
import { Rocket } from "lucide-react";
import {
  createChildProfileAction,
  updateChildProfileThemeAction,
  updateHouseholdSettingsAction,
  updateParentSecurityAction,
} from "@/app/admin/actions";
import {
  assignAdminRoutineTaskAction,
  deleteAdminRoutineTaskAction,
  deleteAdminTaskTemplateAction,
  upsertAdminRoutineAction,
  upsertAdminTaskTemplateAction,
} from "@/app/admin/workbench-actions";

import { RoutineBoard } from "@/components/board/routine-board";
import { getCurrentAppMessages } from "@/lib/i18n.server";
import { getBoardProfilesFromBoardOverview } from "@/lib/board-data";
import { isDatabaseConfigured } from "@/lib/config";
import { getBoardLibraryTasksFromHousehold } from "@/lib/data/board-library";
import { ensureHouseholdBaseline } from "@/lib/household-bootstrap";
import { getHouseholdBoardOverview, getOwnerSubscription } from "@/lib/household";
import {
  isPremiumSubscription,
  isSupportedLocale,
} from "@/lib/settings";
import { getSession } from "@/lib/session";
import { getParentWorkspaceSnapshot } from "@/lib/parent-workspace";

export default async function Home() {
  const messages = await getCurrentAppMessages();
  const databaseReady = isDatabaseConfigured();
  const session = databaseReady ? await getSession() : null;
  const hasLiveSession = Boolean(databaseReady && session?.user);

  if (session?.user) {
    await ensureHouseholdBaseline({
      userId: session.user.id,
      userName: session.user.name,
    });
  }

  const household = session?.user ? await getHouseholdBoardOverview(session.user.id) : null;
  const subscription = session?.user ? await getOwnerSubscription(session.user.id) : null;
  const parentWorkspace = session?.user
    ? await getParentWorkspaceSnapshot(session.user.id)
    : null;
  const boardProfiles = hasLiveSession
    ? getBoardProfilesFromBoardOverview(household)
    : [];
  const libraryTasks = hasLiveSession
    ? getBoardLibraryTasksFromHousehold(household)
    : [];
  const boardSettings = household
    ? {
        locale: isSupportedLocale(household.locale) ? household.locale : "fr",
        soundsEnabled: household.soundsEnabled,
        morningStart: household.morningStart,
        morningEnd: household.morningEnd,
        eveningStart: household.eveningStart,
        eveningEnd: household.eveningEnd,
        premiumActive: isPremiumSubscription(subscription?.plan, subscription?.status),
      }
    : undefined;

  return (
    <main className="min-h-[100dvh] overflow-hidden">
      <div className="orientation-guard">
        <div className="surface-panel max-w-sm rounded-[32px] p-8 text-center text-white">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[linear-gradient(135deg,#ff6fb5,#ff9c4a)] text-slate-950">
            <Rocket className="h-6 w-6" />
          </div>
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.22em] text-white/45">
            {messages.common.appName}
          </p>
          <h1 className="font-display text-4xl text-white">
            {messages.board.landscapeTitle}
          </h1>
          <p className="mt-3 text-base leading-7 text-white/65">
            {messages.board.landscapeBody}
          </p>
        </div>
      </div>

      <RoutineBoard
        profiles={boardProfiles}
        libraryTasks={libraryTasks}
        householdName={household?.name}
        signedIn={hasLiveSession}
        signInHref="/sign-in?callbackUrl=/settings"
        signUpHref="/sign-up?callbackUrl=/settings"
        pricingHref="/pricing"
        onToggleTaskAction={session?.user ? toggleBoardTaskAction : undefined}
        onCreateProfileAction={session?.user ? createBoardProfileAction : undefined}
        onUpdateProfileAction={session?.user ? updateBoardProfileAction : undefined}
        onDeleteProfileAction={session?.user ? deleteBoardProfileAction : undefined}
        onUpsertTaskTemplateAction={
          session?.user ? upsertBoardTaskTemplateAction : undefined
        }
        onDeleteTaskTemplateAction={
          session?.user ? deleteBoardTaskTemplateAction : undefined
        }
        onAssignTaskTemplateAction={
          session?.user ? assignBoardTaskTemplateAction : undefined
        }
        onAssignManyTaskTemplatesAction={
          session?.user ? assignManyBoardTaskTemplatesAction : undefined
        }
        onDeleteRoutineTaskAction={
          session?.user ? deleteBoardRoutineTaskAction : undefined
        }
        onReorderRoutineTasksAction={
          session?.user ? reorderBoardRoutineTasksAction : undefined
        }
        onDeleteRoutineTaskDayAction={
          session?.user ? deleteBoardRoutineTaskDayAction : undefined
        }
        settings={boardSettings}
        onUpdateSettingsAction={
          session?.user ? updateBoardAppSettingsAction : undefined
        }
        onImportPrototypeAction={
          session?.user ? importPrototypeSnapshotAction : undefined
        }
        onActivatePremiumAction={
          session?.user ? activateBoardSubscriptionAction : undefined
        }
        parentWorkspace={parentWorkspace ?? undefined}
        onCreateProfileFormAction={session?.user ? createChildProfileAction : undefined}
        onUpdateHouseholdSettingsFormAction={
          session?.user ? updateHouseholdSettingsAction : undefined
        }
        onUpdateParentSecurityFormAction={
          session?.user ? updateParentSecurityAction : undefined
        }
        onUpdateProfileThemeFormAction={
          session?.user ? updateChildProfileThemeAction : undefined
        }
        onUpsertTaskTemplateWorkbenchAction={
          session?.user ? upsertAdminTaskTemplateAction : undefined
        }
        onDeleteTaskTemplateWorkbenchAction={
          session?.user ? deleteAdminTaskTemplateAction : undefined
        }
        onUpsertRoutineWorkbenchAction={
          session?.user ? upsertAdminRoutineAction : undefined
        }
        onAssignRoutineTaskWorkbenchAction={
          session?.user ? assignAdminRoutineTaskAction : undefined
        }
        onDeleteRoutineTaskWorkbenchAction={
          session?.user ? deleteAdminRoutineTaskAction : undefined
        }
      />
    </main>
  );
}
