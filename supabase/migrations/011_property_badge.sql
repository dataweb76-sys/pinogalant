alter table public.property_extras
  add column if not exists badge text check (badge in ('valor_ajustado','permuta','reservado'));
