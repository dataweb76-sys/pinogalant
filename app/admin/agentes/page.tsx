import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getAllTokkoProperties } from "@/lib/tokko";
import AgentesClient from "./agentes.client";

export const runtime = "nodejs";
export const revalidate = 0;

export default async function AgentesPage() {
  const admin = createSupabaseAdminClient();

  const [{ data: agents }, { data: assignments }, tokkoProps] = await Promise.all([
    admin.from("agents").select("*").order("name"),
    admin.from("tokko_agent_assignments").select("*"),
    getAllTokkoProperties().catch(() => []),
  ]);

  const assignMap: Record<number, string> = {};
  (assignments ?? []).forEach((a: any) => { assignMap[a.tokko_id] = a.agent_id; });

  return (
    <AgentesClient
      agents={agents ?? []}
      tokkoProps={tokkoProps.map(p => ({
        id: p.id,
        address: p.address,
        producerName: p.producer?.name ?? "",
        producerTokkoId: p.producer?.id ?? null,
      }))}
      assignments={assignMap}
    />
  );
}
