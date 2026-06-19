-- Tabla para registrar clicks de WhatsApp desde propiedades
create table if not exists public.whatsapp_leads (
  id              uuid primary key default gen_random_uuid(),
  property_id     bigint,
  property_address text,
  visitor_name    text,
  visitor_phone   text,
  agent_name      text,
  agent_phone     text,
  source          text default 'property_card', -- 'property_card' | 'property_detail'
  created_at      timestamptz default now()
);

-- RLS
alter table public.whatsapp_leads enable row level security;
create policy "Solo admins ven leads" on public.whatsapp_leads
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','super_admin','agent'))
  );
create policy "Cualquiera puede insertar" on public.whatsapp_leads
  for insert with check (true);

-- Indice para queries frecuentes
create index if not exists idx_wa_leads_created on public.whatsapp_leads(created_at desc);
create index if not exists idx_wa_leads_property on public.whatsapp_leads(property_id);
