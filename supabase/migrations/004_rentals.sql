-- ============================================================
-- 004_rentals.sql  —  Sistema completo de gestión de alquileres
-- Pino Galant Inmobiliaria
-- ============================================================

-- ── Detalles de alquiler por propiedad ──────────────────────
CREATE TABLE IF NOT EXISTS public.rental_details (
  id                       uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id              uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,

  -- Precios
  rent_ars                 numeric(14,2),
  rent_usd                 numeric(14,2),
  expenses_ars             numeric(14,2)  DEFAULT 0,
  deposit_months           int            DEFAULT 1,

  -- Impuestos e incluidos
  taxes_included           boolean        DEFAULT false,
  water_included           boolean        DEFAULT false,
  gas_included             boolean        DEFAULT false,
  electricity_included     boolean        DEFAULT false,
  internet_included        boolean        DEFAULT false,

  -- Condiciones del contrato
  contract_duration_months int            DEFAULT 24,
  payment_due_day          int            DEFAULT 5,   -- 1-28
  grace_period_days        int            DEFAULT 3,
  min_income_multiplier    numeric(4,1)   DEFAULT 3.0, -- ingresos mínimos requeridos

  -- Ajuste de precio
  price_increase_pct       numeric(6,2),              -- % cada N meses
  price_increase_months    int            DEFAULT 4,   -- cada cuántos meses

  -- Requisitos
  requires_guarantor       boolean        DEFAULT true,
  accepts_pets             boolean        DEFAULT false,
  accepts_students         boolean        DEFAULT true,
  requires_insurance       boolean        DEFAULT false,

  -- Zona y entorno
  zone_description         text,
  zone_score               int CHECK (zone_score BETWEEN 1 AND 10),
  zone_services            text[]         DEFAULT '{}',
  zone_transport           text[]         DEFAULT '{}',
  zone_schools             text[]         DEFAULT '{}',
  distance_center_km       numeric(6,2),

  available_from           date           DEFAULT CURRENT_DATE,

  created_at               timestamptz    DEFAULT now(),
  updated_at               timestamptz    DEFAULT now(),

  UNIQUE(property_id)
);

-- ── Contratos de alquiler ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.rental_contracts (
  id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  reference_code      text UNIQUE DEFAULT ('PG-' || upper(substring(gen_random_uuid()::text, 1, 8))),

  property_id         uuid NOT NULL REFERENCES public.properties(id),
  tenant_id           uuid NOT NULL REFERENCES auth.users(id),
  agent_id            uuid REFERENCES auth.users(id),
  confirmed_by        uuid REFERENCES auth.users(id),

  -- Período
  start_date          date NOT NULL,
  end_date            date NOT NULL,

  -- Valores económicos
  monthly_rent_ars    numeric(14,2),
  monthly_rent_usd    numeric(14,2),
  expenses_ars        numeric(14,2) DEFAULT 0,
  deposit_amount_ars  numeric(14,2),
  deposit_paid        boolean       DEFAULT false,
  deposit_paid_at     timestamptz,

  -- Condiciones
  payment_due_day     int           DEFAULT 5,
  grace_period_days   int           DEFAULT 3,
  price_increase_pct  numeric(6,2),
  price_increase_months int         DEFAULT 4,

  -- Incluidos
  taxes_included      boolean       DEFAULT false,
  water_included      boolean       DEFAULT false,
  gas_included        boolean       DEFAULT false,
  electricity_included boolean      DEFAULT false,

  -- Cláusulas adicionales personalizadas
  additional_clauses  text,

  -- Estado del contrato
  status              text          DEFAULT 'draft' CHECK (status IN (
    'draft',           -- el admin está preparando
    'pending_tenant',  -- enviado al inquilino para revisar/firmar
    'pending_admin',   -- el inquilino aceptó, esperando confirmación admin
    'active',          -- contrato vigente
    'expired',         -- vencido naturalmente
    'terminated'       -- rescindido antes de tiempo
  )),

  -- Timestamps del flujo
  sent_to_tenant_at   timestamptz,
  tenant_agreed_at    timestamptz,
  tenant_ip           text,
  admin_confirmed_at  timestamptz,
  terminated_at       timestamptz,
  termination_reason  text,

  -- Snapshot de datos al momento del contrato
  tenant_snapshot     jsonb         DEFAULT '{}',
  property_snapshot   jsonb         DEFAULT '{}',

  -- Notas internas
  internal_notes      text,

  created_at          timestamptz   DEFAULT now(),
  updated_at          timestamptz   DEFAULT now()
);

-- ── Pagos de alquiler ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.rental_payments (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id     uuid NOT NULL REFERENCES public.rental_contracts(id) ON DELETE CASCADE,

  period_year     int  NOT NULL,
  period_month    int  NOT NULL CHECK (period_month BETWEEN 1 AND 12),

  base_amount_ars numeric(14,2) NOT NULL,  -- alquiler base
  expenses_ars    numeric(14,2) DEFAULT 0,
  surcharge_ars   numeric(14,2) DEFAULT 0, -- recargo por mora
  discount_ars    numeric(14,2) DEFAULT 0,
  total_ars       numeric(14,2) GENERATED ALWAYS AS
                    (base_amount_ars + expenses_ars + surcharge_ars - discount_ars) STORED,

  due_date        date NOT NULL,
  paid_at         timestamptz,

  status          text DEFAULT 'pending' CHECK (status IN (
    'pending',   -- sin pagar
    'paid',      -- pagado
    'overdue',   -- vencido sin pagar
    'partial',   -- pago parcial
    'waived'     -- condonado
  )),

  payment_method  text CHECK (payment_method IN ('online','office','transfer','other')),
  receipt_url     text,
  marked_paid_by  uuid REFERENCES auth.users(id),
  payment_notes   text,

  -- Ajuste de precio aplicado en este período
  price_increase_applied boolean DEFAULT false,
  previous_amount_ars    numeric(14,2),

  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),

  UNIQUE(contract_id, period_year, period_month)
);

-- ── Reclamos / Mantenimiento ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.rental_claims (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  claim_number    text UNIQUE DEFAULT ('RC-' || to_char(now(), 'YYMM') || '-' || upper(substring(gen_random_uuid()::text, 1, 6))),
  contract_id     uuid NOT NULL REFERENCES public.rental_contracts(id) ON DELETE CASCADE,
  tenant_id       uuid NOT NULL REFERENCES auth.users(id),

  title           text NOT NULL,
  description     text NOT NULL,

  category        text DEFAULT 'other' CHECK (category IN (
    'water_leak',    -- pérdida de agua
    'electrical',    -- problemas eléctricos
    'gas',           -- problemas de gas
    'structural',    -- estructura (techo, paredes, pisos)
    'appliance',     -- electrodoméstico incluido
    'security',      -- seguridad (cerraduras, rejas)
    'pest',          -- plagas
    'cleaning',      -- limpieza áreas comunes
    'heating',       -- calefacción
    'humidity',      -- humedad
    'other'
  )),

  priority        text DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),

  status          text DEFAULT 'open' CHECK (status IN (
    'open',         -- abierto, sin atender
    'in_progress',  -- en gestión
    'waiting',      -- esperando repuesto/profesional
    'resolved',     -- resuelto
    'closed'        -- cerrado (sin solución o rechazado)
  )),

  images          jsonb  DEFAULT '[]',
  admin_notes     text,
  resolved_at     timestamptz,
  scheduled_for   date,   -- fecha programada de reparación

  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- ── Índices ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_rental_contracts_tenant    ON public.rental_contracts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_rental_contracts_property  ON public.rental_contracts(property_id);
CREATE INDEX IF NOT EXISTS idx_rental_contracts_status    ON public.rental_contracts(status);
CREATE INDEX IF NOT EXISTS idx_rental_payments_contract   ON public.rental_payments(contract_id);
CREATE INDEX IF NOT EXISTS idx_rental_payments_status     ON public.rental_payments(status);
CREATE INDEX IF NOT EXISTS idx_rental_payments_due        ON public.rental_payments(due_date);
CREATE INDEX IF NOT EXISTS idx_rental_claims_contract     ON public.rental_claims(contract_id);
CREATE INDEX IF NOT EXISTS idx_rental_claims_status       ON public.rental_claims(status);

-- ── Triggers de updated_at ───────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'set_updated_at') THEN
    CREATE FUNCTION set_updated_at()
    RETURNS trigger LANGUAGE plpgsql AS '
    BEGIN NEW.updated_at = now(); RETURN NEW; END;';
  END IF;
END $$;

DROP TRIGGER IF EXISTS trg_rental_details_upd   ON public.rental_details;
DROP TRIGGER IF EXISTS trg_rental_contracts_upd ON public.rental_contracts;
DROP TRIGGER IF EXISTS trg_rental_payments_upd  ON public.rental_payments;
DROP TRIGGER IF EXISTS trg_rental_claims_upd    ON public.rental_claims;

CREATE TRIGGER trg_rental_details_upd
  BEFORE UPDATE ON public.rental_details
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_rental_contracts_upd
  BEFORE UPDATE ON public.rental_contracts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_rental_payments_upd
  BEFORE UPDATE ON public.rental_payments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_rental_claims_upd
  BEFORE UPDATE ON public.rental_claims
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── RLS ──────────────────────────────────────────────────────
ALTER TABLE public.rental_details    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rental_contracts  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rental_payments   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rental_claims     ENABLE ROW LEVEL SECURITY;

-- rental_details: solo admins pueden escribir, todos pueden leer
CREATE POLICY "rental_details_read"   ON public.rental_details FOR SELECT USING (true);
CREATE POLICY "rental_details_admin"  ON public.rental_details FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- rental_contracts: admin full access, inquilino ve los suyos
CREATE POLICY "contracts_admin"       ON public.rental_contracts FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "contracts_tenant_read" ON public.rental_contracts FOR SELECT TO authenticated
  USING (tenant_id = auth.uid());
CREATE POLICY "contracts_tenant_sign" ON public.rental_contracts FOR UPDATE TO authenticated
  USING (tenant_id = auth.uid() AND status = 'pending_tenant')
  WITH CHECK (tenant_id = auth.uid());

-- rental_payments: admin full access, inquilino ve los suyos
CREATE POLICY "payments_admin"        ON public.rental_payments FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "payments_tenant_read"  ON public.rental_payments FOR SELECT TO authenticated
  USING (contract_id IN (
    SELECT id FROM public.rental_contracts WHERE tenant_id = auth.uid()
  ));

-- rental_claims: admin full access, inquilino gestiona los suyos
CREATE POLICY "claims_admin"          ON public.rental_claims FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "claims_tenant_read"    ON public.rental_claims FOR SELECT TO authenticated
  USING (tenant_id = auth.uid());
CREATE POLICY "claims_tenant_insert"  ON public.rental_claims FOR INSERT TO authenticated
  WITH CHECK (tenant_id = auth.uid());
CREATE POLICY "claims_tenant_update"  ON public.rental_claims FOR UPDATE TO authenticated
  USING (tenant_id = auth.uid() AND status NOT IN ('resolved','closed'));
