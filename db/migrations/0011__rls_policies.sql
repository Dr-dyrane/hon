create or replace function app.current_guest_order_id()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('app.guest_order_id', true), '')::uuid
$$;

create or replace function app.set_actor_context(
  input_email text,
  input_role text,
  input_user_id uuid default null,
  input_guest_order_id uuid default null
)
returns void
language plpgsql
as $$
begin
  perform set_config('app.user_email', coalesce(lower(input_email), ''), true);
  perform set_config('app.role', coalesce(lower(input_role), ''), true);
  perform set_config('app.user_id', coalesce(input_user_id::text, ''), true);
  perform set_config('app.guest_order_id', coalesce(input_guest_order_id::text, ''), true);
end;
$$;

create or replace function app.can_access_order_row(
  order_user_id uuid,
  order_customer_email citext,
  target_order_id uuid
)
returns boolean
language sql
stable
as $$
  select
    app.has_role('admin')
    or (order_user_id is not null and order_user_id = app.current_actor_user_id())
    or (
      order_customer_email is not null
      and app.current_actor_email() is not null
      and lower(order_customer_email::text) = lower(app.current_actor_email()::text)
    )
    or (
      app.current_guest_order_id() is not null
      and target_order_id = app.current_guest_order_id()
    )
$$;

create or replace function app.can_access_order_id(target_order_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from app.orders o
    where o.id = target_order_id
      and app.can_access_order_row(o.user_id, o.customer_email, o.id)
  )
$$;

alter table app.profiles enable row level security;
alter table app.profiles force row level security;

drop policy if exists profiles_admin_all on app.profiles;
create policy profiles_admin_all
on app.profiles
for all
using (app.has_role('admin'))
with check (app.has_role('admin'));

drop policy if exists profiles_customer_select on app.profiles;
create policy profiles_customer_select
on app.profiles
for select
using (user_id = app.current_actor_user_id());

drop policy if exists profiles_customer_insert on app.profiles;
create policy profiles_customer_insert
on app.profiles
for insert
with check (user_id = app.current_actor_user_id());

drop policy if exists profiles_customer_update on app.profiles;
create policy profiles_customer_update
on app.profiles
for update
using (user_id = app.current_actor_user_id())
with check (user_id = app.current_actor_user_id());

alter table app.addresses enable row level security;
alter table app.addresses force row level security;

drop policy if exists addresses_admin_all on app.addresses;
create policy addresses_admin_all
on app.addresses
for all
using (app.has_role('admin'))
with check (app.has_role('admin'));

drop policy if exists addresses_customer_select on app.addresses;
create policy addresses_customer_select
on app.addresses
for select
using (user_id = app.current_actor_user_id());

drop policy if exists addresses_customer_insert on app.addresses;
create policy addresses_customer_insert
on app.addresses
for insert
with check (user_id = app.current_actor_user_id());

drop policy if exists addresses_customer_update on app.addresses;
create policy addresses_customer_update
on app.addresses
for update
using (user_id = app.current_actor_user_id())
with check (user_id = app.current_actor_user_id());

drop policy if exists addresses_customer_delete on app.addresses;
create policy addresses_customer_delete
on app.addresses
for delete
using (user_id = app.current_actor_user_id());

alter table app.orders enable row level security;
alter table app.orders force row level security;

drop policy if exists orders_admin_all on app.orders;
create policy orders_admin_all
on app.orders
for all
using (app.has_role('admin'))
with check (app.has_role('admin'));

drop policy if exists orders_customer_select on app.orders;
create policy orders_customer_select
on app.orders
for select
using (app.can_access_order_row(user_id, customer_email, id));

drop policy if exists orders_customer_insert on app.orders;
create policy orders_customer_insert
on app.orders
for insert
with check (
  app.has_role('customer')
  and (user_id is null or user_id = app.current_actor_user_id())
  and (
    customer_email is null
    or (
      app.current_actor_email() is not null
      and lower(customer_email::text) = lower(app.current_actor_email()::text)
    )
  )
);

alter table app.order_items enable row level security;
alter table app.order_items force row level security;

drop policy if exists order_items_admin_all on app.order_items;
create policy order_items_admin_all
on app.order_items
for all
using (app.has_role('admin'))
with check (app.has_role('admin'));

drop policy if exists order_items_customer_select on app.order_items;
create policy order_items_customer_select
on app.order_items
for select
using (app.can_access_order_id(order_id));

drop policy if exists order_items_customer_insert on app.order_items;
create policy order_items_customer_insert
on app.order_items
for insert
with check (
  app.has_role('customer')
  and app.can_access_order_id(order_id)
);

alter table app.payments enable row level security;
alter table app.payments force row level security;

drop policy if exists payments_admin_all on app.payments;
create policy payments_admin_all
on app.payments
for all
using (app.has_role('admin'))
with check (app.has_role('admin'));

drop policy if exists payments_customer_select on app.payments;
create policy payments_customer_select
on app.payments
for select
using (app.can_access_order_id(order_id));

drop policy if exists payments_customer_insert on app.payments;
create policy payments_customer_insert
on app.payments
for insert
with check (
  app.has_role('customer')
  and app.can_access_order_id(order_id)
);

alter table app.payment_proofs enable row level security;
alter table app.payment_proofs force row level security;

drop policy if exists payment_proofs_admin_all on app.payment_proofs;
create policy payment_proofs_admin_all
on app.payment_proofs
for all
using (app.has_role('admin'))
with check (app.has_role('admin'));

drop policy if exists payment_proofs_customer_select on app.payment_proofs;
create policy payment_proofs_customer_select
on app.payment_proofs
for select
using (
  exists (
    select 1
    from app.payments p
    where p.id = payment_id
      and app.can_access_order_id(p.order_id)
  )
);

drop policy if exists payment_proofs_customer_insert on app.payment_proofs;
create policy payment_proofs_customer_insert
on app.payment_proofs
for insert
with check (
  app.has_role('customer')
  and exists (
    select 1
    from app.payments p
    where p.id = payment_id
      and app.can_access_order_id(p.order_id)
  )
);

alter table app.order_status_events enable row level security;
alter table app.order_status_events force row level security;

drop policy if exists order_status_events_admin_all on app.order_status_events;
create policy order_status_events_admin_all
on app.order_status_events
for all
using (app.has_role('admin'))
with check (app.has_role('admin'));

drop policy if exists order_status_events_customer_select on app.order_status_events;
create policy order_status_events_customer_select
on app.order_status_events
for select
using (app.can_access_order_id(order_id));

drop policy if exists order_status_events_customer_insert on app.order_status_events;
create policy order_status_events_customer_insert
on app.order_status_events
for insert
with check (
  app.has_role('customer')
  and app.can_access_order_id(order_id)
  and actor_type = 'customer'
);

alter table app.payment_review_events enable row level security;
alter table app.payment_review_events force row level security;

drop policy if exists payment_review_events_admin_all on app.payment_review_events;
create policy payment_review_events_admin_all
on app.payment_review_events
for all
using (app.has_role('admin'))
with check (app.has_role('admin'));

alter table app.review_requests enable row level security;
alter table app.review_requests force row level security;

drop policy if exists review_requests_admin_all on app.review_requests;
create policy review_requests_admin_all
on app.review_requests
for all
using (app.has_role('admin'))
with check (app.has_role('admin'));

drop policy if exists review_requests_customer_select on app.review_requests;
create policy review_requests_customer_select
on app.review_requests
for select
using (
  (user_id is not null and user_id = app.current_actor_user_id())
  or app.can_access_order_id(order_id)
);

drop policy if exists review_requests_customer_update on app.review_requests;
create policy review_requests_customer_update
on app.review_requests
for update
using (
  (user_id is not null and user_id = app.current_actor_user_id())
  or app.can_access_order_id(order_id)
)
with check (
  (user_id is not null and user_id = app.current_actor_user_id())
  or app.can_access_order_id(order_id)
);

alter table app.reviews enable row level security;
alter table app.reviews force row level security;

drop policy if exists reviews_admin_all on app.reviews;
create policy reviews_admin_all
on app.reviews
for all
using (app.has_role('admin'))
with check (app.has_role('admin'));

drop policy if exists reviews_customer_select on app.reviews;
create policy reviews_customer_select
on app.reviews
for select
using (
  (user_id is not null and user_id = app.current_actor_user_id())
  or app.can_access_order_id(order_id)
);

drop policy if exists reviews_customer_insert on app.reviews;
create policy reviews_customer_insert
on app.reviews
for insert
with check (
  app.has_role('customer')
  and (user_id is null or user_id = app.current_actor_user_id())
  and app.can_access_order_id(order_id)
);
