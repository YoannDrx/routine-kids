# RoutineKids Feature Audit

Last updated: March 13, 2026

## Goal

This document is the operational audit for the current `routine-kids` codebase.

It answers four questions:

1. What is already real and persisted in Neon/Postgres?
2. What is still local-only, static, or placeholder?
3. Which buttons and actions are wired end-to-end today?
4. What must be implemented to reach a true zero-mock product?

This file complements:

- `docs/ui-reference.md` for visual parity with `index.html`
- `docs/roadmap.md` for the implementation program

## Product Constraints Confirmed

The current audit must now be read with these product decisions locked:

- `/admin` is a temporary engineering surface and must disappear from the product.
- Parent tooling must move into the settings full-view and its modal stack.
- The settings full-view should fit one landscape viewport without page scroll.
- The sound row should behave like an inline toggle and drive real audio playback.
- All front-end copy must go through i18n. No hardcoded user-facing strings should remain in React components.
- Child avatar/photo management needs real upload, replace, crop, and delete flows.
- The library, scheduler, profile editor, and cropper behaviors must regain parity with `index.html`.
- No product route should exist at `/admin`. Parent tooling must live in `/settings` and in board-linked parent modals.

## Status Legend

- `LIVE_DB`: reads and writes are persisted in Prisma/Neon
- `LIVE_AUTH`: action is real through Better Auth
- `MIXED`: UI is real, but at least one read or write still falls back to local or prototype data
- `LOCAL_ONLY`: state changes only in React state on the client
- `STATIC`: pure navigation or static content, no persistence involved
- `PLACEHOLDER`: visible affordance exists, but the real behavior is not implemented

## Connection Issue

### Diagnosis

The sign-in and sign-up failure was reproduced against `/api/auth/sign-up/email` and `/api/auth/sign-in/email`.

The root cause was not the auth flow itself. The dev server had been started before the final `.env.local` setup was in place, so Prisma was initialized without `DATABASE_URL`.

Observed runtime error:

- `PrismaClientInitializationError`
- missing `DATABASE_URL`
- thrown during Better Auth Prisma adapter calls

### Current fix

The issue is resolved locally after restarting `pnpm dev`.

To reduce the chance of repeating the same failure, server-side env loading is now explicitly bootstrapped in:

- `src/lib/env.server.ts`
- `src/lib/prisma.ts`
- `src/lib/config.ts`
- `src/lib/auth.ts`

### Operational rule

Whenever `.env.local` changes, restart `pnpm dev`.

## Route Inventory

### `/`

Purpose:

- child-facing board
- primary tactile surface

Current status:

- `MIXED`

What is real:

- live household bootstrap for signed-in parents
- live board read from `Household -> ChildProfile -> Routine -> RoutineTask -> TaskCompletion`
- live task completion persistence through `toggleBoardTaskAction`
- signed-out homepage now routes through real parent entry points:
  - create household CTA -> `/sign-up?callbackUrl=/settings`
  - sign-in CTA and settings gear -> `/sign-in?callbackUrl=/settings`
  - premium badge -> `/pricing`
- the settings workspace is only mounted when a signed-in parent actually opens it

What is still not real:

- real billing and entitlement enforcement
- full zero-hardcoded coverage of every remaining data label, placeholder, and secondary surface

What still falls back:

- visual theme mapping is limited to the hardcoded packs supported by the React board

### `/settings`

Purpose:

- direct route version of the settings full-view

Current status:

- `MIXED`

What is real:

- household name is read from DB when a session exists
- household locale persists
- household sound preference persists
- household morning/evening windows persist
- premium activation writes `Subscription`
- parent workspaces for crew, household, security, themes, templates, routines, import, and activity open inside the settings modal family
- prototype import now reads `routineKidsData` from the current browser and writes profiles, templates, routines, completions, household settings, and audit rows to Prisma
- sound toggle drives real board audio feedback
- visible settings copy is mostly wired through i18n

What is still static:

- privacy and support content

Main gaps against product direction:

- the settings shell still needs a final compact pass to guarantee no viewport overflow on every landscape breakpoint
- visible copy has moved heavily to i18n, but some user-facing strings and data-driven labels still need translation coverage
- the live prototype import currently flattens old weekday-specific scheduler data into the V1 morning/evening routine model
- Stripe Checkout, signed webhooks and server-side entitlement limits are live in test mode; remote preview validation and live-catalog audit remain

### `/sign-in`

Purpose:

- parent sign-in

Current status:

- `LIVE_AUTH`

What is real:

- Better Auth email/password sign-in
- session persistence
- redirect to callback URL

Missing:

- password reset
- email verification UX
- step-up or MFA
- setup guard messaging when DB/auth env is absent

### `/sign-up`

Purpose:

- parent account creation

Current status:

- `LIVE_AUTH`

What is real:

- Better Auth email/password sign-up
- automatic household bootstrap
- automatic admin role
- theme/preset/bootstrap seed creation

Missing:

- confirm password
- email verification UX
- setup guard messaging when DB/auth env is absent

### `/admin`

Status:

- deleted from the runtime

Notes:

- parent tooling was folded back into settings workspaces
- parent code now lives under `src/components/parent` and `src/app/parent-*.ts`; no product route or internal namespace named `admin` remains

### `/pricing`

Purpose:

- public pricing surface

Current status:

- `LIVE_STRIPE_TEST`

Notes:

- Checkout Sessions are created server-side for the monthly and yearly Family Premium prices
- signed, idempotent webhooks synchronize the `Subscription` row
- profile and assignment limits read the synchronized entitlement on the server
- live-mode catalog changes remain blocked until active subscriptions are audited

### `/api/auth/*`

Purpose:

- Better Auth backend

Current status:

- `LIVE_AUTH`

What is real:

- session creation
- session lookup
- sign-up
- sign-in
- sign-out

Missing:

- operational monitoring
- custom auth error normalization
- email verification path
- password reset path

## Feature Inventory

### Auth and Session

Files:

- `src/lib/auth.ts`
- `src/lib/auth-client.ts`
- `src/lib/session.ts`
- `src/app/api/auth/[...all]/route.ts`

Current state:

- `LIVE_AUTH`

What works:

- sign-up and sign-in hit Better Auth for real
- sessions are persisted
- parent-only reads and writes are protected

Main gaps:

- every created user becomes `admin`
- no non-admin roles
- no reset password
- no email verification
- no MFA even though `ParentSecuritySettings` exists
- auth forms now default to `/settings`, but internal action modules still live under temporary `admin` paths that need cleanup

### Household Bootstrap

Files:

- `src/lib/household-bootstrap.ts`
- `src/lib/household.ts`

Current state:

- `LIVE_DB`

What works:

- first parent account gets a household
- default security settings are created
- free subscription row is created
- built-in theme packs are created
- built-in suggestion presets are created
- baseline routines are backfilled for child profiles

Main gaps:

- seed idempotence is application-driven, not fully enforced by DB constraints
- bootstrap is still based on hardcoded seed definitions

### Child Profiles

Admin files:

- `src/components/parent/create-profile-form.tsx`
- `src/app/parent-actions.ts`

Board files:

- `src/components/board/profile-modals.tsx`
- `src/components/board/routine-board.tsx`

Current state:

- settings workspace create/theme assign: `LIVE_DB`
- board create/edit/delete/photo/avatar: `LIVE_DB`

What works:

- the settings workspace can create a child profile in DB
- child profiles are read from DB into settings workspaces and `/`
- theme can be assigned from the settings workspace
- board modals can create, edit, delete, update avatars, upload photos, crop photos, replace photos, and remove photos in DB

Main gaps:

- parent tooling is still split between board overlays and settings workspaces
- no reorder persistence
- no task-photo CRUD yet

### Routines and Tasks

Files:

- `src/lib/board-data.ts`
- `src/app/board-actions.ts`
- `src/components/board/task-modals.tsx`
- `src/components/board/profile-row.tsx`

Current state:

- board completion toggle: `LIVE_DB`
- board routine/task editing: `LIVE_DB`
- settings workspace routine CRUD: `LIVE_DB`

What works:

- the board can render real routines and real routine tasks
- task completion writes into `TaskCompletion`
- library create/edit writes into `TaskTemplate`
- board add-task and scheduler flows write into `RoutineTask`
- delete-mode removal deletes the real `RoutineTask` and reorders siblings
- parent settings workspaces can rename a routine and add/remove real routine tasks

Main gaps:

- no reorder UI yet
- no archive/duplicate flow for routines yet
- built-in library inventory is still seeded from the prototype catalog
- library and scheduler interactions still diverge from the original `index.html` flow mainly on the richer weekly planning model and task media fields

### Theme System

Files:

- `src/components/parent/profile-theme-form.tsx`
- `src/lib/theme/packs.ts`
- `src/lib/board-data.ts`

Current state:

- assignment: `LIVE_DB`
- rendering: `MIXED`

What works:

- theme choice persists on the child profile

Main gaps:

- board rendering only knows the hardcoded supported slugs
- DB custom themes would persist but not fully render as distinct board experiences
- no theme catalog CRUD
- theme selection still uses temporary extracted components that should be folded into `settings`

### Settings Full-View

Files:

- `src/components/settings/settings-experience.tsx`

Current state:

- `MIXED`

What works:

- UI parity with the original HTML is largely preserved
- language persists on `Household`
- sound preference persists on `Household`
- period settings persist on `Household`
- premium modal updates `Subscription`

Main gaps:

- the full-view still needs final breakpoint tuning to guarantee no vertical overflow on every landscape size
- management cards still depend on extracted transitional components
- no real billing provider yet
- no server-side entitlement enforcement yet
- support/privacy are static actions

### Internationalization

Files:

- `index.html`
- `src/components/board/*`
- `src/components/settings/settings-experience.tsx`
- `src/components/auth/auth-form.tsx`
- `src/app/pricing/page.tsx`

Current state:

- `MIXED`

What works:

- the prototype already contains a translation dictionary and translation keys for the main UX copy
- `Household.locale` persists the chosen locale
- the Next app now has a shared i18n provider, locale cookie sync, and locale-aware root layout
- board, settings, auth, pricing, and key parent workspace surfaces now read from the translation catalog

Main gaps:

- some visible strings still remain outside the translation catalog in secondary/transitional components
- many server-side mutation messages and validation errors still need locale-aware responses
- data content seeded from the prototype is not yet localized per-row

### Sound Engine

Files:

- `index.html`
- `src/components/settings/settings-experience.tsx`
- `src/components/board/routine-board.tsx`

Current state:

- settings toggle: `LIVE_DB`
- playback: `LIVE_DB`

What works:

- the household sound preference persists in DB
- the prototype already documents the intended sound vocabulary through `SoundFX`
- the live Next runtime now instantiates audio on demand and plays tap, task-complete, routine-complete, success, and error feedback
- completing all tasks for a child now triggers a gratification sound

Main gaps:

- the richer prototype vocabulary still needs more sounds beyond the first feedback set
- no test harness exists yet for deterministic sound trigger verification

### Media Uploads

Files:

- `index.html`
- `src/components/board/profile-modals.tsx`
- `prisma/schema.prisma`

Current state:

- child avatar emoji: `LIVE_DB`
- child photo upload: `LIVE_DB`
- task photo upload: `LIVE_DB`

What works:

- the schema already has `imageUrl` fields on `RoutineTask` and `TaskTemplate`
- the prototype already defines upload and cropper flows for tasks and child profiles
- `ChildProfile.photoUrl` now exists in Prisma
- board profile flows can upload, crop, replace, and remove a child photo
- board task flows can upload, crop, replace, and remove a task photo
- new images are written to private Vercel Blob storage and represented in Prisma by an opaque `rk-media:` reference
- `/api/media/*` requires an authenticated household owner and streams only a path belonging to that household
- replacing or deleting a profile/task removes its previous private Blob after the database transaction succeeds

Main gaps:

- legacy imported data URLs remain readable and migrate when edited; a bulk migration is deliberately deferred until an isolated production-safe job exists
- household deletion/export must explicitly include private Blob lifecycle handling
- the hosted read/write lifecycle still needs remote preview E2E coverage

### Journey and Streaks

Files:

- `src/components/board/journey-modal.tsx`

Current state:

- `LIVE_DB`

What works:

- streak is derived from `TaskCompletion` and the profile's live morning/evening routines
- the header badge, row badge, and journey modal all read the same DB-backed streak truth
- planet progression and next-stop state are derived from the live streak service
- progress still reflects current task completion state shown on the board

Remaining caveat:

- historical streak reconstruction still depends on current routine/task history because there is not yet a dedicated immutable day-complete snapshot model

### Prototype Import

Files:

- `src/lib/prototype/import.ts`
- `src/components/parent/prototype-import-card.tsx`

Current state:

- parser preview: `LOCAL_ONLY`
- import action: `PLACEHOLDER`

What works:

- the browser can detect and validate a prototype `routineKidsData` snapshot
- the import preview no longer throws a hydration mismatch while checking browser storage

What is missing:

- server action
- authenticated import route
- mapping to DB models
- dedupe/merge rules
- audit log for import
- relocation of the import entry point into the settings workspace

### Billing and Premium

Files:

- `src/lib/data/billing-plans.ts`
- `src/app/pricing/page.tsx`
- `src/components/board/feedback-modals.tsx`
- `src/components/settings/settings-experience.tsx`

Current state:

- pricing copy: `STATIC`
- premium activation buttons: `LIVE_DB`

What works:

- pricing structure is documented in code
- `Subscription` exists in Prisma
- board and settings can now activate a real internal subscription state

What is missing:

- Stripe integration
- entitlement checks
- server-side premium limits
- sync between subscription rows and UI

### Parent Security

Files:

- `src/components/board/parental-gate-modal.tsx`
- `prisma/schema.prisma`

Current state:

- gate modal: `LIVE_DB`
- persisted settings model: active and enforced

What works:

- the temporary workbench can set or rotate a real 4-digit parent PIN
- the board validates the PIN against `ParentSecuritySettings`
- successful validation creates a signed step-up cookie with expiry
- sensitive board mutations reject when step-up is missing or expired

What is missing:

- passkeys or second factor
- full cleanup of temporary extracted security form modules
- security coverage for future billing actions

## Critical Prototype Parity Gaps

These gaps are the main reasons the app still feels incomplete relative to `index.html`:

1. Completed-day streak snapshots are immutable, but long-range journey QA still needs broader fixtures.
2. The live prototype import does not yet preserve weekday-specific scheduler overrides from the old HTML model.
3. Billing is verified locally in Stripe test mode and still needs remote-preview validation.
4. The task library/editor flow is still simplified relative to the original `global-library-modal`, `task-editor-modal`, and `assign-period-modal`, even though `both` assignment and delete-from-library are now back.
5. The app still contains visible hardcoded strings and some non-localized data-driven labels.
6. Task photo/media flows are live with private storage and still need hosted E2E coverage.

## Action Matrix

The list below tracks the distinct user-visible actions in the current app.

### Auth Actions

| Surface | Action | Status | Persistence | Notes |
| --- | --- | --- | --- | --- |
| `/sign-up` | Create parent account | `LIVE_AUTH` | `User`, `Account`, `Session`, bootstrap household records | Real |
| `/sign-in` | Sign in | `LIVE_AUTH` | `Session` | Real |
| parent workspace | Sign out | `LIVE_AUTH` | Better Auth session invalidation | Surfaced from the activity/settings workspace |
| auth pages | Switch between sign-in/sign-up | `STATIC` | none | Navigation only |

### Board Header Actions

| Surface | Action | Status | Persistence | Notes |
| --- | --- | --- | --- | --- |
| `/` header | Streak badge | `LIVE_DB` | `TaskCompletion` | Opens journey and now reads DB-derived streak metrics |
| `/` header | Premium badge | `MIXED` | `Subscription` | Reads real premium state, still opens a non-billing upgrade modal when free |
| `/` header | Morning mode | `LOCAL_ONLY` | none | Client-only board mode |
| `/` header | Evening mode | `LOCAL_ONLY` | none | Client-only board mode |
| `/` header | Settings gear | `LIVE_DB` | `ParentSecuritySettings`, signed step-up cookie | Real PIN gate before opening parent settings |

### Board Row Actions

| Surface | Action | Status | Persistence | Notes |
| --- | --- | --- | --- | --- |
| board row | Tap avatar | `LIVE_DB` | `ParentSecuritySettings`, signed step-up cookie | Real PIN gate before opening quick-edit avatar modal |
| board row | Toggle task complete | `LIVE_DB` | `TaskCompletion` | Real write |
| board row | Add task `+` | `LIVE_DB` | `TaskTemplate`, `RoutineTask`, `AdminAuditLog` | Opens library flow and assigns durably |
| board row | Toggle delete mode `-` | `LOCAL_ONLY` | none | Client-only UI mode |
| board row | Remove task in delete mode | `LIVE_DB` | `RoutineTask`, `AdminAuditLog` | Deletes and reorders live tasks |
| board footer | Add Astronaut | `LIVE_DB` | `ChildProfile`, `Routine`, `RoutineTask`, `AdminAuditLog` | Board overlay now uses Server Actions |

### Board Modal Actions

| Surface | Action | Status | Persistence | Notes |
| --- | --- | --- | --- | --- |
| parental gate | Validate PIN | `LIVE_DB` | `ParentSecuritySettings`, signed step-up cookie | Wrong PIN rejected, successful step-up unlocks parent overlays for configured duration |
| journey modal | Change selected child | `LOCAL_ONLY` | none | View-only |
| premium modal | Select plan | `LIVE_DB` | `Subscription`, `AdminAuditLog` | Internal premium activation only, not Stripe billing |
| alert modal | OK | `LOCAL_ONLY` | none | UI-only |
| success modal | OK | `LOCAL_ONLY` | none | UI-only |
| confirm modal | Confirm | `LOCAL_ONLY` | none | Executes local callback |

### Profile Modal Actions

| Surface | Action | Status | Persistence | Notes |
| --- | --- | --- | --- | --- |
| profile manager | Edit profile | `LIVE_DB` | `ChildProfile`, `AdminAuditLog` | Real update |
| profile manager | Delete profile | `LIVE_DB` | `ChildProfile`, `Routine`, `RoutineTask`, `AdminAuditLog` | Cascades through owned data |
| profile manager | Add member | `LIVE_DB` | `ChildProfile`, `Routine`, `RoutineTask`, `AdminAuditLog` | Real create |
| quick avatar | Choose avatar | `LOCAL_ONLY` | none | Local selection before durable save |
| quick avatar | Validate avatar | `LIVE_DB` | `ChildProfile`, `AdminAuditLog` | Real avatar update |
| quick avatar | Upload / replace / remove photo | `LIVE_DB` | `ChildProfile`, `AdminAuditLog` | Real photo CRUD with cropper |
| quick avatar | Advanced edit | `LIVE_DB` | `ParentSecuritySettings`, signed step-up cookie | Requires active parent step-up before opening full editor |
| full profile editor | Photo | `LIVE_DB` | `ChildProfile`, `AdminAuditLog` | Upload, crop, replace, and delete are live |
| full profile editor | Age minus/plus | `LOCAL_ONLY` | none | Local editor state |
| full profile editor | Save | `LIVE_DB` | `ChildProfile`, `Routine`, `AdminAuditLog` | Create and edit are real |
| full profile editor | Delete | `LIVE_DB` | `ChildProfile`, `Routine`, `RoutineTask`, `AdminAuditLog` | Real delete when editing an existing child |

### Task Library and Scheduler Actions

| Surface | Action | Status | Persistence | Notes |
| --- | --- | --- | --- | --- |
| library modal | Search tasks | `LOCAL_ONLY` | none | Client-side filter |
| library modal | Create task | `LIVE_DB` | `TaskTemplate`, `AdminAuditLog` | Real template create |
| library modal | Edit task | `LIVE_DB` | `TaskTemplate`, `AdminAuditLog` | Real template update |
| library modal | Delete custom task | `LIVE_DB` | `TaskTemplate`, `AdminAuditLog` | Built-in templates stay protected |
| library modal | Assign task to morning/evening/both | `LIVE_DB` | `RoutineTask`, `AdminAuditLog` | Real assignment, including dual-period add |
| assign-period modal | Confirm period | `LIVE_DB` | `RoutineTask`, `AdminAuditLog` | Period choice writes to the matching routine(s) |
| scheduler modal | Select profile | `LOCAL_ONLY` | none | Client-only |
| scheduler modal | Select week/bulk tab | `LOCAL_ONLY` | none | Client-only |
| scheduler modal | Select period | `LOCAL_ONLY` | none | Client-only selection, now including `both` |
| scheduler modal | Select tasks | `LOCAL_ONLY` | none | Client-only |
| scheduler modal | Confirm scheduler apply | `LIVE_DB` | `RoutineTask`, `AdminAuditLog` | Bulk assignment now writes durable tasks |

### Settings Actions

| Surface | Action | Status | Persistence | Notes |
| --- | --- | --- | --- | --- |
| settings | Back | `STATIC` | none | Navigation/close only |
| settings | Premium CTA | `LIVE_DB` | `Subscription`, `AdminAuditLog` | Opens modal and writes internal premium activation |
| settings | Equipage | `LIVE_DB` | `ChildProfile`, `ChildProfile.defaultThemeId`, `AdminAuditLog` | Standalone settings now opens a real parent crew modal |
| settings | Biblio | `LIVE_DB` | `TaskTemplate`, `AdminAuditLog` | Standalone settings now opens the live template workbench |
| settings | Planif. | `LIVE_DB` | `Routine`, `RoutineTask`, `AdminAuditLog` | Standalone settings now opens the live routine workbench |
| settings | Sounds | `LIVE_DB` | `Household`, `AdminAuditLog` | Persists on household settings and drives live board audio |
| settings | Language | `LIVE_DB` | `Household`, `AdminAuditLog` | Persists on household settings |
| settings | Horaires | `LIVE_DB` | `Household`, `AdminAuditLog` | Reads/writes household periods |
| settings | About | `STATIC` | none | Informational |
| about modal | Privacy | `STATIC` | none | Informational |
| about modal | Support email | `STATIC` | none | `mailto:` only |
| periods modal | Save | `LIVE_DB` | `Household`, `AdminAuditLog` | Real save |
| language modal | Choose FR/EN | `LIVE_DB` | `Household`, `AdminAuditLog` | Real save |

### Settings Workspace CRUD

| Surface | Action | Status | Persistence | Notes |
| --- | --- | --- | --- | --- |
| settings workspace | Save household settings | `LIVE_DB` | `Household`, `AdminAuditLog` | Real |
| settings workspace | Save parent PIN | `LIVE_DB` | `ParentSecuritySettings`, signed step-up cookie, `AdminAuditLog` | Real |
| settings workspace | Create child profile | `LIVE_DB` | `ChildProfile`, `Household`, `ActivityLog`, `AdminAuditLog` | Real |
| settings workspace | Assign child theme | `LIVE_DB` | `ChildProfile`, `AdminAuditLog` | Real |
| settings workspace | Create or update task template | `LIVE_DB` | `TaskTemplate`, `AdminAuditLog` | Real |
| settings workspace | Delete custom task template | `LIVE_DB` | `TaskTemplate`, `AdminAuditLog` | Built-in templates are protected |
| settings workspace | Rename routine | `LIVE_DB` | `Routine`, `AdminAuditLog` | Real |
| settings workspace | Add task to routine | `LIVE_DB` | `RoutineTask`, `AdminAuditLog` | Real |
| settings workspace | Remove task from routine | `LIVE_DB` | `RoutineTask`, `AdminAuditLog` | Real |
| settings workspace | Import prototype | `LIVE_DB` | `ChildProfile`, `Routine`, `RoutineTask`, `TaskTemplate`, `TaskCompletion`, `Household`, `ActivityLog`, `AdminAuditLog` | Live import from `routineKidsData`; weekday-specific overrides are currently flattened into morning/evening routines |

## Schema Coverage

### Prisma models already used in runtime

- `User`
- `Session`
- `Account`
- `Household`
- `ParentSecuritySettings`
- `Subscription`
- `ChildProfile`
- `Routine`
- `RoutineTask`
- `TaskCompletion`
- `ThemePack`
- `RoutineSuggestionPreset`
- `ActivityLog`
- `AdminAuditLog`

### Prisma models present but underused or unused by the app

- `Verification`

### Tables that need stronger product exposure

- `ParentSecuritySettings`
- `Subscription`
- `RoutineSuggestionPreset`
- `ActivityLog`

## Zero-Mock Gaps

The project is not yet release-complete because of six structural gaps:

1. Stripe and private media need remote-preview E2E validation.
2. Some user-facing copy and imported data-driven labels are not localized yet.
3. Transitional internal `admin` file buckets still need to be folded into `settings`.
4. Modal, accessibility and exact iPad viewport coverage remain incomplete.
5. Household export/deletion must include private Blob lifecycle handling.
6. Prototype import still compresses old weekday-specific scheduling into the current V1 routine model until weekly overrides exist.

## Zero-Mock Implementation Plan

### Phase A: Finalize settings-native parent workspace

- Keep folding temporary extracted `admin` components and action modules back into `settings`.
- Keep the settings full-view within one landscape viewport.
- Remove remaining route-era references and outdated documentation.

### Phase B: Finish child profile CRUD — complete

- DB-backed profile CRUD, photo upload/crop/replace/delete and private storage are live.

### Phase C: Finish routine and task CRUD

- Fold the existing workbench capabilities into settings overlays.
- Add DB-backed reorder for `RoutineTask`.
- Keep task color and private task-photo support covered by integration/E2E tests.
- Remove remaining prototype task fallbacks when a live routine is empty.

### Phase D: Finish scheduler

- Define whether scheduler writes templates, routine assignments, or weekly overrides.
- Add audit log entries and explicit readback for scheduler actions.
- Add weekly override storage if V1 needs day-specific planning.

### Phase E: Harden settings and parent access

- Extend the live parent PIN flow to future billing and destructive parent flows where needed.
- Add real inline sound toggle behavior.
- Decide whether sounds stay household-wide or become per-device.
- Add full app i18n for settings, board, auth, pricing, and modal copy.
- Add server-side entitlement checks on top of the live `Subscription` state.

### Phase F: Make journey and streaks real

- Harden the current DB-backed streak service with immutable day-complete snapshots.
- Preserve journey accuracy when routines/tasks evolve over time.
- Keep the header badge, row badge, and journey modal on the same source of truth.

### Phase G: Import and migration

- Harden the live prototype import and document its current data-loss boundaries.
- Preserve weekday-specific prototype scheduler data once weekly overrides land.
- Keep mapping prototype profiles to `ChildProfile`.
- Keep mapping prototype library to `TaskTemplate`.
- Keep mapping prototype assignments to `Routine` and `RoutineTask`.
- Keep mapping prototype completion history into `TaskCompletion` where feasible.
- Keep writing import audit logs.

### Phase H: Billing and entitlements — test-mode complete

- Stripe Checkout and signed idempotent webhooks synchronize `Subscription`.
- Server-side feature gates are active and local premium toggles are removed.
- Remote preview and live-catalog audits remain release gates.

### Phase I: Hardening

- Wrap multi-write parent actions in Prisma transactions.
- Add DB constraints for built-in seed idempotence.
- Add integration tests for auth, settings CRUD, import, and board completion.
- Add Playwright coverage for the iOS-like modal flows.

## Immediate Engineering Priorities

1. Create an isolated Vercel preview with Neon, Stripe test mode and private Blob.
2. Add exact 1024x768 and 1366x1024 modal E2E coverage.
3. Finish i18n for imported/data-driven labels and complete the accessibility pass.
4. Add household export and deletion, including private Blob cleanup.
5. Preserve weekday-specific prototype scheduling data with weekly overrides.
6. Fold the remaining transitional `admin` implementation buckets into settings.
