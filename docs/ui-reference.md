# UI Reference

Source of truth: [`index.html`](/Users/yoannandrieux/Projets/routine-kids/index.html)

Last updated: March 12, 2026

## Rule

The original `index.html` is the authoritative UX reference for the child board,
parental gate, settings full-view, and all high-visibility modals.

Migration rule:

- Preserve layout, visual density, spacing rhythm, card hierarchy, and modal behavior
  before introducing new product ideas.
- Prefer rebuilding the same experience in Next.js over redesigning it.
- If a new flow is required by the modern stack, wrap it in the established visual language of the original app.
- Parent tooling must live inside the board modal family and the settings full-view.
- Do not keep a separate product-facing admin page.

## Primary Surfaces To Preserve

### Board shell

- Sticky header with logo left, digital clock centered, compact actions right.
- Source: [`index.html:517`](/Users/yoannandrieux/Projets/routine-kids/index.html#L517)
- Family wall rows with avatar rail, horizontal task tray, plus/minus controls, and add astronaut CTA.
- Source: [`index.html:592`](/Users/yoannandrieux/Projets/routine-kids/index.html#L592)
- Board render logic and row anatomy.
- Source: [`index.html:2822`](/Users/yoannandrieux/Projets/routine-kids/index.html#L2822)

### Settings full-view

- Full-screen slide-up panel, not a dashboard card.
- Header with back button and title.
- Two-column content split between management cards and application settings.
- On iPad landscape, the full-view should fit in one viewport height without vertical page scroll.
- Management cards open subflows in-place, they do not redirect to another product surface.
- The sound control stays inline as a small toggle affordance, not a drill-down item.
- Source: [`index.html:595`](/Users/yoannandrieux/Projets/routine-kids/index.html#L595)

### Modal family

- Language modal.
- Source: [`index.html:787`](/Users/yoannandrieux/Projets/routine-kids/index.html#L787)
- Premium modal.
- Source: [`index.html:815`](/Users/yoannandrieux/Projets/routine-kids/index.html#L815)
- Confirm modal.
- Source: [`index.html:867`](/Users/yoannandrieux/Projets/routine-kids/index.html#L867)
- Success modal.
- Source: [`index.html:878`](/Users/yoannandrieux/Projets/routine-kids/index.html#L878)
- Alert modal.
- Source: [`index.html:899`](/Users/yoannandrieux/Projets/routine-kids/index.html#L899)
- About modal.
- Source: [`index.html:913`](/Users/yoannandrieux/Projets/routine-kids/index.html#L913)
- Privacy modal.
- Source: [`index.html:940`](/Users/yoannandrieux/Projets/routine-kids/index.html#L940)
- Scheduler modal.
- Source: [`index.html:964`](/Users/yoannandrieux/Projets/routine-kids/index.html#L964)
- Task editor modal.
- Source: [`index.html:1124`](/Users/yoannandrieux/Projets/routine-kids/index.html#L1124)
- Global library modal.
- Source: [`index.html:1166`](/Users/yoannandrieux/Projets/routine-kids/index.html#L1166)
- Assign period modal.
- Source: [`index.html:1195`](/Users/yoannandrieux/Projets/routine-kids/index.html#L1195)
- Parental gate modal.
- Source: [`index.html:1226`](/Users/yoannandrieux/Projets/routine-kids/index.html#L1226)
- Period settings modal.
- Source: [`index.html:1242`](/Users/yoannandrieux/Projets/routine-kids/index.html#L1242)
- Profile manager modal.
- Source: [`index.html:1295`](/Users/yoannandrieux/Projets/routine-kids/index.html#L1295)
- Quick edit modal.
- Source: [`index.html:1319`](/Users/yoannandrieux/Projets/routine-kids/index.html#L1319)
- Full profile editor modal.
- Source: [`index.html:1338`](/Users/yoannandrieux/Projets/routine-kids/index.html#L1338)
- Task photo and profile photo entry points are part of this modal family.
- Cropper flow is part of the reference UX, not an optional extra.
- Auto-assign offer and confirm modals.
- Source: [`index.html:1415`](/Users/yoannandrieux/Projets/routine-kids/index.html#L1415)
- Cropper modal.
- Source: [`index.html:1472`](/Users/yoannandrieux/Projets/routine-kids/index.html#L1472)
- Journey modal.
- Source: [`index.html:1504`](/Users/yoannandrieux/Projets/routine-kids/index.html#L1504)

## Visual Tokens To Keep

- Background:
  - deep purple radial field from `#2a1f52` to `#0f0b24`
  - star drift overlay
- Core accent:
  - pink `#ec4899`
  - orange `#f97316`
  - gold premium accent
- Panels:
  - dark translucent glass
  - soft borders
  - rounded corners between `xl` and `3xl`
- Task cards:
  - compact squares
  - dense icon-first layout
  - small uppercase labels
  - green completion state with check badge
- UI density:
  - compact header
  - shallow paddings
  - narrow gaps
  - visually efficient horizontal layout

## Next Mapping

- `/`
  - child board shell
  - parental gate entry to settings
- `/settings`
  - route alias for the same parent workspace used on `/`
  - must preserve the full-view settings experience and open the same subflows
  - must not become a second product surface with its own IA or layout language

Component direction:

- `src/components/board/*`
  - preserve board layout and interaction density
- `src/components/settings/*`
  - preserve the settings full-view and absorb parent tooling now living in `src/components/admin/*`

Transitional note:

- `src/components/admin/*` and `src/app/admin/*` are implementation scaffolding only.
- They are scheduled to be folded into the settings workspace and removed.

## Non-Negotiable UX Constraints

- Do not replace the settings full-view with a generic SaaS admin layout.
- Do not replace the original modal language with browser-native prompts.
- Do not widen or simplify the board into oversized dashboard cards.
- Do not move child-centric actions into text-heavy forms on the main board.
- Do not change the emotional tone of the original space-themed interaction model.
- Do not introduce a separate admin page as the long-term parent experience.
- Do not allow the settings full-view to become a long scrolling page on iPad.
- Do not keep hardcoded front-end copy outside the translation layer.
