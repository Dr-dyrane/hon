alter table audit.audit_logs
  alter column entity_id drop not null;

alter table audit.audit_logs
  add column if not exists actor_email citext null,
  add column if not exists actor_role text null,
  add column if not exists schema_name text null,
  add column if not exists table_name text null,
  add column if not exists record_pk text null,
  add column if not exists before_data jsonb null,
  add column if not exists after_data jsonb null,
  add column if not exists event_source text not null default 'trigger';

create index if not exists audit_logs_table_created_idx
  on audit.audit_logs (table_name, created_at desc);

create index if not exists audit_logs_actor_created_idx
  on audit.audit_logs (actor_email, created_at desc);

create or replace function app.current_actor_email()
returns citext
language sql
stable
as $$
  select nullif(current_setting('app.user_email', true), '')::citext
$$;

create or replace function app.current_actor_role()
returns text
language sql
stable
as $$
  select nullif(current_setting('app.role', true), '')
$$;

create or replace function app.current_actor_user_id()
returns uuid
language plpgsql
stable
as $$
declare
  configured_user_id text;
  matched_user_id uuid;
begin
  configured_user_id := nullif(current_setting('app.user_id', true), '');

  if configured_user_id is not null then
    return configured_user_id::uuid;
  end if;

  if app.current_actor_email() is null then
    return null;
  end if;

  select u.id
  into matched_user_id
  from app.users u
  where lower(u.email::text) = lower(app.current_actor_email()::text)
  limit 1;

  return matched_user_id;
end;
$$;

create or replace function app.has_role(role_key text)
returns boolean
language sql
stable
as $$
  select lower(coalesce(app.current_actor_role(), '')) = lower(coalesce(role_key, ''))
$$;

create or replace function app.set_actor_context(
  input_email text,
  input_role text,
  input_user_id uuid default null
)
returns void
language plpgsql
as $$
begin
  perform set_config('app.user_email', coalesce(lower(input_email), ''), true);
  perform set_config('app.role', coalesce(lower(input_role), ''), true);
  perform set_config('app.user_id', coalesce(input_user_id::text, ''), true);
end;
$$;

create or replace function audit.log_row_change()
returns trigger
language plpgsql
as $$
declare
  pk_column text := coalesce(tg_argv[0], 'id');
  previous_row jsonb := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end;
  next_row jsonb := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end;
  pk_value text := coalesce(next_row ->> pk_column, previous_row ->> pk_column);
  entity_uuid uuid := null;
begin
  begin
    if pk_value is not null then
      entity_uuid := pk_value::uuid;
    end if;
  exception
    when others then
      entity_uuid := null;
  end;

  insert into audit.audit_logs (
    actor_user_id,
    actor_email,
    actor_role,
    entity_type,
    entity_id,
    action,
    metadata,
    schema_name,
    table_name,
    record_pk,
    before_data,
    after_data,
    event_source
  )
  values (
    app.current_actor_user_id(),
    app.current_actor_email(),
    app.current_actor_role(),
    tg_table_schema || '.' || tg_table_name,
    entity_uuid,
    lower(tg_op),
    '{}'::jsonb,
    tg_table_schema,
    tg_table_name,
    pk_value,
    previous_row,
    next_row,
    'trigger'
  );

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

drop trigger if exists audit_profiles_change on app.profiles;
create trigger audit_profiles_change
after insert or update or delete on app.profiles
for each row
execute function audit.log_row_change('user_id');

drop trigger if exists audit_addresses_change on app.addresses;
create trigger audit_addresses_change
after insert or update or delete on app.addresses
for each row
execute function audit.log_row_change('id');

drop trigger if exists audit_products_change on app.products;
create trigger audit_products_change
after insert or update or delete on app.products
for each row
execute function audit.log_row_change('id');

drop trigger if exists audit_product_variants_change on app.product_variants;
create trigger audit_product_variants_change
after insert or update or delete on app.product_variants
for each row
execute function audit.log_row_change('id');

drop trigger if exists audit_inventory_items_change on app.inventory_items;
create trigger audit_inventory_items_change
after insert or update or delete on app.inventory_items
for each row
execute function audit.log_row_change('variant_id');

drop trigger if exists audit_page_versions_change on app.page_versions;
create trigger audit_page_versions_change
after insert or update or delete on app.page_versions
for each row
execute function audit.log_row_change('id');

drop trigger if exists audit_page_sections_change on app.page_sections;
create trigger audit_page_sections_change
after insert or update or delete on app.page_sections
for each row
execute function audit.log_row_change('id');

drop trigger if exists audit_site_settings_change on app.site_settings;
create trigger audit_site_settings_change
after insert or update or delete on app.site_settings
for each row
execute function audit.log_row_change('key');

drop trigger if exists audit_bank_accounts_change on app.bank_accounts;
create trigger audit_bank_accounts_change
after insert or update or delete on app.bank_accounts
for each row
execute function audit.log_row_change('id');

drop trigger if exists audit_orders_change on app.orders;
create trigger audit_orders_change
after insert or update or delete on app.orders
for each row
execute function audit.log_row_change('id');

drop trigger if exists audit_payments_change on app.payments;
create trigger audit_payments_change
after insert or update or delete on app.payments
for each row
execute function audit.log_row_change('id');

drop trigger if exists audit_payment_proofs_change on app.payment_proofs;
create trigger audit_payment_proofs_change
after insert or update or delete on app.payment_proofs
for each row
execute function audit.log_row_change('id');

drop trigger if exists audit_riders_change on app.riders;
create trigger audit_riders_change
after insert or update or delete on app.riders
for each row
execute function audit.log_row_change('id');

drop trigger if exists audit_delivery_assignments_change on app.delivery_assignments;
create trigger audit_delivery_assignments_change
after insert or update or delete on app.delivery_assignments
for each row
execute function audit.log_row_change('id');

drop trigger if exists audit_reviews_change on app.reviews;
create trigger audit_reviews_change
after insert or update or delete on app.reviews
for each row
execute function audit.log_row_change('id');
