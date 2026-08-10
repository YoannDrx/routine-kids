# RoutineKids — vérification de release

Dernière mise à jour : 10 août 2026

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

La migration additive de production a été préparée via le workflow de migration Neon :

- projet : `routine-kids` ;
- branche principale : inchangée ;
- migration préparée : `7294d6f7-821b-4eab-b41b-a5ee8ebe7ee3` ;
- branche temporaire : `br-wandering-block-ag8ugpfx` ;
- schéma vérifié : membres, webhooks, mutations client et journées accomplies ;
- données vérifiées : 5 utilisateurs avec token Apple unique, 5 foyers avec membre
  propriétaire, 5 abonnements reliés au foyer.

La promotion n'a pas été exécutée. Elle reste une mutation de la base principale et
nécessite l'accord explicite du propriétaire.

## iOS

Le runtime iOS 26.3.1 est installé. Les XCTest passent sur iPhone 17 Pro, le build
Release passe sur iPad et le build générique appareil passe sans signature. L'URL
d'API et les identifiants StoreKit sont injectés dans l'Info.plist réel. Il reste à
sélectionner l'équipe Apple, archiver avec signature et valider le build via TestFlight.

## Gates externes restants

1. Accord pour promouvoir la migration Neon préparée.
2. Secret Resend et expéditeur vérifié en production.
3. Clé Stripe live restreinte, endpoint webhook et secret de signature.
4. App et produits StoreKit dans App Store Connect.
5. Équipe de signature Apple, archive et TestFlight.
6. Captures, réponses App Privacy, décision Kids et compte de review.
7. Relecture juridique des pages confidentialité et conditions.

Tant que ces gates ne sont pas fermés, la version est une release candidate vérifiée,
pas une application publiée.
