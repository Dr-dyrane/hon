# First-Run Onboarding Spec

This document defines how first-run guidance works in app shells.

---

## 1. Goal

Teach first-time users how to operate core workflows without adding UI noise.

The guide must:

- be short
- be contextual
- be skippable
- focus on real actions, not decoration

---

## 2. Delivery Pattern

Use a coach-mark flow (step card + highlighted target), not a full tutorial wall.

Current implementation:

- mobile-first guide
- anchored to shell controls and overview queue controls
- shown once per scope/version via local storage

Component:

- `src/components/shell/WorkspaceFirstRunGuide.tsx`

Target anchors:

- `workspace-mobile-nav`
- `workspace-mobile-fab`
- `workspace-notifications-trigger`
- `admin-overview-primary-action`
- `admin-overview-queue-grid`

---

## 3. 3D Guide Decision

Yes, a 3D guide is possible in this codebase because `three` and `@react-three/fiber` already exist.

But for onboarding, 3D should be optional and non-blocking.

Use 3D only if:

- it does not delay first interaction
- it does not hide primary controls
- it respects reduced motion
- it can be disabled on low-power devices

Do not use 3D as the only way to explain critical actions.

---

## 4. Recommended Rollout

### Phase 1 (now)

- ship lightweight coach marks for first-run mobile
- collect completion and skip rates

### Phase 2 (optional)

- add a small 3D mascot in empty states or help surfaces
- keep coach marks as the primary instruction system

---

## 5. UX Guardrails

1. Maximum of 5 steps per flow.
2. One idea per step.
3. No long explanatory paragraphs.
4. Always provide `Skip`.
5. Preserve the existing app hierarchy and safe-area spacing.
