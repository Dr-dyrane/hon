create table if not exists app.customer_records (
  customer_key text primary key,
  user_id uuid null references app.users(id) on delete set null,
  normalized_email citext null,
  phone_e164 text null,
  support_state text not null default 'standard',
  tags text[] not null default '{}'::text[],
  notes text null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint customer_records_support_state_check check (
    support_state in ('standard', 'priority', 'follow_up', 'hold')
  ),
  constraint customer_records_phone_e164_check check (
    phone_e164 is null or phone_e164 ~ '^\+[1-9][0-9]{7,14}$'
  )
);

create index if not exists customer_records_user_idx
  on app.customer_records (user_id);

create index if not exists customer_records_email_idx
  on app.customer_records (normalized_email);

create index if not exists customer_records_support_state_idx
  on app.customer_records (support_state, updated_at desc);

create trigger set_customer_records_updated_at
before update on app.customer_records
for each row
execute function app.set_updated_at();

create trigger audit_customer_records_change
after insert or update or delete on app.customer_records
for each row
execute function audit.log_row_change('customer_key');

alter table app.customer_records enable row level security;
alter table app.customer_records force row level security;

drop policy if exists customer_records_admin_all on app.customer_records;
create policy customer_records_admin_all
on app.customer_records
for all
using (app.has_role('admin'))
with check (app.has_role('admin'));
