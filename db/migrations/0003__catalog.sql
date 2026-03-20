create table if not exists app.product_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists app.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid null references app.product_categories(id) on delete set null,
  slug text not null unique,
  name text not null,
  marketing_name text null,
  tagline text null,
  short_description text not null,
  long_description text null,
  status text not null default 'draft',
  merchandising_state text not null default 'standard',
  is_available boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint products_status_check check (status in ('draft', 'active', 'archived')),
  constraint products_merchandising_state_check check (
    merchandising_state in ('standard', 'featured', 'hidden')
  )
);

create index if not exists products_listing_idx
  on app.products (status, merchandising_state, is_available, sort_order, created_at);

create table if not exists app.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references app.products(id) on delete cascade,
  sku text not null unique,
  slug text not null unique,
  name text not null,
  size_label text null,
  unit_label text null,
  price_ngn integer not null,
  compare_at_price_ngn integer null,
  status text not null default 'draft',
  is_default boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint product_variants_status_check check (
    status in ('draft', 'active', 'archived')
  ),
  constraint product_variants_price_check check (
    price_ngn >= 0 and (compare_at_price_ngn is null or compare_at_price_ngn >= price_ngn)
  )
);

create unique index if not exists product_variants_default_per_product_idx
  on app.product_variants (product_id)
  where is_default = true;

create index if not exists product_variants_product_status_idx
  on app.product_variants (product_id, status, sort_order);

create table if not exists app.product_media (
  id uuid primary key default gen_random_uuid(),
  product_id uuid null references app.products(id) on delete cascade,
  variant_id uuid null references app.product_variants(id) on delete cascade,
  media_type text not null,
  storage_key text not null,
  alt_text text null,
  sort_order integer not null default 0,
  is_primary boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint product_media_media_type_check check (
    media_type in ('image', 'model_3d', 'video')
  ),
  constraint product_media_target_check check (
    product_id is not null or variant_id is not null
  )
);

create table if not exists app.ingredients (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  detail text not null,
  benefit text null,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists app.variant_ingredients (
  variant_id uuid not null references app.product_variants(id) on delete cascade,
  ingredient_id uuid not null references app.ingredients(id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (variant_id, ingredient_id)
);

create table if not exists app.inventory_items (
  variant_id uuid primary key references app.product_variants(id) on delete cascade,
  on_hand integer not null default 0,
  reserved integer not null default 0,
  reorder_threshold integer null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint inventory_items_quantity_check check (
    on_hand >= 0 and reserved >= 0 and reserved <= on_hand
  )
);

create trigger set_product_categories_updated_at
before update on app.product_categories
for each row
execute function app.set_updated_at();

create trigger set_products_updated_at
before update on app.products
for each row
execute function app.set_updated_at();

create trigger set_product_variants_updated_at
before update on app.product_variants
for each row
execute function app.set_updated_at();

create trigger set_product_media_updated_at
before update on app.product_media
for each row
execute function app.set_updated_at();

create trigger set_ingredients_updated_at
before update on app.ingredients
for each row
execute function app.set_updated_at();

create trigger set_inventory_items_updated_at
before update on app.inventory_items
for each row
execute function app.set_updated_at();
