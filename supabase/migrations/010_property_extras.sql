-- URLs extra por propiedad Tokko (video YouTube/Matterport, etc.)
create table if not exists public.property_extras (
  tokko_id    bigint primary key,
  video_url   text,
  updated_at  timestamptz default now()
);

alter table public.property_extras enable row level security;

create policy "Admins gestionan extras"
  on public.property_extras for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','super_admin')))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','super_admin')));

create policy "Extras son publicos"
  on public.property_extras for select using (true);
