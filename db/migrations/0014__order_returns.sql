create table if not exists app.order_return_cases (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references app.orders(id) on delete cascade,
  requested_by_user_id uuid null references app.users(id) on delete set null,
  requested_by_email citext null,
  status text not null default 'requested',
  reason text not null,
  details text null,
  requested_refund_amount_ngn integer not null default 0,
  approved_refund_amount_ngn integer null,
  reviewed_by_user_id uuid null references app.users(id) on delete set null,
  reviewed_by_email citext null,
  reviewed_at timestamptz null,
  rejected_at timestamptz null,
  received_at timestamptz null,
  refunded_at timestamptz null,
  refund_reference text null,
  resolution_note text null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint order_return_cases_status_check check (
    status in (
      'requested',
      'approved',
      'rejected',
      'received',
      'refunded'
    )
  ),
  constraint order_return_cases_amounts_check check (
    requested_refund_amount_ngn >= 0
    and (approved_refund_amount_ngn is null or approved_refund_amount_ngn >= 0)
  )
);

create index if not exists order_return_cases_order_idx
  on app.order_return_cases (order_id, created_at desc);

create index if not exists order_return_cases_status_idx
  on app.order_return_cases (status, created_at desc);

create unique index if not exists order_return_cases_open_idx
  on app.order_return_cases (order_id)
  where status in ('requested', 'approved', 'received');

create table if not exists app.order_return_events (
  id uuid primary key default gen_random_uuid(),
  return_case_id uuid not null references app.order_return_cases(id) on delete cascade,
  order_id uuid not null references app.orders(id) on delete cascade,
  actor_type text not null default 'system',
  actor_user_id uuid null references app.users(id) on delete set null,
  actor_email citext null,
  action text not null,
  note text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  constraint order_return_events_actor_type_check check (
    actor_type in ('admin', 'customer', 'system')
  ),
  constraint order_return_events_action_check check (
    action in (
      'requested',
      'approved',
      'rejected',
      'received',
      'refunded'
    )
  )
);

create index if not exists order_return_events_case_idx
  on app.order_return_events (return_case_id, created_at desc);

create index if not exists order_return_events_order_idx
  on app.order_return_events (order_id, created_at desc);

create trigger set_order_return_cases_updated_at
before update on app.order_return_cases
for each row
execute function app.set_updated_at();

drop trigger if exists audit_order_return_cases_change on app.order_return_cases;
create trigger audit_order_return_cases_change
after insert or update or delete on app.order_return_cases
for each row
execute function audit.log_row_change('id');

alter table app.order_return_cases enable row level security;
alter table app.order_return_cases force row level security;

drop policy if exists order_return_cases_admin_all on app.order_return_cases;
create policy order_return_cases_admin_all
on app.order_return_cases
for all
using (app.has_role('admin'))
with check (app.has_role('admin'));

drop policy if exists order_return_cases_customer_select on app.order_return_cases;
create policy order_return_cases_customer_select
on app.order_return_cases
for select
using (app.can_access_order_id(order_id));

drop policy if exists order_return_cases_customer_insert on app.order_return_cases;
create policy order_return_cases_customer_insert
on app.order_return_cases
for insert
with check (
  app.has_role('customer')
  and app.can_access_order_id(order_id)
  and (
    requested_by_user_id is null
    or requested_by_user_id = app.current_actor_user_id()
  )
  and (
    requested_by_email is null
    or (
      app.current_actor_email() is not null
      and lower(requested_by_email::text) = lower(app.current_actor_email()::text)
    )
  )
);

alter table app.order_return_events enable row level security;
alter table app.order_return_events force row level security;

drop policy if exists order_return_events_admin_all on app.order_return_events;
create policy order_return_events_admin_all
on app.order_return_events
for all
using (app.has_role('admin'))
with check (app.has_role('admin'));

drop policy if exists order_return_events_customer_select on app.order_return_events;
create policy order_return_events_customer_select
on app.order_return_events
for select
using (app.can_access_order_id(order_id));

drop policy if exists order_return_events_customer_insert on app.order_return_events;
create policy order_return_events_customer_insert
on app.order_return_events
for insert
with check (
  app.has_role('customer')
  and app.can_access_order_id(order_id)
  and actor_type = 'customer'
  and action = 'requested'
);
