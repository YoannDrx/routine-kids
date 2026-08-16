# État d'implémentation — 16 août 2026

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

- Des API JSON v1 permettent maintenant de créer, modifier et supprimer un profil,
  lire/créer/supprimer les modèles de mission, renommer une routine et
  affecter/supprimer une mission.
- Un nouveau compte iOS peut créer son premier enfant sans quitter l'application ;
  les routines matin et soir sont générées par le même service métier que le web.
- Le planificateur natif permet de gérer le titre d'une routine, sa bibliothèque et
  ses missions principales.
- La dernière enveloppe foyer/board est mise en cache avec une version de schéma et
  purgée à la déconnexion. En cas d'échec réseau, l'ancienne board reste affichée,
  l'état hors ligne est explicite et les mutations restent en file.
- `refresh()` restaure l'état précédent après échec au lieu de laisser l'application
  bloquée en chargement.
- Un catalogue `Localizable.xcstrings` FR/EN est présent. Les textes statiques
  SwiftUI couverts utilisent le catalogue ; les messages techniques dynamiques
  doivent encore être passés en revue avant la soumission finale.

### Direction artistique iOS

- Le board natif a retrouvé le fond spatial, le header compact, l'horloge, le choix
  matin/soir, les rangées multi-enfants, les anneaux de progression et les cartes de
  mission compactes.
- L'espace parent principal est maintenant un plein écran spatial adaptatif, avec
  deux colonnes sur iPad paysage, au lieu d'un `Form` noir générique.
- Onboarding et planificateur ont été rethémés dans la même famille visuelle.

La parité stricte n'est pas encore certifiée : les polices Fredoka/Nunito ne sont pas
embarquées, les parcours photo/crop n'existent pas encore en natif, les captures App
Store n'ont pas été régénérées et la recette visuelle sur iPhone/iPad physique reste à
faire.

### Livraison et dépendances

- Next.js, Better Auth, Stripe, Resend, Vercel Blob et `eslint-config-next` ont été
  mis à jour uniquement en versions patch/minor. Prisma 6, TypeScript 5 et ESLint 9
  sont conservés pour la V1.
- GitHub Actions exécute les scénarios Playwright authentifiés sur PostgreSQL.
- Les variables GitHub `VERCEL_PROJECT_ID` et `VERCEL_TEAM_ID` sont configurées.
- Après un push sur `main`, un job CI vérifie que le dernier déploiement Vercel
  Production `READY` correspond exactement au SHA attendu.

## Validation locale finale

- Prisma : quatre migrations appliquées sur une base PostgreSQL 16 neuve.
- `pnpm verify` : schéma, TypeScript, ESLint, 39/39 tests Vitest et build Next passent.
- Playwright : 16/16 passent, dont onboarding authentifié et isolement de deux foyers,
  à 1024×768 et 1366×1024.
- iOS : build simulateur, 3 tests XCTest et 2 tests Swift Testing passent sur iPhone
  16 Pro / iOS 18.5.
- `pnpm audit --prod` : aucune vulnérabilité connue.

L'erreur Better Auth `ECONNRESET` observée à l'arrêt de certains scénarios publics ne
fait pas échouer la suite ; elle reste à surveiller dans les logs de production.

## Bloqueurs externes avant merge et commercialisation

1. Ajouter un secret GitHub Actions `VERCEL_TOKEN` dédié et limité au projet. Sans ce
   secret, le nouveau contrôle post-déploiement de `main` échouera.
2. Créer une clé Stripe live restreinte et le webhook live, puis ajouter
   `STRIPE_SECRET_KEY` et `STRIPE_WEBHOOK_SECRET` à Vercel Production. Au 16 août, ces
   deux variables sont absentes.
3. Valider la stratégie TVA/taxes et les registrations avant toute activation de
   Stripe Tax.
4. Faire un vrai cycle Resend : inscription, réception, vérification, oubli, réception
   et reset.
5. Finir les API/UI natives restantes : édition/suppression de profil depuis l'UI,
   photo/crop, réglages du foyer, jours de planning et réordonnancement complet.
6. Terminer la localisation native, les polices et la recette accessibilité/visuelle
   sur iPhone et iPad physiques, puis régénérer les captures App Store.
7. Valider StoreKit Sandbox/TestFlight : achat, restore, renouvellement, expiration,
   révocation et remboursement.
8. Accepter Paid Apps, finaliser banque/fiscalité, faire relire les textes légaux et
   soumettre l'app et ses abonnements ensemble.
9. Promouvoir le commit final de `main`, rejouer la matrice de routes publiques,
   effectuer un achat Stripe live contrôlé, configurer uptime/alertes et vérifier le
   rollback.

Tant que ces points ne sont pas clos, RoutineKids reste une release candidate interne
et le domaine Production ne doit pas accepter de clients payants.

