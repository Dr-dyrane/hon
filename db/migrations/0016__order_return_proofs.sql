create table if not exists app.order_return_proofs (
  id uuid primary key default gen_random_uuid(),
  return_case_id uuid not null references app.order_return_cases(id) on delete cascade,
  order_id uuid not null references app.orders(id) on delete cascade,
  storage_key text not null,
  public_url text null,
  mime_type text not null,
  submitted_by_email citext null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists order_return_proofs_case_idx
  on app.order_return_proofs (return_case_id, created_at desc);

create index if not exists order_return_proofs_order_idx
  on app.order_return_proofs (order_id, created_at desc);

drop trigger if exists audit_order_return_proofs_change on app.order_return_proofs;
create trigger audit_order_return_proofs_change
after insert or update or delete on app.order_return_proofs
for each row
execute function audit.log_row_change('id');

alter table app.order_return_proofs enable row level security;
alter table app.order_return_proofs force row level security;

drop policy if exists order_return_proofs_admin_all on app.order_return_proofs;
create policy order_return_proofs_admin_all
on app.order_return_proofs
for all
using (app.has_role('admin'))
with check (app.has_role('admin'));

drop policy if exists order_return_proofs_customer_select on app.order_return_proofs;
create policy order_return_proofs_customer_select
on app.order_return_proofs
for select
using (app.can_access_order_id(order_id));

drop policy if exists order_return_proofs_customer_insert on app.order_return_proofs;
create policy order_return_proofs_customer_insert
on app.order_return_proofs
for insert
with check (
  app.has_role('customer')
  and app.can_access_order_id(order_id)
);
