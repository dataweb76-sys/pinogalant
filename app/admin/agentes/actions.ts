"use server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getAllTokkoProperties } from "@/lib/tokko";

export async function saveAgentAction(fd: FormData) {
  const admin = createSupabaseAdminClient();
  const id       = String(fd.get("id") || "").trim();
  const name     = String(fd.get("name") || "").trim();
  const position = String(fd.get("position") || "").trim();
  const phone    = String(fd.get("phone") || "").trim();
  const email    = String(fd.get("email") || "").trim();
  const photo_url = String(fd.get("photo_url") || "").trim();
  const is_active = fd.get("is_active") === "on";

  if (!name) return { ok: false, error: "El nombre es obligatorio" };

  if (id) {
    const { error } = await admin
      .from("agents")
      .update({ name, position, phone, email, photo_url, is_active })
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await admin
      .from("agents")
      .insert({ name, position, phone, email, photo_url, is_active });
    if (error) return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function assignAgentAction(tokkoId: number, agentId: string) {
  const admin = createSupabaseAdminClient();

  if (!agentId) {
    const { error } = await admin
      .from("tokko_agent_assignments")
      .delete()
      .eq("tokko_id", tokkoId);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  }

  const { error } = await admin
    .from("tokko_agent_assignments")
    .upsert({ tokko_id: tokkoId, agent_id: agentId, updated_at: new Date().toISOString() });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// Sincroniza automáticamente las asignaciones según el producer_id de cada propiedad en Tokko
export async function syncAssignmentsAction() {
  const admin = createSupabaseAdminClient();

  const [props, { data: agents }] = await Promise.all([
    getAllTokkoProperties(),
    admin.from("agents").select("id, tokko_id").not("tokko_id", "is", null),
  ]);

  const tokkoIdToAgent: Record<number, string> = {};
  (agents ?? []).forEach((a: any) => { tokkoIdToAgent[a.tokko_id] = a.id; });

  const rows = props
    .filter(p => p.producer?.id && tokkoIdToAgent[p.producer.id])
    .map(p => ({
      tokko_id: p.id,
      agent_id: tokkoIdToAgent[p.producer!.id],
      updated_at: new Date().toISOString(),
    }));

  if (!rows.length) return { ok: true, count: 0 };

  const { error } = await admin
    .from("tokko_agent_assignments")
    .upsert(rows, { onConflict: "tokko_id" });

  if (error) return { ok: false, error: error.message };
  return { ok: true, count: rows.length };
}
