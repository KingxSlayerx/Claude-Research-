-- Threshold quote requests and showroom staff.
--
-- Access model: the browser never talks to these tables. All reads and
-- writes go through the Next.js server using the service-role key, after the
-- server has validated input (customers) or verified a staff session (staff).
-- Row level security is enabled with no policies, so the public `anon` and
-- `authenticated` roles cannot read or write anything even if they hold the
-- project's public anon key.

create extension if not exists pgcrypto;

do $$ begin
  create type quote_status as enum ('new', 'contacted', 'visit', 'quoted', 'won', 'lost');
exception when duplicate_object then null; end $$;

create table if not exists public.staff_members (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  name text not null,
  role text not null default 'staff' check (role in ('staff', 'admin')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.quote_requests (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique check (reference ~ '^TH-[0-9]{6}-[A-Z0-9]{5}$'),
  idempotency_key uuid not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  status quote_status not null default 'new',
  customer_name text not null check (char_length(customer_name) between 2 and 80),
  phone text not null check (phone ~ '^\+91 [6-9][0-9]{4} [0-9]{5}$'),
  email text check (email is null or char_length(email) <= 120),
  locality text not null check (char_length(locality) between 2 and 80),
  project_type text not null,
  timeline text not null,
  site_visit boolean not null,
  notes text check (notes is null or char_length(notes) <= 1000),
  items jsonb not null check (jsonb_typeof(items) = 'array'),
  totals jsonb not null,
  subtotal integer not null check (subtotal >= 0),
  gst integer not null check (gst >= 0),
  total integer not null check (total >= 0),
  pricing_version text not null
);

create index if not exists quote_requests_created_at_idx on public.quote_requests (created_at desc);
create index if not exists quote_requests_status_idx on public.quote_requests (status);

create table if not exists public.quote_events (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quote_requests (id) on delete cascade,
  created_at timestamptz not null default now(),
  actor text not null,
  kind text not null check (kind in ('created', 'status', 'note')),
  from_status quote_status,
  to_status quote_status,
  note text check (note is null or char_length(note) <= 2000)
);

create index if not exists quote_events_quote_idx on public.quote_events (quote_id, created_at);

-- Lock the tables to the server.
alter table public.staff_members enable row level security;
alter table public.quote_requests enable row level security;
alter table public.quote_events enable row level security;
revoke all on public.staff_members, public.quote_requests, public.quote_events from anon, authenticated;

-- Status changes and their audit event are written in one transaction.
create or replace function public.set_quote_status(p_reference text, p_status quote_status, p_actor text)
returns public.quote_requests
language plpgsql
security invoker
set search_path = public
as $$
declare
  current_row public.quote_requests;
begin
  select * into current_row from public.quote_requests where reference = p_reference for update;
  if not found then
    return null;
  end if;
  if current_row.status <> p_status then
    insert into public.quote_events (quote_id, actor, kind, from_status, to_status)
      values (current_row.id, p_actor, 'status', current_row.status, p_status);
    update public.quote_requests set status = p_status, updated_at = now()
      where id = current_row.id
      returning * into current_row;
  end if;
  return current_row;
end;
$$;

revoke all on function public.set_quote_status(text, quote_status, text) from public, anon, authenticated;
grant execute on function public.set_quote_status(text, quote_status, text) to service_role;

-- Status counts for the inbox header.
create or replace function public.quote_status_counts()
returns table (status quote_status, count bigint)
language sql
stable
security invoker
set search_path = public
as $$
  select status, count(*) from public.quote_requests group by status;
$$;

revoke all on function public.quote_status_counts() from public, anon, authenticated;
grant execute on function public.quote_status_counts() to service_role;
