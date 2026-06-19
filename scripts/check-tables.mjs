import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://xoxfpzfvbyqhvilmyhrt.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhveGZwemZ2YnlxaHZpbG15aHJ0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTY0MTg3MSwiZXhwIjoyMDk1MjE3ODcxfQ.kJgCyVFeg1ySfNxYqa5gKGPKkAQRZ-5iaSO-uHEO2eg"
);

const { data: agents, error: agentsError } = await supabase
  .from("agents")
  .select("id, name")
  .limit(10);

if (agentsError) {
  console.log("TABLA_NO_EXISTE: agents -", agentsError.message);
} else {
  console.log("TABLA_OK: agents -", agents.length, "registros");
  agents.forEach(a => console.log("  -", a.name));
}

const { data: assignments, error: assignError } = await supabase
  .from("tokko_agent_assignments")
  .select("tokko_id")
  .limit(5);

if (assignError) {
  console.log("TABLA_NO_EXISTE: tokko_agent_assignments -", assignError.message);
} else {
  console.log("TABLA_OK: tokko_agent_assignments -", assignments.length, "registros");
}
