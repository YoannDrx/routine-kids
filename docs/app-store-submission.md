# RoutineKids — dossier App Store

Date : 10 août 2026

## Identité proposée

- Nom : `RoutineKids`
- Sous-titre FR : `Les routines en mode mission`
- Subtitle EN : `Family routines made playful`
- Catégorie principale : `Éducation`
- Catégorie secondaire proposée : `Style de vie`
- Bundle ID : `com.yoannandrieux.routinekids`
- Version : `1.0.0`
- Build initial : `1`
- SKU proposé : `routinekids-ios-1`
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

## Captures proposées

Préparer en français et anglais, iPhone et iPad, aux plus hautes résolutions demandées
par Media Manager :

1. « Chaque matin devient une mission » — board matin avec deux profils fictifs.
2. « Une routine claire, enfant par enfant » — missions personnalisées.
3. « Avancez ensemble dans le voyage spatial » — progression.
4. « Le parent garde le contrôle » — gate puis réglages.
5. « Retrouvez la famille sur tous vos appareils » — synchronisation.
6. « Aucune publicité. Vos données restent privées. » — promesse confidentialité.

Apple permet de fournir seulement les captures de la plus haute résolution d'une même
UI puis de les redimensionner automatiquement. Vérifier les tailles affichées dans le
Media Manager au moment de l'upload.

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
- [ ] App créée dans App Store Connect avec Bundle ID exact.
- [ ] Certificats/profils de signature et équipe Xcode sélectionnés.
- [ ] Alias public déployé ; support, confidentialité et conditions accessibles sans login.
- [x] Inscription, réinitialisation du mot de passe et suppression complète du compte disponibles dans l'app native.
- [ ] Produits mensuel/annuel créés, localisés, tarifés et disponibles.
- [ ] Capture de review et notes ajoutées pour chaque abonnement.
- [ ] URL App Store Server Notifications V2 configurée.
- [ ] Secrets Apple configurés côté serveur.
- [ ] Tests achat, restauration, renouvellement, expiration, révocation et remboursement.
- [x] Restauration filtrée par `appAccountToken` et entitlements serveur alignés sur les états actifs.
- [ ] Manifeste de confidentialité inspecté dans l'archive Xcode.
- [ ] Questionnaire App Privacy publié.
- [ ] Questionnaire d'âge complété et choix Kids explicitement validé.
- [ ] Captures fictives FR/EN iPhone/iPad chargées.
- [ ] Compte de démo fonctionnel et données fictives stables.
- [ ] Build distribué et validé via TestFlight interne.
- [ ] Premier groupe d'abonnement ajouté à la même soumission que la version 1.0.

## Sources Apple officielles

- [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Design safe and age-appropriate experiences](https://developer.apple.com/kids/)
- [App information](https://developer.apple.com/help/app-store-connect/reference/app-information/app-information/)
- [Manage app privacy](https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy/)
- [Offer auto-renewable subscriptions](https://developer.apple.com/help/app-store-connect/manage-subscriptions/offer-auto-renewable-subscriptions/)
- [Upload app previews and screenshots](https://developer.apple.com/help/app-store-connect/manage-app-information/upload-app-previews-and-screenshots/)
