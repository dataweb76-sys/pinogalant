import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://xoxfpzfvbyqhvilmyhrt.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhveGZwemZ2YnlxaHZpbG15aHJ0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTY0MTg3MSwiZXhwIjoyMDk1MjE3ODcxfQ.kJgCyVFeg1ySfNxYqa5gKGPKkAQRZ-5iaSO-uHEO2eg"
);

// Ejecutamos cada statement por separado
const statements = [
  // 1. Crear tabla agents
  `CREATE TABLE IF NOT EXISTS public.agents (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tokko_id    integer UNIQUE,
    name        text NOT NULL,
    email       text,
    phone       text,
    photo_url   text,
    position    text DEFAULT 'Agente',
    is_active   boolean DEFAULT true,
    created_at  timestamptz DEFAULT now()
  )`,

  // 2. Crear tabla tokko_agent_assignments
  `CREATE TABLE IF NOT EXISTS public.tokko_agent_assignments (
    tokko_id    bigint PRIMARY KEY,
    agent_id    uuid REFERENCES public.agents(id) ON DELETE SET NULL,
    updated_at  timestamptz DEFAULT now()
  )`,

  // 3. Insertar agentes
  `INSERT INTO public.agents (tokko_id, name, email, phone, position) VALUES
    (64466,  'Dana Pino',              'pinogalantbr@gmail.com',              '2954228356',  'Directora'),
    (70833,  'Maria Sol Beascoechea',  'beascoecheam@gmail.com',              '2954317871',  'Martillera'),
    (180574, 'Nicolas Gioiosa',        'nicolasgioiosanegocios@gmail.com',    '2954558051',  'Agente'),
    (180589, 'Martin Riera',           'martinrierapg@gmail.com',             '2954321305',  'Agente'),
    (180590, 'Paulo Teyseire',         'paulo.teysseire.pg@gmail.com',        '',            'Agente')
  ON CONFLICT (tokko_id) DO UPDATE SET
    name     = EXCLUDED.name,
    email    = EXCLUDED.email,
    phone    = EXCLUDED.phone,
    position = EXCLUDED.position`,

  // 4. RLS
  `ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE public.tokko_agent_assignments ENABLE ROW LEVEL SECURITY`,
  `DROP POLICY IF EXISTS "agents_public_read" ON public.agents`,
  `DROP POLICY IF EXISTS "agents_admin_write" ON public.agents`,
  `DROP POLICY IF EXISTS "assignments_public_read" ON public.tokko_agent_assignments`,
  `DROP POLICY IF EXISTS "assignments_admin_write" ON public.tokko_agent_assignments`,
  `CREATE POLICY "agents_public_read" ON public.agents FOR SELECT USING (true)`,
  `CREATE POLICY "assignments_public_read" ON public.tokko_agent_assignments FOR SELECT USING (true)`,
];

for (const sql of statements) {
  const { error } = await supabase.rpc("exec_sql", { query: sql }).catch(() => ({ error: { message: "rpc not available" } }));
  if (error) {
    // exec_sql no disponible vía JS SDK, usamos fetch directo al Management API
    break;
  }
}

// Alternativa: usar el postgres client directamente via Management API
// La única forma sin CLI es via Supabase Management API con access token
// Vamos a intentar crear las tablas usando inserts para verificar que existen

console.log("Verificando si las tablas ya existen...");

const { data: agents, error: agentsError } = await supabase
  .from("agents")
  .select("id, name")
  .limit(5);

if (agentsError) {
  console.log("❌ Tabla 'agents' NO existe:", agentsError.message);
  console.log("\n📋 NECESITÁS ejecutar manualmente en Supabase SQL Editor:");
  console.log("   https://supabase.com/dashboard/project/xoxfpzfvbyqhvilmyhrt/sql/new");
  console.log("\n   Pega el contenido de: supabase/migrations/006_agents.sql");
} else {
  console.log("✅ Tabla 'agents' existe con", agents?.length ?? 0, "agentes:");
  agents?.forEach(a => console.log(" -", a.name));
}

const { data: assignments, error: assignError } = await supabase
  .from("tokko_agent_assignments")
  .select("tokko_id, agent_id")
  .limit(5);

if (assignError) {
  console.log("❌ Tabla 'tokko_agent_assignments' NO existe:", assignError.message);
} else {
  console.log("✅ Tabla 'tokko_agent_assignments' existe con", assignments?.length ?? 0, "asignaciones");
}
