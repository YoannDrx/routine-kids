# RoutineKids — dossier App Store

Date : 10 août 2026

## Identité proposée

- Nom : `RoutineKids`
- Sous-titre FR : `Les routines en mode mission`
- Subtitle EN : `Family routines made playful`
- Catégorie principale : `Éducation`
- Catégorie secondaire proposée : `Style de vie`
- Bundle ID : `com.yoannandrieux.routinekids`
- Version : `1.0`
- Build de soumission : `3` (le build 1 a révélé le canal alpha de l’icône ; le build 3 ajoute la correction finale du cycle de session iOS)
- SKU proposé : `routinekids-ios-1`
- Identifiant Apple : `6800070456`
- URL support : `https://routine-kids.vercel.app/support`
- URL confidentialité : `https://routine-kids.vercel.app/privacy`
- Conditions : `https://routine-kids.vercel.app/terms`

Le nom et le sous-titre respectent chacun la limite de 30 caractères documentée par
Apple. Ces URL utilisent l'alias Vercel stable. Le domaine `routinekids.app` pourra
les remplacer après validation DNS, sans bloquer la V1.

## Description FR proposée

RoutineKids transforme les routines du matin et du soir en petites missions claires
et motivantes.

Le parent prépare les profils, les horaires et les missions dans un espace protégé.
L'enfant voit une board visuelle simple, valide chaque étape et avance dans son voyage
spatial. Toute la famille retrouve le même état sur ses appareils.

Fonctions principales :

- routines matin et soir personnalisables ;
- missions adaptées à chaque enfant ;
- progression et séries quotidiennes ;
- rappels locaux respectueux de la vie privée ;
- photos facultatives contrôlées par le parent ;
- synchronisation familiale ;
- export et suppression des données depuis les réglages ;
- aucune publicité ni suivi publicitaire.

L'offre gratuite permet un profil enfant et quatre missions par routine. Family Plus
permet jusqu'à six profils et vingt missions par routine.

## Promotional text FR

Des matins plus fluides, des soirs plus sereins : chaque routine devient une mission
familiale claire et ludique.

## Keywords FR

`routine,famille,enfant,matin,soir,organisation,parents,missions,habitudes`

## Subscription group

- Nom interne : `RoutineKids Family Plus`
- Nom affiché FR : `Family Plus`
- Nom affiché EN : `Family Plus`
- Niveau : unique, niveau 1

Produits :

| Référence | Product ID | Durée | Prix cible France |
| --- | --- | --- | ---: |
| Family Plus Monthly | `com.yoannandrieux.routinekids.familyplus.monthly` | 1 mois | 4,99 € |
| Family Plus Yearly | `com.yoannandrieux.routinekids.familyplus.yearly` | 1 an | 39,99 € |

La durée d'un produit ne peut plus être modifiée après soumission. Le premier groupe
d'abonnement doit être soumis avec une nouvelle version de l'app.

## App Privacy — réponses préparatoires

Déclarer « Oui, l'app collecte des données ». La fiche doit couvrir les traitements de
l'app et des prestataires intégrés.

| Type Apple probable | Usage | Lié à l'utilisateur | Tracking |
| --- | --- | --- | --- |
| Adresse e-mail | Authentification, sécurité, support | Oui | Non |
| Nom/pseudonyme | Profil parent/enfant choisi par le parent | Oui | Non |
| Photos | Personnalisation facultative | Oui | Non |
| Identifiants utilisateur | Compte, foyer, abonnement | Oui | Non |
| Achats | Statut d'abonnement | Oui | Non |
| Contenu utilisateur | Routines et missions | Oui | Non |
| Diagnostics minimaux | Fonctionnement et sécurité serveur | Selon configuration | Non |

Ne pas déclarer « données non collectées » : les données familiales sont synchronisées
vers Neon et Vercel. Ne pas déclarer de tracking publicitaire. Revalider la réponse dans
App Store Connect après configuration définitive de chaque SDK.

## Âge et catégorie Kids

- Répondre honnêtement au questionnaire d'âge ; l'app n'a ni chat, ni publicité, ni
  contenu violent, sexuel, médical ou jeux d'argent.
- Le gate parental protège les achats, réglages, liens et données.
- Le choix « Made for Kids » est irréversible une fois l'app approuvée.
- Si Kids est choisi, retenir une seule tranche principale après validation produit :
  6–8 ou 9–11. Le modèle autorise 2–12 ans mais l'App Store demande un segment principal.
- N'utiliser que des comptes et enfants fictifs dans les captures.

## Captures chargées

Les captures utilisent uniquement des profils fictifs et sont chargées dans le Media
Manager. Apple les réutilise pour toutes les langues et tailles sélectionnées :

1. mission du matin ;
2. deux profils fictifs ;
3. routine du soir ;
4. vérification parentale ;
5. réglages parents.

Formats validés : 1284×2778 pour l’iPhone 6,5 pouces et 2064×2752 pour l’iPad
12,9/13 pouces.

## Notes App Review proposées

RoutineKids is a parent-managed family routine app. The child-facing board contains no
ads, chat, external links, or account creation. Parent settings, external links, data
management, and purchases are protected by a parental gate.

Use the supplied demo parent account. Open Settings from the top-right gear, complete
the provided parent verification, then open Family Plus to test StoreKit. The app also
includes Restore Purchases and Manage Subscription. The review environment accepts
Apple Sandbox transactions and App Store Server Notifications V2.

Demo account and exact verification instructions must be inserted in App Store Connect,
not committed to Git.

## Checklist de soumission

- [ ] Apple Developer Program actif et contrats Paid Apps acceptés.
- [x] App créée dans App Store Connect avec Bundle ID exact (`6800070456`).
- [x] Équipe Xcode `G9WFV7HNV6` sélectionnée dans la source XcodeGen.
- [ ] Alias public déployé ; support, confidentialité et conditions accessibles sans login.
- [x] Inscription, réinitialisation du mot de passe et suppression complète du compte disponibles dans l'app native.
- [x] Produits mensuel/annuel créés, localisés FR/EN, tarifés et disponibles dans 175 territoires.
- [x] Capture de review et notes spécifiques ajoutées pour chaque abonnement.
- [ ] URL App Store Server Notifications V2 configurée.
- [x] Racines de confiance Apple, identifiants d'app et identifiants produits configurés côté serveur.
- [ ] Tests achat, restauration, renouvellement, expiration, révocation et remboursement.
- [x] Restauration filtrée par `appAccountToken` et entitlements serveur alignés sur les états actifs.
- [x] Manifeste de confidentialité inspecté dans l'archive Xcode et accepté au téléversement.
- [x] Questionnaire App Privacy publié : 8 types, fonctionnalité de l'app, aucun tracking.
- [x] Questionnaire d'âge complété : classification calculée 4+, remplacement non applicable (pas de classement Kids irréversible).
- [x] Captures fictives iPhone/iPad chargées et dimensions acceptées par Apple.
- [x] Compte de démo fonctionnel, vérifié et données fictives stables.
- [x] Build 1.0 (2) téléversé et traité par Apple, état « Prêt à soumettre » dans TestFlight.
- [x] Build 3 téléversé dans App Store Connect.
- [ ] Build 3 traité par Apple, installé et validé via TestFlight interne.
- [x] Les deux abonnements sont ajoutés au même brouillon de vérification ; la version 1.0 sera jointe après l'upload du build 3.

## Sources Apple officielles

- [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Design safe and age-appropriate experiences](https://developer.apple.com/kids/)
- [App information](https://developer.apple.com/help/app-store-connect/reference/app-information/app-information/)
- [Manage app privacy](https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy/)
- [Offer auto-renewable subscriptions](https://developer.apple.com/help/app-store-connect/manage-subscriptions/offer-auto-renewable-subscriptions/)
- [Upload app previews and screenshots](https://developer.apple.com/help/app-store-connect/manage-app-information/upload-app-previews-and-screenshots/)
