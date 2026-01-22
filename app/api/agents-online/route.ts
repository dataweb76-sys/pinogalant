import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ONLINE_MS = 45_000;

export async function GET() {
  try {
    const admin = createSupabaseAdminClient();
    const since = new Date(Date.now() - ONLINE_MS).toISOString();

    const { data, error } = await admin
      .from("profiles")
      .select("id, role, full_name, avatar_url, whatsapp, email, last_seen")
      .in("role", ["admin", "super_admin"])
      .eq("is_online", true)
      .gte("last_seen", since)
      .order("last_seen", { ascending: false });

    if (error) {
      return NextResponse.json({ rows: [], error: error.message }, { status: 200 });
    }

    const rows = (data ?? []).map((p: any) => ({
      user_id: p.id,
      role: p.role ?? null,
      full_name: p.full_name ?? null,
      avatar_url: p.avatar_url ?? null,
      whatsapp: p.whatsapp ?? null,
      email: p.email ?? null,
      last_seen: p.last_seen ?? null,
    }));

    return NextResponse.json({ rows }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ rows: [], error: e?.message || "error" }, { status: 200 });
  }
}
