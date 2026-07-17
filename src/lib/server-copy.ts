import { type AppLocale } from "@/lib/i18n";

type ServerCopy = {
  validation: {
    timeFormat: string;
    localeInvalid: string;
    firstNameMin: string;
    firstNameTooLong: string;
    ageMin: string;
    ageMax: string;
    headlineTooLong: string;
    avatarInvalid: string;
    householdNameMin: string;
    householdNameTooLong: string;
    childProfileNotFound: string;
    newPinFourDigits: string;
    pinConfirmMismatch: string;
    parentPinFourDigits: string;
    titleMin: string;
    titleTooLong: string;
    shortLabelRequired: string;
    shortLabelTooLong: string;
    chooseIcon: string;
    durationMin: string;
    durationMax: string;
    templateNotFound: string;
    routineTaskNotFound: string;
    photoInvalid: string;
    photoTooLarge: string;
    chooseMission: string;
  };
  actions: {
    dbNotConfiguredParentTools: string;
    dbNotConfiguredSettings: string;
    dbNotConfiguredThemes: string;
    dbNotConfiguredSecurity: string;
    dbNotConfiguredBoard: string;
    dbNotConfiguredPremium: string;
    householdMissing: string;
    noHouseholdAttached: string;
    householdSettingsInvalid: string;
    householdSettingsUpdated: string;
    themeChangeInvalid: string;
    profileNotInHousehold: string;
    themeNotFound: string;
    themeAssigned: (profileName: string, themeName: string) => string;
    themeAuto: (profileName: string) => string;
    profileFieldsInvalid: string;
    profileLimitReached: string;
    profileAdded: (name: string) => string;
    profileUpdated: (name: string) => string;
    profileAvatarUpdated: string;
    profilePhotoUpdated: string;
    profilePhotoRemoved: string;
    profileDeleted: (name: string) => string;
    settingsInvalid: string;
    mergedSettingsInvalid: string;
    settingsSaved: string;
    invalidPremiumPlan: string;
    premiumLoadError: string;
    premiumMonthlyActivated: string;
    premiumLifetimeActivated: string;
    parentPinInvalidFields: string;
    parentPinRequiredAction: string;
    currentPinRequired: string;
    currentPinFieldRequired: string;
    currentPinIncorrect: string;
    currentPinFieldIncorrect: string;
    firstParentPinRequired: string;
    firstParentPinFieldRequired: string;
    parentPinSaved: string;
    parentUnlockUpdated: string;
    invalidParentPin: string;
    parentPinMissingConfig: string;
    parentPinIncorrect: string;
    parentAccessConfirmed: string;
    taskTemplateInvalid: string;
    taskTemplateSaveError: string;
    taskTemplateDeleteError: string;
    taskTemplateDeleteProtected: string;
    taskTemplateAdded: (title: string) => string;
    taskTemplateUpdated: (title: string) => string;
    taskTemplateDeleted: (title: string) => string;
    routineInvalid: string;
    routineSaveError: string;
    routineUpdated: (profileName: string, title: string) => string;
    routineTasksReordered: (profileName: string) => string;
    missionAssignError: string;
    routineTaskLimitReached: string;
    missionAdded: (title: string, profileName: string) => string;
    missionAddedBoth: (title: string, profileName: string) => string;
    missionAlreadyPresent: (title: string, profileName: string) => string;
    missionAlreadyPresentBoth: (title: string, profileName: string) => string;
    missionDeleteError: string;
    missionRemoved: (title: string) => string;
    missionsScheduled: (profileName: string, count: number) => string;
    missionsAlreadyScheduled: (profileName: string) => string;
    missionsScheduledBoth: (profileName: string) => string;
    missionsAlreadyScheduledBoth: (profileName: string) => string;
    prototypeImportInvalid: string;
    prototypeImportEmpty: string;
    prototypeImported: (profileCount: number, templateCount: number) => string;
    accountDeleteConfirmationInvalid: string;
    accountDeleteHouseholdMismatch: string;
    accountDeleteBillingError: string;
    accountDeleted: string;
    accountDeletedCleanupPending: string;
  };
};

const frCopy: ServerCopy = {
  validation: {
    timeFormat: "Le format horaire doit etre HH:MM.",
    localeInvalid: "La langue doit etre fr ou en.",
    firstNameMin: "Le prenom doit contenir au moins 2 caracteres.",
    firstNameTooLong: "Le prenom est trop long.",
    ageMin: "L'age minimum est 2 ans.",
    ageMax: "L'age maximum de la V1 est 12 ans.",
    headlineTooLong: "Le sous-titre est trop long.",
    avatarInvalid: "L'avatar est invalide.",
    householdNameMin: "Le nom du foyer doit contenir au moins 3 caracteres.",
    householdNameTooLong: "Le nom du foyer est trop long.",
    childProfileNotFound: "Profil enfant introuvable.",
    newPinFourDigits: "Le nouveau code doit contenir exactement 4 chiffres.",
    pinConfirmMismatch: "La confirmation du code ne correspond pas.",
    parentPinFourDigits: "Le code parent doit contenir 4 chiffres.",
    titleMin: "Le titre doit contenir au moins 2 caracteres.",
    titleTooLong: "Le titre est trop long.",
    shortLabelRequired: "Le label court est obligatoire.",
    shortLabelTooLong: "Le label court est trop long.",
    chooseIcon: "Choisis une icone.",
    durationMin: "La duree minimum est 1 minute.",
    durationMax: "La duree maximum est 60 minutes.",
    templateNotFound: "Template introuvable.",
    routineTaskNotFound: "Mission introuvable.",
    photoInvalid: "La photo est invalide.",
    photoTooLarge: "La photo est trop volumineuse.",
    chooseMission: "Choisis au moins une mission.",
  },
  actions: {
    dbNotConfiguredParentTools:
      "Configure la base Neon dans .env.local avant d'utiliser les outils parent.",
    dbNotConfiguredSettings:
      "Configure la base Neon dans .env.local avant d'utiliser les reglages parent.",
    dbNotConfiguredThemes:
      "Configure la base Neon dans .env.local avant d'utiliser les themes live.",
    dbNotConfiguredSecurity:
      "Configure la base Neon dans .env.local avant d'utiliser la securite parent.",
    dbNotConfiguredBoard: "La base Neon n'est pas configuree.",
    dbNotConfiguredPremium: "La base Neon n'est pas configuree.",
    householdMissing: "Le foyer parent est introuvable.",
    noHouseholdAttached:
      "Aucun foyer n'est rattache a ce compte. Reconnecte-toi ou recree le compte parent.",
    householdSettingsInvalid: "Les reglages du foyer sont invalides.",
    householdSettingsUpdated: "Les reglages du foyer ont ete mis a jour.",
    themeChangeInvalid: "Le changement de theme est invalide.",
    profileNotInHousehold: "Le profil enfant n'appartient pas a ce foyer.",
    themeNotFound: "Le theme selectionne est introuvable pour ce foyer.",
    themeAssigned: (profileName, themeName) =>
      `${profileName} utilise maintenant ${themeName}.`,
    themeAuto: (profileName) => `${profileName} revient au theme automatique.`,
    profileFieldsInvalid: "Le profil contient des champs invalides.",
    profileLimitReached:
      "Le plan gratuit permet un profil enfant. Passez a Family Premium pour agrandir l'equipage.",
    profileAdded: (name) => `${name} a ete ajoute au foyer.`,
    profileUpdated: (name) => `${name} a ete mis a jour.`,
    profileAvatarUpdated: "Avatar mis a jour.",
    profilePhotoUpdated: "Photo mise a jour.",
    profilePhotoRemoved: "Photo supprimee.",
    profileDeleted: (name) => `${name} a ete supprime.`,
    settingsInvalid: "Les reglages sont invalides.",
    mergedSettingsInvalid: "Les reglages fusionnes sont invalides.",
    settingsSaved: "Les reglages parent ont ete enregistres.",
    invalidPremiumPlan: "Le plan premium est invalide.",
    premiumLoadError: "Impossible de charger le foyer premium.",
    premiumMonthlyActivated: "Mode Capitaine mensuel active.",
    premiumLifetimeActivated: "Mode Capitaine a vie active.",
    parentPinInvalidFields: "Le code parent contient des champs invalides.",
    parentPinRequiredAction: "Code parent requis pour cette action.",
    currentPinRequired: "Le code actuel est requis pour modifier le PIN.",
    currentPinFieldRequired: "Le code actuel est requis.",
    currentPinIncorrect: "Le code parent actuel est incorrect.",
    currentPinFieldIncorrect: "Le code actuel est incorrect.",
    firstParentPinRequired: "Definis un premier code parent a 4 chiffres.",
    firstParentPinFieldRequired: "Le code parent est obligatoire.",
    parentPinSaved:
      "Le code parent a ete enregistre et le board est maintenant protege.",
    parentUnlockUpdated: "La duree du deblocage parent a ete mise a jour.",
    invalidParentPin: "Le code parent est invalide.",
    parentPinMissingConfig:
      "Aucun code parent n'est configure. Definis-le d'abord dans les parametres parent.",
    parentPinIncorrect: "Code parent incorrect.",
    parentAccessConfirmed: "Acces parent confirme.",
    taskTemplateInvalid: "Le template contient des champs invalides.",
    taskTemplateSaveError: "Impossible d'enregistrer ce template.",
    taskTemplateDeleteError: "Impossible de supprimer ce template.",
    taskTemplateDeleteProtected:
      "Les templates systeme sont proteges et ne peuvent pas etre supprimes.",
    taskTemplateAdded: (title) => `${title} a ete ajoutee a la bibliotheque.`,
    taskTemplateUpdated: (title) => `${title} a ete mis a jour.`,
    taskTemplateDeleted: (title) => `${title} a ete supprimee de la bibliotheque.`,
    routineInvalid: "La routine contient des champs invalides.",
    routineSaveError: "Impossible de mettre a jour cette routine.",
    routineUpdated: (profileName, title) =>
      `${profileName} utilise maintenant la routine ${title}.`,
    routineTasksReordered: (profileName) =>
      `L'ordre des missions de ${profileName} a ete mis a jour.`,
    missionAssignError: "Impossible d'ajouter cette mission a la routine.",
    routineTaskLimitReached:
      "Le plan gratuit permet quatre missions par routine. Passez a Family Premium pour en ajouter davantage.",
    missionAdded: (title, profileName) =>
      `${title} a ete ajoutee a la routine de ${profileName}.`,
    missionAddedBoth: (title, profileName) =>
      `${title} a ete ajoutee aux routines matin et soir de ${profileName}.`,
    missionAlreadyPresent: (title, profileName) =>
      `${title} est deja presente dans la routine de ${profileName}.`,
    missionAlreadyPresentBoth: (title, profileName) =>
      `${title} est deja presente dans les routines matin et soir de ${profileName}.`,
    missionDeleteError: "Impossible de retirer cette mission.",
    missionRemoved: (title) => `${title} a ete retiree de la routine.`,
    missionsScheduled: (profileName, count) =>
      `${count} mission(s) planifiee(s) pour ${profileName}.`,
    missionsAlreadyScheduled: (profileName) =>
      `Les missions selectionnees sont deja presentes pour ${profileName}.`,
    missionsScheduledBoth: (profileName) =>
      `La planification matin et soir a ete mise a jour pour ${profileName}.`,
    missionsAlreadyScheduledBoth: (profileName) =>
      `Les missions selectionnees existent deja sur matin et soir pour ${profileName}.`,
    prototypeImportInvalid:
      "Le snapshot prototype est invalide ou incomplet pour cet import.",
    prototypeImportEmpty:
      "Aucune donnee prototype exploitable n'a ete trouvee dans ce snapshot.",
    prototypeImported: (profileCount, templateCount) =>
      `Import termine: ${profileCount} profil(s) et ${templateCount} template(s) synchronises.`,
    accountDeleteConfirmationInvalid:
      "Recopie le nom du foyer et DELETE pour confirmer la suppression.",
    accountDeleteHouseholdMismatch: "Le nom du foyer ne correspond pas.",
    accountDeleteBillingError:
      "Impossible d'arreter la facturation. Aucune donnee n'a ete supprimee.",
    accountDeleted: "Le foyer, le compte parent et ses donnees ont ete supprimes.",
    accountDeletedCleanupPending:
      "Le compte est supprime. Le nettoyage des medias doit etre relance par le support.",
  },
};

const enCopy: ServerCopy = {
  validation: {
    timeFormat: "Time format must be HH:MM.",
    localeInvalid: "Locale must be fr or en.",
    firstNameMin: "First name must contain at least 2 characters.",
    firstNameTooLong: "First name is too long.",
    ageMin: "Minimum age is 2.",
    ageMax: "Maximum supported age in V1 is 12.",
    headlineTooLong: "Headline is too long.",
    avatarInvalid: "Avatar is invalid.",
    householdNameMin: "Household name must contain at least 3 characters.",
    householdNameTooLong: "Household name is too long.",
    childProfileNotFound: "Child profile not found.",
    newPinFourDigits: "The new code must contain exactly 4 digits.",
    pinConfirmMismatch: "The code confirmation does not match.",
    parentPinFourDigits: "Parent code must contain 4 digits.",
    titleMin: "Title must contain at least 2 characters.",
    titleTooLong: "Title is too long.",
    shortLabelRequired: "Short label is required.",
    shortLabelTooLong: "Short label is too long.",
    chooseIcon: "Choose an icon.",
    durationMin: "Minimum duration is 1 minute.",
    durationMax: "Maximum duration is 60 minutes.",
    templateNotFound: "Template not found.",
    routineTaskNotFound: "Mission not found.",
    photoInvalid: "Photo is invalid.",
    photoTooLarge: "Photo is too large.",
    chooseMission: "Choose at least one mission.",
  },
  actions: {
    dbNotConfiguredParentTools:
      "Configure the Neon database in .env.local before using parent tools.",
    dbNotConfiguredSettings:
      "Configure the Neon database in .env.local before using parent settings.",
    dbNotConfiguredThemes:
      "Configure the Neon database in .env.local before using live themes.",
    dbNotConfiguredSecurity:
      "Configure the Neon database in .env.local before using parent security.",
    dbNotConfiguredBoard: "The Neon database is not configured.",
    dbNotConfiguredPremium: "The Neon database is not configured.",
    householdMissing: "Parent household was not found.",
    noHouseholdAttached:
      "No household is attached to this account. Sign in again or recreate the parent account.",
    householdSettingsInvalid: "Household settings are invalid.",
    householdSettingsUpdated: "Household settings were updated.",
    themeChangeInvalid: "Theme change is invalid.",
    profileNotInHousehold: "This child profile does not belong to the household.",
    themeNotFound: "The selected theme was not found for this household.",
    themeAssigned: (profileName, themeName) =>
      `${profileName} now uses ${themeName}.`,
    themeAuto: (profileName) => `${profileName} is back on automatic theme mode.`,
    profileFieldsInvalid: "Profile fields are invalid.",
    profileLimitReached:
      "The free plan includes one child profile. Upgrade to Family Premium to grow the crew.",
    profileAdded: (name) => `${name} was added to the household.`,
    profileUpdated: (name) => `${name} was updated.`,
    profileAvatarUpdated: "Avatar updated.",
    profilePhotoUpdated: "Photo updated.",
    profilePhotoRemoved: "Photo removed.",
    profileDeleted: (name) => `${name} was deleted.`,
    settingsInvalid: "Settings are invalid.",
    mergedSettingsInvalid: "Merged settings are invalid.",
    settingsSaved: "Parent settings were saved.",
    invalidPremiumPlan: "Premium plan is invalid.",
    premiumLoadError: "Unable to load the premium household.",
    premiumMonthlyActivated: "Monthly Captain mode is now active.",
    premiumLifetimeActivated: "Lifetime Captain mode is now active.",
    parentPinInvalidFields: "Parent code fields are invalid.",
    parentPinRequiredAction: "Parent code is required for this action.",
    currentPinRequired: "Current code is required to change the PIN.",
    currentPinFieldRequired: "Current code is required.",
    currentPinIncorrect: "Current parent code is incorrect.",
    currentPinFieldIncorrect: "Current code is incorrect.",
    firstParentPinRequired: "Set a first 4-digit parent code.",
    firstParentPinFieldRequired: "Parent code is required.",
    parentPinSaved:
      "The parent code was saved and the board is now protected.",
    parentUnlockUpdated: "Parent unlock duration was updated.",
    invalidParentPin: "Parent code is invalid.",
    parentPinMissingConfig:
      "No parent code is configured yet. Set it first in parent settings.",
    parentPinIncorrect: "Incorrect parent code.",
    parentAccessConfirmed: "Parent access confirmed.",
    taskTemplateInvalid: "Template fields are invalid.",
    taskTemplateSaveError: "Unable to save this template.",
    taskTemplateDeleteError: "Unable to delete this template.",
    taskTemplateDeleteProtected:
      "System templates are protected and cannot be deleted.",
    taskTemplateAdded: (title) => `${title} was added to the library.`,
    taskTemplateUpdated: (title) => `${title} was updated.`,
    taskTemplateDeleted: (title) => `${title} was removed from the library.`,
    routineInvalid: "Routine fields are invalid.",
    routineSaveError: "Unable to update this routine.",
    routineUpdated: (profileName, title) =>
      `${profileName} now uses the ${title} routine.`,
    routineTasksReordered: (profileName) =>
      `${profileName}'s mission order has been updated.`,
    missionAssignError: "Unable to add this mission to the routine.",
    routineTaskLimitReached:
      "The free plan includes four missions per routine. Upgrade to Family Premium to add more.",
    missionAdded: (title, profileName) =>
      `${title} was added to ${profileName}'s routine.`,
    missionAddedBoth: (title, profileName) =>
      `${title} was added to ${profileName}'s morning and evening routines.`,
    missionAlreadyPresent: (title, profileName) =>
      `${title} is already present in ${profileName}'s routine.`,
    missionAlreadyPresentBoth: (title, profileName) =>
      `${title} is already present in ${profileName}'s morning and evening routines.`,
    missionDeleteError: "Unable to remove this mission.",
    missionRemoved: (title) => `${title} was removed from the routine.`,
    missionsScheduled: (profileName, count) =>
      `${count} mission(s) scheduled for ${profileName}.`,
    missionsAlreadyScheduled: (profileName) =>
      `The selected missions are already present for ${profileName}.`,
    missionsScheduledBoth: (profileName) =>
      `Morning and evening planning was updated for ${profileName}.`,
    missionsAlreadyScheduledBoth: (profileName) =>
      `The selected missions already exist in both morning and evening for ${profileName}.`,
    prototypeImportInvalid:
      "The prototype snapshot is invalid or incomplete for this import.",
    prototypeImportEmpty:
      "No usable prototype data was found in this snapshot.",
    prototypeImported: (profileCount, templateCount) =>
      `Import completed: ${profileCount} profile(s) and ${templateCount} template(s) synced.`,
    accountDeleteConfirmationInvalid:
      "Enter the household name and DELETE to confirm deletion.",
    accountDeleteHouseholdMismatch: "The household name does not match.",
    accountDeleteBillingError:
      "Billing could not be stopped. No account data was deleted.",
    accountDeleted: "The household, parent account and its data were deleted.",
    accountDeletedCleanupPending:
      "The account was deleted. Media cleanup must be retried by support.",
  },
};

export function getServerCopy(locale: AppLocale) {
  return locale === "en" ? enCopy : frCopy;
}
