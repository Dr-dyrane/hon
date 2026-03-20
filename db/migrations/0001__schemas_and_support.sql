create extension if not exists citext;
create extension if not exists pgcrypto;

create schema if not exists app;
create schema if not exists audit;

create or replace function app.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;
