# routine-kids

RoutineKids est en cours de migration depuis le prototype HTML monolithique vers une vraie application `Next.js` iPad-first.

## Etat du repo

- Le prototype original reste disponible dans [`index.html`](/Users/yoannandrieux/Projets/routine-kids/index.html) et peut encore etre servi localement.
- La nouvelle application vit dans `src/`, `prisma/` et `docs/`.
- La feuille de route complete est dans [`docs/roadmap.md`](/Users/yoannandrieux/Projets/routine-kids/docs/roadmap.md).
- L'audit fonctionnel detaille est dans [`docs/feature-audit.md`](/Users/yoannandrieux/Projets/routine-kids/docs/feature-audit.md).
- La reference UI/UX a conserver est dans [`docs/ui-reference.md`](/Users/yoannandrieux/Projets/routine-kids/docs/ui-reference.md).
- Le plan d'execution zero mock est dans [`docs/zero-mock-plan.md`](/Users/yoannandrieux/Projets/routine-kids/docs/zero-mock-plan.md).
- La direction produit actuelle ne garde pas de page admin dediee: toute la profondeur parent doit revenir dans l'overlay de parametres.
- La route produit `/admin` a ete supprimee. Les composants de `src/components/admin` restent seulement comme extraction technique transitoire, le temps de les replier proprement dans `settings`.
- La homepage signee-out n'affiche plus de famille prototype: elle garde la board visuelle, mais redirige vers les vrais flows `sign-in`, `sign-up` et `pricing`.
- L'import prototype depuis `routineKidsData` est maintenant reel depuis les parametres et ecrit dans Prisma/Neon. La limite actuelle reste le scheduler hebdo du HTML, encore aplati sur le modele V1 `matin / soir`.
- Les sons de board, le CRUD photo enfant, la base i18n globale et les principaux retours serveur localises sont maintenant poses, mais la repasse zero-hardcoded complete continue.

## Stack cible

- `Next.js 16`
- `React 19`
- `TypeScript`
- `Tailwind CSS v4`
- `Prisma`
- `Neon Postgres`
- `Better Auth`

## Lancer la nouvelle app

1. Installer les dependances:

```bash
pnpm install
```

2. Configurer l'environnement:

```bash
cp .env.example .env.local
```

3. Generer Prisma:

```bash
pnpm prisma:generate
```

4. Lancer Next.js:

```bash
pnpm dev
```

L'app sera disponible sur `http://localhost:3000`.

Important:

- Si tu modifies `.env.local`, redemarre `pnpm dev`.
- Sinon Prisma / Better Auth peuvent rester charges avec un ancien environnement.

## Lancer le prototype d'origine

```bash
pnpm prototype:serve
```

## Structure

- `src/app` : routes App Router et layouts
- `src/components/board` : UI enfant et modales de board
- `src/components/settings` : espace parent cible, plein ecran parametres et overlays
- `src/components/auth` : auth parent
- `src/components/admin` : couche transitoire a replier dans `settings`, puis supprimer
- `src/lib` : donnees de transition, auth, Prisma, themes
- `prisma/schema.prisma` : modele de donnees de depart
- `docs/roadmap.md` : audit, decisions et backlog
- `index.html` : prototype original conserve comme reference fonctionnelle
- `server.js` : serveur du prototype d'origine
