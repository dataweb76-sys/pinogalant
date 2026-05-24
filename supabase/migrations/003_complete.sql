-- ============================================================
-- 003_complete.sql
-- Tablas y columnas faltantes para el funcionamiento completo
-- Ejecutar en Supabase → SQL Editor
-- ============================================================

-- =====================
-- 1. EXTENDER ENUMS
-- =====================

-- Agregar 'campo' al tipo de propiedad
ALTER TYPE public.property_type ADD VALUE IF NOT EXISTS 'campo';

-- Agregar 'agent' al rol de usuario
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'agent';

-- =====================
-- 2. EXTENSIONES A PROFILES
-- =====================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email       text,
  ADD COLUMN IF NOT EXISTS phone       text,
  ADD COLUMN IF NOT EXISTS whatsapp    text,
  ADD COLUMN IF NOT EXISTS avatar_url  text,
  ADD COLUMN IF NOT EXISTS bio         text;

-- =====================
-- 3. EXTENSIONES A PROPERTIES
-- =====================

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS is_published  boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS agent_id      uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS purpose       text,   -- residencial / comercial / industrial
  ADD COLUMN IF NOT EXISTS floors        int,    -- cantidad de pisos (edificios)
  ADD COLUMN IF NOT EXISTS floor_number  int;    -- piso del depto

CREATE INDEX IF NOT EXISTS properties_is_published_idx ON public.properties(is_published);
CREATE INDEX IF NOT EXISTS properties_agent_id_idx     ON public.properties(agent_id);

-- =====================
-- 4. PROPERTY_MEDIA
-- =====================

CREATE TABLE IF NOT EXISTS public.property_media (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid        NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  kind        text        NOT NULL DEFAULT 'image', -- image / video
  url         text        NOT NULL,
  sort_order  int         NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS property_media_property_idx
  ON public.property_media(property_id);
CREATE INDEX IF NOT EXISTS property_media_sort_idx
  ON public.property_media(property_id, sort_order);

ALTER TABLE public.property_media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "media_public_read" ON public.property_media;
CREATE POLICY "media_public_read"
  ON public.property_media FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_id
        AND (p.is_published = true OR public.is_admin())
    )
  );

DROP POLICY IF EXISTS "media_admin_all" ON public.property_media;
CREATE POLICY "media_admin_all"
  ON public.property_media FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =====================
-- 5. PROPERTY_INQUIRIES
-- =====================

CREATE TABLE IF NOT EXISTS public.property_inquiries (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id    uuid        REFERENCES public.properties(id) ON DELETE SET NULL,
  agent_id       uuid        REFERENCES auth.users(id),
  name           text        NOT NULL,
  email          text,
  phone          text,
  message        text        NOT NULL,
  status         text        NOT NULL DEFAULT 'pending', -- pending / in_progress / hot / closed
  internal_notes text,
  resolved_at    timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS inquiries_property_idx    ON public.property_inquiries(property_id);
CREATE INDEX IF NOT EXISTS inquiries_status_idx      ON public.property_inquiries(status);
CREATE INDEX IF NOT EXISTS inquiries_agent_idx       ON public.property_inquiries(agent_id);
CREATE INDEX IF NOT EXISTS inquiries_created_at_idx  ON public.property_inquiries(created_at DESC);

DROP TRIGGER IF EXISTS inquiries_set_updated_at ON public.property_inquiries;
CREATE TRIGGER inquiries_set_updated_at
  BEFORE UPDATE ON public.property_inquiries
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

ALTER TABLE public.property_inquiries ENABLE ROW LEVEL SECURITY;

-- Cualquiera puede dejar una consulta (formulario público)
DROP POLICY IF EXISTS "inquiries_public_insert" ON public.property_inquiries;
CREATE POLICY "inquiries_public_insert"
  ON public.property_inquiries FOR INSERT
  WITH CHECK (true);

-- Admins ven todo; agentes ven sus propias consultas
DROP POLICY IF EXISTS "inquiries_read" ON public.property_inquiries;
CREATE POLICY "inquiries_read"
  ON public.property_inquiries FOR SELECT
  USING (public.is_admin() OR agent_id = auth.uid());

DROP POLICY IF EXISTS "inquiries_update" ON public.property_inquiries;
CREATE POLICY "inquiries_update"
  ON public.property_inquiries FOR UPDATE
  USING (public.is_admin() OR agent_id = auth.uid())
  WITH CHECK (public.is_admin() OR agent_id = auth.uid());

-- =====================
-- 6. FUNCIÓN HELPER PARA ENUMS
-- =====================

CREATE OR REPLACE FUNCTION public.enum_values(enum_name text)
RETURNS text[]
LANGUAGE sql STABLE
AS $$
  SELECT ARRAY(
    SELECT enumlabel::text
    FROM pg_enum
    JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
    WHERE pg_type.typname = enum_name
    ORDER BY enumsortorder
  );
$$;

-- =====================
-- 7. ACTUALIZAR RLS DE PROPERTIES
-- =====================

-- Permitir lectura pública usando is_published (más eficiente)
DROP POLICY IF EXISTS "properties_public_read_published" ON public.properties;
CREATE POLICY "properties_public_read_published"
  ON public.properties FOR SELECT
  USING (
    is_published = true
    OR public.is_admin()
    OR owner_user_id = auth.uid()
    OR agent_id = auth.uid()
  );

-- Agentes pueden ver sus propiedades asignadas
DROP POLICY IF EXISTS "properties_agent_read" ON public.properties;
CREATE POLICY "properties_agent_read"
  ON public.properties FOR SELECT
  USING (agent_id = auth.uid());

-- Admins pueden actualizar is_published
DROP POLICY IF EXISTS "properties_admin_update" ON public.properties;
CREATE POLICY "properties_admin_update"
  ON public.properties FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
