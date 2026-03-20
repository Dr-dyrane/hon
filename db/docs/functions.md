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
