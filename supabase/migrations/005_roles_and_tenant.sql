-- ====================================================
-- 005 · Roles, columnas tenant, owner_id, reseñas
-- ====================================================

-- 1. Nuevos valores del enum
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'tenant';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'agent';

-- 2. Columnas extra en profiles (inquilinos y Google OAuth)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS dni                 text,
  ADD COLUMN IF NOT EXISTS occupation          text,
  ADD COLUMN IF NOT EXISTS employer            text,
  ADD COLUMN IF NOT EXISTS monthly_income_ars  numeric(12,2),
  ADD COLUMN IF NOT EXISTS income_type         text,        -- empleado / autonomo / monotributo / jubilado / otro
  ADD COLUMN IF NOT EXISTS family_count        integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS has_pets            boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS pets_description    text,
  ADD COLUMN IF NOT EXISTS guarantor_name      text,
  ADD COLUMN IF NOT EXISTS guarantor_phone     text,
  ADD COLUMN IF NOT EXISTS guarantor_dni       text,
  ADD COLUMN IF NOT EXISTS guarantor_rel       text,
  ADD COLUMN IF NOT EXISTS prev_rental_ref     text,
  ADD COLUMN IF NOT EXISTS registration_type   text DEFAULT 'email',  -- email / google
  ADD COLUMN IF NOT EXISTS profile_complete    boolean DEFAULT false;

-- 3. owner_id en propiedades (para que el propietario vea "su" propiedad)
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS owner_profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS properties_owner_profile_idx ON public.properties(owner_profile_id);

-- 4. Tabla de reseñas de agentes
CREATE TABLE IF NOT EXISTS public.agent_reviews (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id     uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reviewer_id  uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  property_id  uuid        REFERENCES public.properties(id) ON DELETE SET NULL,
  rating       integer     NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment      text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reviews_public_read"
  ON public.agent_reviews FOR SELECT USING (true);

CREATE POLICY "reviews_owner_insert"
  ON public.agent_reviews FOR INSERT
  WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "reviews_admin_all"
  ON public.agent_reviews FOR ALL
  USING (public.is_admin());
