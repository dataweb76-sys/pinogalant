// app/api/agents-online/route.ts
import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ONLINE_MS = 45_000;

export async function GET() {
  try {
    const admin = createSupabaseAdminClient();

    // 1) Presencia: últimos 45s
    const since = new Date(Date.now() - ONLINE_MS).toISOString();

    const { data: pres, error: presErr } = await admin
      .from("user_presence")
      .select("user_id,last_seen")
      .gte("last_seen", since)
      .limit(200);

    if (presErr) {
      return NextResponse.json({ rows: [], error: presErr.message }, { status: 200 });
    }

    const onlineIds = (pres ?? []).map((r: any) => r.user_id).filter(Boolean);
    if (onlineIds.length === 0) {
      return NextResponse.json({ rows: [] }, { status: 200 });
    }

    // 2) Profiles (solo lo necesario)
    const { data: profs, error: profErr } = await admin
      .from("profiles")
      .select("id,role,full_name,avatar_url,whatsapp")
      .in("id", onlineIds);

    if (profErr) {
      return NextResponse.json({ rows: [], error: profErr.message }, { status: 200 });
    }

    // 3) Emails desde Auth (service role)
    const usersRes = await (admin as any).auth.admin.listUsers({ page: 1, perPage: 500 });
    const authUsers = usersRes?.data?.users ?? [];
    const emailById = new Map<string, string>();
    for (const u of authUsers) {
      if (u?.id && u?.email) emailById.set(u.id, u.email);
    }

    const lastSeenById = new Map<string, string>();
    for (const r of pres as any[]) lastSeenById.set(r.user_id, r.last_seen);

    const rows = (profs as any[]).map((p) => ({
      user_id: p.id,
      role: p.role ?? null,
      full_name: p.full_name ?? null,
      avatar_url: p.avatar_url ?? null,
      whatsapp: p.whatsapp ?? null,
      email: emailById.get(p.id) ?? null,
      last_seen: lastSeenById.get(p.id) ?? null,
    }));

    // Orden: super_admin primero, luego admin
    const rank = (role: string | null) => (role === "super_admin" ? 0 : role === "admin" ? 1 : 9);
    rows.sort((a, b) => rank(a.role) - rank(b.role));

    return NextResponse.json({ rows }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ rows: [], error: e?.message || "error" }, { status: 200 });
  }
}
