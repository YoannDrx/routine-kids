# RoutineKids Roadmap

Last updated: July 17, 2026

## Mission

Rebuild `routine-kids` as a production-ready `Next.js` app while preserving the emotional identity and functional DNA of the original prototype in [`index.html`](/Users/yoannandrieux/Projets/routine-kids/index.html).

Reference docs:

- feature audit: [`docs/feature-audit.md`](/Users/yoannandrieux/Projets/routine-kids/docs/feature-audit.md)
- UI parity reference: [`docs/ui-reference.md`](/Users/yoannandrieux/Projets/routine-kids/docs/ui-reference.md)
- zero-mock execution plan: [`docs/zero-mock-plan.md`](/Users/yoannandrieux/Projets/routine-kids/docs/zero-mock-plan.md)

Important constraint:

- `routine-kids-2` is consultative only.
- No code changes should be made in `routine-kids-2`.
- `routine-kids` gets its own dedicated Neon database.
- The long-term product must not expose a separate `/admin` experience.
- Parent tooling belongs inside the settings full-view and its modal family.

## Current Audit

Authoritative status:

- auth is real
- household bootstrap is real
- board completion persistence is real
- parent household update is real and reachable from settings workspaces
- parent child create is real from board overlays and from settings workspaces
- parent theme assignment is real from settings workspaces
- board profile CRUD is real
- board task library, board add/remove mission flow, and scheduler apply are real
- settings persistence is real for locale, sounds, periods, and internal premium state
- parent PIN security is real for board-only parent entry points
- task-template and routine workbench CRUD is real inside settings workspaces
- board sound playback is real and driven by persisted settings
- board library parity improved: assign-period supports morning, evening, and both, and custom templates can be deleted from the board editor
- child photo upload, crop, replace, and delete are real from board profile flows
- task photo upload, crop, replace, and delete are real from the task library
- new child and task images use private Vercel Blob storage behind a household-authorized media route; legacy data URLs remain readable during migration
- app-wide i18n foundation is real and the main server mutation/validation messages are localized, but the final zero-hardcoded pass is still in progress across all visible copy and data labels
- Stripe billing and server-side plan enforcement are real in test mode; remaining release work is remote preview validation, modal E2E depth, complete i18n and the documented weekday scheduling compromise
- the dedicated `/admin` route has been deleted from the runtime
- the detailed button-by-button breakdown now lives in [`docs/feature-audit.md`](/Users/yoannandrieux/Projets/routine-kids/docs/feature-audit.md)

### What exists today

- One static prototype page in [`index.html`](/Users/yoannandrieux/Projets/routine-kids/index.html).
- One lightweight static server in [`server.js`](/Users/yoannandrieux/Projets/routine-kids/server.js).
- Local persistence in `localStorage` for profiles, tasks, streaks, language, premium state, and images.
- Rich interaction model already validated:
  - child board with morning and evening modes
  - profile management
  - task library
  - weekly scheduler
  - streaks and planet journey
  - image cropper
  - bilingual UX
  - premium gating prototype

### Major risks observed

- Monolithic architecture: UI, state, logic, persistence and modal system live in a single HTML file.
- No backend, no authentication, no shared household model, no multi-device sync.
- Performance risk: CDN runtime assets, heavy animations, `innerHTML` rendering, base64 assets in local storage.
- Accessibility risk: many inline click handlers, limited semantics, portrait lock, very small labels in several places.
- Product credibility issue: the intro overlay can remain black when the video file is missing because the implementation and README disagree on the expected file path.

### Product direction confirmed

- Keep the space-driven emotional identity.
- Keep the multi-profile iPad-first board.
- Keep gamification and progression.
- Keep parent tools in the settings workspace, not in a separate admin page.
- Replace local-only data with Neon/Postgres via Prisma.
- Make the settings full-view feel like a native iOS parent control center.
- Make the settings full-view fit one viewport height in landscape.
- Remove hardcoded front-end copy and adopt app-wide i18n.
- Restore real sound, photo/cropper, and library behaviors from `index.html`.

## Decisions Already Taken

- Rebuild inside `routine-kids`, not `routine-kids-2`.
- Use the technical stack proven elsewhere:
  - `Next.js 16`
  - `React 19`
  - `TypeScript`
  - `Tailwind CSS v4`
  - `Prisma`
  - `Neon`
  - `Better Auth`
- Preserve the original prototype as a reference during the migration.
- Create a new Neon database dedicated to `routine-kids`.

## Work Completed In This Repo

- Git repository initialized and connected to GitHub.
- Full audit performed on the current prototype.
- Comparative architecture review completed against `routine-kids-2`, without modifying it.
- Migration foundation started:
  - Next.js project structure added
  - App Router layout added
  - auth and Prisma foundation added
  - first React board shell added on `/`
  - parent auth pages added
  - a temporary protected `/admin` shell was added for early CRUD work and is now scheduled for removal
  - first live Server Action added for child profile creation
  - idempotent household bootstrap added for built-in theme packs and presets
  - a temporary `/admin/logs` route can read live audit data
  - child profile theme assignment added on the temporary parent workbench
  - homepage can now switch from prototype profiles to live household profiles when session and DB are available
  - child profiles now receive default live morning/evening routines in Prisma
  - board can now render live routines/tasks and persist daily task completion
  - auth runtime issue diagnosed and resolved:
    - root cause was a dev server started before final `.env.local` values were active
    - sign-up and sign-in now validate correctly after restart
    - server env bootstrap added in `src/lib/env.server.ts`, `src/lib/prisma.ts`, `src/lib/config.ts`, and `src/lib/auth.ts`
  - UI source-of-truth documented in `docs/ui-reference.md`
  - detailed feature and button audit documented in `docs/feature-audit.md`
  - board shell re-aligned to the original `index.html` header and family-wall density
  - parental gate rebuilt as a real PIN flow backed by `ParentSecuritySettings`
  - settings full-view rebuilt as an overlay instead of a dashboard replacement
  - settings full-view no longer depends on a separate `/admin` route
  - board modal family started around the board:
    - premium
    - journey
    - profile manager
    - quick avatar edit
    - full profile editor
    - task library
    - scheduler
    - confirm / success / alert
  - safe prototype `localStorage` import parser and import preview card added
  - prototype import preview no longer causes hydration mismatch on the temporary parent workbench
  - settings import workspace now performs a real authenticated import from `routineKidsData` into Prisma:
    - child profiles
    - routines and missions
    - task templates
    - task completions
    - household app settings
    - activity and admin audit logs
  - current import limitation documented:
    - prototype weekday-specific scheduler data is flattened into the V1 morning/evening routine model until weekly overrides exist
  - roadmap captured in-repo
  - prototype scripts preserved
  - authenticated board reads no longer fall back to fake prototype profiles when the live household is empty
  - temporary parent logs no longer fall back to fake preview rows when the DB is ready but no audit events exist
  - temporary task library workbench now creates, edits and deletes real `TaskTemplate` rows
  - temporary routine workbench now renames live routines and adds/removes live `RoutineTask` rows
  - `/settings` now acts as a real parent workspace:
    - auth callbacks now land on `/settings`
    - pricing and parent gate no longer send the user to `/admin`
    - settings can open real parent modals for crew, household, security, themes, import, activity, templates, and routines
    - the sound control now uses a real toggle affordance instead of plain `On/Off` text
  - the `/admin` route and `/admin/logs` route have been removed from the runtime
  - route types regenerated after `/admin` removal
  - board sound engine added for tap, task-complete, routine-complete, success, and error feedback
  - child photo CRUD added on board profile flows:
    - upload
    - crop
    - replace
    - remove
    - persisted `photoUrl` field in Prisma
  - app-wide i18n provider, locale cookie sync, and first large pass of visible copy migration added
  - server-side validation and mutation messages localized across board actions, settings actions, security actions, and parent workbench actions
  - board library editor can now delete custom templates directly from the board flow
  - assign-period and scheduler period selection now support a `morning + evening` path like the prototype
  - streak badge and journey modal now derive live progression from `TaskCompletion`
  - signed-out `/` no longer renders seeded prototype family data as if it were real
  - signed-out `/` now uses real auth-first entry points inside the board shell:
    - create household CTA -> `/sign-up?callbackUrl=/settings`
    - sign-in CTA and settings gear -> `/sign-in?callbackUrl=/settings`
    - premium badge -> `/pricing`
  - the settings workspace only mounts when a signed-in parent opens it
  - dependency install verified
  - Prisma client generation verified
  - `pnpm lint`, `pnpm typecheck`, `pnpm build`, and `pnpm dev` verified

## Target Architecture

### Application layers

- `src/app`: routes, layouts, metadata, auth endpoints
- `src/components/board`: child-facing board UI
- `src/components/settings`: parent settings workspace and modal family
- `src/components/auth`: parent auth forms
- `src/components/admin`: temporary extraction bucket to fold back into `settings`
- `src/lib`: session, auth, Prisma, themes, seed data, helpers
- `prisma`: schema and later migrations

### Runtime model

- Server Components by default for reads and page composition
- Client Components only for tactile interactivity and browser-only behavior
- Server Actions for mutations
- Route Handlers for auth, imports, exports, webhooks and future integrations
- Parent mutations should be reachable from `/` overlays and from `/settings`, not from a separate product surface

### Data model baseline

- `User`
- `Session`
- `Account`
- `Verification`
- `Household`
- `ParentSecuritySettings`
- `ChildProfile`
- `Routine`
- `RoutineTask`
- `TaskCompletion`
- `TaskTemplate`
- `RoutineSuggestionPreset`
- `ThemePack`
- `ActivityLog`
- `AdminAuditLog`
- `Subscription`

## Product Scope

### V1 private beta

- Parent auth
- Household creation
- Child profiles CRUD
- Routine and task CRUD
- Child board with morning and evening flows
- Preset assignment by age band
- Board completion history
- Streak and journey system
- Parent PIN / step-up security
- Import path from the original local data
- Dedicated Neon database

### V1 public

- PWA installability
- Offline-first board behavior
- Export and import
- Parent activity and audit logs
- Theme packs by age
- Real premium model foundation

### V1.5

- Co-parent support
- Local notifications
- Reward ledger and badges
- Premium theme packs
- Weekend and bedtime flows

### V2

- Smarter adaptive recommendations
- Push notifications
- Mature sync across devices
- Additional caregiver roles

## Phase Plan

### Phase 0: Foundation and migration framing

- [x] Audit the current prototype
- [x] Confirm architectural direction
- [x] Create roadmap inside the repo
- [x] Preserve the original prototype
- [x] Create the dedicated Neon project and wire env variables
- [ ] Define the local-storage import contract
- [ ] Fix the original intro overlay bug for reference parity

### Phase 1: Core app shell

- [x] Add Next.js, TypeScript and Tailwind foundation
- [x] Add App Router layout, metadata and manifest
- [x] Add first child board React implementation
- [x] Add auth and Prisma base files
- [x] Install dependencies and generate Prisma client
- [x] Validate `pnpm dev`, `pnpm lint`, `pnpm typecheck`, `pnpm build`

### Phase 2: Data and auth

- [ ] Finalize Prisma schema for `routine-kids`
- [x] Connect Better Auth to Prisma
- [x] Create parent sign-up and sign-in flow
- [x] Auto-create household on first sign-up
- [x] Protect parent-only mutations with auth and PIN step-up
- [x] Remove `/admin` as the auth callback and parent default landing surface

### Phase 3: Parent Workspace In Settings

- [ ] Merge all parent CRUD flows into `SettingsExperience`
- [x] Remove `/admin` redirects from settings, auth, parental gate, and security copy
- [ ] Fit the settings full-view within the viewport height on iPad landscape
- [x] Replace row click sound control with a real inline toggle
- [~] Re-home child profile create/edit/delete, theme, templates, routines, scheduler, import, and logs into settings overlays
- [ ] Delete `src/app/admin/*` once parity is reached

### Phase 4: Prototype Parity On Board And Modals

- [x] Replace local demo board data with household data
- [x] Add task completion persistence
- [x] Restore original board header and family-wall interaction density
- [x] Restore settings as a full-view overlay on top of `/`
- [x] Restore board-level modal shell for premium, journey and profile flows
- [x] Restore library and scheduler UX around the board
- [x] Replace board-local profile CRUD with Server Actions
- [x] Replace board-local task library edits with Prisma-backed task/template CRUD
- [x] Replace board-local scheduler apply flow with real routine/task writes
- [x] Persist board settings and internal premium state in DB
- [x] Replace board-local parental gate with persisted parent security
- [~] Remove remaining `/admin` affordances from board and settings flows
- [ ] Rebuild real sound and celebrations from the prototype sound engine
- [x] Reintroduce photo upload, crop, replace, and delete for child profiles
- [x] Reintroduce task photo + crop in V1 scope
- [~] Restore missing library behaviors from `index.html`
- [~] Add streak persistence
- [~] Rebuild journey progression from DB
- [ ] Add portrait handling rules specific to board only
- [ ] Add full app i18n and remove hardcoded front-end strings

### Phase 5: Migration tools and offline

- [x] Build prototype `localStorage` import flow
- [ ] Add device-side cache strategy
- [ ] Add optimistic completion sync
- [ ] Add export and backup

### Phase 6: Premium and hardening

- [x] Wire billing plans in Stripe test mode
- [x] Add premium limits server-side
- [~] Add tests for auth, board and settings-overlay flows
- [ ] Audit accessibility
- [ ] Audit performance

## Design Direction

### Themes to support

- `Space Academy`
- `Ocean Quest`
- `Jungle Camp`
- `Soft Pastel`

### UX principles

- Child board first, parent tooling second
- Clear tactile actions
- Celebration without clutter
- Large touch targets
- Minimal reading load for the child surface
- Keep the original `index.html` as the source of truth for board overlays and settings behavior
- Preserve `settings = full-view` and `high-frequency tools = overlays` around the board
- No dedicated admin information architecture
- No vertical page scroll inside the main settings full-view on iPad landscape
- No hardcoded UI copy outside the shared translation system

## Immediate Next Steps

1. Keep the isolated Vercel/Neon/Blob/Stripe preview smoke test green; the first remote lifecycle is complete.
2. Run the full modal E2E matrix at 1024x768 and 1366x1024, including media replacement and deletion through the file picker.
3. Complete the remaining i18n pass for imported and data-driven labels.
4. Preserve weekday-specific prototype scheduling fidelity with explicit weekly overrides.
5. Add export/backup and a documented household deletion path, including Blob cleanup.
6. Audit accessibility, reduced motion and deterministic sound behavior.
7. Fix the intro-video parity issue in the preserved original prototype without reintroducing it into the production app.

## Open Questions

- Retention duration and backup policy for private family media.
- Whether billing exits test mode for the private beta or ships immediately after validation.
- Exact strategy for intro video in the new app:
  - onboarding-only
  - theme-driven cinematic
  - or removed in favor of a lighter branded entrance.
