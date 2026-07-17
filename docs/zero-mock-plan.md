# RoutineKids Zero-Mock Execution Plan

Last updated: March 13, 2026

## Objective

Turn `routine-kids` into a fully functional Next.js application with:

- no fake runtime data
- no local-only business actions on production surfaces
- no placeholder actions visible as if they were complete
- no product dependency on `/admin`
- no hardcoded user-facing front-end copy outside the translation layer
- the original iOS-like board UX preserved

This plan is the execution layer on top of:

- [feature audit](/Users/yoannandrieux/Projets/routine-kids/docs/feature-audit.md)
- [roadmap](/Users/yoannandrieux/Projets/routine-kids/docs/roadmap.md)
- [UI reference](/Users/yoannandrieux/Projets/routine-kids/docs/ui-reference.md)

## Delivery Principles

- Keep the original `index.html` interaction model.
- Replace data and mutations, not the visual language.
- Prefer server truth plus optimistic UI over local-only business state.
- Remove misleading runtime fallbacks before adding more product scope.
- Every new write path must end with Prisma persistence, revalidation, and auditability where relevant.
- Parent tooling must live in the settings workspace, not in a separate page.
- The settings full-view should fit a landscape iPad viewport without page scroll.
- Sound, photo, library, and cropper behavior should be rebuilt to match the prototype before new product ideas are introduced.

## Phase 1: Finalize Settings-Native Parent Workspace

### Goal

Finish the parent workspace move so the product has no route-based admin surface and no remaining route-era dependencies.

### Tasks

- Keep household settings, parent PIN, theme assignment, task-template CRUD, routine CRUD, prototype import entry, and logs inside the settings workspace.
- Remove remaining route-era references and stale docs mentioning `/admin` as a live product surface.
- Revalidate `/` and `/settings` as the only parent-facing product surfaces.
- Keep the completed parent modules under `src/components/parent/*` and `src/app/parent-*.ts`; no `admin` route or namespace remains.

### Acceptance Criteria

- No parent journey in the product requires visiting `/admin`.
- Settings cards open their real CRUD flows both from `/` and from `/settings`.
- Auth redirects land on `/settings` or `/` overlays, not on `/admin`.
- The runtime ships without an `/admin` route and without product-facing `/admin` references.

### Status

- Partially completed
- `/settings` now opens real parent workspaces instead of falling back to `/admin`
- auth, pricing, session redirects, and the parent gate now point to `/settings`
- the `/admin` route has been deleted from the runtime
- temporary extracted modules still need cleanup and renaming

## Phase 2: Viewport-Fit Settings Workspace

### Goal

Keep the parent workspace faithful to the prototype while fitting a full landscape viewport.

### Tasks

- Replace scroll-heavy layout with a constrained viewport layout for iPad landscape.
- Keep the header, premium banner, management cards, and settings rows visible without page scroll.
- Re-home complex CRUD into nested overlays and sheets instead of long panels.
- Replace the current text-based sound trailing affordance with a proper inline toggle control.

### Acceptance Criteria

- The main settings view fits in one viewport at typical iPad landscape sizes.
- The base settings screen does not require vertical scrolling.
- Sound can be toggled from a compact inline control.

## Phase 3: Global i18n

### Goal

Remove hardcoded front-end copy and make the whole app locale-driven.

### Tasks

- Introduce a shared i18n layer for App Router and client components.
- Port the existing prototype translation vocabulary into a typed translation catalog.
- Migrate board, settings, auth, pricing, modal copy, placeholders, alerts, and validation messages.
- Localize task and routine display content where the data model already supports it or where schema changes are needed.
- Remove direct locale branching and hardcoded strings from React components.

### Acceptance Criteria

- Changing locale updates the entire UI, not just persisted preference.
- No user-facing text remains hardcoded in front-end components.
- `/`, `/settings`, `/sign-in`, `/sign-up`, and `/pricing` all render from translations.

## Phase 4: Sound Engine And Celebration

### Goal

Make the persisted sound setting drive real audio behavior again.

### Tasks

- Port the prototype `SoundFX` vocabulary into isolated client-side utilities.
- Handle audio unlock/resume for iPad and mobile Safari.
- Fire sounds for tap, task completion, mission add, magic assignment, streak gain, journey unlock, and full-routine completion.
- Tie playback to the persisted `soundsEnabled` preference.
- Add tests or deterministic hooks around the sound trigger layer.

### Acceptance Criteria

- Toggling the setting on or off immediately changes audible behavior.
- Completing all tasks for a child triggers a gratification sound.
- Sound playback does not run when the setting is off.

## Phase 5: Child Photo CRUD And Cropper

### Goal

Replace the avatar/photo placeholders with the full profile media flow.

### Tasks

- Add a storage strategy for child profile photos.
- Extend the schema and actions if a dedicated profile image field is needed.
- Build upload, crop, replace, and delete actions in the full profile editor.
- Preserve emoji avatar fallback when no photo exists.
- Bring the cropper flow back with the same modal language as the prototype.

### Acceptance Criteria

- The photo button in the full profile editor is live.
- Parents can upload, crop, replace, and remove a child photo.
- Refresh preserves the chosen image.

## Phase 6: Library And Scheduler Prototype Parity

### Goal

Restore the richer prototype behavior around library editing and planning while keeping DB-backed writes.

### Tasks

- Add back the missing `both` assignment path from the assign-period modal.
- Restore the contextual library modes: assign, manage, scheduler quick-add.
- Reintroduce task color and task photo fields in the task editor if kept in V1.
- Add delete-from-library affordance in the board task editor flow.
- Decide and implement the V1 scheduler model:
  - direct routine writes only
  - or weekly overrides
- Restore the missing scheduling affordances from the prototype where they still fit the product.

### Acceptance Criteria

- The board library behaves like the prototype with real DB writes.
- Scheduler quick-add and assign flows match the original mental model.
- Task edits survive refresh and remain visible on the board.

## Phase 7: Runtime Truth For Streaks And Journey

### Goal

Make motivation features real, not decorative.

### Tasks

- Compute streaks from `TaskCompletion`.
- Add a reusable streak service.
- Decide storage for rewards and milestones:
  - derive from completion history
  - or store snapshots
- Update journey modal to use DB-backed metrics.
- Add audit-safe parent insights for progress.

### Acceptance Criteria

- Streak values survive reload and reflect completion history.
- Journey progress is backed by DB data.
- The board header badge and journey modal show the same truth.

## Phase 8: Prototype Import

### Goal

Keep the live prototype import safe, auditable, and closer to the original scheduler semantics.

### Tasks

- Keep the authenticated import Server Action on the settings workspace.
- Keep mapping prototype profiles to `ChildProfile`.
- Keep mapping prototype task library to `TaskTemplate`.
- Keep mapping assignments to `Routine` and `RoutineTask`.
- Keep mapping completion history where technically safe.
- Keep logging import metadata in `AdminAuditLog`.
- Preserve old weekday-specific scheduler data once weekly overrides exist in the V1+ model.

### Acceptance Criteria

- A valid prototype snapshot can be imported from the settings workspace.
- Imported data appears on `/` and `/settings` immediately after refresh.
- Import is repeatable without runaway duplication.
- The current V1 import limits are documented clearly.

## Phase 9: Billing and Entitlements

### Goal

Remove fake premium toggles and connect the product to real subscription state.

### Tasks

- Integrate Stripe checkout and webhooks.
- Sync Stripe into `Subscription`.
- Add server-side plan checks.
- Replace the current internal DB-backed premium activation with billing-backed subscription changes.
- Make pricing page reflect real entitlements.

### Acceptance Criteria

- Premium status comes from `Subscription`.
- Premium-only affordances are enforced server-side.
- Board and settings no longer fake premium activation.

### Status

- Implemented in code with a single Family Premium product and monthly/yearly Price IDs.
- Stripe Checkout is created server-side and never grants access directly.
- Signed webhooks synchronize customer, subscription, status, period, and cancellation state.
- Free profile and routine-task limits are enforced server-side on both parent entry paths.
- The local Stripe test lifecycle is complete. Remaining release work is to create an isolated Vercel preview, configure its webhook, repeat the smoke test remotely, and audit legacy live subscriptions before any live catalog change.

## Phase 10: Hardening and Quality

### Goal

Make the application safe to evolve.

### Tasks

- Add Prisma transactions to every multi-write mutation.
- Add stronger DB uniqueness for built-in seeds where needed.
- Add integration tests for auth, profiles, routines, scheduler, import, settings CRUD, and i18n routing.
- Add Playwright coverage for the modal-heavy board flows.
- Audit accessibility and performance.

### Acceptance Criteria

- Critical flows are covered by automated tests.
- No multi-step write leaves partial state on failure.
- The main board remains performant and stable on iPad-sized viewports.

## Current Implementation Start

The first development tranche has already started in code:

- env/runtime loading for auth and Prisma was hardened
- authenticated empty-household board fallback was removed
- fake empty-log fallback was removed
- board profile CRUD is being migrated from local state to Server Actions
- child profile creation was refactored toward atomic creation with default routines
- parent PIN step-up flow is live with signed-cookie enforcement on sensitive board actions
- settings workspace CRUD is live for task templates and for routine rename plus task add/remove
- the `/admin` runtime route has been removed
- the first sound engine tranche is live and now covers success/error feedback in addition to completion cues
- child photo upload, crop, replace, and delete are live from board profile flows
- the app-wide i18n provider and locale cookie sync are live
- the main server mutation and validation messages are localized on board, settings, security, and workbench flows
- the board library can delete custom templates and assign missions to morning, evening, or both
- streak and journey progression are now derived from `TaskCompletion` for the live board
- settings persists locale, sounds, and periods; premium state now comes from Stripe-synchronized subscriptions
- private Vercel Blob storage is live for new profile and task images, with session and household authorization on reads and cleanup on replace/delete
- the major remaining product gaps are localization of imported data labels, modal E2E coverage, weekday-specific scheduling fidelity and a remote deletion fixture containing private media
- live empty routines no longer fall back to prototype missions
- completed-day streak snapshots now remain stable when routines change later
- the Stripe test lifecycle is verified end to end: card Checkout, signed webhook, idempotent replay, Family Premium entitlement, cancellation, and return to Free

## Immediate Next Coding Targets

1. Finish app-wide i18n, especially data-driven labels imported from older snapshots.
2. Expand the sound engine beyond the first feedback vocabulary.
3. Complete the iPad landscape modal E2E matrix and accessibility pass.
4. Expand the live Vercel preview coverage from the verified signup/profile/private-read/Stripe/account-deletion lifecycle to the complete modal and file-picker E2E matrix.
5. Add a private-media fixture to the remote account-deletion scenario; export and deletion are already implemented and the no-media destructive flow is verified remotely.
6. Audit any legacy live subscriptions before creating or archiving a live RoutineKids catalog.
