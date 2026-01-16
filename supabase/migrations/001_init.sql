-- 001_init.sql
-- Core tables: profiles, properties, documents, movements, audit_logs (MVP)
-- Run in Supabase SQL editor.

create type public.user_role as enum ('super_admin', 'admin', 'owner');
create type public.property_status as enum ('borrador','en_revision','aprobada','publicada','pausada','reservada','cerrada','rechazada');
create type public.property_operation as enum ('venta','alquiler');
create type public.property_type as enum ('casa','depto','terreno','local','oficina');

-- Profiles (1:1 with auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null default 'owner',
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Properties (publications + admin-loaded properties in same table for MVP)
create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  operation public.property_operation not null,
  type public.property_type not null,
  status public.property_status not null default 'en_revision',
  title text not null,
  description text,
  province text,
  city text,
  neighborhood text,
  address_hidden boolean not null default true,
  lat double precision,
  lng double precision,

  rooms int,
  bathrooms int,
  covered_m2 numeric,
  total_m2 numeric,
  garage boolean,
  age_years int,
  amenities text[] not null default '{}',

  price_ars numeric,
  price_usd numeric,
  show_both boolean not null default false,
  expenses_ars numeric,

  created_by_user_id uuid references auth.users(id),
  assigned_agent_id uuid references auth.users(id),
  owner_user_id uuid references auth.users(id),

  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists properties_status_idx on public.properties(status);
create index if not exists properties_assigned_idx on public.properties(assigned_agent_id);
create index if not exists properties_created_at_idx on public.properties(created_at desc);

-- Documents per property
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  doc_type text not null,
  url text not null,
  status text not null default 'ok', -- ok / falta / vencido (MVP)
  expires_at timestamptz,
  uploaded_by_user_id uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists documents_property_idx on public.documents(property_id);

-- Movements (income/expense)
create table if not exists public.movements (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references public.properties(id) on delete set null,
  type text not null, -- ingreso / gasto
  concept text not null,
  amount numeric not null,
  currency text not null, -- ARS/USD
  date date not null default (now()::date),
  receipt_url text,
  created_by_user_id uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists movements_property_idx on public.movements(property_id);
create index if not exists movements_created_at_idx on public.movements(created_at desc);

-- Audit logs
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  actor_user_id uuid references auth.users(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  before_json jsonb,
  after_json jsonb,
  is_outside_assignment boolean not null default false,
  notes text
);

create index if not exists audit_logs_created_at_idx on public.audit_logs(created_at desc);
create index if not exists audit_logs_actor_idx on public.audit_logs(actor_user_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name)
  values (new.id, 'owner', null)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- updated_at helpers
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

drop trigger if exists properties_set_updated_at on public.properties;
create trigger properties_set_updated_at
before update on public.properties
for each row execute procedure public.set_updated_at();
