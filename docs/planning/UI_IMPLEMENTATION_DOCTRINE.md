# House of Prax UI Implementation Doctrine

This document locks the implementation behavior for admin and portal UI so design quality does not drift while features are being built.

Read this with:

- `docs/planning/SCREEN_SPECS.md`
- `docs/planning/IMPLEMENTATION_BLUEPRINT.md`
- `docs/planning/RENDEZVOUS_STATUS.md`

---

## 1. Core Rule

Do not treat admin or portal screens as responsive desktop pages.

They must be built as three intentional compositions:

- `mobile`
- `tablet`
- `desktop`

The data contract can stay shared.
The visual hierarchy, density, and interaction rhythm must not.

---

## 2. Non-Negotiables

### Zero-border policy

For this repo:

- do not add visible borders as a styling crutch
- do not add accent rails that behave like borders
- do not use `border`, `border-*`, or outlined cards unless there is a functional exception already approved

Separation should come from:

- spacing
- surface tone
- shadow
- blur
- grouping
- typography hierarchy

### Apple HIG baseline

If a UI choice is uncertain:

- choose the calmer option
- reduce copy before adding more UI
- reduce decoration before adding more emphasis
- prefer grouped surfaces over boxed complexity
- prefer obvious primary action over many equal actions

### One purpose per screen

Each screen must have:

- one primary purpose
- one dominant action
- one obvious reading path

---

## 3. Viewport Doctrine

### Mobile

Mobile is:

- glance-first
- single-column
- thumb-friendly
- action-compressed

Mobile should use:

- KPI rails instead of tall summary grids
- compact action rails instead of wide toolbars
- icon-led actions where context is already obvious
- list-first triage views
- progressive reveal instead of showing every control immediately

Mobile should avoid:

- stacked desktop cards that require long vertical scanning
- verbose helper copy
- multiple competing action groups
- table-like density

### Tablet

Tablet is not stretched mobile and not reduced desktop.

Tablet should use:

- split emphasis
- clearer grouping than desktop
- more context than mobile
- compact dual-region layouts when useful

Tablet is the transition state for:

- list + preview
- map + list
- editor + supporting context

### Desktop

Desktop should use:

- persistent workspace
- broader context
- richer supporting panes
- more visible secondary metadata

Desktop should not force mobile density when there is room.

---

## 4. Shell Rules

### Sidebar

- sidebar must stay sticky on desktop shells
- sidebar should not scroll away with main content
- sidebar content is navigational context, not page content

### Top bar

- top bar title must be route-aware
- top bar should reflect the active section, not always the workspace root name
- avoid duplicate naming where both sidebar and header say the same thing without adding context
- deep routes should show hierarchy in the header, not a flat repeated workspace name
- use a quiet breadcrumb or parent path for nested routes instead of adding loud secondary chrome
- current route title should stay dominant; parent navigation should stay secondary

### Hierarchical navigation

Apple-style navigation here means:

- the sidebar owns section-level movement
- the top bar owns current place in the hierarchy
- nested routes should expose a clear path back to the immediate parent list or editor surface
- do not add heavy web-style breadcrumb bars when a subtle parent trail is enough

For this repo:

- root admin and portal routes show the workspace eyebrow plus the active route title
- nested routes show clickable parent crumbs above the current title
- the shell must derive this from route metadata, not hand-written one-off headers
- page content can still carry a strong heading on root screens, but the shell must always know where the user is
- nested page bodies should switch to a compact context strip, not a second route hero that repeats the shell title

### Narrow desktop threshold

There is a width range where the sidebar is visible but the content area is no longer truly desktop.

In that range:

- keep the sidebar
- switch the content treatment to compact
- keep KPI strips horizontal and glanceable
- collapse action groups earlier
- delay multi-column content until the main pane has enough real width

Senior-engineering rule:

- breakpoint logic must consider available content width, not only viewport width

---

## 5. Surface And Rhythm Rules

### Summary surfaces

Use:

- horizontal KPI strips on mobile
- compact cards on tablet
- fuller metric panels on desktop
- mobile KPI tiles should show only label, value, and icon

Do not:

- ship oversized metric cards on mobile
- require scrolling before the user can absorb the state of the page
- place descriptive support text inside mobile KPI tiles

### Action groups

Use:

- short pill actions
- compact grouped rails
- icon-only secondary actions when obvious

Do not:

- place large explanatory buttons beside each other without hierarchy
- let button labels become the main visual noise on the page

### Lists

Operational lists should read like:

- scan
- identify
- act

Not like:

- card gallery
- documentation blocks

Each row should surface:

- identity
- state
- the smallest useful metadata
- one obvious action target

### Copy

UI copy should be:

- short
- operational
- calm

Avoid:

- explanatory paragraphs in working surfaces
- repeating what the user can already infer visually
- writing product documentation inside the interface

---

## 6. Route-Specific Expectations

### Admin overview

- mobile: triage rail + priority list
- tablet: compact summary + queue grouping
- desktop: broader operations board

### Admin orders and payments

- mobile: list-first, no heavy summary wall
- tablet: list-detail
- desktop: queue + context

### Admin layout

- mobile: KPI rail, compact mode switch, compact action rail, section list first
- tablet: section list + controlled editor emphasis
- desktop: fuller editor workspace

### Portal order surfaces

- mobile: order status at a glance, compact actions, line items below
- tablet: clearer split between status and detail
- desktop: supporting context can stay visible longer

---

## 7. Reference Patterns We Are Following

The admin and portal should borrow these principles from the mobile reference work already reviewed:

- KPI information should be readable at a glance in a rail
- actions should feel orchestrated into compact groups
- rows should carry state with hierarchy, not with border noise
- motion and spacing should support clarity, not spectacle

This reference is directional, not literal.
Do not copy classes or components blindly.
Extract the behavior and hierarchy.

---

## 8. Build Guardrails

Before shipping a new admin or portal screen, check:

1. Does mobile have its own composition, not just smaller cards?
2. Does tablet have its own intermediate layout?
3. Does the top bar title reflect the active route?
4. Do nested routes expose a quiet parent path in the header?
5. Does the screen avoid borders entirely?
6. Is the sidebar sticky where it should be?
7. Is there too much explanatory copy?
8. Are KPI summaries readable at a glance without long scrolling?
9. Are actions grouped calmly and hierarchically?

If any answer is `no`, the screen is not ready.

---

## Apple References

This doctrine follows Apple navigation guidance from official sources:

- Apple HIG platform guidance on navigation structure and clear hierarchy
- WWDC22 `The craft of SwiftUI API design: Progressive Disclosure`, especially the guidance that navigation titles should orient people and back affordances should preserve context
- WWDC22 `Design for spatial user interfaces`, where Apple reinforces clear placement, hierarchy, and avoiding ornamental chrome that competes with content
