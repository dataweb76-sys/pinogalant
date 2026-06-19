-- Tabla de agentes propios
CREATE TABLE IF NOT EXISTS public.agents (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tokko_id    integer UNIQUE,
  name        text NOT NULL,
  email       text,
  phone       text,
  photo_url   text,
  position    text DEFAULT 'Agente',
  is_active   boolean DEFAULT true,
  created_at  timestamptz DEFAULT now()
);

-- Tabla de asignación: propiedad Tokko → agente nuestro
CREATE TABLE IF NOT EXISTS public.tokko_agent_assignments (
  tokko_id    bigint PRIMARY KEY,
  agent_id    uuid REFERENCES public.agents(id) ON DELETE SET NULL,
  updated_at  timestamptz DEFAULT now()
);

-- Insertar los 5 agentes reales de la cuenta Tokkobroker
INSERT INTO public.agents (tokko_id, name, email, phone, position) VALUES
  (64466,  'Dana Pino',              'pinogalantbr@gmail.com',              '2954228356',  'Directora'),
  (70833,  'Maria Sol Beascoechea',  'beascoecheam@gmail.com',              '2954317871',  'Martillera'),
  (180574, 'Nicolas Gioiosa',        'nicolasgioiosanegocios@gmail.com',    '2954558051',  'Agente'),
  (180589, 'Martin Riera',           'martinrierapg@gmail.com',             '2954321305',  'Agente'),
  (180590, 'Paulo Teyseire',         'paulo.teysseire.pg@gmail.com',        '',            'Agente')
ON CONFLICT (tokko_id) DO UPDATE SET
  name     = EXCLUDED.name,
  email    = EXCLUDED.email,
  phone    = EXCLUDED.phone,
  position = EXCLUDED.position;

-- RLS
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tokko_agent_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "agents_public_read"    ON public.agents;
DROP POLICY IF EXISTS "agents_admin_write"    ON public.agents;
DROP POLICY IF EXISTS "assignments_public_read" ON public.tokko_agent_assignments;
DROP POLICY IF EXISTS "assignments_admin_write" ON public.tokko_agent_assignments;

CREATE POLICY "agents_public_read"      ON public.agents FOR SELECT USING (true);
CREATE POLICY "agents_admin_write"      ON public.agents FOR ALL    USING (public.is_admin());
CREATE POLICY "assignments_public_read" ON public.tokko_agent_assignments FOR SELECT USING (true);
CREATE POLICY "assignments_admin_write" ON public.tokko_agent_assignments FOR ALL    USING (public.is_admin());
