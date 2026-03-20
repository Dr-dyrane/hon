# Database Functions Registry

This file records every database function or RPC introduced into the database.

Update this file in the same change that introduces or modifies a function.

---

## Columns To Record

- function name
- signature
- purpose
- caller
- side effects
- migration introduced
- notes

---

## Entries

| Function Name | Signature | Purpose | Caller | Side Effects | Migration Introduced | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `app.set_updated_at` | `app.set_updated_at()` | Normalizes `updated_at` during row updates across mutable app tables. | Database triggers on mutable tables. | Mutates `NEW.updated_at` before update. | `0001__schemas_and_support.sql` | Shared trigger function for identity, catalog, layout, and settings tables. |
| `app.current_actor_email` | `app.current_actor_email()` | Returns the request-scoped actor email from database session settings. | Audit trigger and future RLS helpers. | Reads `app.user_email` from the current transaction. | `0010__audit_and_rls_helpers.sql` | Empty settings resolve to `null`. |
| `app.current_actor_role` | `app.current_actor_role()` | Returns the request-scoped actor role from database session settings. | Audit trigger and future RLS helpers. | Reads `app.role` from the current transaction. | `0010__audit_and_rls_helpers.sql` | Values are normalized to lowercase by the app runtime. |
| `app.current_actor_user_id` | `app.current_actor_user_id()` | Returns the request-scoped actor user ID, or derives it from the actor email when needed. | Audit trigger and future RLS helpers. | Reads `app.user_id`; may look up `app.users`. | `0010__audit_and_rls_helpers.sql` | Keeps audit rows attributable even when the app only has email. |
| `app.has_role` | `app.has_role(role_key text)` | Convenience predicate for role checks inside future RLS policies and helper functions. | Future RLS policies and permission helpers. | Reads the current actor role setting. | `0010__audit_and_rls_helpers.sql` | Current implementation supports the single-role app session model. |
| `app.set_actor_context` | `app.set_actor_context(input_email text, input_role text, input_user_id uuid, input_guest_order_id uuid default null)` | Seeds per-transaction actor settings before actor-scoped reads and writes. | App DB client wrappers. | Sets `app.user_email`, `app.role`, `app.user_id`, and `app.guest_order_id` for the active transaction. | `0010__audit_and_rls_helpers.sql`, updated by `0011__rls_policies.sql` | Called by `query(..., { actor })` and `withTransaction(..., { actor })`; guest checkout uses the extra order scope. |
| `app.current_guest_order_id` | `app.current_guest_order_id()` | Returns the request-scoped guest order ID used for guest confirmation and proof-upload access. | Order-access helpers and RLS policies. | Reads `app.guest_order_id` from the current transaction. | `0011__rls_policies.sql` | Empty settings resolve to `null`. |
| `app.can_access_order_row` | `app.can_access_order_row(order_user_id uuid, order_customer_email citext, target_order_id uuid)` | Centralizes whether the current actor can read or mutate an order-scoped row. | RLS policies for orders, payments, order items, proofs, reviews, and timelines. | Reads actor context and may compare against order ownership or guest token scope. | `0011__rls_policies.sql` | Admins always pass; customers pass by `user_id`, matching email, or guest order ID. |
| `app.can_access_order_id` | `app.can_access_order_id(target_order_id uuid)` | Resolves order access when only the order ID is available on the row being protected. | RLS policies on child tables keyed by `order_id`. | Looks up `app.orders` and delegates to `app.can_access_order_row(...)`. | `0011__rls_policies.sql` | Used by `order_items`, `payments`, `payment_proofs`, `order_status_events`, `review_requests`, and `reviews`. |
| `audit.log_row_change` | `audit.log_row_change()` | Writes normalized row-change records into `audit.audit_logs` for critical mutable tables. | Audit triggers on operational tables. | Inserts audit rows on `insert`, `update`, and `delete`. | `0010__audit_and_rls_helpers.sql` | Trigger argument `tg_argv[0]` defines the primary key column to snapshot. |
