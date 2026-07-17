import {
  updateChildProfileThemeAction,
  updateHouseholdSettingsAction,
  updateParentSecurityAction,
} from "@/app/parent-actions";
import {
  assignBoardTaskTemplateAction,
  assignManyBoardTaskTemplatesAction,
  createBoardProfileAction,
  deleteBoardRoutineTaskDayAction,
  deleteBoardProfileAction,
  deleteBoardTaskTemplateAction,
  upsertBoardTaskTemplateAction,
  updateBoardProfileAction,
} from "@/app/board-actions";
import {
  activateBoardPremiumAction,
  deleteRoutineKidsAccountAction,
  importPrototypeSnapshotAction,
  openBillingPortalAction,
  updateBoardSettingsAction,
} from "@/app/settings-actions";
import { SettingsBoardBridge } from "@/components/settings/settings-board-bridge";
import { isDatabaseConfigured } from "@/lib/config";
import { getBoardProfilesFromBoardOverview } from "@/lib/board-data";
import { getBoardLibraryTasksFromHousehold } from "@/lib/data/board-library";
import { ensureHouseholdBaseline } from "@/lib/household-bootstrap";
import {
  getHouseholdBoardOverview,
  getHouseholdOverview,
  getOwnerSubscription,
} from "@/lib/household";
import {
  isPremiumSubscription,
  isSupportedLocale,
} from "@/lib/settings";
import { getSession } from "@/lib/session";
import { getParentWorkspaceSnapshot } from "@/lib/parent-workspace";

export default async function SettingsPage() {
  const databaseReady = isDatabaseConfigured();
  const session = databaseReady ? await getSession() : null;

  if (session?.user) {
    await ensureHouseholdBaseline({
      userId: session.user.id,
      userName: session.user.name,
    });
  }

  const household = session?.user ? await getHouseholdOverview(session.user.id) : null;
  const boardHousehold = session?.user
    ? await getHouseholdBoardOverview(session.user.id)
    : null;
  const subscription = session?.user ? await getOwnerSubscription(session.user.id) : null;
  const parentWorkspace = session?.user
    ? await getParentWorkspaceSnapshot(session.user.id)
    : null;
  const boardProfiles = session?.user
    ? getBoardProfilesFromBoardOverview(boardHousehold)
    : [];
  const libraryTasks = session?.user
    ? getBoardLibraryTasksFromHousehold(boardHousehold)
    : [];
  const settings = household
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
    <SettingsBoardBridge
      householdName={household?.name}
      initialSettings={settings}
      profiles={boardProfiles}
      libraryTasks={libraryTasks}
      onUpdateSettingsAction={session?.user ? updateBoardSettingsAction : undefined}
      onImportPrototypeAction={
        session?.user ? importPrototypeSnapshotAction : undefined
      }
      onActivatePremiumAction={session?.user ? activateBoardPremiumAction : undefined}
      onManageBillingAction={session?.user ? openBillingPortalAction : undefined}
      onDeleteAccountAction={
        session?.user ? deleteRoutineKidsAccountAction : undefined
      }
      parentWorkspace={parentWorkspace ?? undefined}
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
      onDeleteRoutineTaskDayAction={
        session?.user ? deleteBoardRoutineTaskDayAction : undefined
      }
      onUpdateHouseholdSettingsFormAction={
        session?.user ? updateHouseholdSettingsAction : undefined
      }
      onUpdateParentSecurityFormAction={
        session?.user ? updateParentSecurityAction : undefined
      }
      onUpdateProfileThemeFormAction={
        session?.user ? updateChildProfileThemeAction : undefined
      }
    />
  );
}
