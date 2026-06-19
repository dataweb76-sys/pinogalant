import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://xoxfpzfvbyqhvilmyhrt.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhveGZwemZ2YnlxaHZpbG15aHJ0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTY0MTg3MSwiZXhwIjoyMDk1MjE3ODcxfQ.kJgCyVFeg1ySfNxYqa5gKGPKkAQRZ-5iaSO-uHEO2eg";
const TOKKO_KEY = "6db1f124a41e92f4897a3ea8aefb6b1516f4b75b";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// Traer todos los agentes de nuestra BD
const { data: agents } = await supabase.from("agents").select("id, tokko_id").not("tokko_id", "is", null);
const tokkoIdToAgent = {};
agents.forEach(a => { tokkoIdToAgent[a.tokko_id] = a.id; });
console.log("Agentes en BD:", Object.keys(tokkoIdToAgent).length, "→", Object.keys(tokkoIdToAgent).join(", "));

// Traer todas las propiedades de Tokko
let allProps = [];
let offset = 0;
const limit = 20;
while (true) {
  const res = await fetch(`https://www.tokkobroker.com/api/v1/property/?key=${TOKKO_KEY}&format=json&limit=${limit}&offset=${offset}&lang=es`);
  const data = await res.json();
  const props = data.objects ?? [];
  allProps = allProps.concat(props);
  if (props.length < limit) break;
  offset += limit;
}
console.log("Propiedades de Tokko:", allProps.length);

// Asignar basado en producer.id
const rows = [];
const sinProducer = [];
const sinMatch = [];

for (const p of allProps) {
  const producerId = p.producer?.id;
  if (!producerId) { sinProducer.push(p.address); continue; }
  const agentId = tokkoIdToAgent[producerId];
  if (!agentId) { sinMatch.push(`${p.address} (producer=${producerId})`); continue; }
  rows.push({ tokko_id: p.id, agent_id: agentId, updated_at: new Date().toISOString() });
}

console.log("\nPropiedades a asignar:", rows.length);
if (sinMatch.length) console.log("Sin match de agente:", sinMatch.slice(0,5).join("\n  "));

if (rows.length > 0) {
  const { error } = await supabase
    .from("tokko_agent_assignments")
    .upsert(rows, { onConflict: "tokko_id" });

  if (error) {
    console.error("❌ Error al insertar:", error.message);
  } else {
    console.log(`\n✅ Sincronizadas ${rows.length} asignaciones exitosamente`);
  }
}

// Verificar resultado
const { data: result } = await supabase
  .from("tokko_agent_assignments")
  .select("tokko_id, agents(name)")
  .limit(10);

console.log("\nPrimeras asignaciones en BD:");
result?.forEach(r => console.log(` - Propiedad ${r.tokko_id} → ${r.agents?.name}`));
