# État d'implémentation — 17 août 2026

Ce document décrit l'état vérifié de la branche
`codex/routinekids-production-readiness` après la remise en état issue de l'audit.
Il ne constitue pas une autorisation de commercialisation : les opérations externes
listées à la fin restent des conditions bloquantes.

## Correctifs livrés dans la branche

### Paiement et droits premium

- Un droit Family Plus exige désormais un fournisseur `STRIPE` ou `APPLE`, le plan
  `FAMILY_PLUS`, un statut `ACTIVE` ou `TRIALING`, une période non expirée et aucune
  révocation.
- Un abonnement Stripe TEST ne donne jamais de droit dans le runtime Vercel
  Production. Les transactions Apple Sandbox vérifiées restent acceptées pour
  TestFlight et App Review.
- Le webhook Stripe utilise `event.livemode`, et non le préfixe de la clé API, pour
  déterminer l'environnement de facturation.
- La date de l'événement Stripe est persistée et les événements plus anciens sont
  ignorés afin d'éviter une régression d'état lors d'une livraison désordonnée.
- Checkout déclare l'identifiant d'intégration RoutineKids. `automatic_tax` reste
  volontairement désactivé jusqu'à validation des obligations et registrations
  fiscales.
- Checkout impose désormais le nom, la fonte Nunito et les couleurs RoutineKids.
  Le portail client exige une configuration Stripe dédiée via
  `STRIPE_BILLING_PORTAL_CONFIGURATION_ID` : il ne peut plus utiliser par défaut le
  portail d'un autre produit.
- RoutineKids dispose désormais de son propre compte Stripe, de ses deux tarifs live,
  d'une clé restreinte, d'un portail client et d'un webhook live. Les trois secrets
  runtime Stripe sont présents dans Vercel Production.
- Un verrou `COMMERCIAL_SALES_ENABLED=false` bloque les nouveaux Checkout live tant
  que la recette finale n'est pas terminée. Les previews restent testables et les
  abonnés existants conservent l'accès à leur portail.
- Le script `pnpm billing:reconcile-legacy` audite les droits historiques. L'option
  `--apply` écrit d'abord un snapshot privé en mode `0600`, puis ramène à Free les
  abonnements premium sans preuve fournisseur.

La réconciliation du 16 août a examiné sept abonnements et ramené quatre droits
`provider=NONE` à Free. Le snapshot local est conservé hors Git dans
`.routinekids-snapshots/`.

### Sécurité parentale

- Le web et l'API native partagent désormais un rate limiter PostgreSQL atomique :
  cinq essais sur dix minutes par utilisateur, délai `Retry-After` précis et remise à
  zéro après succès.
- Le premier accès d'un nouveau compte fonctionne avec le mot de passe du compte
  avant la création du PIN. Un défaut découvert par le nouveau test authentifié
  faisait auparavant ignorer le cookie de step-up tant qu'aucun PIN n'existait.
- Les nouvelles API parentales exigent une session, un rôle `OWNER` ou `PARENT`, le
  foyer résolu côté serveur et un step-up parental actif.

### API et autonomie iOS

- Des API JSON v1 permettent maintenant de lire et modifier le foyer, créer,
  modifier et supprimer un profil et sa photo privée, gérer les modèles de mission
  et leurs images, renommer/réordonner une routine, affecter/supprimer/réordonner
  une mission et modifier ses jours de planification.
- Un nouveau compte iOS peut créer son premier enfant sans quitter l'application ;
  les routines matin et soir sont générées par le même service métier que le web.
- Le planificateur natif permet de gérer le titre et l'ordre d'une routine, sa
  bibliothèque, les missions, leurs jours et les modèles personnalisés.
- La dernière enveloppe foyer/board est mise en cache avec une version de schéma et
  purgée à la déconnexion. En cas d'échec réseau, l'ancienne board reste affichée,
  l'état hors ligne est explicite et les mutations restent en file.
- `refresh()` restaure l'état précédent après échec au lieu de laisser l'application
  bloquée en chargement.
- Les réglages du foyer, l'édition/suppression des profils, le choix et le recadrage
  des photos ainsi que l'édition des modèles sont disponibles sans quitter l'app.
- Un catalogue `Localizable.xcstrings` FR/EN couvre les textes SwiftUI et les
  messages dynamiques recensés. La recette linguistique humaine reste nécessaire.

### Direction artistique iOS

- Le board natif a retrouvé le fond spatial, le header compact, l'horloge, le choix
  matin/soir, les rangées multi-enfants, les anneaux de progression et les cartes de
  mission compactes.
- L'espace parent principal est maintenant un plein écran spatial adaptatif, avec
  deux colonnes sur iPad paysage, au lieu d'un `Form` noir générique.
- Onboarding et planificateur ont été rethémés dans la même famille visuelle.

Fredoka et Nunito sont maintenant embarquées dans le bundle iOS sous licence OFL et
utilisées par la hiérarchie de marque. La parité stricte n'est pas encore certifiée :
les captures App Store n'ont pas été régénérées et la recette visuelle et accessibilité
sur iPhone/iPad physiques reste à faire.

### Livraison et dépendances

- Next.js, Better Auth, Stripe, Resend, Vercel Blob et `eslint-config-next` ont été
  mis à jour uniquement en versions patch/minor. Prisma 6, TypeScript 5 et ESLint 9
  sont conservés pour la V1.
- GitHub Actions exécute les scénarios Playwright authentifiés sur PostgreSQL.
- Après un push sur `main`, un job CI vérifie que l'objet de déploiement Production
  publié par Vercel dans GitHub correspond exactement au SHA attendu et se termine
  avec le statut `success`.
- Ce contrôle utilise le `GITHUB_TOKEN` éphémère limité au dépôt. Aucun jeton Vercel
  permanent à portée d'équipe n'est nécessaire.

## Validation locale finale

- Prisma : quatre migrations appliquées sur une base PostgreSQL 16 neuve.
- `pnpm verify` : schéma, TypeScript, ESLint, 49/49 tests Vitest et build Next passent.
- Playwright : 16 scénarios passent et 2 doublons métier sont ignorés sur la seconde
  résolution. Les contrôles publics couvrent 1024×768 et 1366×1024 ; les parcours
  authentifiés couvrent onboarding, CRUD, limites Free, planning, séparation de deux
  foyers et webhook Stripe signé/idempotent sur une base PostgreSQL jetable.
- iOS : 3 tests XCTest, 2 tests Swift Testing et 2 XCUITest passent sur iPhone 17 Pro /
  iOS 26.3.1. Les tests UI couvrent le board familial en paysage, le gate parental et
  l'écran de connexion au plus grand Dynamic Type. Une CI macOS dédiée les rejoue.
- `pnpm audit --prod` : aucune vulnérabilité connue.
- L'avis `GHSA-ggr8-5vv4-36mx` découvert le 17 août dans la dépendance transitive
  Prisma `deepmerge-ts` est neutralisé par un override vers la version corrigée 8.0.1 ;
  Prisma generate/validate et la suite complète passent avec cet override.

L'erreur Better Auth `ECONNRESET` observée à l'arrêt de certains scénarios publics ne
fait pas échouer la suite ; elle reste à surveiller dans les logs de production.

## Bloqueurs externes avant merge et commercialisation

1. Valider la stratégie TVA/taxes et les registrations avant toute activation de
   Stripe Tax.
2. Faire un vrai cycle Resend : inscription, réception, vérification, oubli, réception
   et reset.
3. Terminer la recette linguistique et la recette accessibilité/visuelle sur iPhone et
   iPad physiques, puis régénérer les captures App Store.
4. Archiver et téléverser le build iOS 5 qui contient les nouvelles API/UI natives ;
   le build 3 actuellement sélectionné dans App Store Connect est désormais obsolète.
5. Valider StoreKit Sandbox/TestFlight : achat, restore, renouvellement, expiration,
   révocation et remboursement.
6. Accepter Paid Apps, finaliser banque/fiscalité, faire relire les textes légaux et
   soumettre l'app et ses abonnements ensemble.
8. Promouvoir le commit final de `main`, rejouer la matrice de routes publiques,
   effectuer un achat Stripe live contrôlé, configurer uptime/alertes et vérifier le
   rollback.

Tant que ces points ne sont pas clos, RoutineKids reste une release candidate interne
et le domaine Production ne doit pas accepter de clients payants.
