-- ============================================================
-- 012_rental_extras.sql  —  Garantes + Propiedades propias de alquiler
-- Pino Galant Inmobiliaria
-- ============================================================

-- ── Propiedades que la inmobiliaria gestiona para alquiler ───
CREATE TABLE IF NOT EXISTS public.rental_properties (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title           text NOT NULL,
  address         text NOT NULL,
  city            text NOT NULL DEFAULT 'General Pico',
  province        text NOT NULL DEFAULT 'La Pampa',
  type            text DEFAULT 'casa' CHECK (type IN (
    'casa','departamento','local','oficina','quinta','campo','cochera','galpon','chacra'
  )),
  rooms           int,
  bathrooms       int,
  area_m2         numeric(10,2),
  floor_level     int,
  has_garage      boolean DEFAULT false,
  furnished       boolean DEFAULT false,
  -- Precios
  rent_ars        numeric(14,2),
  expenses_ars    numeric(14,2) DEFAULT 0,
  deposit_months  int DEFAULT 1,
  -- Propietario
  owner_name      text,
  owner_phone     text,
  owner_email     text,
  owner_cbu       text,
  owner_alias     text,
  owner_dni       text,
  commission_pct  numeric(5,2) DEFAULT 5,
  -- Estado
  status          text DEFAULT 'available' CHECK (status IN (
    'available','rented','maintenance','unavailable'
  )),
  description     text,
  notes           text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- ── Garantes del contrato ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.rental_guarantors (
  id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id         uuid NOT NULL REFERENCES public.rental_contracts(id) ON DELETE CASCADE,
  full_name           text NOT NULL,
  dni                 text,
  phone               text,
  whatsapp            text,
  email               text,
  address             text,
  city                text,
  province            text,
  occupation          text,
  employer            text,
  monthly_income      numeric(14,2),
  is_property_owner   boolean DEFAULT false,
  property_address    text,
  property_value_ars  numeric(14,2),
  notes               text,
  created_at          timestamptz DEFAULT now()
);

-- ── Vincular contrato con rental_property ───────────────────
ALTER TABLE public.rental_contracts
  ADD COLUMN IF NOT EXISTS rental_property_id uuid REFERENCES public.rental_properties(id);

-- ── Datos del inquilino en el contrato ──────────────────────
ALTER TABLE public.rental_contracts
  ADD COLUMN IF NOT EXISTS tenant_dni           text,
  ADD COLUMN IF NOT EXISTS tenant_cuit          text,
  ADD COLUMN IF NOT EXISTS tenant_occupation    text,
  ADD COLUMN IF NOT EXISTS tenant_employer      text,
  ADD COLUMN IF NOT EXISTS tenant_monthly_income numeric(14,2),
  ADD COLUMN IF NOT EXISTS tenant_address       text,
  ADD COLUMN IF NOT EXISTS payment_method_pref  text DEFAULT 'transfer' CHECK (payment_method_pref IN (
    'transfer','online','office','mercadopago'
  ));

-- ── Índices ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_rental_properties_status   ON public.rental_properties(status);
CREATE INDEX IF NOT EXISTS idx_rental_guarantors_contract ON public.rental_guarantors(contract_id);

-- ── Triggers ─────────────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_rental_properties_upd ON public.rental_properties;
CREATE TRIGGER trg_rental_properties_upd
  BEFORE UPDATE ON public.rental_properties
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── RLS ──────────────────────────────────────────────────────
ALTER TABLE public.rental_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rental_guarantors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rental_props_admin" ON public.rental_properties
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "rental_props_read" ON public.rental_properties
  FOR SELECT USING (true);

CREATE POLICY "guarantors_admin" ON public.rental_guarantors
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "guarantors_tenant_read" ON public.rental_guarantors
  FOR SELECT TO authenticated
  USING (contract_id IN (
    SELECT id FROM public.rental_contracts WHERE tenant_id = auth.uid()
  ));
