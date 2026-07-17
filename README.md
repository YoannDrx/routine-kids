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
- La route produit `/admin` et les anciens repertoires techniques `admin` ont ete supprimes. Les actions parent vivent dans `src/app/parent-*.ts` et les composants dans `src/components/parent`.
- La homepage signee-out n'affiche plus de famille prototype: elle garde la board visuelle, mais redirige vers les vrais flows `sign-in`, `sign-up` et `pricing`.
- L'import prototype depuis `routineKidsData` est maintenant reel depuis les parametres et ecrit dans Prisma/Neon. La limite actuelle reste le scheduler hebdo du HTML, encore aplati sur le modele V1 `matin / soir`.
- Les sons de board, le CRUD photo enfant, le CRUD photo des missions, la base i18n globale et les principaux retours serveur localises sont maintenant poses, mais la repasse zero-hardcoded complete continue.
- Les nouvelles photos enfant et mission sont stockees dans un Vercel Blob prive. La base ne conserve qu'une reference opaque, et `/api/media/*` controle la session et l'appartenance au foyer avant de diffuser le fichier. Les anciens data URLs restent lisibles pendant la transition.
- Le faux interrupteur Premium a ete remplace par Stripe Checkout mensuel/annuel, avec webhook signe et synchronisation de l'abonnement. Le test local requiert des cles Stripe de test et les deux Price IDs documentes dans `.env.example`.
- Les limites du plan gratuit sont controlees cote serveur sur les deux parcours parent, et les affectations multi-missions/matin-soir sont atomiques.
- Une routine live vide reste vide : aucune mission prototype n'est affichee comme une vraie donnee. Les journees terminees figent leur snapshot de streak afin qu'une future modification de routine ne reecrive pas l'historique.
- Le parcours Stripe test a ete valide avec une vraie Checkout Session de test, webhook signe et idempotent, activation Family Premium, annulation et retour au plan Free. Les fixtures Stripe et la branche Neon de test ont ete supprimees apres verification.
- Le catalogue Stripe de test conserve un seul produit `RoutineKids Family Premium`, avec une offre mensuelle a 9 EUR et annuelle a 90 EUR. Son visuel de marque est genere par l'application sur `/family-premium-card` afin de rester versionne avec l'identite du produit.
- La preview publique `https://routine-kids-yoanndrx-yoanndrxs-projects.vercel.app` utilise une branche Neon isolee, un Blob prive et un webhook Stripe de test. Inscription, profil, lecture authentifiee du media, Checkout, rejeu idempotent, annulation et purge QA ont ete verifies a distance. La branche Neon principale et Stripe live restent intacts.
- L'espace parent propose un export JSON prive `no-store` comprenant les donnees du foyer et les medias Blob disponibles. La suppression renforcee stoppe la facturation, supprime le compte et toutes les donnees en cascade, puis purge les medias prives avec retry.
- Le cycle compte a aussi ete rejoue sur la preview distante : inscription, ouverture de « Mes donnees », declenchement de l'export, confirmation destructive par nom de foyer + `DELETE`, redirection, puis refus de reconnexion avec les anciens identifiants. Le foyer de verification ne contenait pas de media ; le nettoyage Blob reste couvert en code et en tests, pas revendique comme verifie a distance sur ce scenario.

## Stack cible

- `Next.js 16`
- `React 19`
- `TypeScript`
- `Tailwind CSS v4`
- `Prisma`
- `Neon Postgres`
- `Better Auth`
- `Vercel Blob` prive pour les medias familiaux

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
- L'application ne lit jamais `.env.local` elle-meme : Next.js le charge en local et Vercel injecte les variables par environnement. Le fichier n'entre donc pas dans les artefacts deployes.

## Lancer le prototype d'origine

```bash
pnpm prototype:serve
```

## Structure

- `src/app` : routes App Router et layouts
- `src/components/board` : UI enfant et modales de board
- `src/components/settings` : espace parent cible, plein ecran parametres et overlays
- `src/components/auth` : auth parent
- `src/components/parent` : formulaires et outils parent ouverts dans les overlays de `settings`
- `src/lib` : donnees de transition, auth, Prisma, themes
- `prisma/schema.prisma` : modele de donnees de depart
- `docs/roadmap.md` : audit, decisions et backlog
- `index.html` : prototype original conserve comme reference fonctionnelle
- `server.js` : serveur du prototype d'origine
