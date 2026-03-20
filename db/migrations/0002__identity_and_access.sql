create table if not exists app.roles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists app.users (
  id uuid primary key default gen_random_uuid(),
  email citext not null unique,
  phone_e164 text null,
  status text not null default 'active',
  last_signed_in_at timestamptz null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint users_status_check check (status in ('active', 'invited', 'suspended')),
  constraint users_phone_e164_check check (
    phone_e164 is null or phone_e164 ~ '^\+[1-9][0-9]{7,14}$'
  )
);

create table if not exists app.profiles (
  user_id uuid primary key references app.users(id) on delete cascade,
  full_name text not null,
  first_name text null,
  last_name text null,
  preferred_phone_e164 text null,
  marketing_opt_in boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint profiles_phone_e164_check check (
    preferred_phone_e164 is null or preferred_phone_e164 ~ '^\+[1-9][0-9]{7,14}$'
  )
);

create table if not exists app.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app.users(id) on delete cascade,
  label text not null,
  recipient_name text not null,
  phone_e164 text not null,
  line_1 text not null,
  line_2 text null,
  landmark text null,
  city text not null,
  state text not null,
  postal_code text null,
  delivery_notes text null,
  latitude numeric(9,6) null,
  longitude numeric(9,6) null,
  is_default boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint addresses_phone_e164_check check (
    phone_e164 ~ '^\+[1-9][0-9]{7,14}$'
  )
);

create unique index if not exists addresses_default_per_user_idx
  on app.addresses (user_id)
  where is_default = true;

create table if not exists app.user_roles (
  user_id uuid not null references app.users(id) on delete cascade,
  role_id uuid not null references app.roles(id) on delete cascade,
  granted_by_user_id uuid null references app.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, role_id)
);

create table if not exists app.auth_challenges (
  id uuid primary key default gen_random_uuid(),
  email citext not null,
  code_hash text not null,
  channel text not null default 'email',
  purpose text not null default 'sign_in',
  expires_at timestamptz not null,
  consumed_at timestamptz null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  constraint auth_challenges_channel_check check (channel in ('email')),
  constraint auth_challenges_purpose_check check (
    purpose in ('sign_in', 'email_change', 'guest_claim')
  )
);

create index if not exists auth_challenges_email_idx
  on app.auth_challenges (email, expires_at desc);

create trigger set_users_updated_at
before update on app.users
for each row
execute function app.set_updated_at();

create trigger set_profiles_updated_at
before update on app.profiles
for each row
execute function app.set_updated_at();

create trigger set_addresses_updated_at
before update on app.addresses
for each row
execute function app.set_updated_at();
