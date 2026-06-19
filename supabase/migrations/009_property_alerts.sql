create table if not exists public.property_alerts (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text,
  phone       text,
  operation   text,          -- 'venta' | 'alquiler' | 'ambas'
  type_name   text,          -- 'Casa' | 'Departamento' | etc.
  price_max   bigint,
  zones       text,
  is_active   boolean default true,
  created_at  timestamptz default now()
);

alter table public.property_alerts enable row level security;

create policy "Cualquiera puede suscribirse"
  on public.property_alerts for insert with check (true);

create policy "Solo admins ven alertas"
  on public.property_alerts for select
  using (exists (
    select 1 from public.profiles where id = auth.uid() and role in ('admin','super_admin')
  ));

create index if not exists idx_alerts_active on public.property_alerts(is_active, created_at desc);
