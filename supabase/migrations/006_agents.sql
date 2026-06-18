-- Tabla de agentes propios
CREATE TABLE IF NOT EXISTS public.agents (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tokko_id    integer UNIQUE,          -- ID del producer en Tokkobroker
  name        text NOT NULL,
  email       text,
  phone       text,                    -- WhatsApp / teléfono de contacto
  photo_url   text,                    -- foto de perfil real
  position    text DEFAULT 'Agente',
  is_active   boolean DEFAULT true,
  created_at  timestamptz DEFAULT now()
);

-- Tabla de asignación: propiedad Tokko → agente nuestro
CREATE TABLE IF NOT EXISTS public.tokko_agent_assignments (
  tokko_id    bigint PRIMARY KEY,      -- ID de la propiedad en Tokkobroker
  agent_id    uuid REFERENCES public.agents(id) ON DELETE SET NULL,
  updated_at  timestamptz DEFAULT now()
);

-- Insertar los dos agentes que están en Tokkobroker
INSERT INTO public.agents (tokko_id, name, email, phone, position) VALUES
  (70833,  'Maria Sol Beascoechea', 'beascoecheam@gmail.com',          '2954317871',   'Martillera'),
  (180574, 'Nicolas Gioiosa',       'nicolasgioiosanegocios@gmail.com', '+542954558051', 'Agente')
ON CONFLICT (tokko_id) DO NOTHING;

-- Asignar automáticamente todas las propiedades según el producer de Tokko
-- (se carga manualmente desde el admin o via script)

-- RLS: solo admins gestionan agentes
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tokko_agent_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agents_public_read" ON public.agents
  FOR SELECT USING (true);

CREATE POLICY "agents_admin_write" ON public.agents
  FOR ALL USING (public.is_admin());

CREATE POLICY "assignments_public_read" ON public.tokko_agent_assignments
  FOR SELECT USING (true);

CREATE POLICY "assignments_admin_write" ON public.tokko_agent_assignments
  FOR ALL USING (public.is_admin());
