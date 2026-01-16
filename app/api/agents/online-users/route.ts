import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET() {
  const admin = createSupabaseAdminClient();

  // ✅ Online si tuvo actividad en los últimos 15 minutos
  const since = new Date(Date.now() - 15 * 60 * 1000).toISOString();

  const { data: online, error: onlineErr } = await admin
    .from("online_users")
    .select("user_id, role, last_seen")
    .gte("last_seen", since);

  if (onlineErr) {
    return NextResponse.json({ ok: false, error: onlineErr.message }, { status: 400 });
  }

  const ids = (online ?? []).map((x) => x.user_id).filter(Boolean);

  if (ids.length === 0) {
    return NextResponse.json({ ok: true, agents: [] });
  }

  // Info pública desde profiles (service_role)
  const { data: profiles, error: profErr } = await admin
    .from("profiles")
    .select("id, role, email, full_name, phone, whatsapp, avatar_url")
    .in("id", ids);

  if (profErr) {
    return NextResponse.json({ ok: false, error: profErr.message }, { status: 400 });
  }

  const byId = new Map((profiles ?? []).map((p: any) => [p.id, p]));

  const agents = (online ?? [])
    .map((o: any) => {
      const p = byId.get(o.user_id);
      if (!p) return null;

      // solo admin/super_admin visibles
      if (p.role !== "admin" && p.role !== "super_admin") return null;

      return {
        id: p.id,
        role: p.role,
        name: p.full_name || p.email || "Agente",
        email: p.email ?? null,
        whatsapp: (p.whatsapp || p.phone) ?? null,
        avatar_url: p.avatar_url ?? null,
        last_seen: o.last_seen,
      };
    })
    .filter(Boolean) as any[];

  // super_admin primero
  agents.sort((a, b) => {
    const A = a.role === "super_admin" ? 0 : 1;
    const B = b.role === "super_admin" ? 0 : 1;
    return A - B;
  });

  return NextResponse.json({ ok: true, agents });
}
