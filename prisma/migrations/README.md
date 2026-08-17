# Prisma migration workflow

The migrations in this directory are the source of truth for every new
RoutineKids database.

- `20260810120000_baseline` represents the schema that existed before Prisma
  migrations were introduced.
- `20260810130000_production_foundation` contains the additive production
  foundation (memberships, provider-neutral billing, idempotency, immutable day
  completions, rewards, devices, and media metadata).
- `20260810140000_apple_account_tokens` adds the private StoreKit account link.
- `20260810150000_existing_household_backfill` links existing subscriptions and
  owner memberships without changing household content.

For a new database, run `pnpm prisma:migrate:deploy`.

The existing Neon database was historically created with `prisma db push`. Do
not run `migrate deploy` against it until the target has been verified as the
correct isolated branch and the baseline has been marked as already applied:

```bash
pnpm prisma migrate resolve --applied 20260810120000_baseline
pnpm prisma:migrate:deploy
```

Before that operation, take a Neon restore point or branch and rehearse the
migration there. Never use `prisma migrate reset` on a shared environment.
