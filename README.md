# RoutineKids

RoutineKids est une application familiale iPad-first qui transforme les routines du
matin et du soir en missions visuelles. Le parent configure le foyer dans un espace
protégé ; l'enfant utilise la board tactile, suit sa progression et synchronise ses
validations entre appareils.

## État actuel

Le socle web est une application Next.js/Prisma réelle : Better Auth, Neon, médias
privés, routines, historique, import du prototype, export/suppression et Stripe. Un
client natif SwiftUI avec synchronisation hors ligne, rappels locaux et StoreKit 2 vit
dans `ios/`.

La release candidate web et iOS est compilée et testée. La migration Neon est appliquée,
Resend est configuré, le build iOS 3 est traité par Apple et le brouillon App Review
réunit la version et les abonnements. La publication attend encore le runtime Stripe,
le déploiement public final, la recette TestFlight/Sandbox et les accords Paid Apps.
Voir :

- [`docs/implementation-status-2026-08-10.md`](docs/implementation-status-2026-08-10.md)
- [`docs/production-runbook.md`](docs/production-runbook.md)
- [`docs/app-store-submission.md`](docs/app-store-submission.md)
- [`docs/release-verification.md`](docs/release-verification.md)
- [`docs/store-readiness-checklist.md`](docs/store-readiness-checklist.md)
- [`docs/ui-reference.md`](docs/ui-reference.md)

## Stack

- Next.js 16, React 19, TypeScript et Tailwind CSS 4
- Prisma 6 et Neon Postgres
- Better Auth et Resend
- Stripe Billing et StoreKit 2 / App Store Server API
- Vercel Blob privé
- SwiftUI iOS 17+
- Vitest, Playwright et GitHub Actions

## Développement web

```bash
pnpm install
cp .env.example .env.local
pnpm prisma:generate
pnpm dev
```

L'application est disponible sur `http://localhost:3000`. Redémarrer le serveur après
tout changement de `.env.local`.

## Vérification

```bash
pnpm verify
pnpm test:e2e
```

`pnpm verify` contrôle aussi que le dépôt Git pointe exclusivement vers le GitHub
personnel `YoannDrx/routine-kids`.

## iOS

Le projet Xcode généré est dans `ios/RoutineKids.xcodeproj`. Pour le régénérer :

```bash
cd ios
xcodegen generate
```

Les tests et builds Release iPhone/iPad sont validés. Le build 3 a été signé, archivé,
téléversé et traité par App Store Connect ; la recette sur appareil via TestFlight est
décrite dans `docs/app-store-submission.md`.

## Structure

- `src/app` : pages, Server Actions et API
- `src/components` : board, auth, espace parent et PWA
- `src/lib` : règles métier, sécurité, facturation et accès données
- `prisma` : schéma et migrations additives
- `ios` : application SwiftUI native
- `e2e` : scénarios Playwright iPad
- `docs` : audit, release, App Store et exploitation
- `index.html` : prototype historique conservé comme référence visuelle

## Sécurité des données familiales

Les pages authentifiées ne sont pas mises en cache par le service worker. Les médias
sont privés et diffusés uniquement après contrôle du foyer. Les actions parentales
sensibles exigent une revalidation. Aucun secret ni fichier `.env*` ne doit être ajouté
au dépôt.
