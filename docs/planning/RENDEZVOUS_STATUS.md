# House of Prax Rendezvous Pass Tracker

This document is the live execution ledger for the platform build.

Use it to track:

- backend integration
- admin console
- user portal
- cross-cutting quality and hardening

Read this with:

- `docs/planning/README_BIBLE.md`
- `docs/planning/SCHEMA_BLUEPRINT.md`
- `docs/planning/IMPLEMENTATION_BLUEPRINT.md`

---

## 1. How To Use This Document

Rules:

- update this file in the same change as the implementation it describes
- do not remove completed tasks unless the underlying feature is removed
- keep status language simple: `not started`, `in progress`, `blocked`, `complete`
- keep business and engineering explanation here, not in the UI

---

## 2. Current Position

The project is in real implementation, not planning.

Current state:

- planning is locked
- Aurora PostgreSQL is connected through the repo-managed migration and seed pipeline
- marketing reads from the database-backed content path
- auth, admin, and portal route-group shells exist
- order and payment tables are live
- persistent carts are live
- admin order and payment surfaces read from Aurora
- admin customer and settings surfaces read from Aurora
- portal order list and order detail read from Aurora
- checkout creates real orders from the cart
- guest checkout resolves to a tokenized confirmation route
- payment proof upload uses browser-direct signed S3 uploads
- guest carts now merge safely into signed-in carts
- checkout and confirmation surfaces are tightened toward the marketing visual bar
- admin delivery board now supports rider roster, assignment, and delivery-state actions from Aurora
- review requests are created from delivered orders and both review surfaces now read and write against Aurora
- catalog repositories tightened for draft-first creation, granular variant status, and inventory mutation
- catalog creation, editing, and quick merchandising flows now run through real admin routes
- layout section authoring now writes draft content correctly and publish flow remains active
- tokenized courier links now open a real courier location-sharing route
- delivery tracking points now ingest through the app and feed signed-in customer tracking
- portal tracking now streams a real delivery snapshot over SSE with polling fallback
- admin delivery metrics and dispatch map now stream from the live delivery snapshot path
- portal profile and saved address management now read and write against Aurora
- portal reorder now rebuilds the cart from past orders using current availability and pricing
- admin catalog and layout server actions now enforce admin session checks instead of relying on shell-only protection
- request-scoped database actor context and audit triggers now record critical write flows in `audit.audit_logs`
- database-level RLS is now active and forced on the owner-scoped profile, order, payment, proof, timeline, and review tables
- admin and customer read paths now seed actor context so the app continues to function under forced RLS
- secondary layout mutations and review-request lifecycle changes are now captured in the audit ledger
- root admin overview, orders, payments, customers, reviews, delivery, and settings now use the quieter KPI-rail and compact-row shell direction instead of the earlier explanatory scaffold pattern
- portal profile and addresses now use compact context panels instead of route-level hero repetition
- portal home, reorder, and reviews now use the same KPI-rail and compact-root direction as the newer console screens
- portal order detail, proof upload, and live tracking now use quieter value strips and tighter section shells instead of generic stacked cards

This means the system has crossed into operational platform work.

---

## 3. Pass Map

### Pass 0. Planning lock

Status:

- `complete`

Deliverables:

- platform direction
- schema direction
- implementation blueprint
- operational governance docs

### Pass 1. App shell and structure

Status:

- `complete`

Deliverables:

- marketing shell
- auth shell
- portal shell
- admin shell
- shared workspace primitives

### Pass 2. Data foundation and read-path cutover

Status:

- `complete`

Deliverables:

- Aurora IAM-backed connection strategy
- migration and seed runners
- marketing catalog and layout cutover
- admin overview, catalog, and layout reads
- portal account summary reads

### Pass 3. Orders and payments baseline

Status:

- `complete`

Deliverables:

- `orders`, `order_items`, `order_status_events`
- `payments`, `payment_proofs`, `payment_review_events`
- admin order queue
- admin payment queue
- admin order detail with review actions
- portal order list
- portal order detail

### Pass 4. Checkout cutover

Status:

- `complete`

Deliverables:

- persistent cart
- real checkout-to-order creation
- bank-transfer instruction flow
- payment proof upload on the final checkout path
- removal of WhatsApp as the main order path

### Pass 5. Admin console expansion

Status:

- `in progress`

Deliverables:

- customers
- settings
- delivery board
- review moderation
- richer catalog mutations
- richer layout authoring and publishing

### Pass 6. Portal expansion

Status:

- `in progress`

Deliverables:

- addresses
- profile
- reorder
- review history
- signed-in tracking route

### Pass 7. Delivery and realtime

Status:

- `in progress`

Deliverables:

- delivery assignments
- tokenized courier flows
- tracking ingestion
- SSE or socket-ready delivery stream
- admin dispatch map

### Pass 8. Hardening and polish

Status:

- `in progress`

Deliverables:

- RLS
- direct S3 signed uploads
- Apple-HIG copy cleanup
- reduced UI noise across admin and portal
- testing and operational hardening

---

## 4. Backend Integration Tracker

Status:

- `in progress`

Completed:

- [x] Aurora IAM-backed database runtime
- [x] Vercel-compatible DB scripts
- [x] migrations through `0011__rls_policies.sql`
- [x] marketing seed path
- [x] bank-account seed path
- [x] repository layer for marketing, admin, account, orders, and payments
- [x] order status event writes
- [x] payment review event writes
- [x] S3-backed proof upload path
- [x] persistent cart schema and repository path
- [x] checkout order creation from the live cart
- [x] guest-safe checkout order access token path
- [x] browser-direct signed upload flow for payment proofs
- [x] converted-cart checkout recovery path
- [x] checkout cart refresh path for expired or replaced carts
- [x] delivery assignment schema and repository path
- [x] review request and review schema
- [x] review repository and moderation write path
- [x] rider tracking ingestion path
- [x] SSE delivery stream for signed-in tracking and admin dispatch
- [x] request-scoped DB actor context for audited write paths
- [x] audit trigger foundation for critical mutable tables
- [x] owner/admin RLS policy rollout on order-, profile-, and review-scoped tables
- [x] low-churn secondary audit coverage for layout presentations, layout bindings, and review requests

Open:

- [ ] review whether any future low-churn mutable tables should join the audit ledger as new admin surfaces are introduced

---

## 5. Admin Console Tracker

Status:

- `in progress`

Completed:

- [x] admin shell and protected layout
- [x] overview screen
- [x] catalog read surface
- [x] layout summary surface
- [x] order queue
- [x] payment queue
- [x] order detail
- [x] payment review actions

Open:

- [x] customer directory
- [x] settings surface
- [x] delivery board
- [x] assignment-aware delivery operations
- [x] review moderation
- [x] catalog creation and editing flows
- [x] availability and featured management actions
- [x] layout authoring flow
- [x] layout publishing flow
- [ ] tighter Apple-style visual and copy pass across all admin pages

---

## 6. User Portal Tracker

Status:

- `in progress`

Completed:

- [x] portal shell and protected layout
- [x] account home summary
- [x] orders list
- [x] order detail
- [x] payment proof submission from order detail
- [x] live checkout-to-account handoff for signed-in checkout
- [x] guest confirmation route for checkout-created orders
- [x] quieter order history and confirmation surfaces
- [x] review history
- [x] signed-in tracking route
- [x] addresses
- [x] profile
- [x] reorder
- [x] quieter order detail and tracking surfaces

Open:

- [ ] quieter Apple-style copy pass across portal screens

---

## 7. Quality And Design Tracker

Status:

- `in progress`

Completed:

- [x] planning docs
- [x] environment and Vercel docs
- [x] database operations docs
- [x] DB registries for functions, triggers, and RLS

Open:

- [ ] reduce explanatory copy in admin and portal UI
- [ ] align page chrome more closely with the marketing visual language
- [ ] enforce viewport-native mobile, tablet, and desktop compositions across admin and portal
- [ ] ensure selected navigation states remain legible in every shell
- [ ] finish no-border, Apple-HIG-consistent surface treatment review
- [ ] resolve legacy lint failures in older 3D and marketing files
- [ ] tighten the checkout drawer and confirmation route further toward the marketing-page visual bar

---

## 8. Known Gaps And Deviations

These are the important truths to keep visible.

### Checkout shell deviation

Locked plan:

- dedicated checkout route

Current implementation:

- the cart drawer is now backed by a persistent cart and real order creation
- guest confirmation resolves on `/checkout/orders/[orderId]`

This is acceptable for the current pass, but a fuller focused checkout shell may still be introduced later if the flow needs more space.

### Delivery is polling-based, not streaming

Current tracking behavior:

- courier links can post tracking points into the platform
- the signed-in portal tracking route now streams a real delivery snapshot and latest rider position
- admin dispatch metrics and map now stream from the same live delivery snapshot path

Missing:

- richer route/ETA logic
- guest tracking on the same live model

### RLS is active on the first protected slice
Current protection model:

- route guards
- repository scoping
- transaction-scoped database actor context for audited writes and actor-scoped reads
- database-level RLS on owner-scoped profile, order, payment, proof, timeline, and review tables

Missing:

- expand policy coverage review to any future tables that become customer-visible

### High-churn audit exclusions are intentional

Current exclusions:

- `app.carts`
- `app.cart_items`
- `app.delivery_events`
- `app.tracking_points`
- auth-touching `app.users` activity such as sign-in timestamps

Reason:

- these paths are high-frequency or operationally derivative
- auditing them row-by-row would create avoidable database growth without giving proportional debugging value
- the quieter business-critical tables are already covered

### Viewport-native execution is still partial

Locked plan:

- mobile, tablet, and desktop should each have intentional layouts

Current implementation:

- some admin and portal routes still read like compressed desktop pages
- `/admin/layout` has started moving toward a mobile KPI rail and compact control rhythm

Missing:

- tablet-specific split treatments
- mobile KPI rails and compact action groups across the rest of admin and portal
- shared shell-level viewport primitives to keep this systematic

### Legacy lint failures remain

Current repo-wide lint failures are still concentrated in older files such as:

- `src/components/3d/Product3DCarousel.tsx`
- `src/components/3d/Product3DViewer.tsx`
- `src/components/sections/HeroSection.tsx`
- `src/components/sections/ProblemSection.tsx`
- `src/components/ui/ScrollNav.tsx`

These are pre-existing issues outside the new platform work.

---

## 9. Verification Snapshot

Current checkpoint verification:

- `npm run db:migrate` passes
- `npx tsc --noEmit` passes
- targeted `eslint` passes on the active hardening slice
- `npm run build` passes
- `npm run db:seed` passes, but bank-account seed safely skips if bank env vars are missing
- `npm run lint` does not pass repo-wide because of the legacy issues listed above

---

## 10. Environment Notes

Current execution depends on:

- Aurora connection env vars being present
- `APP_SESSION_SECRET` being set
- S3 env vars being present before proof uploads can work in real environments
- bank transfer env vars being present before the bank-account seed can populate `app.bank_accounts`

Important operational note:

- local `.env` formatting must not wrap host or user values in stray quotes if those quotes end up being consumed literally by the runtime

---

## 11. Active Next Pass

The active build block is Pass 5: admin console expansion.

Implement in this order:

1. Review legacy lint debt outside platform work.
2. Keep tightening the Apple-HIG execution across admin and portal root/detail screens.
3. Reassess audit coverage only when new low-churn admin mutation surfaces appear.

After that:

1. continue admin and portal polish
2. deepen delivery quality where ETA/live behavior still feels thin
3. harden uploads, audit coverage, and quality

---

## 12. Integrity Check

The important architectural decisions still hold.

Still correct:

- one Next.js codebase
- Aurora PostgreSQL as the database of record
- email OTP at launch
- guest-first commerce
- manual bank-transfer confirmation
- admin and portal in the same repo
- Apple-HIG-inspired structural discipline

The remaining work is execution, not architectural rethinking.
