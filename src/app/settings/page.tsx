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
import { SettingsAccessGate } from "@/components/settings/settings-access-gate";
import { redirect } from "next/navigation";
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
import { getParentSecuritySummary } from "@/lib/parent-security";

export default async function SettingsPage() {
  const databaseReady = isDatabaseConfigured();
  const session = databaseReady ? await getSession() : null;

  if (!session?.user) {
    redirect("/sign-in?callbackUrl=/settings");
  }

  await ensureHouseholdBaseline({
    userId: session.user.id,
    userName: session.user.name,
  });

  const parentSecurity = await getParentSecuritySummary(session.user.id);

  if (!parentSecurity.stepUpActive) {
    return <SettingsAccessGate pinConfigured={parentSecurity.pinConfigured} />;
  }

  const [household, boardHousehold, subscription, parentWorkspace] = await Promise.all([
    getHouseholdOverview(session.user.id),
    getHouseholdBoardOverview(session.user.id),
    getOwnerSubscription(session.user.id),
    getParentWorkspaceSnapshot(session.user.id),
  ]);
  const boardProfiles = getBoardProfilesFromBoardOverview(boardHousehold);
  const libraryTasks = getBoardLibraryTasksFromHousehold(boardHousehold);
  const settings = household
    ? {
        locale: isSupportedLocale(household.locale) ? household.locale : "fr",
        soundsEnabled: household.soundsEnabled,
        morningStart: household.morningStart,
        morningEnd: household.morningEnd,
        eveningStart: household.eveningStart,
        eveningEnd: household.eveningEnd,
        premiumActive: isPremiumSubscription(subscription),
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
