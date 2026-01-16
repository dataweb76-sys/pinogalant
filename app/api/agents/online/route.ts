import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const ids: string[] = Array.isArray(body?.ids) ? body.ids.map(String) : [];

  // Limita para evitar abuso
  const safeIds = ids.filter(Boolean).slice(0, 50);

  if (safeIds.length === 0) {
    return NextResponse.json({ ok: true, agents: [] });
  }

  const admin = createSupabaseAdminClient();

  // Nota: usamos service_role (admin client) para evitar RLS en profiles.
  // Campos: asumimos que tenés al menos email/role. full_name puede existir o no.
  // whatsapp/phone/avatar_url pueden no existir: los tratamos como opcionales.
  const { data, error } = await admin
    .from("profiles")
    .select("id, role, email, full_name, phone, whatsapp, avatar_url")
    .in("id", safeIds);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }

  // Solo roles admin/super_admin (lo público no tiene por qué ver owners)
  const agents = (data ?? [])
    .filter((a: any) => a.role === "admin" || a.role === "super_admin")
    .map((a: any) => ({
      id: a.id,
      role: a.role,
      name: a.full_name || a.email || "Agente",
      email: a.email || null,
      phone: a.phone || null,
      whatsapp: a.whatsapp || a.phone || null,
      avatar_url: a.avatar_url || null,
    }));

  // Ordena: super_admin primero
  agents.sort((a: any, b: any) => (a.role === "super_admin" ? -1 : 1) - (b.role === "super_admin" ? -1 : 1));

  return NextResponse.json({ ok: true, agents });
}
