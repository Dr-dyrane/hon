# Admin Mobile Action Model

This document defines the action hierarchy for Prax on phone.

Use with:

- `docs/planning/UI_IMPLEMENTATION_DOCTRINE.md`
- `docs/planning/SCREEN_SPECS.md`
- `docs/planning/NATIVE_APP_EXECUTION_PLAN.md`

---

## 1. Objective

Phone admin should complete high-frequency operations fast, with minimal cognitive load.

The first viewport must expose:

1. state at a glance
2. one dominant action
3. fast queue entry

---

## 2. Action Classes

### Quick actions

Quick actions are:

- frequent
- low-risk
- single-step or near-single-step

On mobile, quick actions live in:

- FAB (`route-scoped primary`)
- compact queue cards
- short top-surface action rail

Quick actions must not open heavy forms before confirming intent.

### Detailed actions

Detailed actions are:

- context-heavy
- multi-step
- decision-sensitive

On mobile, detailed actions should open:

- dedicated order/payment/delivery detail surfaces
- controlled sheets or focused editors

Detailed actions must not compete with quick actions in the first viewport.

---

## 3. Top 5 Frequent Admin Actions

These are the default quick-first priorities:

1. Enter highest-priority queue.
2. Review/confirm/reject payment proof.
3. Advance order to next legal state.
4. Assign or reassign delivery rider.
5. Resolve stock blockers for pending orders.

If a screen does not help one of these in the first viewport, it needs restructuring.

---

## 4. Mobile Composition Standard

Phone rhythm:

1. title
2. compact status strip
3. primary queue/action surface

Do not place large explanatory cards before queue entry.

Do not stack multiple equal-weight action groups.

Do not render desktop summary panels as tall mobile blocks.

---

## 5. Acceptance Checklist

A mobile admin screen is ready only if all are true:

1. One dominant action is obvious within 2 seconds.
2. First viewport includes queue entry or route primary action.
3. Quick actions are compact and icon-led where context is obvious.
4. Detailed actions are behind focused surfaces, not mixed into quick rails.
5. Copy is operational and short.
6. No border-based layout separation.
7. Interaction targets are thumb-safe.
8. Safe-area spacing is respected for bottom dock and FAB.
9. Screen maps to one of the top 5 frequent actions.

---

## 6. Current Implementation Anchors

Mobile quick-action structure currently anchors to:

- `workspace mobile nav`
- `route FAB`
- `notifications trigger`
- `admin overview primary queue action`

These anchors are used by first-run guidance and should remain stable.
