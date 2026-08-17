# RoutineKids — vérification de release

Dernière mise à jour : 17 août 2026

## Résultat automatisé

| Contrôle | Résultat |
| --- | --- |
| Cible Git personnelle | PASS — uniquement `YoannDrx/routine-kids` |
| Prisma validate/generate | PASS — Prisma Client 6.19.2 |
| TypeScript | PASS |
| ESLint | PASS |
| Vitest | PASS — 49 tests, 15 fichiers |
| Next.js production build | PASS — Next.js 16.3.1, 32 routes compilées |
| Playwright | PASS — 16 scénarios, 2 doublons métier ignorés ; deux résolutions publiques |
| Audit dépendances production | PASS — aucune vulnérabilité connue |
| Swift typecheck | PASS — tous les fichiers `ios/RoutineKids/*.swift` |
| Tests iPhone | PASS — 3 XCTest + 2 Swift Testing + 2 XCUITest, iPhone 17 Pro / iOS 26.3.1 |
| Build Release appareil | PASS — cible iOS générique, sans signature, build applicatif 5 |
| Privacy manifest | PASS — `plutil -lint` |
| Diff whitespace | PASS — `git diff --check` |
| GitHub Actions | PASS — verify, GitGuardian et Vercel |

Commandes de référence :

```bash
RESEND_API_KEY=re_verify_placeholder \
EMAIL_FROM='RoutineKids Verify <verify@example.com>' \
STRIPE_BILLING_PORTAL_CONFIGURATION_ID=bpc_verify_placeholder \
pnpm verify

DATABASE_URL='postgresql://…/routinekids' \
DIRECT_URL='postgresql://…/routinekids' \
E2E_AUTHENTICATED=true pnpm test:e2e

plutil -lint ios/RoutineKids/PrivacyInfo.xcprivacy
xcodebuild -project ios/RoutineKids.xcodeproj -scheme RoutineKids \
  -destination 'platform=iOS Simulator,OS=18.5,name=iPhone 16 Pro' test
pnpm audit --prod
```

Les clés utilisées ci-dessus sont des placeholders de compilation et n'envoient aucun
e-mail.

## Base Neon

La migration additive de production a été préparée, validée puis appliquée via le
workflow de migration Neon :

- projet : `routine-kids` ;
- branche principale : `main`, migration appliquée ;
- migration : `7294d6f7-821b-4eab-b41b-a5ee8ebe7ee3` ;
- branche temporaire : `br-wandering-block-ag8ugpfx` ;
- schéma vérifié : membres, webhooks, mutations client et journées accomplies ;
- données vérifiées : 5 utilisateurs avec token Apple unique, 5 foyers avec membre
  propriétaire, 5 abonnements reliés au foyer.

Les quatre migrations Prisma sont enregistrées comme appliquées. Le contrôle
post-migration confirme 5 utilisateurs, 5 foyers, 5 propriétaires et aucun abonnement
ou token orphelin.

## iOS

Les tests iOS passent (3 XCTest, 2 Swift Testing et 2 XCUITest) et le build 5 compile
sur simulateur. Fredoka et Nunito sont embarquées et déclarées dans le bundle.
Le build 3 a été signé, archivé, téléversé, traité par Apple puis sélectionné pour la
version 1.0, mais il ne contient pas les derniers parcours natifs et ne doit plus être
soumis. Il faut archiver/téléverser le build 5, le sélectionner et exécuter la recette
TestFlight sur appareils physiques.

## Gates externes restants

1. Merge contrôlé, déploiement Vercel de production vérifié via GitHub, smoke tests
   publics et test de livraison des notifications Apple V2.
2. Recette Stripe live contrôlée sur le compte RoutineKids désormais configuré.
3. Téléversement du build 5 et recette Sandbox/TestFlight sur iPhone et iPad.
4. Contrat Paid Apps, fiscalité et coordonnées bancaires complétés par le titulaire.
5. Relecture juridique finale des pages confidentialité et conditions.
6. Confirmation explicite du propriétaire avant de cliquer sur l'envoi App Review.

Tant que ces gates ne sont pas fermés, la version est une release candidate vérifiée,
pas une application publiée.
