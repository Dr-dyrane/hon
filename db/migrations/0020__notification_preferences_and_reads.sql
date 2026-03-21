create table if not exists app.notification_preferences (
  user_id uuid primary key references app.users(id) on delete cascade,
  workspace_email_enabled boolean not null default true,
  workspace_in_app_enabled boolean not null default true,
  workspace_push_enabled boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists app.notification_reads (
  user_id uuid not null references app.users(id) on delete cascade,
  notification_id text not null,
  read_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, notification_id)
);

create index if not exists notification_reads_user_read_idx
  on app.notification_reads (user_id, read_at desc);

create table if not exists app.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text null,
  is_active boolean not null default true,
  last_seen_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists push_subscriptions_user_active_idx
  on app.push_subscriptions (user_id, is_active, updated_at desc);

drop trigger if exists set_notification_preferences_updated_at on app.notification_preferences;
create trigger set_notification_preferences_updated_at
before update on app.notification_preferences
for each row
execute function app.set_updated_at();

drop trigger if exists set_push_subscriptions_updated_at on app.push_subscriptions;
create trigger set_push_subscriptions_updated_at
before update on app.push_subscriptions
for each row
execute function app.set_updated_at();
