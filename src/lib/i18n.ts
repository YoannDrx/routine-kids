export const localeCookieName = "routinekids-locale";

export type AppLocale = "fr" | "en";

type AppMessages = {
  common: {
    appName: string;
    ok: string;
    yes: string;
    no: string;
    close: string;
    back: string;
    save: string;
    saving: string;
    apply: string;
    edit: string;
    delete: string;
    create: string;
    start: string;
    end: string;
    warning: string;
    later: string;
    loading: string;
  };
  board: {
    landscapeTitle: string;
    landscapeBody: string;
    successTitle: string;
    saveError: string;
    settingsLabel: string;
    premiumBadge: string;
    activatePremium: string;
    morning: string;
    evening: string;
    emptyBoard: string;
    addAstronaut: string;
    onboardingEyebrow: string;
    onboardingTitle: string;
    onboardingBody: string;
    onboardingHint: string;
    rest: string;
    chooseCrewMember: string;
    connectToDeleteTask: string;
    connectToCreateProfile: string;
    connectToEditProfile: string;
    connectToDeleteProfile: string;
    connectToUpdateAvatar: string;
    connectToSaveTask: string;
    connectToAddTask: string;
    connectToPlanTasks: string;
    connectToActivatePremium: string;
    deleteProfileConfirm: (name: string) => string;
    removeTaskConfirm: (taskTitle: string, periodTitle: string) => string;
    deleteTaskForProfile: (name: string) => string;
    editAvatarForProfile: (name: string) => string;
    addTaskForProfile: (name: string) => string;
    removeTasksForProfile: (name: string) => string;
    dayCompleteEyebrow: string;
    dayCompleteTitle: string;
    dayCompleteMessage: (name: string) => string;
  };
  profile: {
    crewTitle: string;
    addMember: string;
    chooseAvatar: string;
    updateProfileFromParent: string;
    validateAvatar: string;
    profileTitle: string;
    namePlaceholder: string;
    ageLabel: string;
    chooseAvatarLabel: string;
    photoButton: string;
    uploadPhoto: string;
    replacePhoto: string;
    removePhoto: string;
    photoSection: string;
    imageTooLarge: string;
    imageInvalid: string;
    cropTitle: string;
    zoom: string;
    cancelCrop: string;
    confirmCrop: string;
    deleteProfile: string;
    saveProfile: string;
    savingProfile: string;
    nameRequired: string;
    defaultName: string;
    defaultHeadline: (age: number) => string;
  };
  library: {
    title: string;
    quickAddTitle: string;
    taskLibraryTitle: string;
    forProfile: (name: string) => string;
    description: string;
    addTask: string;
    searchPlaceholder: string;
    assignTask: string;
    missionLabel: string;
    titleLabel: string;
    colorLabel: string;
    shortLabel: string;
    icon: string;
    duration: string;
    add: string;
    addMission: string;
    bothPeriods: string;
    confirm: string;
    shortLabelPlaceholder: string;
    schedulerTitle: string;
    schedulerDescription: string;
    schedulerWho: string;
    schedulerWhat: string;
    schedulerWhen: string;
    schedulerDays: string;
    allDays: string;
    weekView: string;
    bulkAdd: string;
    weekDays: string[];
    weekDayNames: string[];
    addTasksPlaceholder: string;
    noTemplateAvailable: string;
    selectedProfileMissions: (name: string, count: number) => string;
    selectCrewMember: string;
    deleteTaskConfirm: (taskTitle: string) => string;
    magicAuto: string;
    magicSetupTitle: string;
    magicSetupDescription: string;
    magicPremiumMessage: string;
    yesMagic: string;
    noThanks: string;
    magicTasksTitle: string;
    magicTasksDescription: string;
    magicTasksSelectionHint: string;
    magicTasksSelectedCount: (selected: number, total: number) => string;
    magicTasksEmptySelection: string;
    enableSuggestion: (taskTitle: string) => string;
    disableSuggestion: (taskTitle: string) => string;
    addAll: string;
    noTasksFoundForAge: string;
    smartTasksAdded: (count: number) => string;
  };
  feedback: {
    premiumTitle: string;
    premiumMessage: string;
    unlimitedProfiles: string;
    unlimitedTasks: string;
    monthly: string;
    yearly: string;
    best: string;
    profileLimitMessage: string;
    taskLimitMessage: string;
  };
  journey: {
    title: string;
    progress: string;
    streak: string;
    momentumDays: string;
    currentPlanet: string;
    nextPlanet: string;
    journeyComplete: string;
    completedMissions: (count: number) => string;
    unlockedMilestones: (count: number) => string;
    startJourney: string;
    step: (index: number) => string;
    accomplished: string;
    pending: string;
  };
  gate: {
    title: string;
    description: string;
    missingPin: string;
    pinLabel: string;
    pinPlaceholder: string;
    verify: string;
    verifying: string;
    openSettings: string;
    later: string;
    genericError: string;
    questionPrefix: string;
    answerPlaceholder: string;
    wrongAnswer: string;
  };
  settings: {
    title: string;
    premiumActive: string;
    premiumActiveSubtitle: string;
    manageSubscription: string;
    premiumUpsell: string;
    premiumUpsellSubtitle: string;
    management: string;
    parents: string;
    app: string;
    crew: string;
    library: string;
    planner: string;
    manage: string;
    tasks: string;
    auto: string;
    household: string;
    parentCode: string;
    themes: string;
    import: string;
    activity: string;
    schedule: string;
    scheduleSubtitle: string;
    sounds: string;
    soundsOn: string;
    soundsOff: string;
    soundsEnableAria: string;
    soundsDisableAria: string;
    language: string;
    about: string;
    privacy: string;
    support: string;
    chooseLanguage: string;
    french: string;
    english: string;
    languageDescription: string;
    aboutTagline: string;
    aboutVersion: string;
    monthlyPrice: string;
    yearlyPrice: string;
    parentCodeActive: (minutes: number) => string;
    themePackCount: (count: number) => string;
    privacyTitle: string;
    closeDocument: string;
    privacyUpdated: string;
    privacyIntro: string;
    privacyDataTitle: string;
    privacyDataBody: string;
    privacyLocalTitle: string;
    privacyLocalBody: string;
    privacyThirdPartyTitle: string;
    privacyThirdPartyBody: string;
    privacyTechnicalTitle: string;
    privacyTechnicalBody: string;
    privacyContactTitle: string;
    privacyContactBody: string;
    copyright: string;
    connectParentSpace: string;
    saveError: string;
    connectToSave: string;
    connectToActivatePremium: string;
    versionLabel: string;
  };
  workspace: {
    crewEyebrow: string;
    crewTitle: string;
    crewDescription: string;
    householdEyebrow: string;
    householdTitle: string;
    householdDescription: string;
    securityEyebrow: string;
    securityTitle: string;
    securityDescription: string;
    themesEyebrow: string;
    themesTitle: string;
    themesDescription: string;
    templatesEyebrow: string;
    templatesTitle: string;
    templatesDescription: string;
    routinesEyebrow: string;
    routinesTitle: string;
    routinesDescription: string;
    importEyebrow: string;
    importTitle: string;
    importDescription: string;
    activityEyebrow: string;
    activityTitle: string;
    activityDescription: string;
    noProfiles: string;
    ageYears: (age: number) => string;
    activityEmpty: string;
    activityDate: string;
    activityAction: string;
    activityTarget: string;
    activityDetails: string;
  };
  forms: {
    parentSpace: string;
    serverAction: string;
    addChildProfile: string;
    parentFirstName: string;
    childFirstName: string;
    age: string;
    headline: string;
    profileNamePlaceholder: string;
    headlinePlaceholder: string;
    initialAvatar: string;
    creating: string;
    createProfile: string;
    householdSettings: string;
    householdNameLanguage: string;
    householdName: string;
    saveHousehold: string;
    parentSecurity: string;
    parentPinTitle: string;
    pinActive: string;
    pinSetup: string;
    pinActiveDescription: string;
    pinMissingDescription: string;
    currentPin: string;
    noPinActive: string;
    pinPlaceholder: string;
    trustDuration: string;
    tenMinutes: string;
    fifteenMinutes: string;
    thirtyMinutes: string;
    sixtyMinutes: string;
    newPin: string;
    parentPin: string;
    confirmation: string;
    saveParentPin: string;
    boardTheme: string;
    autoByAge: string;
    updatingShort: string;
    taskTemplates: string;
    liveLibrary: string;
    newTemplate: string;
    system: string;
    custom: string;
    editMode: string;
    createMode: string;
    title: string;
    shortLabel: string;
    templateTitlePlaceholder: string;
    templateShortLabelPlaceholder: string;
    duration: string;
    icon: string;
    saveTemplate: string;
    deleteTemplate: string;
    templateDeleteProtected: string;
    deleteTemplateConfirm: (name: string) => string;
    routineCrud: string;
    routineStudio: string;
    liveDb: string;
    routineStudioDescription: string;
    routineToInitialize: string;
    addMission: string;
    removeMission: string;
    noRoutineMission: string;
    saveRoutine: string;
    prototypeImport: string;
    prototypeSnapshot: string;
    analyzingLocalStorage: string;
    noPrototypeSnapshot: string;
    snapshotUnreadable: string;
    snapshotNeedsCleanup: string;
    importReplaceNotice: string;
    importNow: string;
    importing: string;
    profiles: string;
    templates: string;
    assignments: string;
    completions: string;
    language: string;
    localPremium: string;
    active: string;
    inactive: string;
    signOut: string;
  };
  auth: {
    parentSpace: string;
    createHousehold: string;
    signIn: string;
    signUpDescription: string;
    signInDescription: string;
    email: string;
    password: string;
    parentFirstName: string;
    passwordPlaceholder: string;
    wait: string;
    createParentAccount: string;
    openParentSettings: string;
    alreadyHaveAccount: string;
    noAccount: string;
    createAccount: string;
    connectNow: string;
    signupError: string;
    signinError: string;
  };
  pricing: {
    eyebrow: string;
    title: string;
    description: string;
    backToBoard: string;
    createParentAccount: string;
    openPlans: string;
    limits: string;
    childProfiles: (count: number) => string;
    smartPresets: (count: number) => string;
    auditDays: (count: number) => string;
    plans: {
      free: {
        name: string;
        description: string;
        features: string[];
      };
      family: {
        name: string;
        description: string;
        features: string[];
      };
      familyPlus: {
        name: string;
        description: string;
        features: string[];
      };
    };
  };
};

export function normalizeAppLocale(value: string | null | undefined): AppLocale {
  return value === "en" ? "en" : "fr";
}

export function getIntlLocale(locale: AppLocale) {
  return locale === "en" ? "en-US" : "fr-FR";
}

const messages: Record<AppLocale, AppMessages> = {
  fr: {
    common: {
      appName: "RoutineKids",
      ok: "OK",
      yes: "Oui",
      no: "Non",
      close: "Fermer",
      back: "Retour",
      save: "Enregistrer",
      saving: "Enregistrement...",
      apply: "Appliquer",
      edit: "Modifier",
      delete: "Supprimer",
      create: "Creer",
      start: "Debut",
      end: "Fin",
      warning: "Attention",
      later: "Plus tard",
      loading: "Chargement...",
    },
    board: {
      landscapeTitle: "Passe en paysage",
      landscapeBody:
        "La board enfant est pensee pour tenir en plein ecran sur iPad, avec une navigation tactile et sans surcharge.",
      successTitle: "Succes !",
      saveError: "Une erreur est survenue pendant la sauvegarde.",
      settingsLabel: "Parametres parent",
      premiumBadge: "Badge premium",
      activatePremium: "Activer premium",
      morning: "Matin",
      evening: "Soir",
      emptyBoard: "Aucun astronaute.",
      addAstronaut: "Ajouter un astronaute",
      onboardingEyebrow: "Espace parent",
      onboardingTitle: "Cree le foyer pour lancer la premiere routine.",
      onboardingBody:
        "Connecte un parent pour creer l'equipage, regler les parametres et planifier les missions du matin et du soir.",
      onboardingHint:
        "Tout se pilote ensuite depuis les parametres plein ecran, sans quitter la board enfant.",
      rest: "Repos",
      chooseCrewMember: "Choisis d'abord un membre de l'equipage.",
      connectToDeleteTask: "Connecte-toi pour supprimer cette mission.",
      connectToCreateProfile: "Connecte-toi pour creer un profil reel.",
      connectToEditProfile: "Connecte-toi pour modifier ce profil.",
      connectToDeleteProfile: "Connecte-toi pour supprimer ce profil.",
      connectToUpdateAvatar: "Connecte-toi pour modifier cet avatar.",
      connectToSaveTask: "Connecte-toi pour enregistrer cette mission.",
      connectToAddTask: "Connecte-toi pour ajouter une mission reelle.",
      connectToPlanTasks: "Connecte-toi pour planifier des missions reelles.",
      connectToActivatePremium: "Connecte-toi pour activer le premium.",
      deleteProfileConfirm: (name) => `Supprimer ${name} ?`,
      removeTaskConfirm: (taskTitle, periodTitle) =>
        `Retirer ${taskTitle} pour ${periodTitle} ?`,
      deleteTaskForProfile: (name) => `Supprimer des taches pour ${name}`,
      editAvatarForProfile: (name) => `Modifier l'avatar de ${name}`,
      addTaskForProfile: (name) => `Ajouter une tache pour ${name}`,
      removeTasksForProfile: (name) => `Supprimer ${name}`,
      dayCompleteEyebrow: "Journee complete",
      dayCompleteTitle: "Bravo !",
      dayCompleteMessage: (name) => `${name}, tout est termine pour aujourd'hui !`,
    },
    profile: {
      crewTitle: "L'Equipage",
      addMember: "Ajouter un membre",
      chooseAvatar: "Choisir un avatar",
      updateProfileFromParent: "Modifier le profil (Parents)",
      validateAvatar: "Valider",
      profileTitle: "Profil",
      namePlaceholder: "Nom",
      ageLabel: "Age",
      chooseAvatarLabel: "Choisir un avatar",
      photoButton: "Photo",
      uploadPhoto: "Importer une photo",
      replacePhoto: "Remplacer la photo",
      removePhoto: "Supprimer la photo",
      photoSection: "Photo du profil",
      imageTooLarge: "L'image est trop lourde. Garde un fichier inferieur a 25 Mo.",
      imageInvalid: "Selectionne une image compatible.",
      cropTitle: "Recadrer la photo",
      zoom: "Zoom",
      cancelCrop: "Annuler",
      confirmCrop: "Utiliser cette photo",
      deleteProfile: "Supprimer le profil",
      saveProfile: "Enregistrer",
      savingProfile: "Enregistrement...",
      nameRequired: "Nom requis !",
      defaultName: "Astronaute",
      defaultHeadline: (age) =>
        age <= 4
          ? "Routine douce avant le depart"
          : age >= 7
            ? "Routine plus dense, autonomie en hausse"
            : "Mission rapide avant l'ecole",
    },
    library: {
      title: "Bibliotheque",
      quickAddTitle: "Ajout rapide",
      taskLibraryTitle: "Bibliotheque de taches",
      forProfile: (name) => `Pour ${name}`,
      description: "Conserve la densite et les codes visuels de la board",
      addTask: "Ajouter une tache",
      searchPlaceholder: "Rechercher une mission",
      assignTask: "C'est pour quand ?",
      missionLabel: "Mission",
      titleLabel: "Titre",
      colorLabel: "Couleur",
      shortLabel: "Label court",
      icon: "Icone",
      duration: "Duree",
      add: "Ajouter",
      addMission: "Ajouter une mission",
      bothPeriods: "Matin + soir",
      confirm: "Confirmer",
      shortLabelPlaceholder: "Label court",
      schedulerTitle: "Planificateur",
      schedulerDescription:
        "Grande modal board avec rail profils, tabs et validation finale.",
      schedulerWho: "Qui ?",
      schedulerWhat: "1. Quoi ?",
      schedulerWhen: "2. Quand ?",
      schedulerDays: "3. Jours ?",
      allDays: "Tous",
      weekView: "Vue semaine",
      bulkAdd: "Ajout multiple",
      weekDays: ["L", "M", "M", "J", "V", "S", "D"],
      weekDayNames: ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"],
      addTasksPlaceholder: "Ajouter des missions",
      noTemplateAvailable: "Aucun template disponible",
      selectedProfileMissions: (name, count) =>
        `${name} · ${count} mission(s) selectionnee(s)`,
      selectCrewMember: "Choisis un membre de l'equipage",
      deleteTaskConfirm: (taskTitle) =>
        `Supprimer ${taskTitle} de la bibliotheque ?`,
      magicAuto: "Auto",
      magicSetupTitle: "Configuration Magique ?",
      magicSetupDescription:
        "Voulez-vous que l'IA ajoute automatiquement les taches adaptees a l'age ? (Fonction Premium)",
      magicPremiumMessage:
        "L'automatisation magique est reservee aux Capitaines !",
      yesMagic: "Oui, magie !",
      noThanks: "Non, je gere",
      magicTasksTitle: "Taches Trouvees",
      magicTasksDescription: "Voici les taches suggerees pour cet age.",
      magicTasksSelectionHint:
        "Tout est preselectionne. Retire ce que tu ne veux pas ajouter.",
      magicTasksSelectedCount: (selected, total) =>
        `${selected}/${total} mission(s) selectionnee(s)`,
      magicTasksEmptySelection: "Choisis au moins une mission a ajouter.",
      enableSuggestion: (taskTitle) => `Reprendre ${taskTitle}`,
      disableSuggestion: (taskTitle) => `Retirer ${taskTitle}`,
      addAll: "Tout Ajouter",
      noTasksFoundForAge: "Aucune tache trouvee pour cet age.",
      smartTasksAdded: (count) => `${count} tache(s) ajoutee(s) intelligemment !`,
    },
    feedback: {
      premiumTitle: "Devenez Capitaine !",
      premiumMessage: "Profils illimites, taches illimitees et plus.",
      unlimitedProfiles: "Profils illimites",
      unlimitedTasks: "Taches illimitees",
      monthly: "Mensuel",
      yearly: "Annuel",
      best: "2 mois offerts",
      profileLimitMessage:
        "Desole cadet, il faut etre Capitaine pour agrandir l'equipage !",
      taskLimitMessage:
        "Pas plus de 4 missions par periode pour les cadets. Passez Capitaine pour tout debloquer.",
    },
    journey: {
      title: "Voyage spatial",
      progress: "Progression",
      streak: "Streak",
      momentumDays: "jours d'elan",
      currentPlanet: "Planete actuelle",
      nextPlanet: "Prochaine etape",
      journeyComplete: "Mission accomplie !",
      completedMissions: (count) => `${count} missions terminees`,
      unlockedMilestones: (count) =>
        `${count} planetes deja debloquees sur la route du capitaine.`,
      startJourney: "Complete la routine du jour pour lancer le voyage.",
      step: (index) => `Etape ${index}`,
      accomplished: "Mission accomplie",
      pending: "En attente",
    },
    gate: {
      title: "Securite Parents",
      description:
        "Entre le code parent pour ouvrir les reglages et les modales sensibles.",
      missingPin: "Definis-en un depuis les parametres parent avant d'utiliser cette action.",
      pinLabel: "Code parent",
      pinPlaceholder: "1234",
      verify: "Valider",
      verifying: "Verification...",
      openSettings: "Ouvrir les parametres",
      later: "Plus tard",
      genericError: "Impossible de valider le code parent pour le moment.",
      questionPrefix: "Combien font",
      answerPlaceholder: "Reponse",
      wrongAnswer: "Erreur !",
    },
    settings: {
      title: "Parametres",
      premiumActive: "Statut : Capitaine",
      premiumActiveSubtitle: "Version Premium active",
      manageSubscription: "Gérer l'abonnement",
      premiumUpsell: "Passer Premium",
      premiumUpsellSubtitle: "Debloquez l'illimite !",
      management: "Gestion",
      parents: "Parents",
      app: "Application",
      crew: "Equipage",
      library: "Biblio",
      planner: "Planif.",
      manage: "Gerer",
      tasks: "Taches",
      auto: "Auto",
      household: "Foyer",
      parentCode: "Code parent",
      themes: "Themes",
      import: "Import",
      activity: "Activite",
      schedule: "Horaires",
      scheduleSubtitle: "Matin / Soir",
      sounds: "Sons",
      soundsOn: "Actifs",
      soundsOff: "Desactives",
      soundsEnableAria: "Activer les sons",
      soundsDisableAria: "Desactiver les sons",
      language: "Langue",
      about: "A propos",
      privacy: "Confidentialite",
      support: "Support",
      chooseLanguage: "Choisir la langue",
      french: "Francais",
      english: "English",
      languageDescription: "Francais / English",
      aboutTagline: "Pensé par des parents pour des parents et leurs enfants.",
      aboutVersion: "RoutineKids v1.1",
      monthlyPrice: "9€/mois",
      yearlyPrice: "90€/an",
      parentCodeActive: (minutes) => `Actif · ${minutes} min`,
      themePackCount: (count) => `${count} packs`,
      privacyTitle: "Politique de Confidentialite",
      closeDocument: "Fermer le document",
      privacyUpdated: "Derniere mise a jour : 24 Novembre 2025",
      privacyIntro:
        "Chez RoutineKids, la securite et la confidentialite de vos enfants sont notre priorite absolue. Cette politique detaille comment nous traitons les donnees.",
      privacyDataTitle: "Collecte des donnees",
      privacyDataBody:
        "RoutineKids stocke les profils, photos et routines du foyer dans une base securisee afin de synchroniser l'experience entre vos appareils.",
      privacyLocalTitle: "Stockage local",
      privacyLocalBody:
        "Les preferences temporaires peuvent rester sur l'appareil. Les donnees du foyer sont conservees sur nos serveurs jusqu'a leur suppression par le parent.",
      privacyThirdPartyTitle: "Partage a des tiers",
      privacyThirdPartyBody:
        "Les prestataires techniques strictement necessaires a l'hebergement et au paiement traitent uniquement les donnees requises pour leur service.",
      privacyTechnicalTitle: "Donnees techniques (Apple/Google)",
      privacyTechnicalBody:
        "Apple ou Google peuvent collecter des donnees techniques anonymes (rapports de plantage, statistiques d'installation) conformement a leurs propres politiques de confidentialite, independantes de RoutineKids.",
      privacyContactTitle: "Contact",
      privacyContactBody: "Pour toute question legale :",
      copyright: "© 2025 RoutineKids",
      connectParentSpace: "Connecte-toi pour ouvrir l'espace parent.",
      saveError: "Une erreur est survenue pendant la sauvegarde.",
      connectToSave: "Connecte-toi pour enregistrer ces reglages.",
      connectToActivatePremium: "Connecte-toi pour activer le premium.",
      versionLabel: "Version",
    },
    workspace: {
      crewEyebrow: "Equipage",
      crewTitle: "Profils et themes",
      crewDescription:
        "Le parent workspace reste dans la famille de modales RoutineKids, sans page admin dediee.",
      householdEyebrow: "Foyer",
      householdTitle: "Nom et langue",
      householdDescription:
        "Les reglages parent restent sur une surface tactile compacte, proche du prototype.",
      securityEyebrow: "Securite",
      securityTitle: "Code parent",
      securityDescription:
        "Le step-up parent protege les modales sensibles sur iPad partage.",
      themesEyebrow: "Themes",
      themesTitle: "Themes par enfant",
      themesDescription:
        "Chaque profil peut garder son univers visuel sans quitter les parametres.",
      templatesEyebrow: "Bibliotheque",
      templatesTitle: "Templates de missions",
      templatesDescription:
        "La bibliotheque parent pilote les vraies missions Prisma utilisees par la board.",
      routinesEyebrow: "Planif.",
      routinesTitle: "Routines et missions",
      routinesDescription:
        "Renomme les routines et gere les missions reelles sans quitter l'overlay parent.",
      importEyebrow: "Import",
      importTitle: "Snapshot prototype",
      importDescription:
        "Le migrateur relira directement routineKidsData depuis ce navigateur.",
      activityEyebrow: "Activite",
      activityTitle: "Journal parent",
      activityDescription:
        "Toutes les actions sensibles ecrites en base restent visibles ici.",
      noProfiles: "Aucun profil enfant pour le moment.",
      ageYears: (age) => `${age} ans`,
      activityEmpty: "Aucune action parent n'a encore ete enregistree.",
      activityDate: "Date",
      activityAction: "Action",
      activityTarget: "Cible",
      activityDetails: "Details",
    },
    forms: {
      parentSpace: "Espace parent",
      serverAction: "Server Action",
      addChildProfile: "Ajouter un profil enfant",
      parentFirstName: "Prenom parent",
      childFirstName: "Prenom",
      age: "Age",
      headline: "Sous-titre",
      profileNamePlaceholder: "Luna",
      headlinePlaceholder: "Routine douce avant l'ecole",
      initialAvatar: "Avatar initial",
      creating: "Creation en cours...",
      createProfile: "Creer le profil",
      householdSettings: "Reglages du foyer",
      householdNameLanguage: "Nom du foyer et langue",
      householdName: "Nom du foyer",
      saveHousehold: "Enregistrer le foyer",
      parentSecurity: "Securite parent",
      parentPinTitle: "Code PIN et delai de confiance",
      pinActive: "PIN actif",
      pinSetup: "PIN a configurer",
      pinActiveDescription:
        "La board iPad demandera ce code avant d'ouvrir les reglages et les modales parent.",
      pinMissingDescription:
        "Definis un premier code parent a 4 chiffres pour proteger le board sur iPad partage.",
      currentPin: "Code actuel",
      noPinActive: "Aucun code parent actif pour ce compte.",
      pinPlaceholder: "1234",
      trustDuration: "Duree du deblocage",
      tenMinutes: "10 minutes",
      fifteenMinutes: "15 minutes",
      thirtyMinutes: "30 minutes",
      sixtyMinutes: "60 minutes",
      newPin: "Nouveau code",
      parentPin: "Code parent",
      confirmation: "Confirmation",
      saveParentPin: "Enregistrer le code parent",
      boardTheme: "Theme board",
      autoByAge: "Auto selon l'age",
      updatingShort: "Maj...",
      taskTemplates: "Templates de taches",
      liveLibrary: "Bibliotheque live",
      newTemplate: "Nouveau template",
      system: "Systeme",
      custom: "Custom",
      editMode: "Edition",
      createMode: "Creation",
      title: "Titre",
      shortLabel: "Label court",
      templateTitlePlaceholder: "Petit dej",
      templateShortLabelPlaceholder: "Fuel",
      duration: "Duree",
      icon: "Icone",
      saveTemplate: "Enregistrer",
      deleteTemplate: "Supprimer",
      templateDeleteProtected:
        "Les templates systeme sont proteges et ne peuvent pas etre supprimes.",
      deleteTemplateConfirm: (name) => `Supprimer ${name} de la bibliotheque ?`,
      routineCrud: "Routine CRUD",
      routineStudio: "Atelier des routines",
      liveDb: "Live DB",
      routineStudioDescription:
        "Le cockpit parent peut maintenant renommer les routines et gerer les missions reelles pour chaque enfant, sans passer par la board.",
      routineToInitialize: "Routine a initialiser",
      addMission: "Ajouter une mission",
      removeMission: "Retirer",
      noRoutineMission: "Aucune mission sur cette routine.",
      saveRoutine: "Enregistrer",
      prototypeImport: "Import prototype",
      prototypeSnapshot: "routineKidsData snapshot",
      analyzingLocalStorage: "Analyse du localStorage en cours...",
      noPrototypeSnapshot: "Aucun snapshot prototype detecte sur ce navigateur.",
      snapshotUnreadable: "Snapshot present but unreadable",
      snapshotNeedsCleanup:
        "La structure locale devra etre nettoyee ou convertie avant l'import.",
      importReplaceNotice:
        "Cet import remplace les profils, routines, missions et completions actuels du foyer.",
      importNow: "Importer dans ce foyer",
      importing: "Import en cours...",
      profiles: "Profils",
      templates: "Templates",
      assignments: "Assignments",
      completions: "Completions",
      language: "Langue",
      localPremium: "Premium local",
      active: "actif",
      inactive: "inactif",
      signOut: "Se deconnecter",
    },
    auth: {
      parentSpace: "Espace parent",
      createHousehold: "Creer le foyer",
      signIn: "Se connecter",
      signUpDescription: "Le premier compte parent initialise le foyer RoutineKids.",
      signInDescription:
        "La board enfant reste ludique. Les reglages sensibles vivent ici.",
      email: "Email",
      password: "Mot de passe",
      parentFirstName: "Prenom parent",
      passwordPlaceholder: "Minimum 8 caracteres",
      wait: "Patiente une seconde...",
      createParentAccount: "Creer le compte parent",
      openParentSettings: "Acceder aux parametres parents",
      alreadyHaveAccount: "Deja un compte ?",
      noAccount: "Pas encore de compte ?",
      createAccount: "Creer un compte",
      connectNow: "Se connecter",
      signupError: "Impossible de creer le compte.",
      signinError: "Connexion impossible.",
    },
    pricing: {
      eyebrow: "Pricing",
      title: "Une grille simple pour les familles",
      description:
        "Commencez gratuitement, puis passez a Family Premium avec un paiement securise mensuel ou annuel.",
      backToBoard: "Retour a la board",
      createParentAccount: "Creer un compte parent",
      openPlans: "Voir les formules",
      limits: "Limites clefs",
      childProfiles: (count) => `${count} profils enfants`,
      smartPresets: (count) => `${count} presets intelligents`,
      auditDays: (count) => `${count} jours de logs`,
      plans: {
        free: {
          name: "Free",
          description:
            "Ideal pour valider la board avec un seul foyer et une petite bibliotheque de taches.",
          features: [
            "1 profil enfant",
            "Board matin et soir",
            "Un theme visuel par defaut",
            "Historique simple",
          ],
        },
        family: {
          name: "Family",
          description:
            "Le plan principal pour les foyers actifs qui veulent toute la planification et les presets.",
          features: [
            "Jusqu'a 6 profils enfants",
            "Routines et templates illimites",
            "Presets par age",
            "Journal parent",
            "Themes par tranche d'age",
          ],
        },
        familyPlus: {
          name: "Family Premium",
          description:
            "Pour les foyers qui veulent davantage de profils, de missions et de personnalisation.",
          features: [
            "Profils et missions sans limite applicative",
            "Packs de themes premium",
            "Historique etendu",
            "Acces prioritaire aux futures automatisations",
            "Fonctions avancees de recompense",
          ],
        },
      },
    },
  },
  en: {
    common: {
      appName: "RoutineKids",
      ok: "OK",
      yes: "Yes",
      no: "No",
      close: "Close",
      back: "Back",
      save: "Save",
      saving: "Saving...",
      apply: "Apply",
      edit: "Edit",
      delete: "Delete",
      create: "Create",
      start: "Start",
      end: "End",
      warning: "Warning",
      later: "Later",
      loading: "Loading...",
    },
    board: {
      landscapeTitle: "Switch to landscape",
      landscapeBody:
        "The kid board is designed to fit full-screen on iPad, with tactile navigation and no extra clutter.",
      successTitle: "Success!",
      saveError: "Something went wrong while saving.",
      settingsLabel: "Parent settings",
      premiumBadge: "Premium badge",
      activatePremium: "Activate premium",
      morning: "Morning",
      evening: "Evening",
      emptyBoard: "No astronauts yet.",
      addAstronaut: "Add Astronaut",
      onboardingEyebrow: "Parent space",
      onboardingTitle: "Create the household to launch the first routine.",
      onboardingBody:
        "Sign in a parent to create the crew, tune the settings, and plan morning and evening missions.",
      onboardingHint:
        "Everything then stays inside the full-screen settings flow, without leaving the kid board.",
      rest: "Rest",
      chooseCrewMember: "Choose a crew member first.",
      connectToDeleteTask: "Sign in to delete this mission.",
      connectToCreateProfile: "Sign in to create a real profile.",
      connectToEditProfile: "Sign in to edit this profile.",
      connectToDeleteProfile: "Sign in to delete this profile.",
      connectToUpdateAvatar: "Sign in to update this avatar.",
      connectToSaveTask: "Sign in to save this mission.",
      connectToAddTask: "Sign in to add a real mission.",
      connectToPlanTasks: "Sign in to plan real missions.",
      connectToActivatePremium: "Sign in to activate premium.",
      deleteProfileConfirm: (name) => `Delete ${name}?`,
      removeTaskConfirm: (taskTitle, periodTitle) =>
        `Remove ${taskTitle} from ${periodTitle}?`,
      deleteTaskForProfile: (name) => `Delete tasks for ${name}`,
      editAvatarForProfile: (name) => `Edit ${name}'s avatar`,
      addTaskForProfile: (name) => `Add a task for ${name}`,
      removeTasksForProfile: (name) => `Delete ${name}`,
      dayCompleteEyebrow: "Day complete",
      dayCompleteTitle: "Amazing!",
      dayCompleteMessage: (name) => `${name}, everything is done for today!`,
    },
    profile: {
      crewTitle: "Crew",
      addMember: "Add a member",
      chooseAvatar: "Choose an avatar",
      updateProfileFromParent: "Edit profile (Parents)",
      validateAvatar: "Confirm",
      profileTitle: "Profile",
      namePlaceholder: "Name",
      ageLabel: "Age",
      chooseAvatarLabel: "Choose an avatar",
      photoButton: "Photo",
      uploadPhoto: "Upload a photo",
      replacePhoto: "Replace photo",
      removePhoto: "Remove photo",
      photoSection: "Profile photo",
      imageTooLarge: "The image is too large. Keep it under 25 MB.",
      imageInvalid: "Select a supported image.",
      cropTitle: "Crop photo",
      zoom: "Zoom",
      cancelCrop: "Cancel",
      confirmCrop: "Use this photo",
      deleteProfile: "Delete profile",
      saveProfile: "Save",
      savingProfile: "Saving...",
      nameRequired: "Name required!",
      defaultName: "Astronaut",
      defaultHeadline: (age) =>
        age <= 4
          ? "Gentle routine before takeoff"
          : age >= 7
            ? "Denser routine, growing autonomy"
            : "Quick mission before school",
    },
    library: {
      title: "Library",
      quickAddTitle: "Quick add",
      taskLibraryTitle: "Task library",
      forProfile: (name) => `For ${name}`,
      description: "Keeps the board density and visual language of the prototype",
      addTask: "Add a task",
      searchPlaceholder: "Search for a mission",
      assignTask: "When is it for?",
      missionLabel: "Mission",
      titleLabel: "Title",
      colorLabel: "Color",
      shortLabel: "Short label",
      icon: "Icon",
      duration: "Duration",
      add: "Add",
      addMission: "Add a mission",
      bothPeriods: "Morning + evening",
      confirm: "Confirm",
      shortLabelPlaceholder: "Short label",
      schedulerTitle: "Planner",
      schedulerDescription:
        "Large board modal with profile rail, tabs and final confirmation.",
      schedulerWho: "Who?",
      schedulerWhat: "1. What?",
      schedulerWhen: "2. When?",
      schedulerDays: "3. Days?",
      allDays: "All",
      weekView: "Week view",
      bulkAdd: "Bulk add",
      weekDays: ["M", "T", "W", "T", "F", "S", "S"],
      weekDayNames: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      addTasksPlaceholder: "Add missions",
      noTemplateAvailable: "No template available",
      selectedProfileMissions: (name, count) =>
        `${name} · ${count} mission(s) selected`,
      selectCrewMember: "Choose a crew member",
      deleteTaskConfirm: (taskTitle) =>
        `Delete ${taskTitle} from the library?`,
      magicAuto: "Auto",
      magicSetupTitle: "Magic Setup?",
      magicSetupDescription:
        "Do you want AI to automatically add age-appropriate tasks? (Premium feature)",
      magicPremiumMessage:
        "Magic automation is reserved for Captains!",
      yesMagic: "Yes, magic!",
      noThanks: "No, I'll manage",
      magicTasksTitle: "Tasks Found",
      magicTasksDescription: "Here are the suggested tasks for this age.",
      magicTasksSelectionHint:
        "Everything is preselected. Remove anything you do not want to add.",
      magicTasksSelectedCount: (selected, total) =>
        `${selected}/${total} mission(s) selected`,
      magicTasksEmptySelection: "Choose at least one mission to add.",
      enableSuggestion: (taskTitle) => `Re-enable ${taskTitle}`,
      disableSuggestion: (taskTitle) => `Remove ${taskTitle}`,
      addAll: "Add All",
      noTasksFoundForAge: "No tasks found for this age.",
      smartTasksAdded: (count) => `${count} tasks smartly added!`,
    },
    feedback: {
      premiumTitle: "Become Captain!",
      premiumMessage: "Unlimited profiles, unlimited tasks, and more.",
      unlimitedProfiles: "Unlimited Profiles",
      unlimitedTasks: "Unlimited Tasks",
      monthly: "Monthly",
      yearly: "Yearly",
      best: "2 months free",
      profileLimitMessage:
        "Sorry cadet, you need to be Captain to expand the crew!",
      taskLimitMessage:
        "No more than 4 missions per period for cadets. Go Captain to unlock everything.",
    },
    journey: {
      title: "Space journey",
      progress: "Progress",
      streak: "Streak",
      momentumDays: "momentum days",
      currentPlanet: "Current planet",
      nextPlanet: "Next stop",
      journeyComplete: "Mission complete!",
      completedMissions: (count) => `${count} missions completed`,
      unlockedMilestones: (count) =>
        `${count} planets already unlocked on the captain route.`,
      startJourney: "Complete today's routine to launch the journey.",
      step: (index) => `Step ${index}`,
      accomplished: "Mission accomplished",
      pending: "Pending",
    },
    gate: {
      title: "Parent Security",
      description:
        "Enter the parent code to open settings and sensitive parent modals.",
      missingPin:
        "Set one up from parent settings before using this action.",
      pinLabel: "Parent code",
      pinPlaceholder: "1234",
      verify: "Validate",
      verifying: "Verifying...",
      openSettings: "Open settings",
      later: "Later",
      genericError: "Unable to verify the parent code right now.",
      questionPrefix: "What is",
      answerPlaceholder: "Answer",
      wrongAnswer: "Error!",
    },
    settings: {
      title: "Settings",
      premiumActive: "Status: Captain",
      premiumActiveSubtitle: "Premium version active",
      manageSubscription: "Manage subscription",
      premiumUpsell: "Go Premium",
      premiumUpsellSubtitle: "Unlock the unlimited tier!",
      management: "Manage",
      parents: "Parents",
      app: "App",
      crew: "Crew",
      library: "Library",
      planner: "Planner",
      manage: "Manage",
      tasks: "Tasks",
      auto: "Auto",
      household: "Household",
      parentCode: "Parent code",
      themes: "Themes",
      import: "Import",
      activity: "Activity",
      schedule: "Schedule",
      scheduleSubtitle: "Morning / Evening",
      sounds: "Sounds",
      soundsOn: "On",
      soundsOff: "Off",
      soundsEnableAria: "Enable sounds",
      soundsDisableAria: "Disable sounds",
      language: "Language",
      about: "About",
      privacy: "Privacy",
      support: "Support",
      chooseLanguage: "Choose a language",
      french: "French",
      english: "English",
      languageDescription: "French / English",
      aboutTagline: "Designed by parents for parents and children.",
      aboutVersion: "RoutineKids v1.1",
      monthlyPrice: "€9/month",
      yearlyPrice: "€90/year",
      parentCodeActive: (minutes) => `Active · ${minutes} min`,
      themePackCount: (count) => `${count} packs`,
      privacyTitle: "Privacy Policy",
      closeDocument: "Close Document",
      privacyUpdated: "Last updated: November 24, 2025",
      privacyIntro:
        "At RoutineKids, the safety and privacy of your children are our top priority. This policy details how we handle data.",
      privacyDataTitle: "Data Collection",
      privacyDataBody:
        "RoutineKids stores household profiles, photos, and routines in a secured database so the experience can stay synchronized across devices.",
      privacyLocalTitle: "Local Storage",
      privacyLocalBody:
        "Temporary preferences may remain on the device. Household data is retained on our servers until a parent deletes it.",
      privacyThirdPartyTitle: "Third-Party Sharing",
      privacyThirdPartyBody:
        "Technical providers strictly required for hosting and payments process only the data necessary to provide their service.",
      privacyTechnicalTitle: "Technical Data (Apple/Google)",
      privacyTechnicalBody:
        "Apple or Google may collect anonymous technical data (crash reports, installation statistics) in accordance with their own privacy policies, which are independent of RoutineKids.",
      privacyContactTitle: "Contact",
      privacyContactBody: "For legal questions:",
      copyright: "© 2025 RoutineKids",
      connectParentSpace: "Sign in to open the parent space.",
      saveError: "Something went wrong while saving.",
      connectToSave: "Sign in to save these settings.",
      connectToActivatePremium: "Sign in to activate premium.",
      versionLabel: "Version",
    },
    workspace: {
      crewEyebrow: "Crew",
      crewTitle: "Profiles and themes",
      crewDescription:
        "The parent workspace stays inside the RoutineKids modal family, with no dedicated admin page.",
      householdEyebrow: "Household",
      householdTitle: "Name and language",
      householdDescription:
        "Parent settings stay on a compact tactile surface, close to the original prototype.",
      securityEyebrow: "Security",
      securityTitle: "Parent code",
      securityDescription:
        "Parent step-up protects sensitive modals on shared iPads.",
      themesEyebrow: "Themes",
      themesTitle: "Themes per child",
      themesDescription:
        "Each profile can keep its own visual world without leaving settings.",
      templatesEyebrow: "Library",
      templatesTitle: "Mission templates",
      templatesDescription:
        "The parent library drives the real Prisma missions used by the board.",
      routinesEyebrow: "Planner",
      routinesTitle: "Routines and missions",
      routinesDescription:
        "Rename routines and manage real missions without leaving the parent overlay.",
      importEyebrow: "Import",
      importTitle: "Prototype snapshot",
      importDescription:
        "The migrator will read routineKidsData directly from this browser.",
      activityEyebrow: "Activity",
      activityTitle: "Parent log",
      activityDescription:
        "All sensitive actions written to the database stay visible here.",
      noProfiles: "No child profiles yet.",
      ageYears: (age) => `${age} years old`,
      activityEmpty: "No parent action has been recorded yet.",
      activityDate: "Date",
      activityAction: "Action",
      activityTarget: "Target",
      activityDetails: "Details",
    },
    forms: {
      parentSpace: "Parent space",
      serverAction: "Server Action",
      addChildProfile: "Add a child profile",
      parentFirstName: "Parent first name",
      childFirstName: "First name",
      age: "Age",
      headline: "Headline",
      profileNamePlaceholder: "Luna",
      headlinePlaceholder: "Gentle routine before school",
      initialAvatar: "Initial avatar",
      creating: "Creating...",
      createProfile: "Create profile",
      householdSettings: "Household settings",
      householdNameLanguage: "Household name and language",
      householdName: "Household name",
      saveHousehold: "Save household",
      parentSecurity: "Parent security",
      parentPinTitle: "PIN code and trust window",
      pinActive: "PIN active",
      pinSetup: "PIN to configure",
      pinActiveDescription:
        "The iPad board will ask for this code before opening settings and parent modals.",
      pinMissingDescription:
        "Set a first 4-digit parent code to protect the board on a shared iPad.",
      currentPin: "Current PIN",
      noPinActive: "No active parent code for this account.",
      pinPlaceholder: "1234",
      trustDuration: "Unlock duration",
      tenMinutes: "10 minutes",
      fifteenMinutes: "15 minutes",
      thirtyMinutes: "30 minutes",
      sixtyMinutes: "60 minutes",
      newPin: "New code",
      parentPin: "Parent code",
      confirmation: "Confirmation",
      saveParentPin: "Save parent code",
      boardTheme: "Board theme",
      autoByAge: "Auto by age",
      updatingShort: "Upd...",
      taskTemplates: "Task templates",
      liveLibrary: "Live library",
      newTemplate: "New template",
      system: "System",
      custom: "Custom",
      editMode: "Edit",
      createMode: "Create",
      title: "Title",
      shortLabel: "Short label",
      templateTitlePlaceholder: "Breakfast",
      templateShortLabelPlaceholder: "Fuel",
      duration: "Duration",
      icon: "Icon",
      saveTemplate: "Save",
      deleteTemplate: "Delete",
      templateDeleteProtected:
        "System templates are protected and cannot be deleted.",
      deleteTemplateConfirm: (name) => `Delete ${name} from the library?`,
      routineCrud: "Routine CRUD",
      routineStudio: "Routine studio",
      liveDb: "Live DB",
      routineStudioDescription:
        "The parent cockpit can now rename routines and manage real missions for each child without going through the board.",
      routineToInitialize: "Routine to initialize",
      addMission: "Add a mission",
      removeMission: "Remove",
      noRoutineMission: "No missions on this routine yet.",
      saveRoutine: "Save",
      prototypeImport: "Prototype import",
      prototypeSnapshot: "routineKidsData snapshot",
      analyzingLocalStorage: "Analyzing localStorage...",
      noPrototypeSnapshot: "No prototype snapshot was detected in this browser.",
      snapshotUnreadable: "Snapshot present but unreadable",
      snapshotNeedsCleanup:
        "The local structure will need cleanup or conversion before import.",
      importReplaceNotice:
        "This import replaces the household's current profiles, routines, missions, and completions.",
      importNow: "Import into this household",
      importing: "Importing...",
      profiles: "Profiles",
      templates: "Templates",
      assignments: "Assignments",
      completions: "Completions",
      language: "Language",
      localPremium: "Local premium",
      active: "active",
      inactive: "inactive",
      signOut: "Sign out",
    },
    auth: {
      parentSpace: "Parent space",
      createHousehold: "Create household",
      signIn: "Sign in",
      signUpDescription:
        "The first parent account initializes the RoutineKids household.",
      signInDescription:
        "The kid board stays playful. Sensitive settings live here.",
      email: "Email",
      password: "Password",
      parentFirstName: "Parent first name",
      passwordPlaceholder: "Minimum 8 characters",
      wait: "One second...",
      createParentAccount: "Create parent account",
      openParentSettings: "Open parent settings",
      alreadyHaveAccount: "Already have an account?",
      noAccount: "No account yet?",
      createAccount: "Create an account",
      connectNow: "Sign in",
      signupError: "Unable to create the account.",
      signinError: "Unable to sign in.",
    },
    pricing: {
      eyebrow: "Pricing",
      title: "A simple plan grid for families",
      description:
        "Start free, then upgrade to Family Premium with secure monthly or yearly billing.",
      backToBoard: "Back to board",
      createParentAccount: "Create a parent account",
      openPlans: "View plans",
      limits: "Key limits",
      childProfiles: (count) => `${count} child profiles`,
      smartPresets: (count) => `${count} smart presets`,
      auditDays: (count) => `${count} days of logs`,
      plans: {
        free: {
          name: "Free",
          description:
            "Ideal to validate the board with one family and a small task library.",
          features: [
            "1 child profile",
            "Morning and evening board",
            "One default visual theme",
            "Basic history",
          ],
        },
        family: {
          name: "Family",
          description:
            "The main plan for active households that want full scheduling and presets.",
          features: [
            "Up to 6 child profiles",
            "Unlimited routines and task templates",
            "Age-based presets",
            "Parent audit log",
            "Theme packs by age band",
          ],
        },
        familyPlus: {
          name: "Family Premium",
          description:
            "For households that need more profiles, missions, and personalization.",
          features: [
            "No application limit on profiles or missions",
            "Premium theme packs",
            "Extended history",
            "Priority access to future automations",
            "Advanced reward features",
          ],
        },
      },
    },
  },
};

export function getMessages(locale: AppLocale) {
  return messages[normalizeAppLocale(locale)];
}
