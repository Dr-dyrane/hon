create table if not exists app.bank_accounts (
  id uuid primary key default gen_random_uuid(),
  bank_name text not null,
  account_name text not null,
  account_number text not null,
  instructions text null,
  is_active boolean not null default true,
  is_default boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists bank_accounts_identity_idx
  on app.bank_accounts (bank_name, account_number);

create unique index if not exists bank_accounts_default_idx
  on app.bank_accounts (is_default)
  where is_default = true;

create table if not exists app.orders (
  id uuid primary key default gen_random_uuid(),
  public_order_number text not null unique,
  user_id uuid null references app.users(id) on delete set null,
  source_channel text not null default 'web',
  status text not null default 'awaiting_transfer',
  payment_status text not null default 'awaiting_transfer',
  fulfillment_status text not null default 'pending',
  customer_name text not null,
  customer_email citext null,
  customer_phone_e164 text not null,
  delivery_address_snapshot jsonb not null default '{}'::jsonb,
  notes text null,
  subtotal_ngn integer not null default 0,
  discount_ngn integer not null default 0,
  delivery_fee_ngn integer not null default 0,
  total_ngn integer not null default 0,
  transfer_reference text not null,
  transfer_deadline_at timestamptz null,
  placed_at timestamptz not null default timezone('utc', now()),
  confirmed_at timestamptz null,
  cancelled_at timestamptz null,
  delivered_at timestamptz null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint orders_source_channel_check check (
    source_channel in ('web', 'admin')
  ),
  constraint orders_status_check check (
    status in (
      'checkout_draft',
      'awaiting_transfer',
      'payment_submitted',
      'payment_under_review',
      'payment_confirmed',
      'preparing',
      'ready_for_dispatch',
      'out_for_delivery',
      'delivered',
      'cancelled',
      'expired'
    )
  ),
  constraint orders_payment_status_check check (
    payment_status in (
      'awaiting_transfer',
      'submitted',
      'under_review',
      'confirmed',
      'rejected',
      'expired'
    )
  ),
  constraint orders_fulfillment_status_check check (
    fulfillment_status in (
      'pending',
      'preparing',
      'ready_for_dispatch',
      'out_for_delivery',
      'delivered',
      'cancelled'
    )
  ),
  constraint orders_phone_e164_check check (
    customer_phone_e164 ~ '^\+[1-9][0-9]{7,14}$'
  ),
  constraint orders_amounts_check check (
    subtotal_ngn >= 0
    and discount_ngn >= 0
    and delivery_fee_ngn >= 0
    and total_ngn >= 0
    and total_ngn = subtotal_ngn - discount_ngn + delivery_fee_ngn
  )
);

create index if not exists orders_user_idx
  on app.orders (user_id, placed_at desc);

create index if not exists orders_customer_email_idx
  on app.orders (customer_email, placed_at desc);

create index if not exists orders_status_idx
  on app.orders (status, payment_status, fulfillment_status, placed_at desc);

create table if not exists app.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references app.orders(id) on delete cascade,
  variant_id uuid null references app.product_variants(id) on delete set null,
  sku text not null,
  title text not null,
  flavor text null,
  quantity integer not null,
  unit_price_ngn integer not null,
  line_total_ngn integer not null,
  snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  constraint order_items_quantity_check check (quantity > 0),
  constraint order_items_amounts_check check (
    unit_price_ngn >= 0
    and line_total_ngn >= 0
    and line_total_ngn = unit_price_ngn * quantity
  )
);

create index if not exists order_items_order_idx
  on app.order_items (order_id, created_at asc);

create table if not exists app.order_status_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references app.orders(id) on delete cascade,
  from_status text null,
  to_status text not null,
  actor_type text not null default 'system',
  actor_user_id uuid null references app.users(id) on delete set null,
  actor_email citext null,
  note text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  constraint order_status_events_actor_type_check check (
    actor_type in ('admin', 'customer', 'system')
  )
);

create index if not exists order_status_events_order_idx
  on app.order_status_events (order_id, created_at desc);

create table if not exists app.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references app.orders(id) on delete cascade,
  bank_account_id uuid null references app.bank_accounts(id) on delete set null,
  payment_method text not null default 'bank_transfer',
  status text not null default 'awaiting_transfer',
  expected_amount_ngn integer not null,
  submitted_amount_ngn integer null,
  payer_name text null,
  payer_bank text null,
  external_reference text null,
  reviewed_by_user_id uuid null references app.users(id) on delete set null,
  reviewed_by_email citext null,
  reviewed_at timestamptz null,
  rejection_reason text null,
  expires_at timestamptz null,
  submitted_at timestamptz null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint payments_method_check check (
    payment_method in ('bank_transfer')
  ),
  constraint payments_status_check check (
    status in (
      'awaiting_transfer',
      'submitted',
      'under_review',
      'confirmed',
      'rejected',
      'expired'
    )
  ),
  constraint payments_amounts_check check (
    expected_amount_ngn >= 0
    and (submitted_amount_ngn is null or submitted_amount_ngn >= 0)
  )
);

create unique index if not exists payments_order_idx
  on app.payments (order_id);

create index if not exists payments_status_idx
  on app.payments (status, submitted_at desc, created_at desc);

create table if not exists app.payment_proofs (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references app.payments(id) on delete cascade,
  storage_key text not null,
  public_url text null,
  mime_type text not null,
  submitted_by_email citext null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists payment_proofs_payment_idx
  on app.payment_proofs (payment_id, created_at desc);

create table if not exists app.payment_review_events (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references app.payments(id) on delete cascade,
  actor_user_id uuid null references app.users(id) on delete set null,
  actor_email citext null,
  action text not null,
  note text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  constraint payment_review_events_action_check check (
    action in (
      'submitted',
      'marked_under_review',
      'confirmed',
      'rejected',
      'expired'
    )
  )
);

create index if not exists payment_review_events_payment_idx
  on app.payment_review_events (payment_id, created_at desc);

create trigger set_bank_accounts_updated_at
before update on app.bank_accounts
for each row
execute function app.set_updated_at();

create trigger set_orders_updated_at
before update on app.orders
for each row
execute function app.set_updated_at();

create trigger set_payments_updated_at
before update on app.payments
for each row
execute function app.set_updated_at();
