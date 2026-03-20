create table if not exists app.pages (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  description text null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists app.page_versions (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references app.pages(id) on delete cascade,
  label text not null,
  status text not null default 'draft',
  created_by_user_id uuid null references app.users(id) on delete set null,
  published_by_user_id uuid null references app.users(id) on delete set null,
  published_at timestamptz null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint page_versions_status_check check (
    status in ('draft', 'published', 'archived')
  )
);

create unique index if not exists page_versions_one_published_per_page_idx
  on app.page_versions (page_id)
  where status = 'published';

create table if not exists app.page_sections (
  id uuid primary key default gen_random_uuid(),
  page_version_id uuid not null references app.page_versions(id) on delete cascade,
  section_key text not null,
  section_type text not null,
  eyebrow text null,
  heading text null,
  body text null,
  settings jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  is_enabled boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint page_sections_type_check check (
    section_type in (
      'hero',
      'featured_products',
      'ingredient_story',
      'benefit_grid',
      'science_strip',
      'delivery_reassurance',
      'review_highlight',
      'faq',
      'final_cta'
    )
  ),
  unique (page_version_id, section_key)
);

create index if not exists page_sections_order_idx
  on app.page_sections (page_version_id, sort_order, created_at);

create table if not exists app.page_section_presentations (
  id uuid primary key default gen_random_uuid(),
  page_section_id uuid not null references app.page_sections(id) on delete cascade,
  breakpoint text not null,
  presentation jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint page_section_presentations_breakpoint_check check (
    breakpoint in ('mobile', 'tablet', 'desktop')
  ),
  unique (page_section_id, breakpoint)
);

create table if not exists app.page_section_bindings (
  id uuid primary key default gen_random_uuid(),
  page_section_id uuid not null references app.page_sections(id) on delete cascade,
  entity_type text not null,
  entity_id uuid null,
  binding_key text null,
  metadata jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint page_section_bindings_entity_type_check check (
    entity_type in ('product', 'review', 'page', 'setting')
  )
);

create index if not exists page_section_bindings_order_idx
  on app.page_section_bindings (page_section_id, sort_order, created_at);

create table if not exists app.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_by_user_id uuid null references app.users(id) on delete set null,
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists audit.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid null references app.users(id) on delete set null,
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create trigger set_pages_updated_at
before update on app.pages
for each row
execute function app.set_updated_at();

create trigger set_page_versions_updated_at
before update on app.page_versions
for each row
execute function app.set_updated_at();

create trigger set_page_sections_updated_at
before update on app.page_sections
for each row
execute function app.set_updated_at();

create trigger set_page_section_presentations_updated_at
before update on app.page_section_presentations
for each row
execute function app.set_updated_at();

create trigger set_page_section_bindings_updated_at
before update on app.page_section_bindings
for each row
execute function app.set_updated_at();

create trigger set_site_settings_updated_at
before update on app.site_settings
for each row
execute function app.set_updated_at();
