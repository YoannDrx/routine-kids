# RoutineKids release verification

Last updated: July 17, 2026

## Automated baseline

- TypeScript: pass
- ESLint: pass
- Vitest: 17 tests passed
- Next.js production build: 13 routes built

## Hosted preview

- Public QA alias: `https://routine-kids-yoanndrx-yoanndrxs-projects.vercel.app`
- Isolated services: Neon preview branch, private Vercel Blob and Stripe test mode
- Production Neon and Stripe live catalog: unchanged

## Verified remote lifecycles

1. Signup and authenticated settings access.
2. Child profile creation and household-authorized private-media read.
3. Stripe test Checkout, signed webhook, idempotent replay, Family Premium entitlement, cancellation and return to Free.
4. Data-lifecycle smoke test:
   - create a disposable household;
   - open `Mes donnees`;
   - trigger the private `no-store` JSON export;
   - type the exact household name and `DELETE`;
   - delete the account and return to the public board;
   - verify that the former credentials can no longer sign in.

The disposable household used for the destructive smoke test contained no uploaded media. The database/auth cascade is therefore verified remotely; the Blob cleanup implementation is tested and retried in code, but its hosted proof still requires a dedicated fixture with one private file.

## Remaining release gates

- Full modal matrix at 1024x768 and 1366x1024, including file-picker replace/delete flows.
- Final imported/data-driven i18n pass and accessibility audit.
- Weekday-specific scheduler overrides if exact prototype parity remains in V1.
- Live Stripe catalog audit before any production-mode billing activation.
