create table if not exists app.review_requests (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references app.orders(id) on delete cascade,
  user_id uuid null references app.users(id) on delete set null,
  status text not null default 'pending',
  sent_at timestamptz null,
  completed_at timestamptz null,
  expires_at timestamptz null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint review_requests_status_check check (
    status in ('pending', 'completed', 'expired')
  )
);

create unique index if not exists review_requests_order_idx
  on app.review_requests (order_id);

create index if not exists review_requests_status_idx
  on app.review_requests (status, created_at desc);

create table if not exists app.reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references app.orders(id) on delete cascade,
  user_id uuid null references app.users(id) on delete set null,
  rating smallint not null,
  title text null,
  body text null,
  status text not null default 'pending',
  is_featured boolean not null default false,
  moderated_by_user_id uuid null references app.users(id) on delete set null,
  moderated_by_email citext null,
  moderated_at timestamptz null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint reviews_status_check check (
    status in ('pending', 'approved', 'hidden')
  ),
  constraint reviews_rating_check check (
    rating between 1 and 5
  )
);

create unique index if not exists reviews_order_idx
  on app.reviews (order_id);

create index if not exists reviews_status_idx
  on app.reviews (status, created_at desc);

create index if not exists reviews_featured_idx
  on app.reviews (is_featured, status, created_at desc);

create trigger set_reviews_updated_at
before update on app.reviews
for each row
execute function app.set_updated_at();
