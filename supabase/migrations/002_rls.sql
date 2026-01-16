-- 002_rls.sql
-- Enable RLS + policies
-- NOTE: This is MVP. We'll refine policies as we implement CRUD.

alter table public.profiles enable row level security;
alter table public.properties enable row level security;
alter table public.documents enable row level security;
alter table public.movements enable row level security;
alter table public.audit_logs enable row level security;

-- Helper: is super/admin
create or replace function public.is_admin()
returns boolean
language sql stable
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('super_admin','admin')
  );
$$;

create or replace function public.is_super_admin()
returns boolean
language sql stable
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role = 'super_admin'
  );
$$;

-- PROFILES
-- Users can read their own profile
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles for select
using (id = auth.uid() or public.is_admin());

-- Only super admin can update roles (MVP: super admin can update any profile)
drop policy if exists "profiles_update_super_admin" on public.profiles;
create policy "profiles_update_super_admin"
on public.profiles for update
using (public.is_super_admin())
with check (public.is_super_admin());

-- PROPERTIES
-- Public can read published properties (anon users too)
drop policy if exists "properties_public_read_published" on public.properties;
create policy "properties_public_read_published"
on public.properties for select
using (status = 'publicada' or public.is_admin() or owner_user_id = auth.uid());

-- Owners can insert their own properties (publishing requests)
drop policy if exists "properties_owner_insert" on public.properties;
create policy "properties_owner_insert"
on public.properties for insert
with check (auth.uid() is not null);

-- Admins can update any property (MVP)
drop policy if exists "properties_admin_update" on public.properties;
create policy "properties_admin_update"
on public.properties for update
using (public.is_admin())
with check (public.is_admin());

-- DOCUMENTS: Admins only (MVP)
drop policy if exists "documents_admin_all" on public.documents;
create policy "documents_admin_all"
on public.documents for all
using (public.is_admin())
with check (public.is_admin());

-- MOVEMENTS: Admins only (MVP)
drop policy if exists "movements_admin_all" on public.movements;
create policy "movements_admin_all"
on public.movements for all
using (public.is_admin())
with check (public.is_admin());

-- AUDIT LOGS: read only for admins; write via server/service role later
drop policy if exists "audit_logs_admin_select" on public.audit_logs;
create policy "audit_logs_admin_select"
on public.audit_logs for select
using (public.is_admin());

-- Allow admins to insert logs (MVP). Later we can lock to service role.
drop policy if exists "audit_logs_admin_insert" on public.audit_logs;
create policy "audit_logs_admin_insert"
on public.audit_logs for insert
with check (public.is_admin());
