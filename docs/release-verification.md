# RoutineKids — vérification de release

Dernière mise à jour : 11 août 2026

## Résultat automatisé

| Contrôle | Résultat |
| --- | --- |
| Cible Git personnelle | PASS — uniquement `YoannDrx/routine-kids` |
| Prisma validate/generate | PASS — Prisma Client 6.19.2 |
| TypeScript | PASS |
| ESLint | PASS |
| Vitest | PASS — 28 tests, 11 fichiers |
| Next.js production build | PASS — Next.js 16.3.0, 28 pages générées |
| Playwright | PASS — 14 scénarios sur 1024×768 et 1366×1024 |
| Audit dépendances production | PASS — aucune vulnérabilité connue |
| Swift typecheck | PASS — tous les fichiers `ios/RoutineKids/*.swift` |
| XCTest iPhone | PASS — 2 tests, iPhone 17 Pro / iOS 26.3.1 |
| Build Release iPad | PASS — iPad Pro 13 pouces (M5) / iOS 26.3.1 |
| Build Release appareil générique | PASS — SDK iOS 26.2, sans signature |
| Privacy manifest | PASS — `plutil -lint` |
| Diff whitespace | PASS — `git diff --check` |
| GitHub Actions | PASS — verify, GitGuardian et Vercel |

Commandes de référence :

```bash
RESEND_API_KEY=re_verify_placeholder \
EMAIL_FROM='RoutineKids Verify <verify@example.com>' \
pnpm verify

RESEND_API_KEY=re_e2e_placeholder \
EMAIL_FROM='RoutineKids E2E <e2e@example.com>' \
pnpm test:e2e

xcrun swiftc -typecheck ios/RoutineKids/*.swift
plutil -lint ios/RoutineKids/PrivacyInfo.xcprivacy
xcodebuild -project ios/RoutineKids.xcodeproj -scheme RoutineKids \
  -destination 'platform=iOS Simulator,OS=26.3.1,name=iPhone 17 Pro' test
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

Les tests iOS passent (4 tests : XCTest et Swift Testing), ainsi que les builds Release
iPhone/iPad et appareil générique. Le build 3 a été signé, archivé, téléversé, traité
par Apple puis sélectionné pour la version 1.0. L'URL d'API de production et les
identifiants StoreKit sont injectés dans l'Info.plist réel. Le compte titulaire a été
ajouté au groupe TestFlight interne ; il reste à accepter l'invitation et exécuter la
recette sur un appareil.

## Gates externes restants

1. Validation SMS Stripe, clé live restreinte, endpoint webhook et secret de signature.
2. Déploiement Vercel de production, smoke tests publics et notifications serveur Apple V2.
3. Acceptation de l'invitation interne et recette Sandbox/TestFlight sur appareil.
4. Contrat Paid Apps, fiscalité et coordonnées bancaires complétés par le titulaire.
5. Relecture juridique finale des pages confidentialité et conditions.
6. Confirmation explicite du propriétaire avant de cliquer sur l'envoi App Review.

Tant que ces gates ne sont pas fermés, la version est une release candidate vérifiée,
pas une application publiée.
